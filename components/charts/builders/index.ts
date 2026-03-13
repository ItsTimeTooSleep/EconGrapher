/**
 * 图表构建器入口
 * 
 * 新架构：
 * - AI 输出原语语义配置 (ChartData)
 * - 原语规则引擎计算几何数据 (GeometryData)
 * - 转换器生成 Plotly 格式
 * 
 * @module builders
 * @author EconGrapher Team
 */

import type { ChartData, CurveDefinition, ArrowDefinition } from '@/lib/types'
import { 
  primitiveEngine,
  type PrimitiveSemanticConfig,
  type GeometryData
} from '@/lib/rule-engine'
import type { CurveTemplate } from '@/lib/rule-engine/curve-templates/types'
import { GeometryDataConverter } from '@/lib/rule-engine/utils/GeometryDataConverter'
import { DARK_LAYOUT_BASE, EXPORT_LAYOUT_BASE } from '../layouts'
import type { LayoutBase } from '../layouts'

/**
 * 图表构建结果
 */
export interface FigureResult {
  data: unknown[]
  layout: Record<string, unknown>
}

/**
 * 几何数据转换器实例
 */
const converter = new GeometryDataConverter()

/**
 * 将 ChartData 转换为 PrimitiveSemanticConfig
 * 
 * @param chart - AI 输出的图表数据
 * @returns 原语语义配置
 */
function chartDataToPrimitiveConfig(chart: ChartData): PrimitiveSemanticConfig {
  return {
    title: chart.title,
    xLabel: chart.xLabel,
    yLabel: chart.yLabel,
    xRange: chart.xRange,
    yRange: chart.yRange,
    curves: convertCurves(chart.curves),
    points: chart.points,
    lines: chart.lines,
    areas: chart.areas,
    annotations: chart.annotations,
    axisLabels: chart.axisLabels,
    arrows: convertArrows(chart.arrows)
  }
}

/**
 * 转换箭头定义为箭头原语
 * 
 * @param arrows - 箭头定义数组
 * @returns 箭头原语数组
 */
function convertArrows(arrows?: ArrowDefinition[]): PrimitiveSemanticConfig['arrows'] {
  if (!arrows) return []
  
  return arrows.map(arrow => ({
    id: arrow.id,
    from: arrow.from,
    to: arrow.to,
    color: arrow.color,
    lineWidth: arrow.lineWidth,
    headSize: arrow.headSize,
    label: arrow.label,
    labelPosition: arrow.labelPosition
  }))
}

/**
 * 转换曲线定义为曲线模板
 * 
 * @param curves - 曲线定义数组
 * @returns 曲线模板数组
 */
function convertCurves(curves: CurveDefinition[]): CurveTemplate[] {
  return curves.map(curve => {
    const base = {
      id: curve.id,
      label: curve.label,
      color: curve.color,
      dashed: curve.dashed,
      lineWidth: curve.lineWidth
    }
    
    switch (curve.type) {
      case 'linear':
        return {
          ...base,
          type: 'linear' as const,
          slope: curve.slope!,
          intercept: curve.intercept!
        }
        
      case 'uShape':
        return {
          ...base,
          type: 'uShape' as const,
          minimum: curve.minimum!,
          leftIntercept: curve.leftIntercept,
          rightY: curve.rightY,
          steepness: curve.steepness
        }
        
      case 'nShape':
        return {
          ...base,
          type: 'nShape' as const,
          maximum: curve.maximum!,
          leftIntercept: curve.leftIntercept,
          rightY: curve.rightY,
          steepness: curve.steepness
        }
        
      case 'vertical':
        return {
          ...base,
          type: 'vertical' as const,
          x: curve.x!
        }
        
      case 'horizontal':
        return {
          ...base,
          type: 'horizontal' as const,
          y: curve.y!
        }
        
      case 'pointSet':
        return {
          ...base,
          type: 'pointSet' as const,
          points: curve.points!,
          smooth: curve.smooth
        }
        
      case 'derivedMR':
        return {
          ...base,
          type: 'derivedMR' as const,
          fromCurve: curve.fromCurve!
        }
        
      case 'derivedMFC':
        return {
          ...base,
          type: 'derivedMFC' as const,
          fromCurve: curve.fromCurve!
        }
        
      case 'hyperbola':
        return {
          ...base,
          type: 'hyperbola' as const,
          k: curve.k!,
          h: curve.h,
          v: curve.v,
          startX: curve.startX
        }
        
      default:
        throw new Error(`Unknown curve type: ${(curve as CurveDefinition).type}`)
    }
  })
}

/**
 * 使用原语规则引擎构建图表
 * 
 * @param chart - 图表数据
 * @param layoutBase - 可选的布局基础配置
 * @returns 图表构建结果
 */
function buildFigureWithPrimitiveEngine(
  chart: ChartData,
  layoutBase?: LayoutBase
): FigureResult {
  const config = chartDataToPrimitiveConfig(chart)
  const geometryData = primitiveEngine.process(config)
  const { traces, layout } = converter.convert(geometryData)
  
  const base = layoutBase || DARK_LAYOUT_BASE
  const finalLayout = {
    ...base,
    ...layout,
    title: layout.title,
    xaxis: { ...base.xaxis, ...layout.xaxis },
    yaxis: { ...base.yaxis, ...layout.yaxis }
  }
  
  return {
    data: traces,
    layout: finalLayout
  }
}

/**
 * 构建图表的主入口函数
 * 
 * @param chart - 图表数据
 * @param forExport - 是否用于导出
 * @returns 图表构建结果
 */
export function buildFigure(
  chart: ChartData,
  forExport: boolean = false
): FigureResult | null {
  const layoutBase = forExport ? EXPORT_LAYOUT_BASE : undefined
  
  try {
    return buildFigureWithPrimitiveEngine(chart, layoutBase)
  } catch (error) {
    console.error('Failed to build figure:', error)
    return null
  }
}

/**
 * 构建多个图表
 * 
 * @param charts - 图表数据数组
 * @param forExport - 是否用于导出
 * @returns 图表构建结果数组
 */
export function buildFigures(
  charts: ChartData[],
  forExport: boolean = false
): (FigureResult | null)[] {
  return charts.map(chart => buildFigure(chart, forExport))
}

export { primitiveEngine, chartDataToPrimitiveConfig }
export type { PrimitiveSemanticConfig, GeometryData }
