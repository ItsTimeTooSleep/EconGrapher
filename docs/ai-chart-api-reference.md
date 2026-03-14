# AI 图表绘制 API 参考文档

本文档详细说明 AI 在绘制经济学图表时可以调用的所有 API、参数类型和使用方法。

***

## 一、核心概念

EconGrapher 采用**原语语义配置架构**，AI 不需要计算具体坐标，只需要描述：

1. **曲线**：使用曲线模板定义形状
2. **点**：通过几何关系定义位置
3. **线**：连接点或投影到轴
4. **区域**：由点围成的填充区域
5. **标注**：关联到点的文本

**系统自动计算**：交点、投影、区域面积、坐标位置等所有几何数据。

***

## 二、图表数据结构

### 2.1 ChartData 主结构

```typescript
interface ChartData {
  title: string                    // 图表标题（必需）
  xLabel?: string                  // X 轴标签
  yLabel?: string                  // Y 轴标签
  xRange?: [number, number]        // X 轴范围 [min, max]
  yRange?: [number, number]        // Y 轴范围 [min, max]
  
  curves: CurveDefinition[]        // 曲线定义数组（必需）
  points?: PointDefinition[]       // 点定义数组
  lines?: LineDefinition[]         // 线定义数组
  areas?: AreaDefinition[]         // 区域定义数组
  annotations?: AnnotationDefinition[]  // 标注定义数组
  axisLabels?: AxisLabelDefinition[]    // 轴标签定义数组
  charts?: ChartData[]             // 子图表数组（多图表模式）
}
```

### 2.2 完整示例

```json
{
  "title": "供需均衡分析",
  "xLabel": "数量",
  "yLabel": "价格",
  "xRange": [0, 12],
  "yRange": [0, 12],
  "curves": [
    { "id": "D", "label": "D", "type": "linear", "slope": -1, "intercept": 10 },
    { "id": "S", "label": "S", "type": "linear", "slope": 1, "intercept": 2 }
  ],
  "points": [
    { "id": "E", "definition": { "type": "intersection", "curve1": "D", "curve2": "S" }, "label": "E" }
  ],
  "lines": [
    { "definition": { "type": "dashedToX", "from": "E", "xLabel": "Qe" } },
    { "definition": { "type": "dashedToY", "from": "E", "yLabel": "Pe" } }
  ],
  "areas": [
    { "points": ["E", "origin", "xIntercept"], "color": "rgba(59, 130, 246, 0.3)", "label": "消费者剩余" }
  ]
}
```

***

## 三、曲线模板

### 3.1 曲线类型概览

| 类型           | 用途       | 示例曲线              |
| ------------ | -------- | ----------------- |
| `linear`     | 线性直线     | 需求曲线、供给曲线、AD、SRAS |
| `uShape`     | U 形曲线    | ATC、AVC、MC        |
| `nShape`     | 倒 U 形曲线  | 某些特殊曲线            |
| `vertical`   | 垂直线      | LRAS、LRPC、货币供给    |
| `horizontal` | 水平线      | 价格线、完全竞争 MR       |
| `pointSet`   | 自定义点集    | PPC、洛伦兹曲线         |
| `derivedMR`  | 派生边际收益   | 从需求曲线派生 MR        |
| `derivedMFC` | 派生边际要素成本 | 从供给曲线派生 MFC       |

### 3.2 线性曲线 (linear)

用于需求曲线、供给曲线、AD、SRAS 等直线。

```typescript
interface LinearCurveDefinition {
  id: string           // 曲线唯一标识符（必需）
  label: string        // 显示标签（必需）
  type: 'linear'       // 类型标识（必需）
  slope: number        // 斜率（必需）- 需求曲线为负，供给曲线为正
  intercept: number    // Y 轴截距（必需）
  color?: string       // 颜色（可选）
  dashed?: boolean     // 是否虚线（可选）
  lineWidth?: number   // 线条宽度（可选，默认 2.5）
}
```

**示例**：

```json
{ "id": "D", "label": "D", "type": "linear", "slope": -1, "intercept": 10 }
{ "id": "S", "label": "S", "type": "linear", "slope": 1, "intercept": 2, "color": "#f59e0b" }
```

### 3.3 U 形曲线 (uShape)

用于 ATC、AVC、MC 等成本曲线。

