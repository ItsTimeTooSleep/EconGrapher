/**
 * 原语规则引擎
 * 
 * 核心职责：
 * 1. 解析曲线模板，生成曲线点集
 * 2. 解析几何原语，计算坐标
 * 3. 输出 GeometryData 供渲染层使用
 * 
 * @module primitive-engine
 * @author EconGrapher Team
 */

import type { Point } from './geometry-types'
import type { ResolvedCurve } from './curve-templates/types'
import type { PrimitiveSemanticConfig } from './primitive-config'
import { resolveCurves } from './curve-templates/generators'
import { PrimitiveResolver, createPrimitiveResolver } from './primitives/resolver'
import type { GeometryData } from './geometry-types'
import { createEmptyGeometryData } from './geometry-types'

/**
 * 原语规则引擎类
 * 
 * 这是新的规则引擎，替代旧的图表类型处理器架构。
 * 通过曲线模板和几何原语来描述图表，实现完全的灵活性。
 */
export class PrimitiveEngine {
  constructor() {}
  
  /**
   * 处理原语语义配置，生成几何数据
   * 
   * @param config - 原语语义配置
   * @returns 几何数据
   */
  process(config: PrimitiveSemanticConfig): GeometryData {
    // 1. 解析曲线
    const resolvedCurves = resolveCurves(config.curves || [])
    
    // 2. 创建几何原语解析器
    const resolver = createPrimitiveResolver(resolvedCurves)
    
    // 3. 解析几何原语
    const primitives = resolver.resolve({
      points: config.points || [],
      lines: config.lines || [],
      areas: config.areas || [],
      annotations: config.annotations || [],
      axisLabels: config.axisLabels || [],
      arrows: config.arrows || []
    })
    
    // 4. 构建 GeometryData
    return this.buildGeometryData(config, resolvedCurves, primitives)
  }
  
  /**
   * 构建几何数据
   * 
   * @param config - 原语语义配置
   * @param resolvedCurves - 解析后的曲线映射
   * @param primitives - 解析后的几何原语
   * @returns 几何数据
   */
  private buildGeometryData(
    config: PrimitiveSemanticConfig,
    resolvedCurves: Map<string, ResolvedCurve>,
    primitives: ReturnType<PrimitiveResolver['resolve']>
  ): GeometryData {
    // 创建空的几何数据
    const geometryData = createEmptyGeometryData(
      config.title,
      config.xLabel || 'Quantity',
      config.yLabel || 'Price',
      config.xRange || [0, 12],
      config.yRange || [0, 12]
    )
    
    // 添加曲线
    for (const curve of resolvedCurves.values()) {
      geometryData.curves.push({
        type: curve.equation ? 'linear' : 'pointSet',
        points: curve.points,
        label: curve.label,
        style: {
          color: curve.color || '#3b82f6',
          width: curve.lineWidth || 2.5,
          dash: curve.dashed ? 'dash' : 'solid'
        }
      })
    }
    
    // 添加区域
    for (const area of primitives.areas) {
      geometryData.shadedAreas.push({
        points: area.points,
        color: area.color,
        opacity: area.opacity,
        label: area.label,
        labelPosition: area.labelPosition || this.calculateCentroid(area.points)
      })
    }
    
    // 添加虚线
    for (const line of primitives.lines) {
      if (line.style.dash === 'dash') {
        geometryData.dashedLines.push({
          points: line.points,
          axisLabels: {
            x: line.xLabel,
            y: line.yLabel
          }
        })
      }
    }
    
    // 添加均衡点（从解析后的点中选择需要显示的点）
    for (const point of primitives.points) {
      if (point.showMarker) {
        geometryData.equilibriumPoints.push({
          x: point.coordinates.x,
          y: point.coordinates.y,
          label: point.label || point.id
        })
      }
    }
    
    // 添加标注
    for (const annotation of primitives.annotations) {
      geometryData.annotations.push({
        x: annotation.x,
        y: annotation.y,
        text: annotation.text,
        arrowDirection: this.positionToArrowDirection(annotation.position)
      })
    }
    
    // 添加标记点
    for (const point of primitives.points) {
      if (point.showMarker && point.markerStyle) {
        geometryData.markers.push({
          x: point.coordinates.x,
          y: point.coordinates.y,
          label: point.label,
          color: point.markerStyle.color || '#1e293b',
          symbol: point.markerStyle.symbol || 'circle',
          size: point.markerStyle.size || 8
        })
      }
    }
    
    // 添加箭头
    for (const arrow of primitives.arrows) {
      geometryData.arrows.push({
        startX: arrow.startX,
        startY: arrow.startY,
        endX: arrow.endX,
        endY: arrow.endY,
        color: arrow.color,
        lineWidth: arrow.lineWidth,
        headSize: arrow.headSize,
        label: arrow.label,
        labelPosition: arrow.labelPosition
      })
    }
    
    return geometryData
  }
  
  /**
   * 计算多边形重心
   * 
   * @param points - 多边形顶点
   * @returns 重心坐标
   */
  private calculateCentroid(points: Point[]): Point {
    if (points.length === 0) {
      return { x: 0, y: 0 }
    }
    
    // 移除闭合点
    const vertices = points.length > 1 &&
      points[0].x === points[points.length - 1].x &&
      points[0].y === points[points.length - 1].y
      ? points.slice(0, -1)
      : points
    
    if (vertices.length === 0) {
      return { x: 0, y: 0 }
    }
    
    let sumX = 0
    let sumY = 0
    
    for (const p of vertices) {
      sumX += p.x
      sumY += p.y
    }
    
    return {
      x: sumX / vertices.length,
      y: sumY / vertices.length
    }
  }
  
  /**
   * 将位置转换为箭头方向
   * 
   * @param position - 位置
   * @returns 箭头方向
   */
  private positionToArrowDirection(
    position?: 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
  ): 'up' | 'down' | 'left' | 'right' | undefined {
    if (!position) return undefined
    
    switch (position) {
      case 'top':
        return 'down'
      case 'bottom':
        return 'up'
      case 'left':
        return 'right'
      case 'right':
        return 'left'
      case 'topLeft':
        return 'down'
      case 'topRight':
        return 'down'
      case 'bottomLeft':
        return 'up'
      case 'bottomRight':
        return 'up'
      default:
        return undefined
    }
  }
}

/**
 * 创建原语规则引擎
 * 
 * @returns 原语规则引擎实例
 */
export function createPrimitiveEngine(): PrimitiveEngine {
  return new PrimitiveEngine()
}

/**
 * 原语规则引擎单例
 */
export const primitiveEngine = createPrimitiveEngine()

/**
 * 便捷函数：处理原语语义配置
 * 
 * @param config - 原语语义配置
 * @returns 几何数据
 */
export function processPrimitiveConfig(config: PrimitiveSemanticConfig): GeometryData {
  return primitiveEngine.process(config)
}
