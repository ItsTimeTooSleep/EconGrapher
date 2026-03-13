/**
 * 几何原语类型定义
 * 
 * 定义点、线、区域等几何原语的类型。
 * AI 通过这些原语来描述图表的几何结构。
 * 
 * @module primitives/types
 * @author EconGrapher Team
 */

import type { Point } from '../geometry-types'

/**
 * 点定义类型
 * 
 * 描述点的定义方式：
 * - fixed: 固定坐标点
 * - intersection: 两条曲线的交点
 * - projectX: 投影到 X 轴
 * - projectY: 投影到 Y 轴
 * - onCurve: 曲线上某 X 坐标处的点
 * - onCurveY: 曲线上某 Y 坐标处的点
 * - curveIntercept: 曲线的截距点
 * - onCurveAtPointX: 基于另一个点的 X 坐标在曲线上找点
 * - onCurveAtPointY: 基于另一个点的 Y 坐标在曲线上找点
 * - curveMinimum: 曲线的最低点（适用于 U-shape 曲线）
 * - curveMaximum: 曲线的最高点（适用于 N-shape 曲线）
 */
export type PointDefinition =
  | { type: 'fixed'; x: number; y: number }
  | { type: 'intersection'; curve1: string; curve2: string }
  | { type: 'projectX'; from: string }
  | { type: 'projectY'; from: string }
  | { type: 'onCurve'; curve: string; x: number }
  | { type: 'onCurveY'; curve: string; y: number }
  | { type: 'curveIntercept'; curve: string; axis: 'x' | 'y' }
  | { type: 'onCurveAtPointX'; curve: string; from: string }
  | { type: 'onCurveAtPointY'; curve: string; from: string }
  | { type: 'curveMinimum'; curve: string }
  | { type: 'curveMaximum'; curve: string }

/**
 * 点原语
 * 
 * 定义图表中的一个点。
 * 
 * @property id - 点的唯一标识符
 * @property definition - 点的定义方式
 * @property label - 显示标签（可选）
 * @property showMarker - 是否显示标记点（默认 true）
 * @property markerStyle - 标记样式
 */
export interface PointPrimitive {
  id: string
  definition: PointDefinition
  label?: string
  showMarker?: boolean
  markerStyle?: {
    symbol?: 'circle' | 'square' | 'diamond' | 'triangle-up' | 'triangle-down'
    size?: number
    color?: string
  }
}

/**
 * 解析后的点
 * 
 * @property id - 点 ID
 * @property coordinates - 点坐标
 * @property label - 显示标签
 * @property showMarker - 是否显示标记
 * @property markerStyle - 标记样式
 */
export interface ResolvedPoint {
  id: string
  coordinates: Point
  label?: string
  showMarker: boolean
  markerStyle?: PointPrimitive['markerStyle']
}

/**
 * 线定义类型
 * 
 * 描述线的定义方式：
 * - segment: 两点之间的线段
 * - dashedToX: 到 X 轴的虚线，支持 xLabel
 * - dashedToY: 到 Y 轴的虚线，支持 yLabel
 * - horizontal: 水平线段
 * - vertical: 垂直线段
 */
export type LineDefinition =
  | { type: 'segment'; from: string; to: string }
  | { type: 'dashedToX'; from: string; xLabel?: string }
  | { type: 'dashedToY'; from: string; yLabel?: string }
  | { type: 'horizontal'; from: string; to: string }
  | { type: 'vertical'; from: string; to: string }

/**
 * 线样式
 */
export interface LineStyle {
  color?: string
  width?: number
  dash?: 'solid' | 'dash' | 'dot'
}

/**
 * 线原语
 * 
 * 定义图表中的一条线。
 * 
 * @property id - 线的唯一标识符
 * @property definition - 线的定义方式
 * @property style - 线样式
 */
export interface LinePrimitive {
  id?: string
  definition: LineDefinition
  style?: LineStyle
}

/**
 * 解析后的线
 * 
 * @property points - 线的点集
 * @property style - 线样式
 * @property xLabel - X 轴标签（用于 dashedToX）
 * @property yLabel - Y 轴标签（用于 dashedToY）
 */
export interface ResolvedLine {
  points: Point[]
  style: LineStyle
  xLabel?: string
  yLabel?: string
}

/**
 * 区域原语
 * 
 * 定义图表中的一个填充区域。
 * 
 * @property id - 区域的唯一标识符
 * @property points - 点 ID 数组，按顺序连接形成封闭区域
 * @property color - 填充颜色
 * @property opacity - 透明度（0-1）
 * @property label - 区域标签
 * @property labelPosition - 标签位置（可选，默认自动计算）
 */
