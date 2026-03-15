/**
 * 几何数据转换器
 * 
 * 将规则引擎输出的 GeometryData 转换为 Plotly.js 可用的 traces 和 layout。
 * 这个模块是规则引擎层和渲染层之间的桥梁。
 * 
 * @module GeometryDataConverter
 * @author EconGrapher Team
 */

import type { 
  GeometryData, 
  CurveGeometry, 
  ShadedAreaGeometry, 
  BraceGeometry, 
  DashedLineGeometry, 
  AnnotationGeometry, 
  MarkerGeometry,
  ArrowGeometry,
  AxisLabelGeometry,
  Point
} from '../geometry-types'
import { COLORS } from '@/components/charts/constants/colors'
import { DARK_LAYOUT_BASE } from '@/components/charts/layouts'

interface PlotlyTrace {
  x: number[]
  y: number[]
  type: string
  mode: string
  name?: string
  line?: {
    color?: string
    width?: number
    dash?: string
    shape?: string
    smoothing?: number
  }
  fill?: string
  fillcolor?: string
  opacity?: number
  showlegend?: boolean
  hoverinfo?: string
  hovertemplate?: string
  marker?: {
    color?: string
    symbol?: string
    size?: number
  }
  text?: string | string[]
  textposition?: string
  textfont?: {
    color?: string
    size?: number
    family?: string
  }
}

interface PlotlyAnnotation {
  x: number
  y: number
  xref: string
  yref: string
  text: string
  showarrow: boolean
  arrowhead?: number
  arrowcolor?: string
  arrowsize?: number
  arrowwidth?: number
  ax?: number
  ay?: number
  axref?: string
  ayref?: string
  font?: {
    color?: string
    size?: number
    weight?: string
  }
  bgcolor?: string
  borderpad?: number
  xanchor?: string
  yanchor?: string
  xshift?: number
  yshift?: number
}

interface PlotlyLayout {
  title?: {
    text: string
    font?: {
      color?: string
      size?: number
    }
  }
  xaxis?: {
    title?: string | {
      text: string
      font?: {
        color?: string
        size?: number
        family?: string
      }
    }
    range?: [number, number]
    gridcolor?: string
    linecolor?: string
    showgrid?: boolean
    zeroline?: boolean
    showticklabels?: boolean
    scaleanchor?: string
    scaleratio?: number
  }
  yaxis?: {
    title?: string | {
      text: string
      font?: {
        color?: string
        size?: number
        family?: string
      }
    }
    range?: [number, number]
    gridcolor?: string
    linecolor?: string
    showgrid?: boolean
    zeroline?: boolean
    showticklabels?: boolean
  }
  annotations?: PlotlyAnnotation[]
  paper_bgcolor?: string
  plot_bgcolor?: string
  font?: {
    color?: string
    family?: string
    size?: number
  }
  margin?: {
    l?: number
    r?: number
    t?: number
    b?: number
  }
  legend?: {
    x?: number
    y?: number
    xanchor?: string
    yanchor?: string
    bgcolor?: string
    bordercolor?: string
    borderwidth?: number
    font?: {
      color?: string
      size?: number
    }
    visible?: boolean
  }
  hoverlabel?: {
    bgcolor?: string
    font?: {
      color?: string
      size?: number
    }
  }
}

interface ConversionResult {
  traces: PlotlyTrace[]
  layout: PlotlyLayout
}

interface ViewportRange {
  xRange: [number, number]
  yRange: [number, number]
}

interface WeightedPoint {
  x: number
  y: number
  weight: number
}

const VIEWPORT_CONFIG = {
  minRange: 4,
  paddingRatio: 0.15,
  defaultRange: [0, 12] as [number, number],
  extremeThreshold: 500,
  weights: {
    annotation: 1.0,
    marker: 1.0,
    yIntercept: 0.9,
    shadedArea: 0.8,
    dashedLine: 0.6,
    curveEndpoint: 0.1
  },
  highWeightThreshold: 0.5,
  centerScaleFactor: 1.25,
  minRightSpaceRatio: 0.18
}

