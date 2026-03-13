/**
 * 基础类型定义
 * 
 * @module types
 * @author EconGrapher Team
 */

/**
 * 点坐标
 */
export interface Point {
  x: number
  y: number
}

export interface Session {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  preview: string
}

/**
 * 图表数据类型
 * 
 * 新架构使用原语语义配置，不再区分图表类型。
 * AI 通过曲线模板和几何原语描述图表。
 */
export interface ChartData {
  type: 'chart'
  title: string
  xLabel?: string
  yLabel?: string
  xRange?: [number, number]
  yRange?: [number, number]
  
  curves: CurveDefinition[]
  points?: PointDefinition[]
  lines?: LineDefinition[]
  areas?: AreaDefinition[]
  annotations?: AnnotationDefinition[]
  axisLabels?: AxisLabelDefinition[]
  arrows?: ArrowDefinition[]
  charts?: ChartData[]
}

/**
 * 曲线定义
 */
export interface CurveDefinition {
  id: string
  label: string
  type: CurveType
  color?: string
  dashed?: boolean
  lineWidth?: number
  slope?: number
  intercept?: number
  minimum?: { x: number; y: number }
  maximum?: { x: number; y: number }
  leftIntercept?: number
  rightY?: number
  steepness?: number
  x?: number
  y?: number
  points?: Array<{ x: number; y: number }>
  smooth?: boolean
  fromCurve?: string
  k?: number
  h?: number
  v?: number
  startX?: number
}

/**
 * 曲线类型
 */
export type CurveType = 
  | 'linear'
  | 'uShape'
  | 'nShape'
  | 'hyperbola'
  | 'vertical'
  | 'horizontal'
  | 'pointSet'
  | 'derivedMR'
  | 'derivedMFC'

/**
 * 点定义
 */
export interface PointDefinition {
  id: string
  label?: string
  showMarker?: boolean
  markerStyle?: {
    symbol?: 'circle' | 'square' | 'diamond' | 'triangle-up' | 'triangle-down'
    size?: number
    color?: string
  }
  definition: PointDefinitionType
}

/**
 * 点定义类型
 */
export type PointDefinitionType =
  | { type: 'fixed'; x: number; y: number }
  | { type: 'intersection'; curve1: string; curve2: string }
  | { type: 'projectX'; from: string }
  | { type: 'projectY'; from: string }
  | { type: 'onCurve'; curve: string; x: number }
  | { type: 'onCurveY'; curve: string; y: number }
  | { type: 'curveIntercept'; curve: string; axis: 'x' | 'y' }
  | { type: 'onCurveAtPointX'; curve: string; from: string }
  | { type: 'onCurveAtPointY'; curve: string; from: string }

/**
 * 线定义
 */
export interface LineDefinition {
  id?: string
  definition: LineDefinitionType
  style?: {
    color?: string
    width?: number
    dash?: 'solid' | 'dash' | 'dot'
  }
}

/**
 * 线定义类型
 */
export type LineDefinitionType =
  | { type: 'segment'; from: string; to: string }
  | { type: 'dashedToX'; from: string; xLabel?: string }
  | { type: 'dashedToY'; from: string; yLabel?: string }
  | { type: 'horizontal'; from: string; to: string }
  | { type: 'vertical'; from: string; to: string }

/**
 * 区域定义
 */
export interface AreaDefinition {
  id?: string
  points: string[]
  color?: string
  opacity?: number
  label?: string
}

/**
 * 标注定义
 */
export interface AnnotationDefinition {
  point: string
  text: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
  offset?: { x?: number; y?: number }
}

/**
 * 轴标签定义
 */
export interface AxisLabelDefinition {
  point: string
  axis: 'x' | 'y'
  label: string
}

/**
 * 箭头定义
 * 
 * 支持从点/线到点/线的箭头绘制
 */
export interface ArrowDefinition {
  id?: string
  from: ArrowEndpoint
  to: ArrowEndpoint
  color?: string
  lineWidth?: number
  headSize?: number
  label?: string
  labelPosition?: 'start' | 'middle' | 'end'
}

/**
 * 箭头端点
 * 
 * 可以是点ID或曲线上的位置
 */
export type ArrowEndpoint = 
  | { type: 'point'; id: string }
  | { type: 'curvePoint'; curve: string; x: number }
  | { type: 'curvePointY'; curve: string; y: number }
  | { type: 'fixed'; x: number; y: number }

