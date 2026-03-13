/**
 * 原语语义配置类型
 * 
 * 定义 AI 输出的标准格式。
 * AI 通过曲线模板和几何原语描述图表。
 * 
 * @module primitive-config
 * @author EconGrapher Team
 */

import type { CurveTemplate } from './curve-templates/types'
import type {
  PointPrimitive,
  LinePrimitive,
  AreaPrimitive,
  AnnotationPrimitive,
  AxisLabelPrimitive,
  ArrowPrimitive
} from './primitives/types'

/**
 * 原语语义配置
 * 
 * 这是 AI 输出的标准格式。
 * AI 只需要描述：
 * 1. 有哪些曲线（使用曲线模板）
 * 2. 有哪些点（使用点原语）
 * 3. 有哪些线（使用线原语）
 * 4. 有哪些区域（使用区域原语）
 * 5. 有哪些标注（使用标注原语）
 * 
 * AI 不需要计算任何坐标，所有几何计算由规则引擎完成。
 */
export interface PrimitiveSemanticConfig {
  /**
   * 图表标题
   */
  title: string
  
  /**
   * X 轴标签
   */
  xLabel?: string
  
  /**
   * Y 轴标签
   */
  yLabel?: string
  
  /**
   * X 轴范围 [min, max]
   */
  xRange?: [number, number]
  
  /**
   * Y 轴范围 [min, max]
   */
  yRange?: [number, number]
  
  /**
   * 曲线定义数组
   * 使用曲线模板定义各种曲线
   */
  curves: CurveTemplate[]
  
  /**
   * 点定义数组
   * 使用点原语定义各种点
   */
  points?: PointPrimitive[]
  
  /**
   * 线定义数组
   * 使用线原语定义各种线
   */
  lines?: LinePrimitive[]
  
  /**
   * 区域定义数组
   * 使用区域原语定义各种填充区域
   */
  areas?: AreaPrimitive[]
  
  /**
   * 标注定义数组
   * 使用标注原语定义各种文本标注
   */
  annotations?: AnnotationPrimitive[]
  
  /**
   * 轴标签定义数组
   * 使用轴标签原语定义坐标轴上的标签
   */
  axisLabels?: AxisLabelPrimitive[]
  
  /**
   * 箭头定义数组
   * 使用箭头原语定义各种箭头
   */
  arrows?: ArrowPrimitive[]
}

/**
 * 配置验证结果
 */
export interface ConfigValidation {
  valid: boolean
  errors: string[]
  warnings?: string[]
}

/**
 * 验证结果（兼容旧版）
 */
export type ValidationResult = ConfigValidation

/**
 * 验证原语语义配置
 * 
 * @param config - 原语语义配置
 * @returns 验证结果
 */
export function validatePrimitiveConfig(config: PrimitiveSemanticConfig): ConfigValidation {
  const errors: string[] = []
  const warnings: string[] = []
  
  // 检查标题
  if (!config.title) {
    errors.push('Missing title')
  }
  
  // 检查曲线
  if (!config.curves || config.curves.length === 0) {
    warnings.push('No curves defined')
  }
  
  // 检查曲线 ID 唯一性
  const curveIds = new Set<string>()
  for (const curve of config.curves || []) {
    if (curveIds.has(curve.id)) {
      errors.push(`Duplicate curve id: ${curve.id}`)
    }
    curveIds.add(curve.id)
  }
  
  // 检查点 ID 唯一性
  const pointIds = new Set<string>()
  for (const point of config.points || []) {
    if (pointIds.has(point.id)) {
      errors.push(`Duplicate point id: ${point.id}`)
    }
    pointIds.add(point.id)
  }
  
  // 检查点引用是否存在
  for (const point of config.points || []) {
    if (point.definition.type === 'intersection') {
      if (!curveIds.has(point.definition.curve1)) {
        errors.push(`Point "${point.id}" references non-existent curve "${point.definition.curve1}"`)
      }
      if (!curveIds.has(point.definition.curve2)) {
        errors.push(`Point "${point.id}" references non-existent curve "${point.definition.curve2}"`)
      }
    }
    if (point.definition.type === 'onCurve' || point.definition.type === 'onCurveY') {
      if (!curveIds.has(point.definition.curve)) {
        errors.push(`Point "${point.id}" references non-existent curve "${point.definition.curve}"`)
      }
    }
    if (point.definition.type === 'curveIntercept') {
      if (!curveIds.has(point.definition.curve)) {
        errors.push(`Point "${point.id}" references non-existent curve "${point.definition.curve}"`)
      }
    }
  }
  
  // 检查派生曲线依赖
  for (const curve of config.curves || []) {
    if (curve.type === 'derivedMR' || curve.type === 'derivedMFC') {
      if (!curveIds.has(curve.fromCurve)) {
        errors.push(`Curve "${curve.id}" references non-existent curve "${curve.fromCurve}"`)
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * 默认坐标轴范围
 */
export const DEFAULT_AXIS_RANGE = {
  x: [0, 12] as [number, number],
  y: [0, 12] as [number, number]
}

/**
 * 默认轴标签
 */
export const DEFAULT_AXIS_LABELS = {
  x: 'Quantity',
  y: 'Price'
}
