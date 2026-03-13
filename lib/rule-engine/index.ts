/**
 * 规则引擎入口
 * 
 * 这是规则引擎的主入口，负责：
 * 1. 导出原语规则引擎
 * 2. 提供统一的 API 接口
 * 
 * 新架构：
 * - 曲线模板系统：定义各种经济学曲线的形状
 * - 几何原语系统：定义点、线、区域等几何元素
 * - 原语规则引擎：解析配置，计算坐标
 * 
 * @module RuleEngine
 * @author EconGrapher Team
 */

// 导出原语规则引擎
export { PrimitiveEngine, createPrimitiveEngine, primitiveEngine, processPrimitiveConfig } from './primitive-engine'

// 导出原语语义配置类型
export type { PrimitiveSemanticConfig } from './primitive-config'
export { validatePrimitiveConfig, DEFAULT_AXIS_RANGE, DEFAULT_AXIS_LABELS } from './primitive-config'
export type { ConfigValidation } from './primitive-config'

// 导出曲线模板系统
export * from './curve-templates'

// 导出几何原语系统
export * from './primitives'

// 导出几何数据类型
export * from './geometry-types'

// 导出几何数据转换器
export { GeometryDataConverter, geometryDataConverter, convertGeometryData } from './utils/GeometryDataConverter'

// 兼容旧版 API
export type { ValidationResult } from './primitive-config'