/**
 * 消息分支
 */
export interface MessageBranch {
  content?: string
  chart?: ChartData
  analysis?: EffectAnalysis
  timestamp: number
  blocks?: ContentBlock[]
}

/**
 * 消息
 */
export interface Message {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content?: string
  chart?: ChartData
  analysis?: EffectAnalysis
  timestamp: number
  isLoading?: boolean
  isAborted?: boolean
  branches?: MessageBranch[]
  currentBranchIndex?: number
  blocks?: ContentBlock[]
}

/**
 * API 请求参数配置
 */
export interface ApiParameters {
  temperature: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
}

/**
 * 默认 API 参数
 */
export const DEFAULT_PARAMETERS: ApiParameters = {
  temperature: 0.3,
  maxTokens: undefined,
  topP: undefined,
  frequencyPenalty: undefined,
  presencePenalty: undefined
}

/**
 * API 设置
 */
export interface ApiSettings {
  apiKey: string
  endpoint: string
  model: string
  parameters?: ApiParameters
  formatType?: 'openai' | 'anthropic' | 'google' | 'ollama' | 'custom'
  customFormatId?: string
}

export const DEFAULT_ENDPOINT = 'https://api.openai.com/v1'
export const DEFAULT_MODEL = 'gpt-4o'

/**
 * 思考模型关键词列表
 * 用于智能检测模型是否为思考模型
 */
export const THINKING_MODEL_KEYWORDS = [
  'deepseek-reasoner',
  'deepseek-r1',
  'o1',
  'o1-mini',
  'o1-preview',
  'o3',
  'o3-mini',
  'o4-mini',
  'reasoner',
  'r1',
  'thinking'
]

/**
 * 判断模型是否为思考模型
 * @param model - 模型名称
 * @returns 是否为思考模型
 */
export function isThinkingModel(model: string): boolean {
  if (!model || typeof model !== 'string') return false
  const normalizedModel = model.toLowerCase().trim()
  return THINKING_MODEL_KEYWORDS.some(keyword => 
    normalizedModel.includes(keyword.toLowerCase())
  )
}

/**
 * 效果分析
 */
export interface EffectAnalysis {
  changeType: string
  market: string
  impact: string
  additionalNotes?: string
}

/**
 * 内容块类型
 */
export type ContentBlockType = 'text' | 'chart' | 'analysis' | 'thinking'

/**
 * 思考内容块
 */
export interface ThinkingContent {
  content: string
  isStreaming?: boolean
}

/**
 * 内容块
 */
export interface ContentBlock {
  type: ContentBlockType
  content?: string
  chart?: ChartData
  analysis?: EffectAnalysis
  thinking?: ThinkingContent
}

/**
 * 预设问题
 */
export const PRESET_QUESTIONS = [
  'Show me supply and demand with equilibrium',
  'Draw a monopoly with deadweight loss',
  'Show consumer and producer surplus',
  'Illustrate a price ceiling with shortage',
  'Draw cost curves (MC, ATC, AVC)',
  'Show the AD-AS model',
  'Draw a tax with deadweight loss',
  'Show a negative externality',
  'Draw the money market',
  'Illustrate perfect competition',
]

// CurveData 已经在上面定义，不需要重复导出

/**
 * 兼容旧版的曲线数据类型
 */
export interface CurveData {
  label: string
  points?: Array<{ x: number; y: number }>
  slope?: number
  intercept?: number
  color?: string
  dashed?: boolean
  lineWidth?: number
  mode?: 'lines' | 'markers' | 'lines+markers'
  fill?: 'tozeroy' | 'tozerox' | 'toself' | 'tonexty' | 'tonextx'
  fillColor?: string
  fillOpacity?: number
}

/**
 * 阴影区域
 */
export interface ShadedArea {
  points: Array<{ x: number; y: number }>
  color?: string
  opacity?: number
  label?: string
  labelPosition?: { x: number; y: number }
}

/**
 * 虚线到轴
 */
export interface DashedLinesToAxes {
  points: Array<{ x: number; y: number }>
  axisLabels?: { x?: string; y?: string }
}

/**
 * 标记点
 */
export interface Marker {
  x: number
  y: number
  label?: string
  color?: string
  symbol?: 'circle' | 'square' | 'diamond' | 'triangle-up' | 'triangle-down'
  size?: number
}
