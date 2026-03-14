/**
 * AI 服务模块
 * 
 * 负责与 AI API 通信，处理图表生成请求。
 * 采用几何原语方法：AI 通过曲线模板和几何原语描述图表。
 * 所有几何计算由原语规则引擎完成。
 * 
 * @module ai-service
 * @author EconGrapher Team
 */

import type { Message, ChartData, EffectAnalysis, ApiSettings, ContentBlock, CurveDefinition, PointDefinition, LineDefinition, AreaDefinition, ApiParameters, ArrowDefinition } from './types'
import { isThinkingModel, DEFAULT_PARAMETERS } from './types'
import aiLogger from './logger'
import { detectProvider, type ApiProvider } from './provider-detector'
import { buildRequestBodyParams, getCustomHeaders, getProviderAdapter } from './provider-adapter'
import { 
  getProviderFormatType, 
  buildApiUrl, 
  buildRequestBody, 
  parseResponse, 
  parseStreamChunk, 
  isStreamDone,
  type FormattedMessage,
  type ApiFormatType
} from './api-format-adapter'

/**
 * 图表加载标记
 * AI 在输出图表配置前会先输出此标记，系统检测到后立即显示图表生成动画
 */
export const CHART_LOADING_MARKER = '[ECONCHART_LOADING]'

/**
 * 原始 HTTP 请求记录接口
 */
export interface RawHttpRequest {
  id: string
  timestamp: number
  sessionId?: string
  url: string
  method: string
  headers: Record<string, string>
  body: unknown
}

/**
 * 原始 HTTP 响应记录接口
 */
export interface RawHttpResponse {
  id: string
  timestamp: number
  requestId: string
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  isStream: boolean
  streamChunks?: string[]
}

/**
 * 请求-响应对接口
 */
export interface RequestResponsePair {
  id: string
  timestamp: number
  sessionId?: string
  request: RawHttpRequest
  response?: RawHttpResponse
}

const RAW_REQUESTS_STORAGE_KEY = 'econgrapher_raw_requests'
const MAX_STORED_REQUESTS = 50

/**
 * 保存原始 HTTP 请求
 * @param request - 请求对象
 * @returns 请求ID
 */
function saveRawRequest(request: RawHttpRequest): string {
  try {
    const stored = getStoredRawRequests()
    const pair: RequestResponsePair = {
      id: request.id,
      timestamp: request.timestamp,
      sessionId: request.sessionId,
      request: request
    }
    stored.unshift(pair)
    if (stored.length > MAX_STORED_REQUESTS) {
      stored.splice(MAX_STORED_REQUESTS)
    }
    localStorage.setItem(RAW_REQUESTS_STORAGE_KEY, JSON.stringify(stored))
    return request.id
  } catch (e) {
    console.warn('[AI Service] Failed to save raw request:', e)
    return request.id
  }
}

/**
 * 更新请求的响应数据
 * @param requestId - 请求ID
 * @param response - 响应对象
 */
function updateRawRequestResponse(requestId: string, response: RawHttpResponse): void {
  try {
    const stored = getStoredRawRequests()
    const index = stored.findIndex(r => r.id === requestId)
    if (index !== -1) {
      stored[index].response = response
      localStorage.setItem(RAW_REQUESTS_STORAGE_KEY, JSON.stringify(stored))
    }
  } catch (e) {
    console.warn('[AI Service] Failed to update raw request response:', e)
  }
}

/**
 * 获取存储的原始请求列表
 * @returns 请求列表
 */
