'use client'

import { useState, useEffect } from 'react'
import { Maximize2 } from 'lucide-react'
import type { ChartData } from '@/lib/types'
import { SingleChart } from './SingleChart'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { cn } from '@/lib/utils'

interface EconChartProps {
  chart: ChartData
  compact?: boolean
}

/**
 * 经济学图表主组件
 * 支持单图表和多图表模式，支持全屏查看
 * @param chart - 图表数据
 * @param compact - 是否使用紧凑模式
 */
export default function EconChart({ chart, compact }: EconChartProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [renderFullscreen, setRenderFullscreen] = useState(false)

  useEffect(() => {
    if (isFullscreen) {
      const timer = setTimeout(() => {
        setRenderFullscreen(true)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setRenderFullscreen(false)
    }
  }, [isFullscreen])

  if (chart.charts && chart.charts.length > 0) {
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
          {chart.charts.map((subChart, i) => (
            <div
              key={i}
              className="group relative rounded-lg overflow-hidden border border-border bg-chart-panel-bg"
            >
              <SingleChart chart={subChart} compact />
              <button
                onClick={() => setIsFullscreen(true)}
                className={cn(
                  "absolute top-2 left-2 p-1.5 rounded-md bg-background/80 backdrop-blur-sm",
                  "border border-border/50 shadow-sm transition-all duration-200",
                  "opacity-100 hover:bg-accent hover:scale-105",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50"
                )}
                aria-label="全屏查看图表"
              >
                <Maximize2 className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>

        <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
          <DialogContent 
            className="max-w-5xl sm:max-w-5xl w-[95vw] h-[90vh] bg-background/95 backdrop-blur-sm border-border p-4 flex flex-col"
            showCloseButton={true}
          >
            <DialogTitle>
              <VisuallyHidden>图表全屏查看</VisuallyHidden>
            </DialogTitle>
            <div className="flex-1 overflow-hidden rounded-lg border border-border bg-chart-panel-bg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 h-full">
                {chart.charts?.map((subChart, i) => (
                  <div
                    key={i}
                    className="rounded-lg overflow-hidden border border-border bg-chart-panel-bg"
                  >
                    {renderFullscreen && <SingleChart chart={subChart} fullscreen />}
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
      <div className="group relative rounded-lg overflow-hidden border border-border bg-chart-panel-bg w-full">
        <SingleChart chart={chart} compact={compact} />
        <button
          onClick={() => setIsFullscreen(true)}
          className={cn(
            "absolute top-2 left-2 p-1.5 rounded-md bg-background/80 backdrop-blur-sm",
            "border border-border/50 shadow-sm transition-all duration-200",
            "opacity-100 hover:bg-accent hover:scale-105",
            "focus:outline-none focus:ring-2 focus:ring-primary/50"
          )}
          aria-label="全屏查看图表"
        >
          <Maximize2 className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent 
          className="max-w-5xl sm:max-w-5xl w-[95vw] h-[90vh] bg-background/95 backdrop-blur-sm border-border p-4 flex flex-col"
          showCloseButton={true}
        >
          <DialogTitle>
            <VisuallyHidden>图表全屏查看</VisuallyHidden>
          </DialogTitle>
          <div className="flex-1 overflow-hidden rounded-lg border border-border bg-chart-panel-bg">
            {renderFullscreen && <SingleChart chart={chart} fullscreen />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