```typescript
interface UShapeCurveDefinition {
  id: string                      // 曲线唯一标识符（必需）
  label: string                   // 显示标签（必需）
  type: 'uShape'                  // 类型标识（必需）
  minimum: { x: number; y: number }  // 最低点坐标（必需）
  leftIntercept?: number          // 左侧 Y 截距（x=0 时的 y 值）
  rightY?: number                 // 右侧某点的 Y 值
  steepness?: number              // 陡峭程度（默认 1）
  color?: string                  // 颜色
  dashed?: boolean                // 是否虚线
  lineWidth?: number              // 线条宽度
}
```

**示例**：

```json
{ 
  "id": "ATC", 
  "label": "ATC", 
  "type": "uShape", 
  "minimum": { "x": 5, "y": 8 },
  "leftIntercept": 20
}
```

### 3.4 倒 U 形曲线 (nShape)

```typescript
interface NShapeCurveDefinition {
  id: string                      // 曲线唯一标识符（必需）
  label: string                   // 显示标签（必需）
  type: 'nShape'                  // 类型标识（必需）
  maximum: { x: number; y: number }  // 最高点坐标（必需）
  leftIntercept?: number          // 左侧 Y 截距
  rightY?: number                 // 右侧某点的 Y 值
  steepness?: number              // 陡峭程度
  color?: string                  // 颜色
  dashed?: boolean                // 是否虚线
  lineWidth?: number              // 线条宽度
}
```

### 3.5 垂直线 (vertical)

用于 LRAS、LRPC、货币供给等。

```typescript
interface VerticalLineDefinition {
  id: string           // 曲线唯一标识符（必需）
  label: string        // 显示标签（必需）
  type: 'vertical'     // 类型标识（必需）
  x: number            // X 坐标位置（必需）
  color?: string       // 颜色
  dashed?: boolean     // 是否虚线
  lineWidth?: number   // 线条宽度
}
```

**示例**：

```json
{ "id": "LRAS", "label": "LRAS", "type": "vertical", "x": 8, "color": "#8b5cf6" }
```

### 3.6 水平线 (horizontal)

用于价格线、完全竞争市场的 MR 等。

```typescript
interface HorizontalLineDefinition {
  id: string           // 曲线唯一标识符（必需）
  label: string        // 显示标签（必需）
  type: 'horizontal'   // 类型标识（必需）
  y: number            // Y 坐标位置（必需）
  color?: string       // 颜色
  dashed?: boolean     // 是否虚线
  lineWidth?: number   // 线条宽度
}
```

**示例**：

```json
{ "id": "Pc", "label": "Pc", "type": "horizontal", "y": 4 }
```

### 3.7 点集曲线 (pointSet)

用于 PPC、洛伦兹曲线等自定义形状。

```typescript
interface PointSetCurveDefinition {
  id: string                          // 曲线唯一标识符（必需）
  label: string                       // 显示标签（必需）
  type: 'pointSet'                    // 类型标识（必需）
  points: Array<{ x: number; y: number }>  // 点坐标数组（必需）
  smooth?: boolean                    // 是否平滑曲线（默认 true）
  color?: string                      // 颜色
  dashed?: boolean                    // 是否虚线
  lineWidth?: number                  // 线条宽度
}
```

**示例**：

```json
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
  ]
}
```

### 3.8 派生 MR 曲线 (derivedMR)

从需求曲线自动派生边际收益曲线。MR 曲线的斜率是需求曲线斜率的 2 倍。

```typescript
interface DerivedMRCurveDefinition {
  id: string           // 曲线唯一标识符（必需）
  label: string        // 显示标签（必需）
  type: 'derivedMR'    // 类型标识（必需）
  fromCurve: string    // 源需求曲线的 ID（必需）
  color?: string       // 颜色
  dashed?: boolean     // 是否虚线
  lineWidth?: number   // 线条宽度
}
```

**示例**：

```json
{ "id": "MR", "label": "MR", "type": "derivedMR", "fromCurve": "D" }
```

### 3.9 派生 MFC 曲线 (derivedMFC)

从供给曲线自动派生边际要素成本曲线。MFC 曲线的斜率是供给曲线斜率的 2 倍。

```typescript
interface DerivedMFCCurveDefinition {
  id: string           // 曲线唯一标识符（必需）
  label: string        // 显示标签（必需）
  type: 'derivedMFC'   // 类型标识（必需）
  fromCurve: string    // 源供给曲线的 ID（必需）
  color?: string       // 颜色
  dashed?: boolean     // 是否虚线
  lineWidth?: number   // 线条宽度
}
```

