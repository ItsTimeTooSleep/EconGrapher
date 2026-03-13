# 几何原语架构重构计划

## 概述

将现有的"经济学概念驱动"架构重构为"几何原语驱动"架构。AI 通过曲线模板和几何原语描述图表，规则引擎负责几何计算。

## 架构对比

### 当前架构
```
AI 输出经济学概念 → 图表类型处理器 → 几何计算 → Plotly 渲染
例：showConsumerSurplus: true → SupplyDemandRules → 计算 CS 区域
```

### 新架构
```
AI 输出几何原语 → 几何计算引擎 → Plotly 渲染
例：定义点 E = 交点(D, S)，填充区域 [A, B, E] → 计算坐标
```

---

## 第一步：设计曲线模板系统

### 1.1 创建曲线模板类型定义

**文件**: `lib/rule-engine/curve-templates/types.ts`

定义曲线模板接口：
- `LinearCurveTemplate` - 线性曲线（斜率 + 截距）
- `UShapeCurveTemplate` - U 形曲线（最低点 + 形状参数）
- `VerticalLineTemplate` - 垂直线（x 位置）
- `HorizontalLineTemplate` - 水平线（y 位置）
- `PointSetCurveTemplate` - 点集曲线（自定义点）
- `DerivedCurveTemplate` - 派生曲线（从其他曲线派生，如 MR 从 D 派生）

### 1.2 实现曲线模板生成器

**文件**: `lib/rule-engine/curve-templates/generators.ts`

实现各类曲线的点集生成：
- `generateLinearPoints` - 生成线性曲线点（支持无限延长）
- `generateUShapePoints` - 生成 U 形曲线点
- `generateVerticalLinePoints` - 生成垂直线点
- `generateDerivedMR` - 从需求曲线派生 MR

### 1.3 创建曲线模板注册表

**文件**: `lib/rule-engine/curve-templates/registry.ts`

管理所有曲线模板，支持：
- 通过 label 查找曲线
- 验证曲线定义
- 解析派生曲线依赖

---

## 第二步：设计几何原语系统

### 2.1 创建几何原语类型定义

**文件**: `lib/rule-engine/primitives/types.ts`

定义几何原语接口：

#### 点原语 (PointPrimitive)
```typescript
interface PointPrimitive {
  id: string                    // 点标识符
  definition: PointDefinition   // 点定义方式
  label?: string               // 显示标签
  showMarker?: boolean         // 是否显示标记点
}

type PointDefinition = 
  | { type: 'fixed'; x: number; y: number }
  | { type: 'intersection'; curve1: string; curve2: string }
  | { type: 'projectX'; from: string }      // 投影到 X 轴
  | { type: 'projectY'; from: string }      // 投影到 Y 轴
  | { type: 'onCurve'; curve: string; x: number }  // 曲线上某 X 处的点
  | { type: 'onCurveY'; curve: string; y: number } // 曲线上某 Y 处的点
```

#### 线原语 (LinePrimitive)
```typescript
interface LinePrimitive {
  id: string
  definition: LineDefinition
  style?: LineStyle
}

type LineDefinition =
  | { type: 'segment'; from: string; to: string }  // 两点连线
  | { type: 'dashedToX'; from: string }            // 到 X 轴的虚线
  | { type: 'dashedToY'; from: string }            // 到 Y 轴的虚线
  | { type: 'dashedToAxis'; from: string; showXLabel?: string; showYLabel?: string }
```

#### 区域原语 (AreaPrimitive)
```typescript
interface AreaPrimitive {
  id: string
  points: string[]              // 点 ID 数组，按顺序连接
  color?: string
  opacity?: number
  label?: string
}
```

#### 标注原语 (AnnotationPrimitive)
```typescript
interface AnnotationPrimitive {
  point: string                 // 关联的点 ID
  text: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}
```

### 2.2 实现几何计算引擎

**文件**: `lib/rule-engine/primitives/calculator.ts`

核心计算方法：
- `calculatePoint` - 根据定义计算点坐标
- `calculateLine` - 根据定义计算线段
- `calculateArea` - 根据点数组计算区域
- `resolveDependencies` - 解析点之间的依赖关系

### 2.3 创建几何原语解析器

**文件**: `lib/rule-engine/primitives/resolver.ts`

