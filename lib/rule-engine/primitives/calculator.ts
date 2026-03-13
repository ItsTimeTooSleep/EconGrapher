/**
 * 几何计算引擎
 * 
 * 负责根据点定义计算坐标，处理点之间的依赖关系。
 * 
 * @module primitives/calculator
 * @author EconGrapher Team
 */

import type { Point } from '../geometry-types'
import type { ResolvedCurve } from '../curve-templates/types'
import type {
  PointDefinition,
  PointPrimitive,
  ResolvedPoint,
  LineDefinition,
  LinePrimitive,
  ResolvedLine,
  AreaPrimitive,
  ResolvedArea,
  AnnotationPrimitive,
  ResolvedAnnotation,
  AxisLabelPrimitive,
  ResolvedAxisLabel,
  ArrowPrimitive,
  ResolvedArrow,
  ArrowEndpointDefinition,
  DEFAULT_PRIMITIVE_STYLES
} from './types'
import { getYAtX, getXAtY, calculateIntersection } from '../curve-templates/generators'

/**
 * 几何计算引擎类
 * 
 * 核心职责：
 * 1. 解析点定义，计算坐标
 * 2. 处理点之间的依赖关系
 * 3. 解析线定义，生成线段
 * 4. 解析区域定义，生成填充区域
 */
export class PrimitiveCalculator {
  private curves: Map<string, ResolvedCurve>
  private resolvedPoints: Map<string, ResolvedPoint>
  
  constructor(curves: Map<string, ResolvedCurve>) {
    this.curves = curves
    this.resolvedPoints = new Map()
  }
  
  /**
   * 解析所有点定义
   * 
   * 使用拓扑排序处理依赖关系。
   * 
   * @param points - 点原语数组
   * @returns 解析后的点映射
   */
  resolvePoints(points: PointPrimitive[]): Map<string, ResolvedPoint> {
    // 构建依赖图
    const dependencies = this.buildDependencyGraph(points)
    
    // 拓扑排序
    const sortedIds = this.topologicalSort(dependencies)
    
    // 按顺序解析点
    for (const id of sortedIds) {
      const point = points.find(p => p.id === id)
      if (point) {
        this.resolvePoint(point)
      }
    }
    
    return this.resolvedPoints
  }
  
  /**
   * 解析单个点定义
   * 
   * @param point - 点原语
   * @returns 解析后的点
   */
  private resolvePoint(point: PointPrimitive): ResolvedPoint {
    // 检查是否已解析
    if (this.resolvedPoints.has(point.id)) {
      return this.resolvedPoints.get(point.id)!
    }
    
    const coordinates = this.calculatePointCoordinates(point.definition)
    
    const resolved: ResolvedPoint = {
      id: point.id,
      coordinates,
      label: point.label,
      showMarker: point.showMarker === true,
      markerStyle: point.markerStyle
    }
    
    this.resolvedPoints.set(point.id, resolved)
    return resolved
  }
  