export function getStoredRawRequests(): RequestResponsePair[] {
  try {
    const stored = localStorage.getItem(RAW_REQUESTS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (e) {
    console.warn('[AI Service] Failed to get stored raw requests:', e)
    return []
  }
}

/**
 * 清除存储的原始请求
 */
export function clearStoredRawRequests(): void {
  localStorage.removeItem(RAW_REQUESTS_STORAGE_KEY)
}

/**
 * 导出原始请求为 JSON 字符串
 * @returns JSON 字符串
 */
export function exportRawRequests(): string {
  return JSON.stringify(getStoredRawRequests(), null, 2)
}

/**
 * 系统提示词
 * 
 * 新架构：AI 使用几何原语描述图表
 * 完整 API 参考：docs/ai-chart-api-reference.md
 */
const SYSTEM_PROMPT = `# ROLE
You are an expert AP Economics educator, specializing in both AP Microeconomics and AP Macroeconomics.

# PRIMARY OBJECTIVE
Your sole purpose is to help students master economic concepts. Provide clear, accurate, and patient explanations tailored to the AP curriculum.

# CORE INSTRUCTIONS
## You have the ability to genertate economic related chart through geometric primitives. Please provide graph when explaining if it would help deepen user's understanding。

### Economic chart
You have the ability generating chart using geometric primitives.
The following is elements the system supports:
1. **Curves**: Define curves using templates (linear, U-shape, N-shape, hyperbola, vertical, horizontal, pointSet, derivedMR, derivedMFC)
2. **Points**: Define points using geometric operations (intersection, projection, fixed coordinates, onCurve)
3. **Lines**: Define lines connecting points or projecting to axes
4. **Areas**: Define filled regions by specifying point IDs
5. **Annotations**: Add text labels associated with points
6. **Axis Labels**: Add labels on axes at specific positions

#### Detailed explaination of each element:

## Curve Templates

**Common Parameters (all curve types):**
- id (required): unique identifier for the curve
- label (required): display label shown on the chart
- type (required): curve type identifier
- color (optional): hex color code (e.g., "#3b82f6")
- dashed (optional): true for dashed line (default: false)
- lineWidth (optional): line thickness (default: 2.5)

#### 1. Linear Curve (demand, supply, AD, SRAS, etc.)
\`\`\`json
{ "id": "D", "label": "D", "type": "linear", "slope": -1, "intercept": 10 }
\`\`\`
- slope (required): negative for demand, positive for supply
- intercept (required): Y-axis intercept (price when quantity = 0)

#### 2. U-Shape Curve (ATC, AVC, MC, etc.)
\`\`\`json
{ "id": "ATC", "label": "ATC", "type": "uShape", "minimum": { "x": 5, "y": 8 }, "leftIntercept": 20 }
\`\`\`
- minimum (required): the lowest point {x, y} of the U-shape
- leftIntercept (optional): Y value when x=0
- rightY (optional): Y value at right side
- steepness (optional): curve steepness (default: 1)

#### 3. N-Shape Curve (inverted U-shape)
\`\`\`json
{ "id": "curve1", "label": "Curve", "type": "nShape", "maximum": { "x": 5, "y": 10 }, "leftIntercept": 2 }
\`\`\`
- maximum (required): the highest point {x, y} of the inverted U-shape
- leftIntercept (optional): Y value when x=0
- rightY (optional): Y value at right side
- steepness (optional): curve steepness (default: 1)

#### 4. Hyperbola Curve (AFC - Average Fixed Cost)
\`\`\`json
{ "id": "AFC", "label": "AFC", "type": "hyperbola", "k": 50 }
\`\`\`
- k (required): numerator coefficient (e.g., Fixed Cost for AFC = FC/Q)
- h (optional): horizontal asymptote offset (default: 0)
- v (optional): vertical asymptote offset (default: 0)
- startX (optional): starting X value to avoid division by zero (default: 0.5)
- Equation: y = k / (x - h) + v
- For AFC: y = FC / Q, where k = Fixed Cost

#### 5. Vertical Line (LRAS, LRPC, Money Supply)
\`\`\`json
{ "id": "LRAS", "label": "LRAS", "type": "vertical", "x": 8 }
\`\`\`
- x (required): X coordinate position

#### 6. Horizontal Line (Price ceiling/floor, Market price, MR in perfect competition)
\`\`\`json
{ "id": "Pc", "label": "Pc", "type": "horizontal", "y": 4 }
\`\`\`
- y (required): Y coordinate position

#### 7. PointSet Curve (PPC, Lorenz curve, custom shapes)
\`\`\`json
{
  "id": "PPC",
  "label": "PPC",
  "type": "pointSet",
  "points": [
    { "x": 0, "y": 10 },
    { "x": 3, "y": 9 },
    { "x": 6, "y": 6 },
    { "x": 9, "y": 3 },
    { "x": 10, "y": 0 }
  ],
  "smooth": true
}
\`\`\`
- points (required): array of {x, y} coordinates
- smooth (optional): whether to smooth the curve (default: true)

#### 8. Derived MR (from demand curve)
\`\`\`json
{ "id": "MR", "label": "MR", "type": "derivedMR", "fromCurve": "D" }
\`\`\`
- fromCurve (required): ID of the demand curve to derive from
- Note: MR has twice the slope of the demand curve, same intercept

#### 9. Derived MFC (from supply curve in factor markets)
\`\`\`json
{ "id": "MFC", "label": "MFC", "type": "derivedMFC", "fromCurve": "S" }
\`\`\`
- fromCurve (required): ID of the supply curve to derive from
- Note: MFC has twice the slope of the supply curve, same intercept

## Point Definitions

**Common Parameters (all point types):**
- id (required): unique identifier for the point
- label (optional): display label shown on the chart
- showMarker (optional): whether to show the point marker (default: false)
  - **IMPORTANT**: Points are invisible by default. Only set showMarker: true when you need to mark a specific point.
  - For axis labels (like Qe, Pe, Y, P), use axisLabels instead of showMarker.
- markerStyle (optional): object with symbol, size, and color properties
  - symbol (optional): "circle" | "square" | "diamond" | "triangle-up" | "triangle-down" (default: "circle")
  - size (optional): marker size in pixels (default: 8)
  - color (optional): marker color (default: auto)
- definition (required): object defining how the point is calculated

#### 1. Fixed Point
\`\`\`json
{ "id": "A", "definition": { "type": "fixed", "x": 5, "y": 3 }, "label": "A" }
\`\`\`
- definition.type (required): must be "fixed"
- definition.x (required): X coordinate
- definition.y (required): Y coordinate

#### 2. Intersection Point
\`\`\`json
{ "id": "E", "definition": { "type": "intersection", "curve1": "D", "curve2": "S" }, "label": "E" }
\`\`\`
- definition.type (required): must be "intersection"
- definition.curve1 (required): ID of the first curve
- definition.curve2 (required): ID of the second curve

#### 3. Projection to X-axis
\`\`\`json
{ "id": "Qe", "definition": { "type": "projectX", "from": "E" }, "label": "Qe" }
\`\`\`
- definition.type (required): must be "projectX"
- definition.from (required): ID of the source point

### 4. Projection to Y-axis
\`\`\`json
{ "id": "Pe", "definition": { "type": "projectY", "from": "E" }, "label": "Pe" }
\`\`\`
- definition.type (required): must be "projectY"
- definition.from (required): ID of the source point

#### 5. Point on Curve at X coordinate
\`\`\`json
{ "id": "P1", "definition": { "type": "onCurve", "curve": "D", "x": 5 } }
\`\`\`
- definition.type (required): must be "onCurve"
- definition.curve (required): ID of the curve
- definition.x (required): X coordinate on the curve

#### 6. Point on Curve at Y coordinate
\`\`\`json
{ "id": "P2", "definition": { "type": "onCurveY", "curve": "S", "y": 8 } }
\`\`\`
- definition.type (required): must be "onCurveY"
- definition.curve (required): ID of the curve
- definition.y (required): Y coordinate on the curve

#### 7. Curve Intercept
\`\`\`json
{ "id": "D_int", "definition": { "type": "curveIntercept", "curve": "D", "axis": "y" } }
{ "id": "D_xInt", "definition": { "type": "curveIntercept", "curve": "D", "axis": "x" } }
\`\`\`
- definition.type (required): must be "curveIntercept"
- definition.curve (required): ID of the curve
- definition.axis (required): "x" for X-intercept, "y" for Y-intercept

#### 8. Point on Curve at Another Point's X Coordinate
\`\`\`json
{ "id": "Pm", "definition": { "type": "onCurveAtPointX", "curve": "D", "from": "Em" } }
\`\`\`
- definition.type (required): must be "onCurveAtPointX"
- definition.curve (required): ID of the curve
- definition.from (required): ID of the source point (uses its X coordinate)
- **Use Case**: In monopoly graphs, to find the monopoly price point on the demand curve at the monopoly quantity (where MR=MC)

#### 9. Point on Curve at Another Point's Y Coordinate
\`\`\`json
{ "id": "P1", "definition": { "type": "onCurveAtPointY", "curve": "S", "from": "E" } }
\`\`\`
- definition.type (required): must be "onCurveAtPointY"
- definition.curve (required): ID of the curve
- definition.from (required): ID of the source point (uses its Y coordinate)

#### 10. Curve Minimum Point
\`\`\`json
{ "id": "ATC_min", "definition": { "type": "curveMinimum", "curve": "ATC" } }
\`\`\`
- definition.type (required): must be "curveMinimum"
- definition.curve (required): ID of the U-shape curve
- **Use Case**: Get the minimum point of a U-shape curve (ATC, AVC, MC). The point is automatically calculated from the curve's definition.
- **IMPORTANT**: Only works with U-shape curves (type: "uShape")

#### 11. Curve Maximum Point
\`\`\`json
{ "id": "MP_max", "definition": { "type": "curveMaximum", "curve": "MP" } }
\`\`\`
- definition.type (required): must be "curveMaximum"
- definition.curve (required): ID of the N-shape curve
- **Use Case**: Get the maximum point of an N-shape (inverted U) curve. The point is automatically calculated from the curve's definition.
- **IMPORTANT**: Only works with N-shape curves (type: "nShape")

**BEST PRACTICE: Use Geometric Definitions Instead of Fixed Coordinates**

When defining points, ALWAYS prefer geometric definitions over fixed coordinates:

| Use This | Instead of This | Why |
|----------|-----------------|-----|
| \`{ "type": "intersection", "curve1": "MC", "curve2": "ATC" }\` | \`{ "type": "fixed", "x": 6, "y": 8 }\` | Accurate intersection point |
| \`{ "type": "curveMinimum", "curve": "ATC" }\` | \`{ "type": "fixed", "x": 6, "y": 8 }\` | Exact minimum from curve definition |
| \`{ "type": "projectX", "from": "E" }\` | \`{ "type": "fixed", "x": 6, "y": 0 }\` | Consistent with source point |

**Benefits of geometric definitions:**
1. **Accuracy**: Points are mathematically derived from curve definitions
2. **Consistency**: If you change curve parameters, points update automatically
3. **Clarity**: The chart intent is clear from the definition

## Line Definitions

**Common Parameters (all line types):**
- id (optional): unique identifier for the line
- definition (required): object defining the line type and parameters
- style (optional): object with color, width, and dash properties
  - color (optional): line color (hex code)
  - width (optional): line width in pixels
  - dash (optional): "solid" | "dash" | "dot" (default: "dash" for dashed lines)

#### 1. Dashed Line to X-axis
\`\`\`json
{ "definition": { "type": "dashedToX", "from": "E", "xLabel": "Qe" } }
\`\`\`
- definition.type (required): must be "dashedToX"
- definition.from (required): ID of the source point
- definition.xLabel (optional): label to display on X-axis

#### 2. Dashed Line to Y-axis
\`\`\`json
{ "definition": { "type": "dashedToY", "from": "E", "yLabel": "Pe" } }
\`\`\`
- definition.type (required): must be "dashedToY"
- definition.from (required): ID of the source point
- definition.yLabel (optional): label to display on Y-axis

### 3. Segment Between Two Points
\`\`\`json
{ "definition": { "type": "segment", "from": "A", "to": "B" } }
\`\`\`
- definition.type (required): must be "segment"
- definition.from (required): ID of the starting point
- definition.to (required): ID of the ending point

#### 4. Horizontal Line Segment
\`\`\`json
{ "definition": { "type": "horizontal", "from": "A", "to": "B" } }
\`\`\`
- definition.type (required): must be "horizontal"
- definition.from (required): ID of the first point
- definition.to (required): ID of the second point

#### 5. Vertical Line Segment
\`\`\`json
{ "definition": { "type": "vertical", "from": "A", "to": "B" } }
\`\`\`
- definition.type (required): must be "vertical"
- definition.from (required): ID of the first point
- definition.to (required): ID of the second point

## Area Definitions

Areas are defined by listing point IDs in order (clockwise or counter-clockwise):

\`\`\`json
{
  "id": "area1",
  "points": ["D_int", "Pe", "E"],
  "color": "rgba(59, 130, 246, 0.3)",
  "opacity": 0.3,
  "label": "Consumer Surplus"
}
\`\`\`
- id (optional): unique identifier for the area
- points (required): array of point IDs forming the closed region (in order)
- color (optional): fill color (hex or rgba format)
- opacity (optional): transparency 0-1 (default: 0.3)
- label (optional): area label for legend

**CRITICAL: Area Definition Rules**

1. **Point Order Matters**: Points must be listed in clockwise OR counter-clockwise order to form a proper polygon.
   - WRONG: \`["A", "C", "B"]\` if A, B, C are not in order → creates self-intersecting polygon
   - CORRECT: \`["A", "B", "C"]\` or \`["A", "C", "B"]\` depending on geometric arrangement

2. **Triangle Areas**: For triangular areas, use exactly 3 points that form the triangle vertices.
   - Consumer Surplus example: \`["D_int", "Pe", "E"]\` - triangle with vertices at demand intercept, price on y-axis, and equilibrium

3. **Quadrilateral Areas**: For four-sided areas, ensure points trace the boundary without crossing.
   - Example: \`["MC_int", "MC_at_Qm", "Pm", "Pm_y"]\` - traces: y-axis → right → up → left → back to start

4. **DO NOT Include Axis Projection Points Unnecessarily**:
   - For CS above a price line: Use \`["D_int", "Pm_y", "Pm"]\` NOT \`["D_int", "Pm_y", "Pm", "Qm"]\`
   - The Qm point (on x-axis) would incorrectly extend the polygon to the axis

5. **Visualize Before Defining**: Before writing the points array, visualize the polygon:
   - What shape should this area be? (triangle, quadrilateral, etc.)
   - Which points are the actual vertices of this shape?
   - Are the points in proper order around the boundary?

## Axis Label Definitions

Add labels on axes at specific point positions:

\`\`\`json
{ "point": "Qe", "axis": "x", "label": "Qe" }
{ "point": "Pe", "axis": "y", "label": "Pe" }
\`\`\`
- point (required): ID of the point
- axis (required): "x" or "y"
- label (required): label text to display on the axis

**When to use axisLabels:**
- Coordinate values (Qe, Pe, Qm, Pm, etc.)
- Quantity labels (Qd, Qs, Q1, Q2, etc.)
- Price labels (Pc, Pf, P1, P2, etc.)
- Any label that indicates a position on the x-axis or y-axis

**Examples of correct axisLabel usage:**
- "Qd" / "Qs" for quantity demanded/supplied positions
- "Pc" for price ceiling position on y-axis
- "Qe" / "Pe" for equilibrium quantity/price
- "Change in Q" or "ΔQ" for quantity changes
- "Change in P" or "ΔP" for price changes

## Annotation Definitions

Add text labels associated with points:

\`\`\`json
{ "point": "E", "text": "Equilibrium Point", "position": "topRight", "offset": { "x": 5, "y": 5 } }
\`\`\`
- point (required): ID of the point to annotate
- text (required): annotation text content
- position (optional): position relative to the point - "top" | "bottom" | "left" | "right" | "topLeft" | "topRight" | "bottomLeft" | "bottomRight" (default: "topRight")
- offset (optional): pixel offset {x, y} from the calculated position

**IMPORTANT: Annotations vs Axis Labels**
- Use **annotations** for explanatory text that describes a point or concept (e.g., "Equilibrium Point", "Original Equilibrium")
- Use **axisLabels** for coordinate values and quantity/price labels (e.g., "Qe", "Pe", "Qd", "Qs", "Pc")

**WRONG Usage:**
\`\`\`json
{ "point": "Qd", "text": "Quantity Demanded", "position": "bottom" }  // WRONG: This should be an axisLabel
{ "point": "Qs", "text": "Quantity Supplied", "position": "bottom" }  // WRONG: This should be an axisLabel
\`\`\`

**CORRECT Usage:**
\`\`\`json
"axisLabels": [
  { "point": "Qd", "axis": "x", "label": "Qd" },
  { "point": "Qs", "axis": "x", "label": "Qs" }
],
"annotations": [
  { "point": "E", "text": "Original Equilibrium", "position": "topRight" }
]
\`\`\`


## Arrow Definitions

Draw arrows between points or curve positions. Useful for showing shifts, movements, or directional changes.

\`\`\`json
{
  "arrows": [
    {
      "from": { "type": "point", "id": "E1" },
      "to": { "type": "point", "id": "E2" },
      "color": "#ef4444",
      "label": "Shift",
      "labelPosition": "middle"
    }
  ]
}
\`\`\`

**Arrow Parameters:**
- from (required): starting point definition
- to (required): ending point definition
- color (optional): arrow color (default: "#ef4444" red)
- lineWidth (optional): line width (default: 2)
- headSize (optional): arrow head size (default: 12)
- label (optional): text label on the arrow
- labelPosition (optional): "start" | "middle" | "end" (default: "middle")

**Endpoint Types:**
1. **Point reference**: \`{ "type": "point", "id": "E" }\` - Reference a defined point by ID
2. **Curve point at X**: \`{ "type": "curvePoint", "curve": "D", "x": 5 }\` - Point on a curve at specific X
3. **Curve point at Y**: \`{ "type": "curvePointY", "curve": "S", "y": 8 }\` - Point on a curve at specific Y
4. **Fixed coordinates**: \`{ "type": "fixed", "x": 5, "y": 3 }\` - Fixed coordinate point

**Common Use Cases:**
1. **Supply/Demand Shifts**: Arrow from old equilibrium to new equilibrium
2. **Price/Quantity Changes**: Arrow showing movement along curve
3. **Policy Effects**: Arrow from pre-policy to post-policy position

**Example - Price Ceiling Effect:**
\`\`\`json
{
  "arrows": [
    {
      "from": { "type": "point", "id": "E" },
      "to": { "type": "curvePointY", "curve": "D", "y": 4 },
      "color": "#ef4444",
      "label": "Price Drop",
      "labelPosition": "middle"
    }
  ]
}
\`\`\`

## Preset Colors

### Curve Colors
| Purpose | Color |
|---------|-------|
| Demand | #3b82f6 (blue) |
| Supply | #f59e0b (orange) |
| MR | #f97316 (orange-red) |
| MC | #ef4444 (red) |
| ATC | #10b981 (green) |
| AVC | #6366f1 (indigo) |
| AFC | #8b5cf6 (purple) |
| LRAS | #8b5cf6 (purple) |

### Area Colors (use with opacity 0.3)
| Purpose | Color |
|---------|-------|
| Consumer Surplus | rgba(59, 130, 246, 0.3) |
| Producer Surplus | rgba(245, 158, 11, 0.3) |
| Deadweight Loss | rgba(239, 68, 68, 0.3) |
| Profit | rgba(16, 185, 129, 0.3) |
| Loss | rgba(239, 68, 68, 0.3) |
| Tax | rgba(139, 92, 246, 0.3) |
| Subsidy | rgba(16, 185, 129, 0.3) |

## Chart Output Format

**CRITICAL: Output charts as JSON code blocks!**

**IMPORTANT: Before each chart code block, output the loading marker:**

\`\`\`
[ECONCHART_LOADING]
\`\`\`chart
{
  "title": "Market Equilibrium",
  "xLabel": "Quantity",
  "yLabel": "Price",
  "xRange": [0, 12],
  "yRange": [0, 12],
  "curves": [
    { "id": "D", "label": "D", "type": "linear", "slope": -1, "intercept": 10 },
    { "id": "S", "label": "S", "type": "linear", "slope": 1, "intercept": 2 }
  ],
  "points": [
    { "id": "E", "definition": { "type": "intersection", "curve1": "D", "curve2": "S" }, "label": "E", "showMarker": true },
    { "id": "D_int", "definition": { "type": "curveIntercept", "curve": "D", "axis": "y" } },
    { "id": "S_int", "definition": { "type": "curveIntercept", "curve": "S", "axis": "y" } },
    { "id": "Pe", "definition": { "type": "onAxis", "from": "E", "axis": "y" } },
    { "id": "Qe", "definition": { "type": "onAxis", "from": "E", "axis": "x" } }
  ],
  "lines": [
    { "definition": { "type": "dashedToX", "from": "E" },
    { "definition": { "type": "dashedToY", "from": "E" } }
  ],
  "areas": [
    {
      "points": ["D_int", "Pe", "E"],
      "color": "rgba(59, 130, 246, 0.3)",
      "label": "CS"
    },
    {
      "points": ["S_int", "Pe", "E"],
      "color": "rgba(245, 158, 11, 0.3)",
      "label": "PS"
    }
  ],
  "axisLabels": [
    { "point": "Qe", "axis": "x", "label": "Qe" },
    { "point": "Pe", "axis": "y", "label": "Pe" }
  ]
}
\`\`\`

**Chart Structure Parameters:**
- title (required): chart title
- xLabel (optional): X-axis label
- yLabel (optional): Y-axis label
- xRange (optional): [min, max] for X-axis (default: [0, 12])
- yRange (optional): [min, max] for Y-axis (default: [0, 12])
- curves (required for single chart): array of curve definitions
- points (optional): array of point definitions
- lines (optional): array of line definitions
- areas (optional): array of area definitions
- annotations (optional): array of annotation definitions
- axisLabels (optional): array of axis label definitions
- charts (optional): array of sub-chart definitions for multiple side-by-side charts

## Multiple Charts (Side-by-Side)

When you need to compare two markets, scenarios side by side, use the \`charts\` array:

\`\`\`chart
{
  "title": "Market Comparison",
  "charts": [
    {
      "title": "Market A",
      "xLabel": "Quantity",
      "yLabel": "Price",
      "curves": [...]
    },
    {
      "title": "Market B", 
      "xLabel": "Quantity",
      "yLabel": "Price",
      "curves": [...]
    }
  ]
}
\`\`\`

**When to use multiple charts:**
- Comparing different market structures (e.g., Perfect Competition vs Monopoly)
- Before/After analysis (e.g., before and after a tax, subsidy, or policy change)
- Short-run vs Long-run comparisons
- Market Vs Individual Firm
- Different scenarios or cases

**Important rules for multiple charts:**
- Each sub-chart is a complete chart with its own title, curves, points, etc.
- Do NOT include \`curves\` at the top level when using \`charts\`
- The top-level \`title\` serves as an overall heading
- Each sub-chart can have different xRange/yRange if needed

## Common Chart Examples

### Supply and Demand with CS/PS

**IMPORTANT: Consumer Surplus (CS) and Producer Surplus (PS) Definition**

- **Consumer Surplus (CS)**: The area BELOW the demand curve and ABOVE the price line, from Q=0 to Q=Qe
  - Triangle vertices: (0, D_intercept), (0, Pe), (Qe, Pe) → Use points: ["D_int", "Pe", "E"]
  - D_int is the Y-intercept of demand curve (where x=0)
  - Pe is the projection of equilibrium point to Y-axis (price level)
  - E is the equilibrium point

- **Producer Surplus (PS)**: The area ABOVE the supply curve and BELOW the price line, from Q=0 to Q=Qe
  - Triangle vertices: (0, S_intercept), (0, Pe), (Qe, Pe) → Use points: ["S_int", "Pe", "E"]
  - S_int is the Y-intercept of supply curve (where x=0)

**WRONG Definition (DO NOT USE):**
- DO NOT use ["Pe", "E", "Qe"] - this forms a triangle under the price line, NOT the actual CS/PS areas

\`\`\`chart
{
  "title": "Market Equilibrium",
  "xLabel": "Quantity",
  "yLabel": "Price",
  "xRange": [0, 12],
  "yRange": [0, 12],
  "curves": [
    { "id": "D", "label": "D", "type": "linear", "slope": -1, "intercept": 10 },
    { "id": "S", "label": "S", "type": "linear", "slope": 1, "intercept": 2 }
  ],
  "points": [
    { "id": "E", "definition": { "type": "intersection", "curve1": "D", "curve2": "S" }, "label": "E", "showMarker": true },
    { "id": "D_int", "definition": { "type": "curveIntercept", "curve": "D", "axis": "y" } },
    { "id": "S_int", "definition": { "type": "curveIntercept", "curve": "S", "axis": "y" } },
    { "id": "Pe", "definition": { "type": "projectY", "from": "E" } },
    { "id": "Qe", "definition": { "type": "projectX", "from": "E" } }
  ],
  "lines": [
    { "definition": { "type": "dashedToX", "from": "E", "xLabel": "Qe" } },
    { "definition": { "type": "dashedToY", "from": "E", "yLabel": "Pe" } }
  ],
  "areas": [
    {
      "points": ["D_int", "Pe", "E"],
      "color": "rgba(59, 130, 246, 0.3)",
      "label": "CS"
    },
    {
      "points": ["S_int", "Pe", "E"],
      "color": "rgba(245, 158, 11, 0.3)",
      "label": "PS"
    }
  ],
  "axisLabels": [
    { "point": "Qe", "axis": "x", "label": "Qe" },
    { "point": "Pe", "axis": "y", "label": "Pe" }
  ]
}
\`\`\`

### Monopoly with Deadweight Loss

**CRITICAL: How to Draw Monopoly Graphs Correctly**

When drawing a monopoly graph, you MUST follow this correct sequence:

1. **Find the monopoly quantity (Qm)**: Where MR = MC (intersection point Em)
2. **Find the monopoly price (Pm)**: On the DEMAND curve at Qm (NOT at the MR=MC intersection)
   - Use \`onCurveAtPointX\` with \`from: "Em"\` and \`curve: "D"\`
3. **Find the competitive equilibrium (Qc)**: Where D = MC (intersection point Ec)
4. **Draw areas correctly**:
   - **Consumer Surplus (CS)**: Area below D, above Pm, from Q=0 to Qm
     - This is a TRIANGLE with vertices: D_y_intercept, Pm_on_y_axis, Pm
     - **DO NOT include Qm** (x-axis point) - this would create a wrong polygon!
     - Correct: \`["D_int", "Pm_y", "Pm"]\` - forms triangle above price line
   - **Producer Surplus (PS)**: Area above MC, below Pm, from Q=0 to Qm
     - This is a QUADRILATERAL with vertices in clockwise order
     - Correct: \`["MC_int", "MC_at_Qm", "Pm", "Pm_y"]\` - starts from MC intercept, goes right, then up, then left
   - **Deadweight Loss (DWL)**: Triangle between Qm and Qc
     - Vertices: Pm (on D at Qm), MC_at_Qm (on MC at Qm), Ec (where D=MC)
     - Correct: \`["Pm", "MC_at_Qm", "Ec"]\` - forms triangle in the gap

**Common Mistakes to AVOID:**
- ❌ Using fixed x value for Pm (e.g., \`"x": 3\`) - This is WRONG because Qm is calculated dynamically
- ❌ Drawing Pm at the MR=MC intersection - The price is on the DEMAND curve, not at MR=MC
- ❌ Wrong DWL triangle - Must connect demand curve, MC curve, and competitive equilibrium
- ❌ **CS including Qm point** - This creates a quadrilateral extending to x-axis, NOT the actual consumer surplus!
- ❌ **PS with wrong point order** - Points must be in clockwise/counter-clockwise order to avoid self-intersecting polygons

**CORRECT Monopoly Example:**
\`\`\`chart
{
  "title": "Unregulated Monopoly",
  "xLabel": "Quantity",
  "yLabel": "Price, Cost",
  "xRange": [0, 14],
  "yRange": [0, 14],
  "curves": [
    { "id": "D", "label": "D = AR", "type": "linear", "slope": -1, "intercept": 13, "color": "#3b82f6" },
    { "id": "MR", "label": "MR", "type": "derivedMR", "fromCurve": "D", "color": "#f97316" },
    { "id": "MC", "label": "MC", "type": "linear", "slope": 0.5, "intercept": 2, "color": "#ef4444" }
  ],
  "points": [
    { "id": "Em", "definition": { "type": "intersection", "curve1": "MR", "curve2": "MC" }, "label": "M", "showMarker": true },
    { "id": "Pm", "definition": { "type": "onCurveAtPointX", "curve": "D", "from": "Em" } },
    { "id": "MC_at_Qm", "definition": { "type": "onCurveAtPointX", "curve": "MC", "from": "Em" } },
    { "id": "Qm", "definition": { "type": "projectX", "from": "Em" } },
    { "id": "Pm_y", "definition": { "type": "projectY", "from": "Pm" } },
    { "id": "Ec", "definition": { "type": "intersection", "curve1": "D", "curve2": "MC" }, "label": "Ec", "showMarker": true },
    { "id": "Qc", "definition": { "type": "projectX", "from": "Ec" } },
    { "id": "D_int", "definition": { "type": "curveIntercept", "curve": "D", "axis": "y" } },
    { "id": "MC_int", "definition": { "type": "curveIntercept", "curve": "MC", "axis": "y" } }
  ],
"lines": [
    { "definition": { "type": "dashedToX", "from": "Em" } },
    { "definition": { "type": "dashedToY", "from": "Pm" } },
    { "definition": { "type": "dashedToX", "from": "Ec" } },
    { "definition": { "type": "vertical", "from": "Em", "to": "Pm" }, "style": { "color": "#94a3b8", "width": 1.5, "dash": "dash" } }
],
  "areas": [
    { "points": ["D_int", "Pm_y", "Pm"], "color": "rgba(59, 130, 246, 0.3)", "label": "CS", "opacity": 0.3 },
    { "points": ["MC_int", "MC_at_Qm", "Pm", "Pm_y"], "color": "rgba(245, 158, 11, 0.3)", "label": "PS", "opacity": 0.3 },
    { "points": ["Pm", "MC_at_Qm", "Ec"], "color": "rgba(239, 68, 68, 0.3)", "label": "DWL", "opacity": 0.3 }
  ],
  "axisLabels": [
    { "point": "Qm", "axis": "x", "label": "Qm" },
    { "point": "Qc", "axis": "x", "label": "Qc" },
    { "point": "Pm_y", "axis": "y", "label": "Pm" }
  ],
  "annotations": [
    { "point": "Em", "text": "Profit Maxinium", "position": "bottomRight", "offset": { "x": 5, "y": -5 } },
    { "point": "Ec", "text": "Socially Optimal", "position": "topRight", "offset": { "x": 5, "y": 5 } }
  ]
}
\`\`\`

**Key Points Explained:**
- **Em**: MR = MC intersection → determines monopoly quantity Qm
- **Pm**: Uses \`onCurveAtPointX\` to find price on demand curve at Qm
- **MC_at_Qm**: Uses \`onCurveAtPointX\` to find MC at monopoly quantity
- **Ec**: D = MC intersection → socially optimal (competitive) quantity Qc
- **Vertical dashed line**: From Em up to Pm shows the price-setting process

**Area Definitions Explained:**
- **CS = ["D_int", "Pm_y", "Pm"]**: Triangle with vertices at (0, D_intercept), (0, Pm), (Qm, Pm)
  - This is the area BELOW demand curve and ABOVE price line Pm
  - DO NOT add Qm point - that would extend the polygon to x-axis incorrectly!
- **PS = ["MC_int", "MC_at_Qm", "Pm", "Pm_y"]**: Quadrilateral in clockwise order
  - Starts at MC intercept (0, MC_intercept)
  - Goes right to MC_at_Qm (Qm, MC_at_Qm)
  - Goes up to Pm (Qm, Pm)
  - Goes left to Pm_y (0, Pm)
  - This is the area ABOVE MC curve and BELOW price line Pm
- **DWL = ["Pm", "MC_at_Qm", "Ec"]**: Triangle showing lost surplus
  - Between monopoly quantity Qm and competitive quantity Qc

### AD-AS Model
\`\`\`chart
{
  "title": "AD-AS Model",
  "xLabel": "Real GDP",
  "yLabel": "Price Level",
  "curves": [
    { "id": "AD", "label": "AD", "type": "linear", "slope": -0.8, "intercept": 12 },
    { "id": "SRAS", "label": "SRAS", "type": "linear", "slope": 0.7, "intercept": 2 },
    { "id": "LRAS", "label": "LRAS", "type": "vertical", "x": 8, "color": "#8b5cf6" }
  ],
  "points": [
    { "id": "E", "definition": { "type": "intersection", "curve1": "AD", "curve2": "SRAS" }, "label": "E", "showMarker": true },
    { "id": "Y", "definition": { "type": "projectX", "from": "E" } },
    { "id": "P", "definition": { "type": "projectY", "from": "E" } },
    { "id": "Ye", "definition": { "type": "curveIntercept", "curve": "LRAS", "axis": "x" } }
  ],
"lines": [
    { "definition": { "type": "dashedToX", "from": "E" } },
    { "definition": { "type": "dashedToY", "from": "E" } }
],
  "axisLabels": [
    { "point": "Y", "axis": "x", "label": "Y" },
    { "point": "P", "axis": "y", "label": "P" },
    { "point": "Ye", "axis": "x", "label": "Ye" }
  ]
}
\`\`\`

### Cost Curves

**Cost Curve Relationships:**
- MC intersects ATC at ATC's minimum and AVC at AVC's minimum
- ATC = AVC + AFC (Average Total Cost = Average Variable Cost + Average Fixed Cost)
- AFC is a hyperbola (y = FC/Q), continuously decreasing as quantity increases
- Use \`derivedATC\` to automatically calculate ATC from AVC and AFC
- Use \`intersection\` to define where MC intersects ATC and AVC
- Use \`axisLabels\` for axis labels

**Example with All Cost Curves (MC, AVC, AFC, ATC):**
\`\`\`chart
{
  "title": "Firm Cost Curves",
  "xLabel": "Quantity",
  "yLabel": "Cost ($)",
  "xRange": [0, 12],
  "yRange": [0, 20],
  "curves": [
    { "id": "MC", "label": "MC", "type": "uShape", "minimum": { "x": 4, "y": 5 }, "leftIntercept": 15, "color": "#ef4444" },
    { "id": "AVC", "label": "AVC", "type": "uShape", "minimum": { "x": 5, "y": 6 }, "leftIntercept": 12, "color": "#6366f1" },
    { "id": "AFC", "label": "AFC", "type": "hyperbola", "k": 30, "color": "#8b5cf6" },
    { "id": "ATC", "label": "ATC", "type": "derivedATC", "fromAvcCurve": "AVC", "fromAfcCurve": "AFC", "color": "#10b981" }
  ],
  "points": [
    { "id": "MC_ATC_int", "definition": { "type": "intersection", "curve1": "MC", "curve2": "ATC" } },
    { "id": "MC_AVC_int", "definition": { "type": "intersection", "curve1": "MC", "curve2": "AVC" } }
  ],
  "axisLabels": [
    { "point": "MC_AVC_int", "label": "Q₂", "axis": "x" },
    { "point": "MC_AVC_int", "label": "C₂", "axis": "y" },
    { "point": "MC_ATC_int", "label": "Q₃", "axis": "x" },
    { "point": "MC_ATC_int", "label": "C₃", "axis": "y" }
  ],
  "lines": [
    { "definition": { "type": "dashedToX", "from": "MC_AVC_int" } },
    { "definition": { "type": "dashedToY", "from": "MC_AVC_int" } },
    { "definition": { "type": "dashedToX", "from": "MC_ATC_int" } },
    { "definition": { "type": "dashedToY", "from": "MC_ATC_int" } }
  ]
}
\`\`\`

### PPC (Production Possibilities Curve)
\`\`\`chart
{
  "title": "Production Possibilities Curve",
  "xLabel": "Consumer Goods",
  "yLabel": "Capital Goods",
  "xRange": [0, 12],
  "yRange": [0, 12],
  "curves": [
    {
      "id": "PPC",
      "label": "PPC",
      "type": "pointSet",
      "points": [
        { "x": 0, "y": 10 },
        { "x": 2, "y": 9.8 },
        { "x": 4, "y": 9.2 },
        { "x": 6, "y": 8 },
        { "x": 7.5, "y": 6.6 },
        { "x": 8.5, "y": 5.2 },
        { "x": 9.2, "y": 3.8 },
        { "x": 9.7, "y": 2.2 },
        { "x": 10, "y": 0 }
      ],
      "smooth": true
    }
  ],
  "points": [
    { "id": "A", "definition": { "type": "fixed", "x": 5, "y": 5 }, "label": "A", "showMarker": true },
    { "id": "B", "definition": { "type": "fixed", "x": 8, "y": 8 }, "label": "B", "showMarker": true }
  ],
  "annotations": [
    { "point": "A", "text": "Inefficient\n(under-utilization)", "position": "bottomLeft" },
    { "point": "B", "text": "Impossible\n(unattainable)", "position": "topRight" }
  ]
}
\`\`\`

### Perfect Competition vs Monopoly (Side-by-Side)

**IMPORTANT: In Perfect Competition Long-Run Equilibrium:**
- Market price equals minimum ATC (P = min ATC)
- MC intersects ATC at ATC's minimum point
- MC's minimum is at a SMALLER x-value than ATC's minimum
- Firms earn zero economic profit

\`\`\`chart
{
  "title": "Market Structure Comparison",
  "charts": [
    {
      "title": "Perfect Competition",
      "xLabel": "Quantity",
      "yLabel": "Price",
      "xRange": [0, 12],
      "yRange": [0, 12],
      "curves": [
        { "id": "D", "label": "MR=D=AR=P", "type": "horizontal", "y": 6, "color": "#3b82f6" },
        { "id": "MC", "label": "MC", "type": "uShape", "minimum": { "x": 5, "y": 4 }, "leftIntercept": 12, "color": "#ef4444" }
      ],
      "points": [
        { "id": "E", "definition": { "type": "intersection", "curve1": "D", "curve2": "MC" }, "showMarker": true },
        { "id": "Qc", "definition": { "type": "projectX", "from": "E" } },
        { "id": "Pc", "definition": { "type": "projectY", "from": "E" } }
      ],
      "axisLabels": [
        { "point": "Qc", "axis": "x", "label": "Qc" },
        { "point": "Pc", "axis": "y", "label": "Pc" }
      ],
      "lines": [
        { "definition": { "type": "dashedToX", "from": "E" } },
        { "definition": { "type": "dashedToY", "from": "E" } }
      ]
    },
    {
      "title": "Monopoly",
      "xLabel": "Quantity",
      "yLabel": "Price",
      "xRange": [0, 12],
      "yRange": [0, 12],
      "curves": [
        { "id": "D", "label": "D", "type": "linear", "slope": -0.8, "intercept": 10, "color": "#3b82f6" },
        { "id": "MR", "label": "MR", "type": "derivedMR", "fromCurve": "D", "color": "#f97316" },
        { "id": "MC", "label": "MC", "type": "uShape", "minimum": { "x": 3, "y": 2 }, "leftIntercept": 8, "color": "#ef4444" },
        { "id": "ATC", "label": "ATC", "type": "uShape", "minimum": { "x": 5, "y": 4 }, "leftIntercept": 10, "color": "#10b981" }
      ],
      "points": [
        { "id": "Em", "definition": { "type": "intersection", "curve1": "MR", "curve2": "MC" }, "showMarker": true },
        { "id": "Pm", "definition": { "type": "onCurveAtPointX", "curve": "D", "from": "Em" } },
        { "id": "Qm", "definition": { "type": "projectX", "from": "Em" } },
        { "id": "Pm_y", "definition": { "type": "projectY", "from": "Pm" } },
        { "id": "ATC_at_Qm", "definition": { "type": "onCurveAtPointX", "curve": "ATC", "from": "Em" } },
        { "id": "ATC_y", "definition": { "type": "projectY", "from": "ATC_at_Qm" } }
      ],
      "axisLabels": [
        { "point": "Qm", "axis": "x", "label": "Qm" },
        { "point": "Pm_y", "axis": "y", "label": "Pm" }
      ],
      "lines": [
        { "definition": { "type": "dashedToX", "from": "Em" } },
        { "definition": { "type": "dashedToY", "from": "Pm" } },
        { "definition": { "type": "dashedToY", "from": "ATC_at_Qm" } },
        { "definition": { "type": "horizontal", "from": "ATC_at_Qm", "to": "Qm" } }
      ],
      "areas": [
        { "points": ["Pm_y", "ATC_y", "ATC_at_Qm", "Pm"], "color": "rgba(16, 185, 129, 0.3)", "label": "Profit" }
      ]
    }
  ]
}
\`\`\`

### Perfect Competition: Market and Firm in Long-Run Equilibrium (Side-by-Side)

**Key Points:**
- Market equilibrium determines price P*
- Firm takes price as given (horizontal demand/MR line at P*)
- Firm produces where P* = MC = min ATC
- MC minimum at x=4, ATC minimum at x=6 (MC reaches minimum first)
- At equilibrium (x=6), MC = ATC = P* = 6

\`\`\`chart
{
  "title": "Perfect Competition: Market and Firm in Long-Run Equilibrium",
  "charts": [
    {
      "title": "Market",
      "xLabel": "Quantity",
      "yLabel": "Price",
      "xRange": [0, 12],
      "yRange": [0, 12],
      "curves": [
        { "id": "D", "label": "D", "type": "linear", "slope": -1, "intercept": 10, "color": "#3b82f6" },
        { "id": "S", "label": "S", "type": "linear", "slope": 1, "intercept": 2, "color": "#f59e0b" }
      ],
      "points": [
        { "id": "E", "definition": { "type": "intersection", "curve1": "D", "curve2": "S" }, "label": "E", "showMarker": true },
        { "id": "Pe", "definition": { "type": "projectY", "from": "E" } },
        { "id": "Qe", "definition": { "type": "projectX", "from": "E" } },
        { "id": "D_int", "definition": { "type": "curveIntercept", "curve": "D", "axis": "y" } },
        { "id": "S_int", "definition": { "type": "curveIntercept", "curve": "S", "axis": "y" } }
      ],
      "lines": [
        { "definition": { "type": "dashedToX", "from": "E" },
        { "definition": { "type": "dashedToY", "from": "E" } }
      ],
      "areas": [
        { "points": ["D_int", "Pe", "E"], "color": "rgba(59, 130, 246, 0.3)", "label": "CS" },
        { "points": ["S_int", "Pe", "E"], "color": "rgba(245, 158, 11, 0.3)", "label": "PS" }
      ],
      "axisLabels": [
        { "point": "Qe", "axis": "x", "label": "Q*" },
        { "point": "Pe", "axis": "y", "label": "P*" }
      ]
    },
    {
      "title": "Representative Firm",
      "xLabel": "Quantity",
      "yLabel": "Price, Cost",
      "xRange": [0, 10],
      "yRange": [0, 12],
      "curves": [
        { "id": "P", "label": "P = MR", "type": "horizontal", "y": 6, "color": "#3b82f6", "dashed": true },
        { "id": "MC", "label": "MC", "type": "uShape", "minimum": { "x": 4, "y": 4 }, "leftIntercept": 12, "color": "#ef4444" },
        { "id": "ATC", "label": "ATC", "type": "uShape", "minimum": { "x": 6, "y": 6 }, "leftIntercept": 18, "color": "#10b981" }
      ],
      "points": [
        { "id": "E_firm", "definition": { "type": "intersection", "curve1": "P", "curve2": "MC" }, "label": "E", "showMarker": true },
        { "id": "Q_firm", "definition": { "type": "projectX", "from": "E_firm" } },
        { "id": "ATC_at_Q", "definition": { "type": "onCurve", "curve": "ATC", "x": 6 } }
      ],
      "lines": [
        { "definition": { "type": "dashedToX", "from": "E_firm" } }
      ],
      "axisLabels": [
        { "point": "Q_firm", "axis": "x", "label": "q*" }
      ],
      "annotations": [
        { "point": "E_firm", "text": "P = MC = min ATC", "position": "topRight" }
      ]
    }
  ]
}
\`\`\`

## Best Practices

- Use \`showMarker: true\` only for key points that need visual markers (like equilibrium points, intersections)
- Use \`axisLabels\` for labels on axes (like Qe, Pe, Y, P)
- Use uppercase for curves (D, S, MR, MC), meaningful names for points (E for equilibrium, M for monopoly)
- Use preset colors for consistency, semi-transparent (opacity 0.3) for areas
- Default axis range [0, 12] for both axes, adjust to fit all elements
- Add dashed lines from important points to both axes using \`dashedToX\` and \`dashedToY\`
- Keep the chart clean: put simple labels on the chart, detailed explanations in your text response
- Use geometric definitions instead of fixed coordinates:
  - Use \`intersection\` for curve intersections
  - Use \`derivedATC\` to calculate ATC from AVC and AFC
  - Use \`axisLabels\` for axis labels

## Other Charts
### T-table (T-account / Balance Sheet)

**CRITICAL: T-tables must use Markdown tables, NOT chart JSON, and NOT wrapped in code blocks!**

When the user asks for T-accounts, balance sheets, or any two-column accounting tables:

1. **DO NOT use chart JSON** - Do not output \`\`\`chart blocks for T-tables
2. **DO NOT wrap in code blocks** - Do NOT use \`\`\`markdown or \`\`\` around the table
3. **Output the table directly** - The markdown table syntax should be part of your normal response text

**CORRECT - Direct markdown table (renders as a visual table):**

| Assets | Liabilities & Equity |
|--------|---------------------|
| Reserves $10,000 | Deposits $15,000 |
| Loans $8,000 | Borrowings $2,000 |
| Securities $4,000 | Owner's Equity $5,000 |
| **Total $22,000** | **Total $22,000** |

**WRONG - Table in code block (renders as code text, NOT as table):**
~~~
\`\`\`markdown
| Assets | Liabilities |
| ... |
\`\`\`
~~~

**WRONG - Using chart JSON for T-tables:**
~~~
\`\`\`chart
{ "title": "T-account", ... }  // DO NOT do this for T-tables!
\`\`\`
~~~

**When to use Markdown tables (NOT chart JSON):**
- T-accounts in accounting (Debit/Credit columns)
- Bank balance sheets
- Simple two-column comparison tables
- Any tabular data that doesn't require geometric curves/axes

**When to use chart JSON:**
- Supply and demand curves
- Cost curves (MC, ATC, AVC)
- AD-AS models
- Any visualization with axes, curves, and geometric relationships

## Response Format

To ensure clarity and effectiveness in every interaction, structure your responses as follows:

---

### 1. **Text Explanation First**
Begin with a clear, concise verbal explanation of the concept. Use plain language, define key terms, and connect the topic to the AP curriculum.

### 2. **Visual Aid (When Helpful)**
If a chart or diagram would deepen understanding:
- **Offer to provide a chart** (e.g., *"Would a supply-demand diagram help clarify this?"*)

### 3. **Reinforce the "Why"**
Always explain the economic reasoning behind the chart or concept. Connect visual elements to real-world intuition or AP exam tips.

### 4. **Check for Understanding (Optional)**
End by inviting questions or offering a related practice scenario.

---

**Example Flow:**

> *"Let's explore the concept of price ceilings. First, here's the basic idea..."*
>
> *"Would a chart help illustrate the shortage that results?"*
> *[If yes] "Here's a simple supply and demand diagram showing a binding price ceiling below equilibrium..."*
>
> *"Notice how the quantity demanded exceeds quantity supplied at that price — that's the shortage. On the AP exam, you'll need to shade this area."*
>
> *"Does that make sense? Would you like to try an example?"*`

/**
 * 流式响应回调接口
 */
export interface StreamCallbacks {
  onTextChunk: (chunk: string) => void
  onThinkingChunk?: (chunk: string) => void
  onToolCallDetected: () => void
  onChartReady?: (chart: ChartData) => void
  onAnalysisReady?: (analysis: EffectAnalysis) => void
  onError: (error: Error) => void
  onComplete: (result: CompleteResult) => void
  onContentBlockAdded?: (block: ContentBlock, blocks: ContentBlock[]) => void
  onAbort?: (result: CompleteResult) => void
}

/**
 * 完成结果接口
 */
export interface CompleteResult {
  text: string
  blocks: ContentBlock[]
  chart?: ChartData
  analysis?: EffectAnalysis
}

/**
 * AI 响应接口
 */
export interface AIResponse {
  text?: string
  chart?: ChartData
  analysis?: EffectAnalysis
}

/**
 * 解析图表配置
 * 
 * 新架构：直接解析原语配置
 * 
 * @param config - AI 输出的配置
 * @returns ChartData
 */
function parseChartConfig(config: Record<string, unknown>): ChartData {
  const chart: ChartData = {
    title: config.title as string || 'Untitled',
    xLabel: config.xLabel as string,
    yLabel: config.yLabel as string,
    xRange: config.xRange as [number, number] | undefined,
    yRange: config.yRange as [number, number] | undefined,
    curves: (config.curves as CurveDefinition[] || []).map(c => ({
      id: c.id,
      label: c.label,
      type: c.type,
      slope: c.slope,
      intercept: c.intercept,
      minimum: c.minimum,
      maximum: c.maximum,
      leftIntercept: c.leftIntercept,
      rightY: c.rightY,
      steepness: c.steepness,
      x: c.x,
      y: c.y,
      points: c.points,
      smooth: c.smooth,
      fromCurve: c.fromCurve,
      color: c.color,
      dashed: c.dashed,
      lineWidth: c.lineWidth
    })),
    points: (config.points as PointDefinition[] || []).map(p => ({
      id: p.id,
      label: p.label,
      showMarker: p.showMarker,
      markerStyle: p.markerStyle,
      definition: p.definition
    })),
    lines: (config.lines as LineDefinition[] || []).map(l => ({
      id: l.id,
      definition: l.definition,
      style: l.style
    })),
    areas: (config.areas as AreaDefinition[] || []).map(a => ({
      id: a.id,
      points: a.points,
      color: a.color,
      opacity: a.opacity,
      label: a.label
    })),
    annotations: (config.annotations as ChartData['annotations'] || []),
    axisLabels: (config.axisLabels as ChartData['axisLabels'] || []),
    arrows: (config.arrows as ArrowDefinition[] || []).map(a => ({
      id: a.id,
      from: a.from,
      to: a.to,
      color: a.color,
      lineWidth: a.lineWidth,
      headSize: a.headSize,
      label: a.label,
      labelPosition: a.labelPosition
    })),
    charts: config.charts ? (config.charts as Record<string, unknown>[]).map(subConfig => parseChartConfig(subConfig)) : undefined
  }
  
  aiLogger.info('CHART_PARSED', 'Chart config parsed', { 
    title: chart.title,
    curveCount: chart.curves.length,
    pointCount: chart.points?.length || 0,
    areaCount: chart.areas?.length || 0,
    subChartCount: chart.charts?.length || 0
  })
  
  return chart
}

/**
 * 发送消息并获取响应（非流式）
 * 
 * @param messages - 历史消息列表
 * @param userContent - 用户输入内容
 * @param settings - API 设置
 * @param abortSignal - 中止信号
 * @returns AI 响应
 */
export async function sendMessage(
  messages: Message[],
  userContent: string,
  settings: ApiSettings,
  abortSignal?: AbortSignal
): Promise<AIResponse> {
  aiLogger.startRequest()
  
  const endpoint = settings.endpoint.replace(/\/$/, '')
  const provider = detectProvider(endpoint)
  const formatType = getProviderFormatType(provider.id)
  const isThinking = isThinkingModel(settings.model)

  const historyMessages: FormattedMessage[] = messages.slice(-10).map(m => ({
    role: m.role,
    content: m.content || (m.chart ? `[Generated a chart: ${m.chart.title}]` : '')
  })).filter(m => m.content) as FormattedMessage[]

  const formattedMessages: FormattedMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...historyMessages,
    { role: 'user', content: userContent }
  ]

  aiLogger.logMessageHistory(historyMessages)
  aiLogger.logApiRequest(endpoint, settings.model, historyMessages.length, userContent)

  const parameters: ApiParameters = {
    ...DEFAULT_PARAMETERS,
    ...settings.parameters
  }

  const body = buildRequestBody(formatType, {
    model: settings.model,
    messages: formattedMessages,
    parameters,
    stream: false,
    systemPrompt: SYSTEM_PROMPT
  })

  const requestParams = buildRequestBodyParams(provider.id, parameters, isThinking)
  const finalBody = { ...body, ...requestParams }

  const url = buildApiUrl(endpoint, settings.model, formatType, settings.apiKey)
  const customHeaders = getCustomHeaders(provider.id)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${settings.apiKey}`,
    ...customHeaders
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(finalBody),
    signal: abortSignal
  })

  if (!res.ok) {
    const err = await res.text()
    aiLogger.logApiError(res.status, err)
    throw new Error(`API Error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const parsed = parseResponse(formatType, data)

  aiLogger.logApiResponse(res.status, false, !!parsed.content)

  const result: AIResponse = {}

  if (parsed.content) {
    result.text = parsed.content
    aiLogger.info('RESPONSE', 'Text response received', { contentLength: parsed.content.length })
  }

  aiLogger.endRequest()
  return result
}

/**
 * 发送消息并获取流式响应
 * 
 * @param messages - 历史消息列表
 * @param userContent - 用户输入内容
 * @param settings - API 设置
 * @param callbacks - 流式响应回调
 * @param sessionId - 会话ID
 * @param abortSignal - 中止信号
 */
export async function sendMessageStream(
  messages: Message[],
  userContent: string,
  settings: ApiSettings,
  callbacks: StreamCallbacks,
  sessionId?: string,
  abortSignal?: AbortSignal
): Promise<void> {
  aiLogger.startRequest()
  
  const endpoint = settings.endpoint.replace(/\/$/, '')
  const provider = detectProvider(endpoint)
  const formatType = getProviderFormatType(provider.id)
  const isThinking = isThinkingModel(settings.model)

  const historyMessages: FormattedMessage[] = messages.slice(-10).map(m => ({
    role: m.role,
    content: m.content || (m.chart ? `[Generated a chart: ${m.chart.title}]` : '') || (m.blocks ? `[Generated content with ${m.blocks.filter(b => b.type === 'chart').length} chart(s)]` : '')
  })).filter(m => m.content) as FormattedMessage[]

  const formattedMessages: FormattedMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...historyMessages
  ]

  aiLogger.logMessageHistory(historyMessages)
  aiLogger.logApiRequest(endpoint, settings.model, historyMessages.length, userContent)

  const parameters: ApiParameters = {
    ...DEFAULT_PARAMETERS,
    ...settings.parameters
  }

  const baseBody = buildRequestBody(formatType, {
    model: settings.model,
    messages: formattedMessages,
    parameters,
    stream: true,
    systemPrompt: SYSTEM_PROMPT
  })

  const requestParams = buildRequestBodyParams(provider.id, parameters, isThinking)
  const body = { ...baseBody, ...requestParams, stream: true }

  const url = buildApiUrl(endpoint, settings.model, formatType, settings.apiKey)
  const customHeaders = getCustomHeaders(provider.id)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${settings.apiKey}`,
    ...customHeaders
  }

  const rawRequestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const rawRequest: RawHttpRequest = {
    id: rawRequestId,
    timestamp: Date.now(),
    sessionId,
    url,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ***`
    },
    body: {
      ...body,
      _meta: {
        endpoint,
        provider: provider.id,
        formatType,
        timestamp: new Date().toISOString()
      }
    }
  }
  saveRawRequest(rawRequest)

  // 在 try 块外部声明变量，以便在 catch 块中访问
  let textContent = ''
  let thinkingContent = ''
  const streamChunks: string[] = []
  const contentBlocks: ContentBlock[] = []
  let currentTextBlock = ''
  let currentThinkingBlock = ''
  let hasThinkingBlock = false
  
  const flushTextBlock = () => {
    if (currentTextBlock.trim()) {
      const textBlock: ContentBlock = { type: 'text', content: currentTextBlock.trim() }
      contentBlocks.push(textBlock)
      currentTextBlock = ''
      if (callbacks.onContentBlockAdded) {
        callbacks.onContentBlockAdded(textBlock, [...contentBlocks])
      }
    }
  }
  
  const flushThinkingBlock = () => {
    if (currentThinkingBlock.trim()) {
      const thinkingBlock: ContentBlock = { 
        type: 'thinking', 
        thinking: { content: currentThinkingBlock.trim(), isStreaming: false } 
      }
      contentBlocks.push(thinkingBlock)
      currentThinkingBlock = ''
      if (callbacks.onContentBlockAdded) {
        callbacks.onContentBlockAdded(thinkingBlock, [...contentBlocks])
      }
    }
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: abortSignal
    })

    const responseHeaders: Record<string, string> = {}
    res.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    if (!res.ok) {
      const err = await res.text()
      const errorResponse: RawHttpResponse = {
        id: `${rawRequestId}-response`,
        timestamp: Date.now(),
        requestId: rawRequestId,
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body: err,
        isStream: false
      }
      updateRawRequestResponse(rawRequestId, errorResponse)
      
      aiLogger.logApiError(res.status, err)
      callbacks.onError(new Error(`API Error ${res.status}: ${err}`))
      return
    }

    aiLogger.logStreamStart()
    
    const reader = res.body?.getReader()
    if (!reader) {
      aiLogger.logError('Stream', new Error('No response body'))
      callbacks.onError(new Error('No response body'))
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let loadingMarkerDetected = false
    let suppressTextOutput = false
    
    let inCodeBlock = false
    let codeBlockContent = ''
    let textBeforeCodeBlock = ''
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk
      streamChunks.push(chunk)
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue

        if (formatType === 'openai' || formatType === 'ollama') {
          if (!trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta

            if (delta?.reasoning_content) {
              const reasoningChunk = delta.reasoning_content
              thinkingContent += reasoningChunk
              currentThinkingBlock += reasoningChunk
              hasThinkingBlock = true
              
              if (callbacks.onThinkingChunk) {
                callbacks.onThinkingChunk(reasoningChunk)
              }
            }

            if (delta?.content) {
              if (hasThinkingBlock && currentTextBlock.trim() === '') {
                flushThinkingBlock()
              }
              
              const content = delta.content
              textContent += content
              
              for (const char of content) {
                if (!loadingMarkerDetected) {
                  if (CHART_LOADING_MARKER.startsWith(textBeforeCodeBlock + char)) {
                    textBeforeCodeBlock += char
                    if (textBeforeCodeBlock === CHART_LOADING_MARKER) {
                      loadingMarkerDetected = true
                      suppressTextOutput = true
                      textBeforeCodeBlock = ''
                      aiLogger.info('CHART_LOADING', 'Detected chart loading marker')
                      flushTextBlock()
                      callbacks.onToolCallDetected()
                    }
                    continue
                  } else if (textBeforeCodeBlock.length > 0) {
                    currentTextBlock += textBeforeCodeBlock
                    if (!suppressTextOutput) {
                      for (const c of textBeforeCodeBlock) {
                        callbacks.onTextChunk(c)
                      }
                    }
                    textBeforeCodeBlock = ''
                  }
                  
                  currentTextBlock += char
                  if (!suppressTextOutput) {
                    callbacks.onTextChunk(char)
                  }
                }
                
                if (loadingMarkerDetected && suppressTextOutput) {
                  if (!inCodeBlock) {
                    textBeforeCodeBlock += char
                    
                    const codeBlockMatch = textBeforeCodeBlock.match(/```\s*chart\s*$/)
                    if (codeBlockMatch) {
                      inCodeBlock = true
                      codeBlockContent = ''
                      textBeforeCodeBlock = ''
                      aiLogger.info('CHART_BLOCK', 'Detected chart code block start')
                      continue
                    }
                    
                    if (textBeforeCodeBlock.length > 100) {
                      const recentText = textBeforeCodeBlock.slice(-50)
                      if (!recentText.includes('```')) {
                        textBeforeCodeBlock = recentText
                      }
                    }
                  } else {
                    if (char === '`' && codeBlockContent.endsWith('``')) {
                      codeBlockContent = codeBlockContent.slice(0, -2)
                      inCodeBlock = false
                      suppressTextOutput = false
                      loadingMarkerDetected = false
                      
                      aiLogger.info('CHART_BLOCK', 'Chart code block ended', { 
                        contentLength: codeBlockContent.length 
                      })
                      
                      try {
                        const config = JSON.parse(codeBlockContent.trim())
                        const chartData = parseChartConfig(config)
                        
                        const chartBlock: ContentBlock = { type: 'chart', chart: chartData }
                        contentBlocks.push(chartBlock)
                        aiLogger.info('CHART_BLOCK', 'Chart parsed successfully', { 
                          title: chartData.title 
                        })
                        if (callbacks.onChartReady) {
                          callbacks.onChartReady(chartData)
                        }
                        if (callbacks.onContentBlockAdded) {
                          callbacks.onContentBlockAdded(chartBlock, [...contentBlocks])
                        }
                      } catch (e) {
                        aiLogger.logError('Chart parse', e)
                        console.error('Failed to parse chart config:', e)
                      }
                      
                      codeBlockContent = ''
                    } else {
                      codeBlockContent += char
                    }
                  }
                }
              }
            }
          } catch (e) {
            // Ignore JSON parse errors for incomplete chunks
          }
        } else if (formatType === 'anthropic') {
          if (!trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6)
          
          try {
            const parsed = JSON.parse(data)
            
            if (parsed.type === 'content_block_delta') {
              const delta = parsed.delta
              if (delta.type === 'text_delta' && delta.text) {
                const content = delta.text
                textContent += content
                currentTextBlock += content
                if (callbacks.onTextChunk) {
                  callbacks.onTextChunk(content)
                }
              } else if (delta.type === 'thinking_delta' && delta.thinking) {
                thinkingContent += delta.thinking
                currentThinkingBlock += delta.thinking
                hasThinkingBlock = true
                if (callbacks.onThinkingChunk) {
                  callbacks.onThinkingChunk(delta.thinking)
                }
              }
            }
            
            if (parsed.type === 'message_stop') {
              break
            }
          } catch (e) {
            // Ignore parse errors
          }
        } else if (formatType === 'google') {
          try {
            const parsed = JSON.parse(trimmed)
            const candidates = parsed.candidates || []
            const candidate = candidates[0]
            const content = candidate?.content
            const parts = content?.parts || []
            
            for (const part of parts) {
              if (part.text) {
                textContent += part.text
                currentTextBlock += part.text
                if (callbacks.onTextChunk) {
                  callbacks.onTextChunk(part.text)
                }
              }
            }
            
            if (candidate?.finishReason === 'STOP') {
              break
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
    
    flushThinkingBlock()
    flushTextBlock()

    const successResponse: RawHttpResponse = {
      id: `${rawRequestId}-response`,
      timestamp: Date.now(),
      requestId: rawRequestId,
      status: 200,
      statusText: 'OK',
      headers: responseHeaders,
      body: thinkingContent ? `[Thinking]\n${thinkingContent}\n\n[Response]\n${textContent}` : textContent,
      isStream: true,
      streamChunks
    }
    updateRawRequestResponse(rawRequestId, successResponse)

    const totalChunks = streamChunks.length
    aiLogger.logStreamEnd(totalChunks, textContent.length)
    
    if (thinkingContent) {
      aiLogger.info('THINKING', 'Thinking content received', { 
        thinkingLength: thinkingContent.length 
      })
    }
    
    // 从 blocks 中提取 chart 和 analysis
    const chartBlock = contentBlocks.find(b => b.type === 'chart')
    const analysisBlock = contentBlocks.find(b => b.type === 'analysis')
    
    callbacks.onComplete({
      text: textContent,
      blocks: contentBlocks,
      chart: chartBlock?.chart,
      analysis: analysisBlock?.analysis
    })
    aiLogger.endRequest()

  } catch (error) {
    const err = error as Error
    if (err.name === 'AbortError') {
      aiLogger.info('STREAM', 'Request aborted by user')
      
      flushThinkingBlock()
      flushTextBlock()
      
      const chartBlock = contentBlocks.find(b => b.type === 'chart')
      const analysisBlock = contentBlocks.find(b => b.type === 'analysis')
      
      if (callbacks.onAbort && (textContent || contentBlocks.length > 0)) {
        callbacks.onAbort({
          text: textContent,
          blocks: contentBlocks,
          chart: chartBlock?.chart,
          analysis: analysisBlock?.analysis
        })
      }
    } else {
      aiLogger.logError('Stream', err)
      callbacks.onError(err)
    }
    aiLogger.endRequest()
  }
}

/**
 * 生成图表标题建议
 * 
 * @param messages - 历史消息列表
 * @param settings - API 设置
 * @returns 标题建议
 */
export async function generateTitle(
  messages: Message[],
  settings: ApiSettings
): Promise<string> {
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
  if (!lastUserMessage) return 'New Conversation'
  
  const endpoint = settings.endpoint.replace(/\/$/, '')
  const provider = detectProvider(endpoint)
  const isThinking = isThinkingModel(settings.model)
  const parameters: ApiParameters = {
    ...DEFAULT_PARAMETERS,
    ...settings.parameters
  }
  
  try {
    const requestParams = buildRequestBodyParams(provider.id, parameters, isThinking)
    const body: Record<string, unknown> = {
      model: settings.model,
      messages: [
        { role: 'system', content: 'Generate a short title (max 6 words) for this conversation. Only output the title, nothing else.' },
        { role: 'user', content: lastUserMessage.content || '' }
      ],
      max_tokens: 20,
      ...requestParams
    }
    
    const customHeaders = getCustomHeaders(provider.id)
    const res = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`,
        ...customHeaders
      },
      body: JSON.stringify(body)
    })
    
    if (res.ok) {
      const data = await res.json()
      return data.choices?.[0]?.message?.content?.trim() || 'New Conversation'
    }
  } catch (e) {
    console.warn('Failed to generate title:', e)
  }
  
  return 'New Conversation'
}

/**
 * 测试 API 连接
 * 
 * @param settings - API 设置
 * @returns 连接是否成功
 */
export async function testApiConnection(settings: ApiSettings): Promise<boolean> {
  try {
    const endpoint = settings.endpoint.replace(/\/$/, '')
    const provider = detectProvider(endpoint)
    const customHeaders = getCustomHeaders(provider.id)
    
    const res = await fetch(`${endpoint}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`,
        ...customHeaders
      }
    })
    return res.ok
  } catch (e) {
    console.warn('API connection test failed:', e)
    return false
  }
}

/**
 * 获取会话的原始请求记录
 * 
 * @param sessionId - 会话ID
 * @returns 原始请求记录数组
 */
export function getSessionRawRequests(sessionId: string): RequestResponsePair[] {
  const allRequests = getStoredRawRequests()
  return allRequests.filter(r => r.sessionId === sessionId)
}