解析流程：
1. 收集所有曲线定义
2. 解析所有点定义（处理依赖关系）
3. 解析所有线定义
4. 解析所有区域定义
5. 输出 GeometryData

---

## 第三步：重写规则引擎

### 3.1 创建新的语义配置类型

**文件**: `lib/rule-engine/primitive-config.ts`

```typescript
interface PrimitiveSemanticConfig {
  title: string
  xLabel?: string
  yLabel?: string
  xRange?: [number, number]
  yRange?: [number, number]
  
  curves: CurveTemplate[]       // 曲线定义
  points: PointPrimitive[]      // 点定义
  lines: LinePrimitive[]        // 线定义
  areas: AreaPrimitive[]        // 区域定义
  annotations: AnnotationPrimitive[]  // 标注定义
}
```

### 3.2 实现新的规则引擎

**文件**: `lib/rule-engine/primitive-engine.ts`

```typescript
class PrimitiveEngine {
  process(config: PrimitiveSemanticConfig): GeometryData {
    // 1. 解析曲线，生成点集
    // 2. 解析点定义，计算坐标
    // 3. 解析线定义，生成线段
    // 4. 解析区域定义，生成填充区域
    // 5. 解析标注定义，生成标注
    // 6. 返回 GeometryData
  }
}
```

### 3.3 更新 GeometryDataConverter

**文件**: `lib/rule-engine/utils/GeometryDataConverter.ts`

保持现有接口，适配新的 GeometryData 格式。

---

## 第四步：更新 AI 提示词

### 4.1 重写系统提示词

**文件**: `lib/ai-service.ts`

新的提示词结构：
1. 解释几何原语概念
2. 提供曲线模板使用说明
3. 提供点、线、区域定义示例
4. 展示完整图表配置示例

### 4.2 更新图表函数定义

**文件**: `lib/ai-service.ts`

替换现有的 20+ 个图表函数为：
- `generate_chart` - 统一的图表生成函数

函数参数：
```typescript
{
  title: string,
  xLabel: string,
  yLabel: string,
  curves: CurveTemplate[],
  points: PointPrimitive[],
  lines: LinePrimitive[],
  areas: AreaPrimitive[],
  annotations: AnnotationPrimitive[],
  xRange?: [number, number],
  yRange?: [number, number]
}
```

### 4.3 提供曲线模板辅助函数

AI 可用的曲线模板快捷方式：
- `uShapeCurve(options)` - 快速创建 U 形曲线
- `downwardLine(options)` - 快速创建向下倾斜直线
- `upwardLine(options)` - 快速创建向上倾斜直线
- `verticalLine(options)` - 快速创建垂直线

---

## 第五步：移除旧代码

### 5.1 删除旧的处理器文件

删除以下文件：
- `lib/rule-engine/processors/SupplyDemandRules.ts`
- `lib/rule-engine/processors/PriceControlRules.ts`
- `lib/rule-engine/processors/TaxSubsidyRules.ts`
- `lib/rule-engine/processors/MonopolyRules.ts`
- `lib/rule-engine/processors/ExternalityRules.ts`
- `lib/rule-engine/processors/GenericChartRules.ts`

### 5.2 删除旧的类型定义

从 `lib/types.ts` 中移除：
- `ChartType` 枚举（保留 `generic_chart` 或重命名为 `chart`）
- 所有图表类型特定的字段（如 `demandCurve`, `supplyCurves` 等）

### 5.3 更新入口文件

**文件**: `lib/rule-engine/index.ts`

导出新的模块：
- `PrimitiveEngine`
- 曲线模板相关类型和函数
- 几何原语相关类型和函数

### 5.4 更新 builders

**文件**: `components/charts/builders/index.ts`

简化 `chartDataToSemanticConfig`，移除图表类型判断逻辑。

---

## 文件变更清单

### 新增文件
| 文件路径 | 描述 |
|---------|------|
| `lib/rule-engine/curve-templates/types.ts` | 曲线模板类型定义 |
| `lib/rule-engine/curve-templates/generators.ts` | 曲线模板生成器 |
| `lib/rule-engine/curve-templates/registry.ts` | 曲线模板注册表 |
| `lib/rule-engine/curve-templates/index.ts` | 曲线模板模块入口 |
| `lib/rule-engine/primitives/types.ts` | 几何原语类型定义 |
| `lib/rule-engine/primitives/calculator.ts` | 几何计算引擎 |
| `lib/rule-engine/primitives/resolver.ts` | 几何原语解析器 |
| `lib/rule-engine/primitives/index.ts` | 几何原语模块入口 |
| `lib/rule-engine/primitive-config.ts` | 新的语义配置类型 |
| `lib/rule-engine/primitive-engine.ts` | 新的规则引擎 |