  /**
   * 计算点坐标
   * 
   * @param definition - 点定义
   * @returns 点坐标
   */
  private calculatePointCoordinates(definition: PointDefinition): Point {
    switch (definition.type) {
      case 'fixed':
        return { x: definition.x, y: definition.y }
        
      case 'intersection': {
        const curve1 = this.curves.get(definition.curve1)
        const curve2 = this.curves.get(definition.curve2)
        
        if (!curve1) {
          throw new Error(`Curve not found: ${definition.curve1}`)
        }
        if (!curve2) {
          throw new Error(`Curve not found: ${definition.curve2}`)
        }
        
        const intersection = calculateIntersection(curve1, curve2)
        if (!intersection) {
          throw new Error(`No intersection found between ${definition.curve1} and ${definition.curve2}`)
        }
        
        return intersection
      }
      
      case 'projectX': {
        const sourcePoint = this.resolvedPoints.get(definition.from)
        if (!sourcePoint) {
          throw new Error(`Point not found: ${definition.from}`)
        }
        return { x: sourcePoint.coordinates.x, y: 0 }
      }
      
      case 'projectY': {
        const sourcePoint = this.resolvedPoints.get(definition.from)
        if (!sourcePoint) {
          throw new Error(`Point not found: ${definition.from}`)
        }
        return { x: 0, y: sourcePoint.coordinates.y }
      }
      
      case 'onCurve': {
        const curve = this.curves.get(definition.curve)
        if (!curve) {
          throw new Error(`Curve not found: ${definition.curve}`)
        }
        
        const y = getYAtX(curve, definition.x)
        if (y === null) {
          throw new Error(`Cannot find Y at X=${definition.x} on curve ${definition.curve}`)
        }
        
        return { x: definition.x, y }
      }
      
      case 'onCurveY': {
        const curve = this.curves.get(definition.curve)
        if (!curve) {
          throw new Error(`Curve not found: ${definition.curve}`)
        }
        
        const x = getXAtY(curve, definition.y)
        if (x === null) {
          throw new Error(`Cannot find X at Y=${definition.y} on curve ${definition.curve}`)
        }
        
        return { x, y: definition.y }
      }
      
      case 'curveIntercept': {
        const curve = this.curves.get(definition.curve)
        if (!curve) {
          throw new Error(`Curve not found: ${definition.curve}`)
        }
        
        if (definition.axis === 'y') {
          // Y 截距：x = 0 时的 y 值
          if (curve.equation?.intercept !== undefined) {
            return { x: 0, y: curve.equation.intercept }
          }
          // 对于点集曲线，取第一个点
          if (curve.points.length > 0) {
            const firstPoint = curve.points[0]
            return { x: 0, y: firstPoint.y }
          }
          throw new Error(`Cannot determine Y-intercept for curve ${definition.curve}`)
        } else {
          // X 截距：y = 0 时的 x 值
          if (curve.equation?.slope !== undefined && curve.equation?.intercept !== undefined) {
            if (curve.equation.slope === 0) {
              throw new Error(`Curve ${definition.curve} is horizontal, no X-intercept`)
            }
            const x = -curve.equation.intercept / curve.equation.slope
            return { x, y: 0 }
          }
          // 对于点集曲线，找到 y=0 的点
          const x = getXAtY(curve, 0)
          if (x !== null) {
            return { x, y: 0 }
          }
          throw new Error(`Cannot determine X-intercept for curve ${definition.curve}`)
        }
      }
      
      case 'onCurveAtPointX': {
        const curve = this.curves.get(definition.curve)
        if (!curve) {
          throw new Error(`Curve not found: ${definition.curve}`)
        }
        
        const sourcePoint = this.resolvedPoints.get(definition.from)
        if (!sourcePoint) {
          throw new Error(`Point not found: ${definition.from}`)
        }
        
        const y = getYAtX(curve, sourcePoint.coordinates.x)
        if (y === null) {
          throw new Error(`Cannot find Y at X=${sourcePoint.coordinates.x} on curve ${definition.curve}`)
        }
        
        return { x: sourcePoint.coordinates.x, y }
      }
      
      case 'onCurveAtPointY': {
        const curve = this.curves.get(definition.curve)
        if (!curve) {
          throw new Error(`Curve not found: ${definition.curve}`)
        }
        
        const sourcePoint = this.resolvedPoints.get(definition.from)
        if (!sourcePoint) {
          throw new Error(`Point not found: ${definition.from}`)
        }
        
        const x = getXAtY(curve, sourcePoint.coordinates.y)
        if (x === null) {
          throw new Error(`Cannot find X at Y=${sourcePoint.coordinates.y} on curve ${definition.curve}`)
        }
        
        return { x, y: sourcePoint.coordinates.y }
      }
      
      default:
        throw new Error(`Unknown point definition type: ${(definition as PointDefinition).type}`)
    }
  }
  
  /**
   * 构建依赖图
   * 
   * @param points - 点原语数组
   * @returns 依赖图（点 ID -> 依赖的点 ID 数组）
   */
  private buildDependencyGraph(points: PointPrimitive[]): Map<string, string[]> {
    const graph = new Map<string, string[]>()
    
    for (const point of points) {
      const deps: string[] = []
      
      if (point.definition.type === 'projectX' || point.definition.type === 'projectY') {
        deps.push(point.definition.from)
      }
      
      if (point.definition.type === 'onCurveAtPointX' || point.definition.type === 'onCurveAtPointY') {
        deps.push(point.definition.from)
      }
      
      graph.set(point.id, deps)
    }
    
    return graph
  }
  
