/**
 * 几何数据类型定义
 * 
 * 本文件定义了规则引擎输出的标准格式。
 * 所有几何数据由规则引擎计算得出，供渲染层使用。
 * 
 * @module geometry-types
 * @author EconGrapher Team
 */

/**
 * 二维坐标点
 * 
 * @property x - X 坐标
 * @property y - Y 坐标
 */
export interface Point {
  x: number
  y: number
}

/**
 * 曲线样式
 * 
 * @property color - 曲线颜色
 * @property width - 线条宽度
 * @property dash - 虚线样式
 */
export interface CurveStyle {
  color: string
  width: number
  dash?: 'solid' | 'dash' | 'dot'
}

/**
 * 曲线几何数据
 * 
 * @property type - 曲线类型：linear(线性) | pointSet(点集)
 * @property points - 曲线上的点坐标数组
 * @property label - 曲线标签
 * @property style - 曲线样式
 */
export interface CurveGeometry {
  type: 'linear' | 'pointSet'
  points: Point[]
  label: string
  style: CurveStyle
}

/**
 * 均衡点几何数据
 * 
 * @property x - X 坐标
 * @property y - Y 坐标
 * @property label - 均衡点标签
 */
export interface EquilibriumGeometry {
  x: number
  y: number
  label: string
}

/**
 * 虚线几何数据
 * 用于表示从点到坐标轴的虚线
 * 
 * @property points - 虚线路径点数组
 * @property axisLabels - 坐标轴标签
 */
export interface DashedLineGeometry {
  points: Point[]
  axisLabels: {
    x?: string
    y?: string
  }
}

/**
 * 阴影区域几何数据
 * 
 * @property points - 区域顶点数组（按顺序连接形成封闭区域）
 * @property color - 填充颜色
 * @property opacity - 透明度
 * @property label - 区域标签
 * @property labelPosition - 标签位置
 */
export interface ShadedAreaGeometry {
  points: Point[]
  color: string
  opacity: number
  label?: string
  labelPosition: Point
}

/**
 * 花括号几何数据
 * 用于表示 Shortage/Surplus 等区域的花括号标注
 * 
 * @property x1 - 起始 X 坐标
 * @property x2 - 结束 X 坐标
 * @property y - Y 坐标位置
 * @property direction - 方向：up(向上) | down(向下)
 * @property label - 标签文本
 * @property color - 颜色
 * @property labelPosition - 标签位置
 */
export interface BraceGeometry {
  x1: number
  x2: number
  y: number
  direction: 'up' | 'down'
  label: string
  color: string
  labelPosition: Point
}

/**
 * 文本标注几何数据
 * 
 * @property x - X 坐标
 * @property y - Y 坐标
 * @property text - 标注文本
 * @property arrowDirection - 箭头方向（可选）
 */
export interface AnnotationGeometry {
  x: number
  y: number
  text: string
  arrowDirection?: 'right' | 'left' | 'up' | 'down'
}

/**
 * 箭头几何数据
 * 
 * @property startX - 起点 X 坐标
 * @property startY - 起点 Y 坐标
 * @property endX - 终点 X 坐标
 * @property endY - 终点 Y 坐标
 * @property color - 箭头颜色
 * @property lineWidth - 线条宽度
 * @property headSize - 箭头头部大小
 * @property label - 标签文本
 * @property labelPosition - 标签位置
 */
export interface ArrowGeometry {
  startX: number
  startY: number
  endX: number
  endY: number
  color: string
  lineWidth: number
  headSize: number
  label?: string
  labelPosition?: 'start' | 'middle' | 'end'
}

/**
 * 标记点几何数据
 * 
 * @property x - X 坐标
 * @property y - Y 坐标
 * @property label - 标签
 * @property color - 颜色
 * @property symbol - 符号类型
 * @property size - 大小
 */
export interface MarkerGeometry {
  x: number
  y: number
  label?: string
  color: string
  symbol?: 'circle' | 'square' | 'diamond' | 'triangle-up' | 'triangle-down'
  size?: number
}

/**
 * 坐标轴几何数据
 * 
 * @property xRange - X 轴范围 [min, max]
 * @property yRange - Y 轴范围 [min, max]
 * @property xLabel - X 轴标签
 * @property yLabel - Y 轴标签
 */
export interface AxisGeometry {
  xRange: [number, number]
  yRange: [number, number]
  xLabel: string
  yLabel: string
}

/**
 * 几何数据输出格式
 * 这是规则引擎的输出格式，包含所有需要渲染的几何元素
 * 
 * @property curves - 曲线数据数组
 * @property equilibriumPoints - 均衡点数组
 * @property dashedLines - 虚线数组
 * @property shadedAreas - 阴影区域数组
 * @property braces - 花括号数组
 * @property annotations - 文本标注数组
 * @property markers - 标记点数组
 * @property arrows - 箭头数组
 * @property axis - 坐标轴配置
 * @property title - 图表标题
 */
export interface GeometryData {
  curves: CurveGeometry[]
  equilibriumPoints: EquilibriumGeometry[]
  dashedLines: DashedLineGeometry[]
  shadedAreas: ShadedAreaGeometry[]
  braces: BraceGeometry[]
  annotations: AnnotationGeometry[]
  markers: MarkerGeometry[]
  arrows: ArrowGeometry[]
  axis: AxisGeometry
  title: string
}