export class GeometryDataConverter {
  convert(geometryData: GeometryData): ConversionResult {
    const traces: PlotlyTrace[] = []
    const annotations: PlotlyAnnotation[] = []

    geometryData.curves.forEach(curve => {
      const curveTrace = this.convertCurve(curve)
      traces.push(curveTrace)
      
      const labelAnnotation = this.createCurveLabelAnnotation(curve)
      if (labelAnnotation) {
        annotations.push(labelAnnotation)
      }
    })

    console.log('[DEBUG] convert - Adding shaded areas, count:', geometryData.shadedAreas.length)
    geometryData.shadedAreas.forEach(area => {
      console.log('[DEBUG] convert - Processing shaded area:', area.label)
      traces.push(this.convertShadedArea(area))
    })

    geometryData.braces.forEach(brace => {
      const { trace, annotation } = this.convertBrace(brace)
      traces.push(trace)
      if (annotation) {
        annotations.push(annotation)
      }
    })

    geometryData.dashedLines.forEach(dashedLine => {
      traces.push(this.convertDashedLine(dashedLine))
      
      if (dashedLine.axisLabels.x && dashedLine.points.length >= 2) {
        annotations.push(this.createAxisLabelAnnotation(
          dashedLine.points[1].x,
          0,
          dashedLine.axisLabels.x,
          'x'
        ))
      }
      if (dashedLine.axisLabels.y && dashedLine.points.length >= 2) {
        annotations.push(this.createAxisLabelAnnotation(
          0,
          dashedLine.points[0].y,
          dashedLine.axisLabels.y,
          'y'
        ))
      }
    })

    console.log('[DEBUG] convert - geometryData.axisLabels:', geometryData.axisLabels)
    
    geometryData.axisLabels.forEach(axisLabel => {
      console.log('[DEBUG] convert - processing axisLabel:', axisLabel)
      annotations.push(this.createAxisLabelAnnotation(
        axisLabel.x,
        axisLabel.y,
        axisLabel.label,
        axisLabel.axis
      ))
    })

    geometryData.markers.forEach(marker => {
      traces.push(this.convertMarker(marker))
    })

    geometryData.annotations.forEach(annotation => {
      annotations.push(this.convertAnnotation(annotation))
    })

    geometryData.arrows.forEach(arrow => {
      const { traces: arrowTraces, arrowAnnotation, labelAnnotation } = this.convertArrow(arrow)
      traces.push(...arrowTraces)
      if (arrowAnnotation) {
        annotations.push(arrowAnnotation)
      }
      if (labelAnnotation) {
        annotations.push(labelAnnotation)
      }
    })

    console.log('[DEBUG] convert - All traces generated, total:', traces.length)
    traces.forEach((trace, index) => {
      console.log(`[DEBUG] convert - Trace ${index}:`, {
        name: (trace as any).name,
        type: trace.type,
        x: trace.x?.slice(0, 10),
        y: trace.y?.slice(0, 10),
        line: (trace as any).line,
        color: (trace as any).line?.color
      })
    })

    const viewport = this.calculateViewport(geometryData)

    const layout: PlotlyLayout = {
      ...DARK_LAYOUT_BASE,
      title: {
        text: geometryData.title,
        font: { color: COLORS.text, size: 14 }
      },
      xaxis: {
        ...DARK_LAYOUT_BASE.xaxis,
        range: viewport.xRange,
        title: {
          text: geometryData.axis.xLabel,
          font: { color: COLORS.text, size: 12, family: 'Inter, system-ui, sans-serif' }
        },
        scaleanchor: 'y',
        scaleratio: 1
      },
      yaxis: {
        ...DARK_LAYOUT_BASE.yaxis,
        range: viewport.yRange,
        title: {
          text: geometryData.axis.yLabel,
          font: { color: COLORS.text, size: 12, family: 'Inter, system-ui, sans-serif' }
        }
      },
      legend: {
        x: 0.98,
        y: 0.98,
        xanchor: 'right',
        yanchor: 'top',
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        bordercolor: 'rgba(0, 0, 0, 0.1)',
        borderwidth: 1
      },
      annotations
    }

    return { traces, layout }
  }