***

## 四、点原语

### 4.1 点定义类型

| 类型                | 说明                 | 参数                 |
| ----------------- | ------------------ | ------------------ |
| `fixed`           | 固定坐标点              | `x`, `y`           |
| `intersection`    | 两曲线交点              | `curve1`, `curve2` |
| `projectX`        | 投影到 X 轴            | `from` (源点 ID)     |
| `projectY`        | 投影到 Y 轴            | `from` (源点 ID)     |
| `onCurve`         | 曲线上某 X 处的点         | `curve`, `x`       |
| `onCurveY`        | 曲线上某 Y 处的点         | `curve`, `y`       |
| `curveIntercept`  | 曲线的截距点             | `curve`, `axis`    |
| `onCurveAtPointX` | 基于另一个点的 X 坐标在曲线上找点 | `curve`, `from`    |
| `onCurveAtPointY` | 基于另一个点的 Y 坐标在曲线上找点 | `curve`, `from`    |
| `curveMinimum`    | U 形曲线的最低点          | `curve`            |
| `curveMaximum`    | N 形曲线的最高点          | `curve`            |

### 4.2 点定义结构

```typescript
interface PointDefinition {
  id: string           // 点的唯一标识符（必需）
  label?: string       // 显示标签
  showMarker?: boolean // 是否显示标记点（默认 true）
  markerStyle?: {
    symbol?: 'circle' | 'square' | 'diamond' | 'triangle-up' | 'triangle-down'
    size?: number
    color?: string
  }
  definition: PointDefinitionType  // 点的定义方式（必需）
}
```

### 4.3 固定坐标点

```json
{ 
  "id": "origin", 
  "definition": { "type": "fixed", "x": 0, "y": 0 }
}
```

### 4.4 曲线交点

自动计算两条曲线的交点坐标。

```json
{ 
  "id": "E", 
  "definition": { "type": "intersection", "curve1": "D", "curve2": "S" },
  "label": "E"
}
```

### 4.5 投影点

将一个点投影到坐标轴。

```json
{ "id": "Ex", "definition": { "type": "projectX", "from": "E" } }
{ "id": "Ey", "definition": { "type": "projectY", "from": "E" } }
```

### 4.6 曲线上的点

在曲线上指定 X 或 Y 坐标，自动计算另一个坐标。

```json
{ "id": "P1", "definition": { "type": "onCurve", "curve": "D", "x": 5 } }
{ "id": "P2", "definition": { "type": "onCurveY", "curve": "S", "y": 8 } }
```

### 4.7 曲线截距点

获取曲线与坐标轴的交点。

```json
{ "id": "yIntercept", "definition": { "type": "curveIntercept", "curve": "D", "axis": "y" } }
{ "id": "xIntercept", "definition": { "type": "curveIntercept", "curve": "D", "axis": "x" } }
```

### 4.8 基于另一个点的 X 坐标在曲线上找点

使用另一个点的 X 坐标在指定曲线上找到对应的点。这在垄断图表中特别有用，用于找到垄断价格点。

```json
{ "id": "Pm", "definition": { "type": "onCurveAtPointX", "curve": "D", "from": "Em" } }
```

**参数说明：**

- `curve`: 目标曲线的 ID
- `from`: 源点的 ID（使用该点的 X 坐标）

**使用场景：** 在垄断图表中，找到需求曲线上对应垄断产量（MR=MC 交点）的价格点。

### 4.9 基于另一个点的 Y 坐标在曲线上找点

使用另一个点的 Y 坐标在指定曲线上找到对应的点。

```json
{ "id": "P1", "definition": { "type": "onCurveAtPointY", "curve": "S", "from": "E" } }
```

**参数说明：**

- `curve`: 目标曲线的 ID
- `from`: 源点的 ID（使用该点的 Y 坐标）

### 4.10 曲线最低点 (curveMinimum)

自动获取 U 形曲线（ATC、AVC、MC 等）的最低点坐标。点的坐标从曲线定义的 `minimum` 参数自动计算。

```json
{ "id": "ATC_min", "definition": { "type": "curveMinimum", "curve": "ATC" } }
```

**参数说明：**