/**
 * 交点计算结果
 * 
 * @property point - 交点坐标（若存在）
 * @property exists - 是否存在有效交点
 * @property reason - 无交点时的原因说明
 */
export interface IntersectionResult {
  point: Point | null
  exists: boolean
  reason?: string
}

/**
 * 区域计算结果
 * 
 * @property points - 区域顶点
 * @property area - 区域面积
 * @property centroid - 区域重心
 */
export interface AreaResult {
  points: Point[]
  area: number
  centroid: Point
}

/**
 * 价格管制效果类型
 */
export type PriceControlEffectType = 
  | 'ceiling_binding'      // 价格上限有效（低于均衡价格）
  | 'ceiling_non_binding'  // 价格上限无效（高于均衡价格）
  | 'floor_binding'        // 价格下限有效（高于均衡价格）
  | 'floor_non_binding'    // 价格下限无效（低于均衡价格）
  | 'at_equilibrium'       // 等于均衡价格

/**
 * 价格管制效果结果
 * 
 * @property type - 效果类型
 * @property description - 效果描述
 * @property Qd - 需求量（在管制价格处）
 * @property Qs - 供给量（在管制价格处）
 * @property shortage - 短缺量（Qd - Qs）
 * @property surplus - 过剩量（Qs - Qd）
 */
export interface PriceControlEffectResult {
  type: PriceControlEffectType
  description: string
  Qd?: number
  Qs?: number
  shortage?: number
  surplus?: number
}

/**
 * 税收效果结果
 * 
 * @property originalEquilibrium - 原始均衡点
 * @property newEquilibrium - 新均衡点（税后）
 * @property consumerPrice - 消费者支付价格
 * @property producerPrice - 生产者收到价格
 * @property taxRevenue - 税收收入
 * @property consumerBurden - 消费者税负
 * @property producerBurden - 生产者税负
 * @property deadweightLoss - 无谓损失
 */
export interface TaxEffectResult {
  originalEquilibrium: Point
  newEquilibrium: Point
  consumerPrice: number
  producerPrice: number
  taxRevenue: number
  consumerBurden: number
  producerBurden: number
  deadweightLoss: number
}

/**
 * 垄断均衡结果
 * 
 * @property monopolyQuantity - 垄断产量
 * @property monopolyPrice - 垄断价格
 * @property socialOptimalQuantity - 社会最优产量
 * @property socialOptimalPrice - 社会最优价格
 * @property profit - 利润（若 ATC 存在）
 * @property deadweightLoss - 无谓损失
 */
export interface MonopolyEquilibriumResult {
  monopolyQuantity: number
  monopolyPrice: number
  socialOptimalQuantity: number
  socialOptimalPrice: number
  profit?: number
  profitArea?: Point[]
  deadweightLoss: number
  deadweightLossArea: Point[]
}

/**
 * 外部性均衡结果
 * 
 * @property marketQuantity - 市场均衡产量
 * @property marketPrice - 市场均衡价格
 * @property socialQuantity - 社会最优产量
 * @property socialPrice - 社会最优价格
 * @property deadweightLoss - 无谓损失
 * @property externalityAmount - 外部性大小
 */
export interface ExternalityEquilibriumResult {
  marketQuantity: number
  marketPrice: number
  socialQuantity: number
  socialPrice: number
  deadweightLoss: number
  deadweightLossArea: Point[]
  externalityAmount: number
}

/**
 * 创建空的几何数据对象
 * 用于初始化规则处理器的输出
 * 
 * @param title - 图表标题
 * @param xLabel - X 轴标签
 * @param yLabel - Y 轴标签
 * @param xRange - X 轴范围
 * @param yRange - Y 轴范围
 * @returns 空的几何数据对象
 */
export function createEmptyGeometryData(
  title: string,
  xLabel: string = 'Quantity',
  yLabel: string = 'Price',
  xRange: [number, number] = [0, 12],
  yRange: [number, number] = [0, 12]
): GeometryData {
  return {
    curves: [],
    equilibriumPoints: [],
    dashedLines: [],
    shadedAreas: [],
    braces: [],
    annotations: [],
    markers: [],
    arrows: [],
    axis: {
      xRange,
      yRange,
      xLabel,
      yLabel
    },
    title
  }
}

/**
 * 计算三角形面积
 * 使用叉积公式计算三角形面积
 * 
 * @param p1 - 第一个顶点
 * @param p2 - 第二个顶点
 * @param p3 - 第三个顶点
 * @returns 三角形面积
 */
export function calculateTriangleArea(
  p1: Point,
  p2: Point,
  p3: Point
): number {
  return Math.abs(
    (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2
  )
}

/**
 * 计算多边形重心
 * 使用几何中心公式计算多边形重心
 * 
 * @param points - 多边形顶点数组
 * @returns 重心坐标
 */
export function calculateCentroid(points: Point[]): Point {
  if (points.length === 0) {
    return { x: 0, y: 0 }
  }
  
  const n = points.length
  let sumX = 0
  let sumY = 0
  
  for (const p of points) {
    sumX += p.x
    sumY += p.y
  }
  
  return {
    x: sumX / n,
    y: sumY / n
  }
}

/**
 * 计算两点之间的距离
 * 
 * @param p1 - 第一个点
 * @param p2 - 第二个点
 * @returns 两点之间的欧氏距离
 */
export function calculateDistance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}