  /**
   * 智能计算视口范围
   * 
   * 根据图表中的关键点自动计算合适的显示范围，使用权重机制确保重要内容优先显示。
   * 采用"缩放+中心锚定"策略，以加权中心为锚点扩展视口，实现视觉平衡。
   * 
   * 算法步骤：
   * 1. 收集所有带权重的关键点
   * 2. 过滤高权重点，计算边界和加权中心
   * 3. 以加权中心为锚点，放大视口范围
   * 4. 确保均衡点右侧有足够空间
   * 
   * @param geometryData - 几何数据
   * @returns 计算出的视口范围
   */
  private calculateViewport(geometryData: GeometryData): ViewportRange {
    if (geometryData.axis.xRange && geometryData.axis.yRange) {
      return {
        xRange: geometryData.axis.xRange,
        yRange: geometryData.axis.yRange
      }
    }

    const weightedPoints: WeightedPoint[] = []

    geometryData.markers.forEach(marker => {
      weightedPoints.push({ x: marker.x, y: marker.y, weight: VIEWPORT_CONFIG.weights.marker })
    })

    geometryData.axisLabels.forEach(axisLabel => {
      weightedPoints.push({ x: axisLabel.x, y: axisLabel.y, weight: VIEWPORT_CONFIG.weights.annotation })
    })

    geometryData.annotations.forEach(annotation => {
      weightedPoints.push({ x: annotation.x, y: annotation.y, weight: VIEWPORT_CONFIG.weights.annotation })
    })

    geometryData.shadedAreas.forEach(area => {
      area.points.forEach(point => {
        if (this.isValidPoint(point)) {
          weightedPoints.push({ ...point, weight: VIEWPORT_CONFIG.weights.shadedArea })
        }
      })
    })

    geometryData.dashedLines.forEach(line => {
      line.points.forEach(point => {
        if (this.isValidPoint(point)) {
          weightedPoints.push({ ...point, weight: VIEWPORT_CONFIG.weights.dashedLine })
        }
      })
    })

    geometryData.curves.forEach(curve => {
      const curveWeightedPoints = this.extractCurveWeightedPoints(curve)
      weightedPoints.push(...curveWeightedPoints)
    })

    if (weightedPoints.length === 0) {
      return {
        xRange: geometryData.axis.xRange || VIEWPORT_CONFIG.defaultRange,
        yRange: geometryData.axis.yRange || VIEWPORT_CONFIG.defaultRange
      }
    }

    const highWeightPoints = weightedPoints.filter(p => p.weight >= VIEWPORT_CONFIG.highWeightThreshold)
    const pointsToUse = highWeightPoints.length > 0 ? highWeightPoints : weightedPoints

    const bounds = this.calculateWeightedBounds(pointsToUse)
    const center = this.calculateWeightedCenter(pointsToUse)

    const markersWithLabel = geometryData.markers.filter(m => m.label)
    let xRange = this.calculateCenteredAxisRange(
      bounds.minX,
      bounds.maxX,
      center.x,
      markersWithLabel
    )
    let yRange = this.calculateCenteredAxisRange(
      bounds.minY,
      bounds.maxY,
      center.y,
      []
    )

    const xRangeLength = xRange[1] - xRange[0]
    const yRangeLength = yRange[1] - yRange[0]
    const maxRange = Math.max(xRangeLength, yRangeLength)

    const xCenter = (xRange[0] + xRange[1]) / 2
    const yCenter = (yRange[0] + yRange[1]) / 2

    const finalXRange = [
      Math.max(0, xCenter - maxRange / 2),
      xCenter + maxRange / 2
    ] as [number, number]
    const finalYRange = [
      Math.max(0, yCenter - maxRange / 2),
      yCenter + maxRange / 2
    ] as [number, number]

    return { xRange: finalXRange, yRange: finalYRange }
  }

  /**
   * 检查点是否有效（非极端值）
   * 
   * @param point - 待检查的点
   * @returns 是否为有效点
   */
  private isValidPoint(point: Point): boolean {
    return (
      Math.abs(point.x) < VIEWPORT_CONFIG.extremeThreshold &&
      Math.abs(point.y) < VIEWPORT_CONFIG.extremeThreshold &&
      isFinite(point.x) &&
      isFinite(point.y)
    )
  }