- `curve`: U 形曲线的 ID（必须是 `type: "uShape"` 的曲线）

**使用场景：**

- 获取成本曲线的最低点
- MC 与 ATC/AVC 的交点（MC 在 ATC/AVC 最低点处相交）

**示例：**

```json
{
  "curves": [
    { "id": "MC", "label": "MC", "type": "uShape", "minimum": { "x": 4, "y": 5 }, "leftIntercept": 15 },
    { "id": "ATC", "label": "ATC", "type": "uShape", "minimum": { "x": 6, "y": 8 }, "leftIntercept": 25 }
  ],
  "points": [
    { "id": "MC_min", "definition": { "type": "curveMinimum", "curve": "MC" } },
    { "id": "ATC_min", "definition": { "type": "curveMinimum", "curve": "ATC" } },
    { "id": "MC_ATC_int", "definition": { "type": "intersection", "curve1": "MC", "curve2": "ATC" }, "showMarker": true }
  ]
}
```

### 4.11 曲线最高点 (curveMaximum)

自动获取 N 形曲线（倒 U 形）的最高点坐标。点的坐标从曲线定义的 `maximum` 参数自动计算。

```json
{ "id": "MP_max", "definition": { "type": "curveMaximum", "curve": "MP" } }
```

**参数说明：**

- `curve`: N 形曲线的 ID（必须是 `type: "nShape"` 的曲线）

**使用场景：**

- 获取边际产量（MP）曲线的最高点
- 获取总产量曲线的拐点

***

## 五、线原语

### 5.1 线定义类型

| 类型           | 说明       | 参数               |
| ------------ | -------- | ---------------- |
| `segment`    | 两点之间的线段  | `from`, `to`     |
| `dashedToX`  | 到 X 轴的虚线 | `from`, `xLabel` |
| `dashedToY`  | 到 Y 轴的虚线 | `from`, `yLabel` |
| `horizontal` | 水平线段     | `from`, `to`     |
| `vertical`   | 垂直线段     | `from`, `to`     |

### 5.2 线定义结构

```typescript
interface LineDefinition {
  id?: string          // 线的唯一标识符（可选）
  definition: LineDefinitionType  // 线的定义方式（必需）
  style?: {
    color?: string     // 颜色
    width?: number     // 线宽
    dash?: 'solid' | 'dash' | 'dot'  // 线型
  }
}
```

### 5.3 线段

连接两个点。

```json
{ "definition": { "type": "segment", "from": "P1", "to": "P2" } }
```

### 5.4 到轴的虚线

从点绘制虚线到坐标轴，支持添加轴标签。

```json
{ "definition": { "type": "dashedToX", "from": "E", "xLabel": "Qe" } }
{ "definition": { "type": "dashedToY", "from": "E", "yLabel": "Pe" } }
```

- `xLabel`（可选）：在 X 轴上显示的标签
- `yLabel`（可选）：在 Y 轴上显示的标签

### 5.5 水平/垂直线段

```json
{ "definition": { "type": "horizontal", "from": "P1", "to": "P2" } }
{ "definition": { "type": "vertical", "from": "P1", "to": "P2" } }
```

***

## 六、区域原语

### 6.1 区域定义结构

```typescript
interface AreaDefinition {
  id?: string          // 区域的唯一标识符（可选）
  points: string[]     // 点 ID 数组，按顺序连接形成封闭区域（必需）
  color?: string       // 填充颜色
  opacity?: number     // 透明度（0-1，默认 0.3）
  label?: string       // 区域标签
}
```

### 6.2 示例

```json
{
  "points": ["E", "Ey", "origin", "Ex"],
  "color": "rgba(59, 130, 246, 0.3)",
  "opacity": 0.3,
  "label": "消费者剩余"
}
```

**注意**：`points` 数组中的点 ID 必须按顺序排列，系统会自动闭合区域。

***

## 七、标注原语

### 7.1 标注定义结构

```typescript
interface AnnotationDefinition {
  point: string        // 关联的点 ID（必需）
  text: string         // 标注文本（必需）
  position?: 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
  offset?: { x?: number; y?: number }  // 偏移量（像素）
}
```

### 7.2 示例

```json
{ "point": "E", "text": "均衡点", "position": "topRight" }
```

***

## 八、轴标签原语

### 8.1 轴标签定义结构