  /**
   * 拓扑排序
   * 
   * @param graph - 依赖图
   * @returns 排序后的点 ID 数组
   */
  private topologicalSort(graph: Map<string, string[]>): string[] {
    const result: string[] = []
    const visited = new Set<string>()
    const temp = new Set<string>()
    
    const visit = (id: string) => {
      if (temp.has(id)) {
        throw new Error(`Circular dependency detected at point: ${id}`)
      }
      if (visited.has(id)) {
        return
      }
      
      temp.add(id)
      
      const deps = graph.get(id) || []
      for (const dep of deps) {
        visit(dep)
      }
      
      temp.delete(id)
      visited.add(id)
      result.push(id)
    }
    
    for (const id of graph.keys()) {
      if (!visited.has(id)) {
        visit(id)
      }
    }
    
    return result
  }
  
  /**
   * 解析线定义
   * 
   * @param line - 线原语
   * @returns 解析后的线
   */
  resolveLine(line: LinePrimitive): ResolvedLine {
    const points: Point[] = []
    let xLabel: string | undefined
    let yLabel: string | undefined
    
    switch (line.definition.type) {
      case 'segment': {
        const from = this.resolvedPoints.get(line.definition.from)
        const to = this.resolvedPoints.get(line.definition.to)
        
        if (!from) {
          throw new Error(`Point not found: ${line.definition.from}`)
        }
        if (!to) {
          throw new Error(`Point not found: ${line.definition.to}`)
        }
        
        points.push(from.coordinates, to.coordinates)
        break
      }
      
      case 'dashedToX': {
        const from = this.resolvedPoints.get(line.definition.from)
        if (!from) {
          throw new Error(`Point not found: ${line.definition.from}`)
        }
        
        points.push(
          from.coordinates,
          { x: from.coordinates.x, y: 0 }
        )
        break
      }
      
      case 'dashedToY': {
        const from = this.resolvedPoints.get(line.definition.from)
        if (!from) {
          throw new Error(`Point not found: ${line.definition.from}`)
        }
        
        points.push(
          { x: 0, y: from.coordinates.y },
          from.coordinates
        )
        break
      }
      
      case 'dashedToAxis': {
        const from = this.resolvedPoints.get(line.definition.from)
        if (!from) {
          throw new Error(`Point not found: ${line.definition.from}`)
        }
        
        points.push(
          { x: 0, y: from.coordinates.y },
          from.coordinates,
          { x: from.coordinates.x, y: 0 }
        )
        xLabel = line.definition.xLabel
        yLabel = line.definition.yLabel
        break
      }
      
      case 'horizontal': {
        const from = this.resolvedPoints.get(line.definition.from)
        const to = this.resolvedPoints.get(line.definition.to)
        
        if (!from || !to) {
          throw new Error(`Point not found`)
        }
        
        points.push(
          from.coordinates,
          { x: to.coordinates.x, y: from.coordinates.y }
        )
        break
      }
      
      case 'vertical': {
        const from = this.resolvedPoints.get(line.definition.from)
        const to = this.resolvedPoints.get(line.definition.to)
        
        if (!from || !to) {
          throw new Error(`Point not found`)
        }
        
        points.push(
          from.coordinates,
          { x: from.coordinates.x, y: to.coordinates.y }
        )
        break
      }
      
      default:
        throw new Error(`Unknown line definition type`)
    }
    
    return {
      points,
      style: {
        color: line.style?.color || 'rgba(0, 0, 0, 0.3)',
        width: line.style?.width || 1.5,
        dash: line.style?.dash || 'dash'
      },
      xLabel,
      yLabel
    }
  }
  
  /**
   * 解析区域定义
   * 
   * @param area - 区域原语
   * @returns 解析后的区域
   */
  resolveArea(area: AreaPrimitive): ResolvedArea {
    const points: Point[] = []
    
    for (const pointId of area.points) {
      const resolved = this.resolvedPoints.get(pointId)
      if (!resolved) {
        throw new Error(`Point not found: ${pointId}`)
      }
      points.push(resolved.coordinates)
    }
    
    // 闭合区域
    if (points.length > 0) {
      points.push(points[0])
    }
    
    return {
      points,
      color: area.color || 'rgba(59, 130, 246, 0.3)',
      opacity: area.opacity ?? 0.3,
      label: area.label,
      labelPosition: area.labelPosition === 'auto' || !area.labelPosition 
        ? this.calculateAreaCentroid(points) 
        : area.labelPosition
    }
  }
  