  /**
   * 从曲线中提取带权重的关键点
   * 
   * 对于线性曲线，提取曲线在合理范围内的端点，权重较低。
   * Y轴交点（x=0或接近0的点）给予更高权重，因为经济学图表中价格截距很重要。
   * 对于点集曲线，提取曲线的起点、终点和极值点。
   * 
   * @param curve - 曲线几何数据
   * @returns 带权重的关键点数组
   */
  private extractCurveWeightedPoints(curve: CurveGeometry): WeightedPoint[] {
    const weightedPoints: WeightedPoint[] = []

    if (curve.type === 'linear' && curve.points.length > 0) {
      const validPoints = curve.points.filter(p => this.isValidPoint(p))
      
      if (validPoints.length > 0) {
        const sortedByX = [...validPoints].sort((a, b) => a.x - b.x)
        const sortedByY = [...validPoints].sort((a, b) => a.y - b.y)

        const reasonableMinX = Math.max(0, sortedByX[0].x)
        const reasonableMaxX = Math.min(20, sortedByX[sortedByX.length - 1].x)
        const reasonableMinY = Math.max(0, sortedByY[0].y)
        const reasonableMaxY = Math.min(20, sortedByY[sortedByY.length - 1].y)

        if (reasonableMinX <= reasonableMaxX) {
          weightedPoints.push({ x: reasonableMinX, y: reasonableMinY, weight: VIEWPORT_CONFIG.weights.curveEndpoint })
          weightedPoints.push({ x: reasonableMaxX, y: reasonableMaxY, weight: VIEWPORT_CONFIG.weights.curveEndpoint })
        }

        const midX = (reasonableMinX + reasonableMaxX) / 2
        const midY = (reasonableMinY + reasonableMaxY) / 2
        weightedPoints.push({ x: midX, y: midY, weight: VIEWPORT_CONFIG.weights.curveEndpoint })

        const yInterceptPoint = this.findYIntercept(validPoints)
        if (yInterceptPoint) {
          weightedPoints.push({ ...yInterceptPoint, weight: VIEWPORT_CONFIG.weights.yIntercept })
        }
      }
    } else if (curve.type === 'pointSet' && curve.points.length > 0) {
      const validPoints = curve.points.filter(p => this.isValidPoint(p))
      
      if (validPoints.length > 0) {
        weightedPoints.push({ ...validPoints[0], weight: VIEWPORT_CONFIG.weights.curveEndpoint })
        weightedPoints.push({ ...validPoints[validPoints.length - 1], weight: VIEWPORT_CONFIG.weights.curveEndpoint })

        let minY = validPoints[0].y
        let maxY = validPoints[0].y
        let minYPoint = validPoints[0]
        let maxYPoint = validPoints[0]

        validPoints.forEach(p => {
          if (p.y < minY) {
            minY = p.y
            minYPoint = p
          }
          if (p.y > maxY) {
            maxY = p.y
            maxYPoint = p
          }
        })

        weightedPoints.push({ ...minYPoint, weight: VIEWPORT_CONFIG.weights.curveEndpoint })
        weightedPoints.push({ ...maxYPoint, weight: VIEWPORT_CONFIG.weights.curveEndpoint })

        const yInterceptPoint = this.findYIntercept(validPoints)
        if (yInterceptPoint) {
          weightedPoints.push({ ...yInterceptPoint, weight: VIEWPORT_CONFIG.weights.yIntercept })
        }
      }
    }

    return weightedPoints
  }