```typescript
interface AxisLabelDefinition {
  point: string        // 关联的点 ID（必需）
  axis: 'x' | 'y'      // 轴（必需）
  label: string        // 标签文本（必需）
}
```

### 8.2 示例

```json
{ "point": "Ex", "axis": "x", "label": "Qe" }
{ "point": "Ey", "axis": "y", "label": "Pe" }
```

***

## 九、预设颜色

### 9.1 曲线颜色

| 颜色常量   | 十六进制值     | 用途          |
| ------ | --------- | ----------- |
| demand | `#3b82f6` | 需求曲线（蓝色）    |
| supply | `#f59e0b` | 供给曲线（橙色）    |
| mr     | `#f97316` | MR 曲线（橙红色）  |
| mc     | `#ef4444` | MC 曲线（红色）   |
| atc    | `#10b981` | ATC 曲线（绿色）  |
| avc    | `#6366f1` | AVC 曲线（靛蓝色） |
| afc    | `#8b5cf6` | AFC 曲线（紫色）  |
| lras   | `#8b5cf6` | LRAS 曲线（紫色） |

### 9.2 区域颜色

| 颜色常量            | RGBA 值                    | 用途    |
| --------------- | ------------------------- | ----- |
| consumerSurplus | `rgba(59, 130, 246, 0.3)` | 消费者剩余 |
| producerSurplus | `rgba(245, 158, 11, 0.3)` | 生产者剩余 |
| deadweightLoss  | `rgba(239, 68, 68, 0.3)`  | 无谓损失  |
| profit          | `rgba(16, 185, 129, 0.3)` | 利润    |
| loss            | `rgba(239, 68, 68, 0.3)`  | 亏损    |
| tax             | `rgba(139, 92, 246, 0.3)` | 税收    |
| subsidy         | `rgba(16, 185, 129, 0.3)` | 补贴    |

***

## 十、完整示例

### 10.1 供需均衡图

```json
{
  "type": "chart",
  "title": "供需均衡",
  "xLabel": "数量",
  "yLabel": "价格",
  "curves": [
    { "id": "D", "label": "D", "type": "linear", "slope": -1, "intercept": 10 },
    { "id": "S", "label": "S", "type": "linear", "slope": 1, "intercept": 2 }
  ],
  "points": [
    { "id": "E", "definition": { "type": "intersection", "curve1": "D", "curve2": "S" }, "label": "E" },
    { "id": "Ex", "definition": { "type": "projectX", "from": "E" } },
    { "id": "Ey", "definition": { "type": "projectY", "from": "E" } }
  ],
  "lines": [
    { "definition": { "type": "dashedToX", "from": "E", "xLabel": "Qe" } },
    { "definition": { "type": "dashedToY", "from": "E", "yLabel": "Pe" } }
  ]
}
```

### 10.2 垄断定价图

**重要说明：** 垄断图表必须正确使用 `onCurveAtPointX` 来找到垄断价格点。

```json
{
  "type": "chart",
  "title": "垄断定价与无谓损失",
  "xLabel": "数量",
  "yLabel": "价格",
  "curves": [
    { "id": "D", "label": "D", "type": "linear", "slope": -1, "intercept": 13, "color": "#3b82f6" },
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
    { "definition": { "type": "dashedToX", "from": "Em", "xLabel": "Qm" } },
    { "definition": { "type": "dashedToY", "from": "Pm", "yLabel": "Pm" } },
    { "definition": { "type": "dashedToX", "from": "Ec", "xLabel": "Qc" } },
    { "definition": { "type": "vertical", "from": "Em", "to": "Pm" }, "style": { "color": "#94a3b8", "width": 1.5, "dash": "dash" } }
  ],
  "areas": [
    { "points": ["D_int", "Pm_y", "Pm", "Qm"], "color": "rgba(59, 130, 246, 0.3)", "label": "CS" },
    { "points": ["Pm_y", "MC_int", "MC_at_Qm", "Pm"], "color": "rgba(245, 158, 11, 0.3)", "label": "PS" },
    { "points": ["Pm", "MC_at_Qm", "Ec"], "color": "rgba(239, 68, 68, 0.3)", "label": "DWL" }
  ],
  "axisLabels": [
    { "point": "Qm", "axis": "x", "label": "Qm" },
    { "point": "Qc", "axis": "x", "label": "Qc" },
    { "point": "Pm_y", "axis": "y", "label": "Pm" }
  ]
}
```

