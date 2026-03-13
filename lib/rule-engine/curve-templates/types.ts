/**
 * 曲线模板类型定义
 * 
 * 定义各种经济学曲线的模板类型，AI 通过这些模板来描述曲线形状。
 * 系统根据模板自动生成曲线的点集。
 * 
 * @module curve-templates/types
 * @author EconGrapher Team
 */

import type { Point } from '../geometry-types'

/**
 * 曲线模板类型枚举
 */
export type CurveTemplateType = 
  | 'linear'           // 线性曲线（直线）
  | 'uShape'           // U 形曲线（ATC, AVC, MC 等）
  | 'nShape'           // 倒 U 形曲线
  | 'hyperbola'        // 双曲线（AFC 等）
  | 'vertical'         // 垂直线（LRAS 等）
  | 'horizontal'       // 水平线（价格线等）
  | 'pointSet'         // 自定义点集曲线
  | 'derivedMR'        // 从需求曲线派生的 MR 曲线
  | 'derivedMFC'       // 从供给曲线派生的 MFC 曲线

/**
 * 基础曲线模板接口
 * 所有曲线模板都继承此接口
 */
export interface BaseCurveTemplate {
  id: string                      // 曲线唯一标识符
  type: CurveTemplateType         // 曲线模板类型
  label: string                   // 曲线显示标签（如 'D', 'S', 'MC'）
  color?: string                  // 曲线颜色
  dashed?: boolean                // 是否为虚线
  lineWidth?: number              // 线条宽度
  equation?: {                    // 曲线方程（可选，用于计算）
    slope?: number
    intercept?: number
  }
}

/**
 * 线性曲线模板
 * 用于需求曲线、供给曲线、AD、SRAS 等直线
 * 
 * @property slope - 斜率（需求曲线为负，供给曲线为正）
 * @property intercept - Y 轴截距
 */
export interface LinearCurveTemplate extends BaseCurveTemplate {
  type: 'linear'
  slope: number
  intercept: number
}

/**
 * U 形曲线模板
 * 用于 ATC, AVC, MC 等成本曲线
 * 
 * @property minimum - 最低点坐标 { x, y }
 * @property leftIntercept - 左侧 Y 截距（x=0 时的 y 值）
 * @property rightY - 右侧某点的 Y 值（用于控制右侧上升斜率）
 * @property steepness - 陡峭程度（可选，默认 1）
 */
export interface UShapeCurveTemplate extends BaseCurveTemplate {
  type: 'uShape'
  minimum: Point
  leftIntercept?: number
  rightY?: number
  steepness?: number
}

/**
 * 倒 U 形曲线模板
 * 用于某些特殊曲线
 */
export interface NShapeCurveTemplate extends BaseCurveTemplate {
  type: 'nShape'
  maximum: Point
  leftIntercept?: number
  rightY?: number
  steepness?: number
}

/**
 * 双曲线模板
 * 用于 AFC（平均固定成本）等曲线
 * 方程形式：y = k / (x - h) + v
 * 简化形式：y = k / x（当 h=0, v=0 时）
 * 
 * @property k - 分子系数（如固定成本 FC）
 * @property h - 水平渐近线偏移（默认 0）
 * @property v - 垂直渐近线偏移（默认 0）
 * @property startX - 起始 X 值（默认 0.5，避免除零）
 */
export interface HyperbolaCurveTemplate extends BaseCurveTemplate {
  type: 'hyperbola'
  k: number
  h?: number
  v?: number
  startX?: number
}

/**
 * 垂直线模板
 * 用于 LRAS, LRPC, 货币供给等垂直线
 * 
 * @property x - X 坐标位置
 */
export interface VerticalLineTemplate extends BaseCurveTemplate {
  type: 'vertical'
  x: number
}

/**
 * 水平线模板
 * 用于价格线、完全竞争市场的 MR 等
 * 
 * @property y - Y 坐标位置
 */
export interface HorizontalLineTemplate extends BaseCurveTemplate {
  type: 'horizontal'
  y: number
}

/**
 * 点集曲线模板
 * 用于自定义形状的曲线，如 PPC、洛伦兹曲线等
 * 
 * @property points - 曲线上的点数组
 * @property smooth - 是否平滑曲线（默认 true）
 */
export interface PointSetCurveTemplate extends BaseCurveTemplate {
  type: 'pointSet'
  points: Point[]
  smooth?: boolean
}

