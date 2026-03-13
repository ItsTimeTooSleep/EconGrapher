/**
 * 几何原语解析器
 * 
 * 整合所有几何原语的解析流程，输出最终的几何数据。
 * 
 * @module primitives/resolver
 * @author EconGrapher Team
 */

import type { Point } from '../geometry-types'
import type { ResolvedCurve } from '../curve-templates/types'
import type {
  PointPrimitive,
  LinePrimitive,
  AreaPrimitive,
  AnnotationPrimitive,
  AxisLabelPrimitive,
  ArrowPrimitive,
  ResolvedPoint,
  ResolvedLine,
  ResolvedArea,
  ResolvedAnnotation,
  ResolvedAxisLabel,
  ResolvedArrow,
  PrimitivesConfig,
  ResolvedPrimitives
} from './types'
import { PrimitiveCalculator } from './calculator'

/**
 * 几何原语解析器类
 * 
 * 负责解析所有几何原语，生成最终的几何数据。
 */
export class PrimitiveResolver {
  private calculator: PrimitiveCalculator
  private resolvedPoints: Map<string, ResolvedPoint> = new Map()
  private resolvedLines: ResolvedLine[] = []
  private resolvedAreas: ResolvedArea[] = []
  private resolvedAnnotations: ResolvedAnnotation[] = []
  private resolvedAxisLabels: ResolvedAxisLabel[] = []
  private resolvedArrows: ResolvedArrow[] = []
  
  constructor(curves: Map<string, ResolvedCurve>) {
    this.calculator = new PrimitiveCalculator(curves)
  }
  
  /**
   * 解析所有几何原语
   * 
   * @param config - 几何原语配置
   * @returns 解析后的几何原语
   */
  resolve(config: PrimitivesConfig): ResolvedPrimitives {
    // 1. 解析点
    this.resolvedPoints = this.calculator.resolvePoints(config.points)
    
    // 2. 解析线
    for (const line of config.lines) {
      try {
        const resolved = this.calculator.resolveLine(line)
        this.resolvedLines.push(resolved)
      } catch (error) {
        console.warn(`Failed to resolve line: ${error}`)
      }
    }
    
    // 3. 解析区域
    for (const area of config.areas) {
      try {
        const resolved = this.calculator.resolveArea(area)
        this.resolvedAreas.push(resolved)
      } catch (error) {
        console.warn(`Failed to resolve area: ${error}`)
      }
    }
    
    // 4. 解析标注
    for (const annotation of config.annotations) {
      try {
        const resolved = this.calculator.resolveAnnotation(annotation)
        this.resolvedAnnotations.push(resolved)
      } catch (error) {
        console.warn(`Failed to resolve annotation: ${error}`)
      }
    }
    
    // 5. 解析轴标签
    for (const axisLabel of config.axisLabels) {
      try {
        const resolved = this.calculator.resolveAxisLabel(axisLabel)
        this.resolvedAxisLabels.push(resolved)
      } catch (error) {
        console.warn(`Failed to resolve axis label: ${error}`)
      }
    }
    
    // 6. 解析箭头
    for (const arrow of config.arrows) {
      try {
        const resolved = this.calculator.resolveArrow(arrow)
        this.resolvedArrows.push(resolved)
      } catch (error) {
        console.warn(`Failed to resolve arrow: ${error}`)
      }
    }
    
    return {
      points: Array.from(this.resolvedPoints.values()),
      lines: this.resolvedLines,
      areas: this.resolvedAreas,
      annotations: this.resolvedAnnotations,
      axisLabels: this.resolvedAxisLabels,
      arrows: this.resolvedArrows
    }
  }
  
  /**
   * 获取已解析的点
   * 
   * @param id - 点 ID
   * @returns 解析后的点
   */
  getPoint(id: string): ResolvedPoint | undefined {
    return this.resolvedPoints.get(id)
  }
  
  /**
   * 获取所有已解析的点
   */
  getPoints(): ResolvedPoint[] {
    return Array.from(this.resolvedPoints.values())
  }
  
  /**
   * 获取所有已解析的线
   */
  getLines(): ResolvedLine[] {
    return this.resolvedLines
  }
  
  /**
   * 获取所有已解析的区域
   */
  getAreas(): ResolvedArea[] {
    return this.resolvedAreas
  }
  
  /**
   * 获取所有已解析的标注
   */
  getAnnotations(): ResolvedAnnotation[] {
    return this.resolvedAnnotations
  }
  
  /**
   * 获取所有已解析的轴标签
   */
  getAxisLabels(): ResolvedAxisLabel[] {
    return this.resolvedAxisLabels
  }
  
  /**
   * 获取所有已解析的箭头
   */
  getArrows(): ResolvedArrow[] {
    return this.resolvedArrows
  }
}

/**
 * 创建几何原语解析器
 * 
 * @param curves - 已解析的曲线映射
 * @returns 几何原语解析器实例
 */
export function createPrimitiveResolver(curves: Map<string, ResolvedCurve>): PrimitiveResolver {
  return new PrimitiveResolver(curves)
}

/**
 * 解析几何原语配置
 * 
 * 便捷函数，创建解析器并解析配置。
 * 
 * @param curves - 已解析的曲线映射
 * @param config - 几何原语配置
 * @returns 解析后的几何原语
 */
export function resolvePrimitives(
  curves: Map<string, ResolvedCurve>,
  config: PrimitivesConfig
): ResolvedPrimitives {
  const resolver = new PrimitiveResolver(curves)
  return resolver.resolve(config)
}