  /**
   * 计算区域重心
   * 
   * @param points - 区域顶点
   * @returns 重心坐标
   */
  private calculateAreaCentroid(points: Point[]): Point {
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
   * 解析标注定义
   * 
   * @param annotation - 标注原语
   * @returns 解析后的标注
   */
  resolveAnnotation(annotation: AnnotationPrimitive): ResolvedAnnotation {
    const point = this.resolvedPoints.get(annotation.point)
    if (!point) {
      throw new Error(`Point not found: ${annotation.point}`)
    }
    
    return {
      x: point.coordinates.x,
      y: point.coordinates.y,
      text: annotation.text,
      position: annotation.position,
      offset: annotation.offset
    }
  }
  
  /**
   * 解析轴标签定义
   * 
   * @param axisLabel - 轴标签原语
   * @returns 解析后的轴标签
   */
  resolveAxisLabel(axisLabel: AxisLabelPrimitive): ResolvedAxisLabel {
    const point = this.resolvedPoints.get(axisLabel.point)
    if (!point || !point.coordinates) {
      throw new Error(`Point not found: ${axisLabel.point}`)
    }
    
    if (axisLabel.axis === 'x') {
      return {
        x: point.coordinates.x,
        y: 0,
        label: axisLabel.label
      }
    } else {
      return {
        x: 0,
        y: point.coordinates.y,
        label: axisLabel.label
      }
    }
  }
  
  /**
   * 解析箭头定义
   * 
   * @param arrow - 箭头原语
   * @returns 解析后的箭头
   */
  resolveArrow(arrow: ArrowPrimitive): ResolvedArrow {
    const startPoint = this.resolveArrowEndpoint(arrow.from)
    const endPoint = this.resolveArrowEndpoint(arrow.to)
    
    return {
      startX: startPoint.x,
      startY: startPoint.y,
      endX: endPoint.x,
      endY: endPoint.y,
      color: arrow.color || '#ef4444',
      lineWidth: arrow.lineWidth ?? 2,
      headSize: arrow.headSize ?? 12,
      label: arrow.label,
      labelPosition: arrow.labelPosition
    }
  }
  
  /**
   * 解析箭头端点
   * 
   * @param endpoint - 箭头端点定义
   * @returns 端点坐标
   */
  private resolveArrowEndpoint(endpoint: ArrowEndpointDefinition): Point {
    switch (endpoint.type) {
      case 'point': {
        const point = this.resolvedPoints.get(endpoint.id)
        if (!point) {
          throw new Error(`Point not found: ${endpoint.id}`)
        }
        return point.coordinates
      }
      
      case 'curvePoint': {
        const curve = this.curves.get(endpoint.curve)
        if (!curve) {
          throw new Error(`Curve not found: ${endpoint.curve}`)
        }
        const y = getYAtX(curve, endpoint.x)
        if (y === null) {
          throw new Error(`Cannot find Y at X=${endpoint.x} on curve ${endpoint.curve}`)
        }
        return { x: endpoint.x, y }
      }
      
      case 'curvePointY': {
        const curve = this.curves.get(endpoint.curve)
        if (!curve) {
          throw new Error(`Curve not found: ${endpoint.curve}`)
        }
        const x = getXAtY(curve, endpoint.y)
        if (x === null) {
          throw new Error(`Cannot find X at Y=${endpoint.y} on curve ${endpoint.curve}`)
        }
        return { x, y: endpoint.y }
      }
      
      case 'fixed':
        return { x: endpoint.x, y: endpoint.y }
        
      default:
        throw new Error(`Unknown arrow endpoint type`)
    }
  }
  
  /**
   * 获取已解析的点
   * 
   * @param id - 点 ID
   * @returns 解析后的点
   */
  getResolvedPoint(id: string): ResolvedPoint | undefined {
    return this.resolvedPoints.get(id)
  }
  
  /**
   * 获取所有已解析的点
   * 
   * @returns 解析后的点数组
   */
  getAllResolvedPoints(): ResolvedPoint[] {
    return Array.from(this.resolvedPoints.values())
  }
}

/**
 * 创建几何计算引擎
 * 
 * @param curves - 已解析的曲线映射
 * @returns 几何计算引擎实例
 */
export function createPrimitiveCalculator(curves: Map<string, ResolvedCurve>): PrimitiveCalculator {
  return new PrimitiveCalculator(curves)
}