/**
 * 派生 MR 曲线模板
 * 从需求曲线自动派生边际收益曲线
 * MR 曲线的斜率是需求曲线斜率的 2 倍
 * 
 * @property fromCurve - 源需求曲线的 ID
 */
export interface DerivedMRCurveTemplate extends BaseCurveTemplate {
  type: 'derivedMR'
  fromCurve: string
}

/**
 * 派生 MFC 曲线模板
 * 从供给曲线自动派生边际要素成本曲线
 * MFC 曲线的斜率是供给曲线斜率的 2 倍
 * 
 * @property fromCurve - 源供给曲线的 ID
 */
export interface DerivedMFCCurveTemplate extends BaseCurveTemplate {
  type: 'derivedMFC'
  fromCurve: string
}

/**
 * 曲线模板联合类型
 */
export type CurveTemplate = 
  | LinearCurveTemplate
  | UShapeCurveTemplate
  | NShapeCurveTemplate
  | HyperbolaCurveTemplate
  | VerticalLineTemplate
  | HorizontalLineTemplate
  | PointSetCurveTemplate
  | DerivedMRCurveTemplate
  | DerivedMFCCurveTemplate

/**
 * 二次曲线方程参数
 * y = a(x - h)² + k
 */
export interface QuadraticEquation {
  a: number
  h: number
  k: number
}

/**
 * 双曲线方程参数
 * y = k / (x - h) + v
 */
export interface HyperbolaEquation {
  k: number
  h: number
  v: number
}

/**
 * 曲线方程信息
 */
export interface CurveEquation {
  slope?: number
  intercept?: number
  quadratic?: QuadraticEquation
  hyperbola?: HyperbolaEquation
}

/**
 * 曲线解析结果
 * 包含曲线的点集和方程信息
 */
export interface ResolvedCurve {
  id: string
  label: string
  points: Point[]
  color?: string
  dashed?: boolean
  lineWidth?: number
  equation?: CurveEquation
}

/**
 * 曲线模板验证结果
 */
export interface CurveTemplateValidation {
  valid: boolean
  errors: string[]
  warnings?: string[]
}

/**
 * 默认曲线样式
 */
export const DEFAULT_CURVE_STYLE = {
  color: '#3b82f6',
  dashed: false,
  lineWidth: 2.5
}

/**
 * 预设曲线颜色
 */
export const CURVE_COLORS = {
  demand: '#3b82f6',        // 蓝色
  supply: '#f59e0b',        // 橙色
  mr: '#f97316',            // 橙红色
  mc: '#ef4444',            // 红色
  atc: '#10b981',           // 绿色
  avc: '#6366f1',           // 靛蓝色
  afc: '#8b5cf6',           // 紫色
  ad: '#3b82f6',            // 蓝色
  sras: '#f59e0b',          // 橙色
  lras: '#8b5cf6',          // 紫色
  equilibrium: '#1e293b',   // 深灰色
  consumerSurplus: 'rgba(59, 130, 246, 0.3)',
  producerSurplus: 'rgba(245, 158, 11, 0.3)',
  deadweightLoss: 'rgba(239, 68, 68, 0.3)',
  profit: 'rgba(16, 185, 129, 0.3)',
  loss: 'rgba(239, 68, 68, 0.3)',
  tax: 'rgba(139, 92, 246, 0.3)',
  subsidy: 'rgba(16, 185, 129, 0.3)'
} as const

/**
 * 根据曲线标签自动选择颜色
 * 
 * @param label - 曲线标签
 * @returns 颜色值
 */
export function getCurveColor(label: string): string {
  const upperLabel = label.toUpperCase()
  
  if (upperLabel.startsWith('D') || upperLabel === 'AD') {
    return CURVE_COLORS.demand
  }
  if (upperLabel.startsWith('S') || upperLabel === 'SRAS') {
    return CURVE_COLORS.supply
  }
  if (upperLabel === 'MR') {
    return CURVE_COLORS.mr
  }
  if (upperLabel === 'MC') {
    return CURVE_COLORS.mc
  }
  if (upperLabel === 'ATC') {
    return CURVE_COLORS.atc
  }
  if (upperLabel === 'AVC') {
    return CURVE_COLORS.avc
  }
  if (upperLabel === 'AFC') {
    return CURVE_COLORS.afc
  }
  if (upperLabel === 'LRAS') {
    return CURVE_COLORS.lras
  }
  
  return CURVE_COLORS.demand
}