  /**
   * 查找曲线与Y轴的交点
   * 
   * 对于线性曲线，通过线性插值计算x=0时的y值。
   * 如果曲线经过Y轴附近（x接近0），返回该交点。
   * 
   * @param points - 曲线点集
   * @returns Y轴交点，如果不存在则返回null
   */
  private findYIntercept(points: Point[]): Point | null {
    if (points.length < 2) return null

    const sortedByX = [...points].sort((a, b) => a.x - b.x)

    for (let i = 0; i < sortedByX.length - 1; i++) {
      const p1 = sortedByX[i]
      const p2 = sortedByX[i + 1]

      if (p1.x <= 0 && p2.x >= 0) {
        if (p1.x === p2.x) continue
        
        const t = (0 - p1.x) / (p2.x - p1.x)
        const yIntercept = p1.y + t * (p2.y - p1.y)
        
        if (isFinite(yIntercept) && Math.abs(yIntercept) < VIEWPORT_CONFIG.extremeThreshold) {
          return { x: 0, y: yIntercept }
        }
      }
    }

    const nearYAxisPoint = sortedByX.find(p => Math.abs(p.x) < 0.5)
    if (nearYAxisPoint) {
      return { x: 0, y: nearYAxisPoint.y }
    }

    return null
  }

  /**
   * 计算带权重点集的边界
   * 
   * @param points - 带权重的点数组
   * @returns 边界对象 { minX, maxX, minY, maxY }
   */
  private calculateWeightedBounds(points: WeightedPoint[]): {
    minX: number
    maxX: number
    minY: number
    maxY: number
  } {
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    points.forEach(point => {
      minX = Math.min(minX, point.x)
      maxX = Math.max(maxX, point.x)
      minY = Math.min(minY, point.y)
      maxY = Math.max(maxY, point.y)
    })

    return { minX, maxX, minY, maxY }
  }

  /**
   * 计算带权重点集的加权中心
   * 
   * 根据各点的权重计算视觉重心，用于视口中心锚定。
   * 权重越高的点对中心位置影响越大。
   * 
   * @param points - 带权重的点数组
   * @returns 加权中心坐标 { x, y }
   */
  private calculateWeightedCenter(points: WeightedPoint[]): { x: number; y: number } {
    if (points.length === 0) {
      return { x: 0, y: 0 }
    }

    let totalWeight = 0
    let weightedSumX = 0
    let weightedSumY = 0

    points.forEach(point => {
      totalWeight += point.weight
      weightedSumX += point.x * point.weight
      weightedSumY += point.y * point.weight
    })

    if (totalWeight === 0) {
      const bounds = this.calculateWeightedBounds(points)
      return {
        x: (bounds.minX + bounds.maxX) / 2,
        y: (bounds.minY + bounds.maxY) / 2
      }
    }

    return {
      x: weightedSumX / totalWeight,
      y: weightedSumY / totalWeight
    }
  }

  /**
   * 计算单个轴的范围
   * 
   * 根据最小值和最大值计算合适的显示范围，添加边距并确保范围合理。
   * 不再限制最大范围，以支持大数据范围的图表需求。
   * 
   * @param min - 最小值
   * @param max - 最大值
   * @returns 轴范围 [min, max]
   */
  private calculateAxisRange(min: number, max: number): [number, number] {
    const range = max - min

    if (range < 0.01) {
      const center = min
      return [Math.max(0, center - 6), center + 6]
    }

    const padding = range * VIEWPORT_CONFIG.paddingRatio
    let rangeMin = Math.max(0, min - padding)
    let rangeMax = max + padding

    const actualRange = rangeMax - rangeMin
    if (actualRange < VIEWPORT_CONFIG.minRange) {
      const center = (rangeMin + rangeMax) / 2
      rangeMin = Math.max(0, center - VIEWPORT_CONFIG.minRange / 2)
      rangeMax = center + VIEWPORT_CONFIG.minRange / 2
    }

    return [rangeMin, rangeMax]
  }