export interface AreaPrimitive {
  id?: string
  points: string[]
  color?: string
  opacity?: number
  label?: string
  labelPosition?: 'auto' | Point
}

/**
 * 解析后的区域
 * 
 * @property points - 区域顶点坐标
 * @property color - 填充颜色
 * @property opacity - 透明度
 * @property label - 区域标签
 * @property labelPosition - 标签位置
 */
export interface ResolvedArea {
  points: Point[]
  color: string
  opacity: number
  label?: string
  labelPosition?: Point
}

/**
 * 标注原语
 * 
 * 定义图表中的文本标注。
 * 
 * @property point - 关联的点 ID
 * @property text - 标注文本
 * @property position - 标注相对于点的位置
 * @property offset - 偏移量（像素）
 */
export interface AnnotationPrimitive {
  point: string
  text: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
  offset?: { x?: number; y?: number }
}

/**
 * 解析后的标注
 * 
 * @property x - X 坐标
 * @property y - Y 坐标
 * @property text - 标注文本
 * @property position - 位置
 * @property offset - 偏移量
 */
export interface ResolvedAnnotation {
  x: number
  y: number
  text: string
  position?: AnnotationPrimitive['position']
  offset?: { x?: number; y?: number }
}

/**
 * 轴标签原语
 * 
 * 定义坐标轴上的标签。
 * 
 * @property point - 关联的点 ID
 * @property axis - 轴（'x' 或 'y'）
 * @property label - 标签文本
 */
export interface AxisLabelPrimitive {
  point: string
  axis: 'x' | 'y'
  label: string
}

/**
 * 解析后的轴标签
 * 
 * @property x - X 坐标
 * @property y - Y 坐标
 * @property label - 标签文本
 */
export interface ResolvedAxisLabel {
  x: number
  y: number
  label: string
}

/**
 * 箭头端点定义
 * 
 * 描述箭头端点的定义方式：
 * - point: 引用已定义的点 ID
 * - curvePoint: 曲线上某 X 坐标处的点
 * - curvePointY: 曲线上某 Y 坐标处的点
 * - fixed: 固定坐标点
 */
export type ArrowEndpointDefinition =
  | { type: 'point'; id: string }
  | { type: 'curvePoint'; curve: string; x: number }
  | { type: 'curvePointY'; curve: string; y: number }
  | { type: 'fixed'; x: number; y: number }

/**
 * 箭头原语
 * 
 * 定义图表中的箭头。
 * 
 * @property id - 箭头的唯一标识符
 * @property from - 起点定义
 * @property to - 终点定义
 * @property color - 箭头颜色
 * @property lineWidth - 线条宽度
 * @property headSize - 箭头头部大小
 * @property label - 标签文本
 * @property labelPosition - 标签位置
 */
export interface ArrowPrimitive {
  id?: string
  from: ArrowEndpointDefinition
  to: ArrowEndpointDefinition
  color?: string
  lineWidth?: number
  headSize?: number
  label?: string
  labelPosition?: 'start' | 'middle' | 'end'
}

/**
 * 解析后的箭头
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
export interface ResolvedArrow {
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
 * 几何原语配置
 * 
 * 包含所有几何原语的配置。
 */
export interface PrimitivesConfig {
  points: PointPrimitive[]
  lines: LinePrimitive[]
  areas: AreaPrimitive[]
  annotations: AnnotationPrimitive[]
  axisLabels: AxisLabelPrimitive[]
  arrows: ArrowPrimitive[]
}

/**
 * 解析后的几何原语
 * 
 * 包含所有解析后的几何元素。
 */
export interface ResolvedPrimitives {
  points: ResolvedPoint[]
  lines: ResolvedLine[]
  areas: ResolvedArea[]
  annotations: ResolvedAnnotation[]
  axisLabels: ResolvedAxisLabel[]
  arrows: ResolvedArrow[]
}

/**
 * 默认样式配置
 */
export const DEFAULT_PRIMITIVE_STYLES = {
  line: {
    color: 'rgba(0, 0, 0, 0.3)',
    width: 1.5,
    dash: 'dash' as const
  },
  area: {
    color: 'rgba(59, 130, 246, 0.3)',
    opacity: 0.3
  },
  marker: {
    symbol: 'circle' as const,
    size: 8,
    color: '#1e293b'
  }
}