### 修改文件
| 文件路径 | 修改内容 |
|---------|---------|
| `lib/rule-engine/index.ts` | 更新导出，使用新引擎 |
| `lib/rule-engine/geometry-types.ts` | 保持不变，可能微调 |
| `lib/rule-engine/utils/GeometryDataConverter.ts` | 适配新格式 |
| `lib/types.ts` | 简化 ChartData 类型 |
| `lib/ai-service.ts` | 重写提示词和函数定义 |
| `components/charts/builders/index.ts` | 简化转换逻辑 |

### 删除文件
| 文件路径 | 原因 |
|---------|------|
| `lib/rule-engine/processors/SupplyDemandRules.ts` | 被几何原语系统替代 |
| `lib/rule-engine/processors/PriceControlRules.ts` | 被几何原语系统替代 |
| `lib/rule-engine/processors/TaxSubsidyRules.ts` | 被几何原语系统替代 |
| `lib/rule-engine/processors/MonopolyRules.ts` | 被几何原语系统替代 |
| `lib/rule-engine/processors/ExternalityRules.ts` | 被几何原语系统替代 |
| `lib/rule-engine/processors/GenericChartRules.ts` | 被几何原语系统替代 |
| `lib/rule-engine/processors/ChartRuleProcessor.ts` | 被新引擎替代 |
| `lib/rule-engine/processors/index.ts` | 不再需要 |
| `lib/rule-engine/semantic-types.ts` | 被 primitive-config.ts 替代 |

---

## 实施顺序

1. **曲线模板系统** - 先实现曲线模板，确保能生成各类曲线
2. **几何原语系统** - 实现点、线、区域的定义和计算
3. **新规则引擎** - 整合曲线模板和几何原语
4. **AI 提示词** - 更新 AI 接口
5. **清理旧代码** - 删除不再需要的文件

---

## 示例：Supply and Demand 图表

### AI 输出（新格式）
```json
{
  "title": "Market Equilibrium",
  "xLabel": "Quantity",
  "yLabel": "Price",
  "curves": [
    { "id": "D", "template": "linear", "slope": -1, "intercept": 10, "color": "#3b82f6" },
    { "id": "S", "template": "linear", "slope": 1, "intercept": 2, "color": "#f59e0b" }
  ],
  "points": [
    { "id": "E", "definition": { "type": "intersection", "curve1": "D", "curve2": "S" }, "label": "E" },
    { "id": "Pe", "definition": { "type": "projectY", "from": "E" } },
    { "id": "Qe", "definition": { "type": "projectX", "from": "E" } }
  ],
  "lines": [
    { "definition": { "type": "dashedToAxis", "from": "E", "showXLabel": "Qe", "showYLabel": "Pe" } }
  ],
  "areas": [
    { 
      "id": "CS",
      "points": ["D_intercept", "Pe", "E"],
      "color": "rgba(59, 130, 246, 0.3)",
      "label": "Consumer Surplus"
    },
    { 
      "id": "PS",
      "points": ["S_intercept", "Pe", "E"],
      "color": "rgba(245, 158, 11, 0.3)",
      "label": "Producer Surplus"
    }
  ]
}
```

---

## 风险与缓解

| 风险 | 缓解措施 |
|------|---------|
| AI 学习曲线 | 提供详细的示例和模板函数 |
| 配置冗长 | 提供快捷模板函数 |
| 依赖解析复杂 | 实现拓扑排序，检测循环依赖 |
| 曲线不存在 | 验证阶段检查曲线 ID |
| 交点不存在 | 处理平行线等边界情况 |

---

## 预计工作量

| 步骤 | 预计时间 |
|------|---------|
| 曲线模板系统 | 中等 |
| 几何原语系统 | 较大 |
| 新规则引擎 | 中等 |
| AI 提示词 | 较小 |
| 清理旧代码 | 较小 |

总计：大型重构项目