  /**
   * 以加权中心为锚点计算轴范围
   * 
   * 核心算法：
   * 1. 先计算基础范围（包含所有点）
   * 2. 以加权中心为锚点，放大视口范围
   * 3. 确保带标签点右侧有足够空间
   * 
   * @param min - 边界最小值
   * @param max - 边界最大值
   * @param center - 加权中心坐标
   * @param labeledPoints - 带标签点数组（用于确保右侧空间）
   * @returns 轴范围 [min, max]
   */
  private calculateCenteredAxisRange(
    min: number,
    max: number,
    center: number,
    labeledPoints: { x: number; y: number; label?: string }[]
  ): [number, number] {
    const range = max - min

    if (range < 0.01) {
      return [Math.max(0, center - 6), center + 6]
    }

    const padding = range * VIEWPORT_CONFIG.paddingRatio
    let rangeMin = Math.max(0, min - padding)
    let rangeMax = max + padding

    let actualRange = rangeMax - rangeMin
    if (actualRange < VIEWPORT_CONFIG.minRange) {
      const midPoint = (rangeMin + rangeMax) / 2
      rangeMin = Math.max(0, midPoint - VIEWPORT_CONFIG.minRange / 2)
      rangeMax = midPoint + VIEWPORT_CONFIG.minRange / 2
      actualRange = rangeMax - rangeMin
    }

    const scaledRange = actualRange * VIEWPORT_CONFIG.centerScaleFactor
    const halfScaledRange = scaledRange / 2

    let newMin = center - halfScaledRange
    let newMax = center + halfScaledRange

    if (labeledPoints.length > 0) {
      const maxEqX = Math.max(...labeledPoints.map(p => p.x))
      const rightSpace = newMax - maxEqX
      const minRequiredSpace = scaledRange * VIEWPORT_CONFIG.minRightSpaceRatio

      if (rightSpace < minRequiredSpace) {
        const extraSpace = minRequiredSpace - rightSpace
        newMax += extraSpace
      }
    }

    if (newMin < 0) {
      const shift = -newMin
      newMin = 0
      newMax += shift
    }

    return [newMin, newMax]
  }

  private convertCurve(curve: CurveGeometry): PlotlyTrace {
    return {
      x: curve.points.map(p => p.x),
      y: curve.points.map(p => p.y),
      type: 'scatter',
      mode: 'lines',
      name: curve.label,
      line: {
        color: curve.style.color,
        width: curve.style.width,
        dash: curve.style.dash === 'dash' ? 'dash' : curve.style.dash === 'dot' ? 'dot' : 'solid',
        shape: curve.type === 'pointSet' ? 'spline' : 'linear',
        smoothing: curve.type === 'pointSet' ? 0.8 : 0
      },
      showlegend: false,
      hoverinfo: 'name'
    }
  }

  private createCurveLabelAnnotation(curve: CurveGeometry): PlotlyAnnotation | null {
    if (!curve.label || curve.points.length === 0) {
      return null
    }

    // 找到在可见范围内最右侧的点，标签应放在那里
    const validPoints = curve.points.filter(p => 
      p.x >= -5 && p.x <= 25 && p.y >= -5 && p.y <= 25
    )
    
    if (validPoints.length === 0) {
      return null
    }
    
    // 按 X 坐标从大到小排序，找到最右边的点
    const sortedByX = [...validPoints].sort((a, b) => b.x - a.x)
    const endPoint = sortedByX[0]
    
    const labelOffset = 0.3
    
    return {
      x: endPoint.x + labelOffset,
      y: endPoint.y,
      xref: 'x',
      yref: 'y',
      text: curve.label,
      showarrow: false,
      font: { 
        color: curve.style.color, 
        size: 14,
        weight: 'bold'
      },
      bgcolor: 'rgba(255,255,255,0.95)',
      borderpad: 4,
      xanchor: 'left',
      yanchor: 'middle'
    }
  }

  private convertShadedArea(area: ShadedAreaGeometry): PlotlyTrace {
    console.log('[DEBUG] convertShadedArea - START area:', JSON.stringify(area, null, 2))
    const trace = {
      x: area.points.map(p => p.x),
      y: area.points.map(p => p.y),
      type: 'scatter',
      mode: 'lines',
      fill: 'toself',
      fillcolor: area.color,
      opacity: area.opacity,
      line: { color: 'transparent', width: 0 },
      showlegend: !!area.label,
      name: area.label || '',
      hoverinfo: 'name'
    }
    console.log('[DEBUG] convertShadedArea - END trace:', { name: trace.name, x: trace.x, y: trace.y, color: area.color })
    return trace
  }