**关键点说明：**

- `Em`: MR = MC 交点，确定垄断产量 Qm
- `Pm`: 使用 `onCurveAtPointX` 在需求曲线上找到垄断价格
- `MC_at_Qm`: 使用 `onCurveAtPointX` 在 MC 曲线上找到垄断产量处的边际成本
- `Ec`: D = MC 交点，社会最优产量 Qc

### 10.3 成本曲线图

**重要说明：** 成本曲线应使用几何定义来定义关键点，确保准确性。

```json
{
  "type": "chart",
  "title": "厂商成本曲线",
  "xLabel": "产量",
  "yLabel": "成本 ($)",
  "xRange": [0, 12],
  "yRange": [0, 20],
  "curves": [
    { 
      "id": "MC", 
      "label": "MC", 
      "type": "uShape", 
      "minimum": { "x": 4, "y": 5 },
      "leftIntercept": 15,
      "color": "#ef4444"
    },
    { 
      "id": "ATC", 
      "label": "ATC", 
      "type": "uShape", 
      "minimum": { "x": 6, "y": 8 },
      "leftIntercept": 25,
      "color": "#10b981"
    },
    { 
      "id": "AVC", 
      "label": "AVC", 
      "type": "uShape", 
      "minimum": { "x": 5, "y": 6 },
      "leftIntercept": 12,
      "color": "#6366f1"
    }
  ],
  "points": [
    { "id": "MC_min", "definition": { "type": "curveMinimum", "curve": "MC" } },
    { "id": "AVC_min", "definition": { "type": "curveMinimum", "curve": "AVC" } },
    { "id": "ATC_min", "definition": { "type": "curveMinimum", "curve": "ATC" } },
    { "id": "MC_ATC_int", "definition": { "type": "intersection", "curve1": "MC", "curve2": "ATC" }, "showMarker": true },
    { "id": "MC_AVC_int", "definition": { "type": "intersection", "curve1": "MC", "curve2": "AVC" }, "showMarker": true },
    { "id": "Q1", "definition": { "type": "projectX", "from": "MC_min" } },
    { "id": "Q2", "definition": { "type": "projectX", "from": "AVC_min" } },
    { "id": "Q3", "definition": { "type": "projectX", "from": "ATC_min" } }
  ],
  "lines": [
    { "definition": { "type": "dashedToX", "from": "MC_min" } },
    { "definition": { "type": "dashedToX", "from": "AVC_min" } },
    { "definition": { "type": "dashedToX", "from": "ATC_min" } }
  ],
  "axisLabels": [
    { "point": "Q1", "axis": "x", "label": "Q₁" },
    { "point": "Q2", "axis": "x", "label": "Q₂" },
    { "point": "Q3", "axis": "x", "label": "Q₃" }
  ]
}
```

**关键点说明：**

- `MC_min`, `AVC_min`, `ATC_min`: 使用 `curveMinimum` 自动获取曲线最低点
- `MC_ATC_int`, `MC_AVC_int`: MC 在 ATC 和 AVC 最低点处与它们相交
- `Q₁`, `Q₂`, `Q₃`: 各最低点在 X 轴上的投影，用于轴标签
- 虚线从最低点延伸到 X 轴，便于读取产量值

### 10.4 AD-AS 模型

```json
{
  "type": "chart",
  "title": "AD-AS 模型",
  "xLabel": "实际 GDP",
  "yLabel": "价格水平",
  "curves": [
    { "id": "AD", "label": "AD", "type": "linear", "slope": -0.5, "intercept": 15 },
    { "id": "SRAS", "label": "SRAS", "type": "linear", "slope": 0.3, "intercept": 3 },
    { "id": "LRAS", "label": "LRAS", "type": "vertical", "x": 10 }
  ],
  "points": [
    { "id": "E", "definition": { "type": "intersection", "curve1": "AD", "curve2": "SRAS" }, "label": "E" }
  ],
  "lines": [
    { "definition": { "type": "dashedToX", "from": "E", "xLabel": "Y" } },
    { "definition": { "type": "dashedToY", "from": "E", "yLabel": "P" } }
  ]
}
```

***

## 十一、最佳实践

### 11.1 ID 命名规范

