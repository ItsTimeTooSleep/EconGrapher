'use client'

import { useEffect, useRef, useState } from 'react'
import type { ChartData } from '@/lib/types'
import { buildFigure, type FigureResult } from './builders'

interface SingleChartProps {
  chart: ChartData
  compact?: boolean
  fullscreen?: boolean
}

/**
 * 单个图表渲染组件
 * @param chart - 图表数据
 * @param compact - 是否使用紧凑模式
 * @param fullscreen - 是否全屏模式
 */
export function SingleChart({ chart, compact, fullscreen }: SingleChartProps) {
  const divRef = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!fullscreen) {
      setIsReady(true)
    } else {
      const timer = setTimeout(() => setIsReady(true), 50)
      return () => clearTimeout(timer)
    }
  }, [fullscreen])

  useEffect(() => {
    if (!isReady) return

    const figure: FigureResult | null = buildFigure(chart)
    if (!figure || !divRef.current) return

    const currentDiv = divRef.current
    const h = fullscreen ? undefined : (compact ? 300 : 380)

    import('plotly.js-dist-min').then(Plotly => {
      if (!currentDiv) return

      const layout = {
        ...figure.layout,
        height: h,
        autosize: true,
        margin: fullscreen ? { l: 80, r: 60, t: 80, b: 80 } : figure.layout.margin,
        dragmode: 'pan',
        xaxis: figure.layout.xaxis,
        yaxis: figure.layout.yaxis
      } as Record<string, unknown>

      Plotly.newPlot(
        currentDiv,
        figure.data,
        layout,
        {
          responsive: true,
          displayModeBar: true,
          scrollZoom: true,
          modeBarButtonsToRemove: ['select2d', 'lasso2d', 'autoScale2d', 'pan2d', 'zoomIn2d', 'zoomOut2d', 'zoom2d'],
          displaylogo: false,
          toImageButtonOptions: { format: 'png', filename: chart.title }
        }
      ).then(() => {
        if (fullscreen && currentDiv) {
          setTimeout(() => {
            if (currentDiv) {
              Plotly.relayout(currentDiv, { autosize: true })
            }
          }, 100)
          setTimeout(() => {
            if (currentDiv) {
              window.dispatchEvent(new Event('resize'))
            }
          }, 200)
        }
      })
    })

    return () => {
      import('plotly.js-dist-min').then(Plotly => {
        Plotly.purge(currentDiv)
      })
    }
  }, [chart, compact, fullscreen, isReady])

  return (
    <div
      ref={divRef}
      className="w-full h-full"
      style={fullscreen ? { minHeight: '100%', height: '100%' } : undefined}
    />
  )
}