  private convertBrace(brace: BraceGeometry): {
    trace: PlotlyTrace
    annotation: PlotlyAnnotation | null
  } {
    const mid = (brace.x1 + brace.x2) / 2
    const height = Math.abs(brace.x2 - brace.x1) * 0.08
    const y = brace.direction === 'up' ? brace.y - height : brace.y + height

    const trace: PlotlyTrace = {
      x: [brace.x1, brace.x1 + (brace.x2 - brace.x1) * 0.25, mid, brace.x1 + (brace.x2 - brace.x1) * 0.75, brace.x2],
      y: [brace.y, brace.y - height * 0.5, y, brace.y - height * 0.5, brace.y],
      type: 'scatter',
      mode: 'lines',
      line: { color: brace.color, width: 2 },
      fill: 'none',
      showlegend: false,
      hoverinfo: 'none',
      name: brace.label
    }

    const annotation: PlotlyAnnotation | null = brace.label ? {
      x: mid,
      y: brace.labelPosition.y,
      xref: 'x',
      yref: 'y',
      text: brace.label,
      showarrow: false,
      font: { color: brace.color, size: 12, weight: 'bold' },
      bgcolor: 'rgba(255,255,255,0.9)',
      borderpad: 3
    } : null

    return { trace, annotation }
  }

  private convertDashedLine(dashedLine: DashedLineGeometry): PlotlyTrace {
    return {
      x: dashedLine.points.map(p => p.x),
      y: dashedLine.points.map(p => p.y),
      type: 'scatter',
      mode: 'lines',
      line: { color: 'rgba(0,0,0,0.3)', width: 1.5, dash: 'dot' },
      showlegend: false,
      hoverinfo: 'none'
    }
  }

  private convertMarker(marker: MarkerGeometry): PlotlyTrace {
    const hasLabel = marker.label && marker.label.trim() !== ''
    return {
      x: [marker.x],
      y: [marker.y],
      type: 'scatter',
      mode: hasLabel ? 'markers+text' : 'markers',
      marker: {
        color: marker.color,
        symbol: marker.symbol || 'circle',
        size: marker.size || 10
      },
      text: hasLabel ? marker.label : '',
      textposition: hasLabel ? 'top center' : undefined,
      showlegend: false,
      hoverinfo: 'none'
    }
  }

  private convertAnnotation(annotation: AnnotationGeometry): PlotlyAnnotation {
    const hasArrow = annotation.arrowDirection === 'right' || 
                     annotation.arrowDirection === 'left' ||
                     annotation.arrowDirection === 'up' ||
                     annotation.arrowDirection === 'down'

    let ax = 0
    let ay = -20

    if (annotation.arrowDirection) {
      switch (annotation.arrowDirection) {
        case 'right':
          ax = 60
          ay = 0
          break
        case 'left':
          ax = -60
          ay = 0
          break
        case 'up':
          ax = 0
          ay = -60
          break
        case 'down':
          ax = 0
          ay = 60
          break
      }
    }

    return {
      x: annotation.x,
      y: annotation.y,
      xref: 'x',
      yref: 'y',
      text: annotation.text,
      showarrow: hasArrow,
      arrowhead: 2,
      arrowsize: 1.2,
      arrowcolor: 'rgba(0,0,0,0.5)',
      ax,
      ay,
      font: { color: COLORS.text, size: 11 },
      bgcolor: 'rgba(255,255,255,0.9)',
      borderpad: 3
    }
  }