- 曲线 ID：使用大写字母，如 `D`、`S`、`MR`、`MC`
- 点 ID：使用有意义的名称，如 `E`（均衡点）、`M`（垄断点）、`origin`（原点）
- 投影点：在原点 ID 后加轴标识，如 `Ex`、`Ey`

### 11.2 颜色选择

- 优先使用预设颜色，保持图表风格一致
- 区域使用半透明颜色（opacity 0.3）
- 避免使用过多颜色，保持图表简洁

### 11.3 坐标轴范围

- 默认范围：X 轴 \[0, 12]，Y 轴 \[0, 12]
- 根据曲线位置适当调整，确保所有元素可见
- 坐标轴从 0 开始（`minallowed: 0`）

### 11.4 点的定义顺序

- 先定义曲线
- 再定义基于曲线的点（交点、曲线上的点）
- 最后定义投影点

### 11.5 几何定义优先

**始终使用几何定义而非固定坐标**，确保图表的准确性和一致性：

| 使用                                                            | 而非                                    | 原因        |
| ------------------------------------------------------------- | ------------------------------------- | --------- |
| `{ "type": "intersection", "curve1": "MC", "curve2": "ATC" }` | `{ "type": "fixed", "x": 6, "y": 8 }` | 精确的交点坐标   |
| `{ "type": "curveMinimum", "curve": "ATC" }`                  | `{ "type": "fixed", "x": 6, "y": 8 }` | 从曲线定义自动计算 |
| `{ "type": "projectX", "from": "E" }`                         | `{ "type": "fixed", "x": 6, "y": 0 }` | 与源点保持一致   |

**优点：**

1. **准确性**：点坐标从曲线数学定义自动计算
2. **一致性**：修改曲线参数时，点自动更新
3. **清晰性**：图表意图从定义中清晰可见

### 11.6 坐标轴虚线

**为关键点添加到坐标轴的虚线**，帮助读者识别坐标值：

```json
{
  "lines": [
    { "definition": { "type": "dashedToX", "from": "E", "xLabel": "Qe" } },
    { "definition": { "type": "dashedToY", "from": "E", "yLabel": "Pe" } }
  ]
}
```

**适用场景：**

- 均衡点到两个轴
- 最低/最高点到 X 轴
- 垄断价格点到 Y 轴

### 11.7 最小化图表标注

保持图表简洁，避免过多文字：

| 做法                | 示例                                              |
| ----------------- | ----------------------------------------------- |
| ✅ 使用简短标签          | `"text": "E"` 或 `"text": "min ATC"`             |
| ❌ 避免长解释           | `"text": "MC minimum\n(occurs first)"`          |
| ✅ 详细说明放文本         | 在响应文本中解释图表含义                                    |
| ✅ 坐标值用 axisLabels | `{ "point": "Qe", "axis": "x", "label": "Qe" }` |

***

## 十二、错误处理

### 12.1 常见错误

| 错误类型       | 说明                            | 解决方法                          |
| ---------- | ----------------------------- | ----------------------------- |
| 曲线 ID 重复   | 多条曲线使用相同 ID                   | 确保每条曲线有唯一 ID                  |
| 点引用不存在的曲线  | 点定义引用了未定义的曲线                  | 检查 curve1/curve2/fromCurve 参数 |
| 派生曲线依赖缺失   | derivedMR/derivedMFC 引用的曲线不存在 | 确保源曲线已定义                      |
| 区域点 ID 不存在 | 区域引用了未定义的点                    | 检查 points 数组中的点 ID            |

### 12.2 验证函数

系统提供配置验证函数：

```typescript
function validatePrimitiveConfig(config: PrimitiveSemanticConfig): ConfigValidation

interface ConfigValidation {
  valid: boolean
  errors: string[]
  warnings?: string[]
}
```

***

## 十三、相关文件

| 文件路径                                       | 说明     |
| ------------------------------------------ | ------ |
| `lib/types.ts`                             | 核心类型定义 |
| `lib/rule-engine/primitive-config.ts`      | 原语语义配置 |
| `lib/rule-engine/curve-templates/types.ts` | 曲线模板类型 |
| `lib/rule-engine/primitives/types.ts`      | 几何原语类型 |
| `lib/rule-engine/primitive-engine.ts`      | 原语规则引擎 |
| `components/charts/EconChart.tsx`          | 主图表组件  |
| `components/charts/builders/index.ts`      | 图表构建器  |