  /**
   * 转换箭头几何数据为 Plotly 格式
   * 
   * 简单直接的箭头绘制，避免多余线条
   * 
   * @param arrow - 箭头几何数据
   * @returns 包含 trace 和可选 annotation 的对象
   */
  private convertArrow(arrow: ArrowGeometry): {
    traces: PlotlyTrace[]
    arrowAnnotation: PlotlyAnnotation | null
    labelAnnotation: PlotlyAnnotation | null
  } {
    console.log('[DEBUG] convertArrow - START arrow:', JSON.stringify(arrow, null, 2))
    
    const dx = arrow.endX - arrow.startX
    const dy = arrow.endY - arrow.startY
    const length = Math.sqrt(dx * dx + dy * dy)
    console.log('[DEBUG] convertArrow - length:', length)
    
    if (length < 0.01) {
      console.log('[DEBUG] convertArrow - too short, returning empty')
      return {
        traces: [],
        arrowAnnotation: null,
        labelAnnotation: null
      }
    }
    
    const unitX = dx / length
    const unitY = dy / length
    console.log('[DEBUG] convertArrow - unit:', { unitX, unitY })
    
    const padding = 0.3
    const adjustedStartX = arrow.startX + unitX * padding
    const adjustedStartY = arrow.startY + unitY * padding
    const adjustedEndX = arrow.endX - unitX * padding
    const adjustedEndY = arrow.endY - unitY * padding
    console.log('[DEBUG] convertArrow - adjusted:', { adjustedStartX, adjustedStartY, adjustedEndX, adjustedEndY })
    
    const traces: PlotlyTrace[] = []
    
    const arrowAnnotation: PlotlyAnnotation = {
      x: adjustedEndX,
      y: adjustedEndY,
      xref: 'x',
      yref: 'y',
      ax: adjustedStartX,
      ay: adjustedStartY,
      axref: 'x',
      ayref: 'y',
      showarrow: true,
      arrowcolor: arrow.color,
      arrowwidth: arrow.lineWidth * 2,
      arrowhead: 2,
      arrowsize: 1.2,
      text: '',
      font: { size: 1 }
    }
    
    let labelAnnotation: PlotlyAnnotation | null = null
    if (arrow.label) {
      let labelX: number
      let labelY: number
      let xanchor: 'left' | 'center' | 'right' = 'center'
      let yanchor: 'top' | 'middle' | 'bottom' = 'middle'
      
      switch (arrow.labelPosition) {
        case 'start':
          labelX = adjustedStartX - unitX * 0.5
          labelY = adjustedStartY - unitY * 0.5
          xanchor = unitX < -0.3 ? 'right' : unitX > 0.3 ? 'left' : 'center'
          yanchor = unitY < -0.3 ? 'bottom' : unitY > 0.3 ? 'top' : 'middle'
          break
        case 'end':
          labelX = adjustedEndX + unitX * 0.5
          labelY = adjustedEndY + unitY * 0.5
          xanchor = unitX < -0.3 ? 'left' : unitX > 0.3 ? 'right' : 'center'
          yanchor = unitY < -0.3 ? 'top' : unitY > 0.3 ? 'bottom' : 'middle'
          break
        case 'middle':
        default:
          labelX = (adjustedStartX + adjustedEndX) / 2
          labelY = (adjustedStartY + adjustedEndY) / 2
          xanchor = 'center'
          yanchor = 'middle'
          break
      }
      
      labelAnnotation = {
        x: labelX,
        y: labelY,
        xref: 'x',
        yref: 'y',
        text: arrow.label,
        showarrow: false,
        font: { 
          color: arrow.color, 
          size: 11, 
          weight: 'bold' 
        },
        bgcolor: 'rgba(255,255,255,0.95)',
        borderpad: 4,
        xanchor,
        yanchor
      }
    }
    
    console.log('[DEBUG] convertArrow - END, using Plotly annotation arrow')
    return { traces, arrowAnnotation, labelAnnotation }
  }

  private createAxisLabelAnnotation(
    x: number,
    y: number,
    text: string,
    axis: 'x' | 'y'
  ): PlotlyAnnotation {
    if (axis === 'x') {
      return {
        x,
        y: 0,
        xref: 'x',
        yref: 'y',
        text,
        showarrow: false,
        font: { color: COLORS.text, size: 12, weight: 'bold' },
        yanchor: 'top',
        yshift: -10
      }
    } else {
      return {
        x: 0,
        y,
        xref: 'x',
        yref: 'y',
        text,
        showarrow: false,
        font: { color: COLORS.text, size: 12, weight: 'bold' },
        xanchor: 'right',
        xshift: -10
      }
    }
  }
}

export const geometryDataConverter = new GeometryDataConverter()

export function convertGeometryData(geometryData: GeometryData): ConversionResult {
  return geometryDataConverter.convert(geometryData)
}
