'use client'

import { useState, useCallback } from 'react'
import type { ChartData } from '@/lib/types'
import EconChart from '@/components/charts/EconChart'
import { cn } from '@/lib/utils'

const EXAMPLE_CHARTS: { name: string; data: ChartData }[] = [
  {
    name: '供需均衡',
    data: {
      title: 'Supply and Demand Equilibrium',
      xLabel: 'Quantity',
      yLabel: 'Price',
      xRange: [0, 12],
      yRange: [0, 12],
      curves: [
        { id: 'D', label: 'D', type: 'linear', slope: -1, intercept: 10 },
        { id: 'S', label: 'S', type: 'linear', slope: 1, intercept: 2 }
      ],
      points: [
        { id: 'E', definition: { type: 'intersection', curve1: 'D', curve2: 'S' }, label: 'E' }
      ],
      lines: [
        { definition: { type: 'dashedToX', from: 'E', xLabel: 'Qe' } },
        { definition: { type: 'dashedToY', from: 'E', yLabel: 'Pe' } }
      ]
    }
  },
  {
    name: '成本曲线',
    data: {
      title: 'Cost Curves (MC, ATC, AVC)',
      xLabel: 'Quantity',
      yLabel: 'Cost',
      xRange: [0, 12],
      yRange: [0, 25],
      curves: [
        { id: 'MC', label: 'MC', type: 'uShape', minimum: { x: 4, y: 5 }, leftIntercept: 15, color: '#ef4444' },
        { id: 'ATC', label: 'ATC', type: 'uShape', minimum: { x: 6, y: 10 }, leftIntercept: 22, color: '#3b82f6' },
        { id: 'AVC', label: 'AVC', type: 'uShape', minimum: { x: 5, y: 7 }, leftIntercept: 18, color: '#22c55e' }
      ]
    }
  },
  {
    name: '垄断市场',
    data: {
      title: 'Monopoly with Deadweight Loss',
      xLabel: 'Quantity',
      yLabel: 'Price',
      xRange: [0, 12],
      yRange: [0, 14],
      curves: [
        { id: 'D', label: 'D', type: 'linear', slope: -1, intercept: 12 },
        { id: 'MR', label: 'MR', type: 'derivedMR', fromCurve: 'D', dashed: true },
        { id: 'MC', label: 'MC', type: 'linear', slope: 1, intercept: 2 }
      ],
      points: [
        { id: 'Pm', definition: { type: 'intersection', curve1: 'MR', curve2: 'MC' } },
        { id: 'Pc', definition: { type: 'intersection', curve1: 'D', curve2: 'MC' } },
        { id: 'pricePoint', definition: { type: 'onCurve', curve: 'D', x: 4 } }
      ],
      lines: [
        { definition: { type: 'dashedToX', from: 'Pm', xLabel: 'Qm' } },
        { definition: { type: 'dashedToY', from: 'Pm' } },
        { definition: { type: 'dashedToY', from: 'pricePoint', yLabel: 'Pm' } }
      ]
    }
  },
  {
    name: 'AD-AS模型',
    data: {
      title: 'AD-AS Model',
      xLabel: 'Real GDP',
      yLabel: 'Price Level',
      xRange: [0, 12],
      yRange: [0, 12],
      curves: [
        { id: 'AD', label: 'AD', type: 'linear', slope: -0.8, intercept: 10, color: '#3b82f6' },
        { id: 'SRAS', label: 'SRAS', type: 'linear', slope: 0.6, intercept: 2, color: '#22c55e' },
        { id: 'LRAS', label: 'LRAS', type: 'vertical', x: 6, color: '#8b5cf6' }
      ],
      points: [
        { id: 'E', definition: { type: 'intersection', curve1: 'AD', curve2: 'SRAS' }, label: 'E' }
      ]
    }
  }
]

export default function TestPage() {
  const [input, setInput] = useState('')
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRender = useCallback(() => {
    setError(null)
    setChartData(null)

    if (!input.trim()) {
      setError('Please enter chart source directive')
      return
    }

    try {
      const parsed = JSON.parse(input)
      
      if (!parsed.title) {
        setError('Invalid chart data: title is required')
        return
      }
      
      if (!(parsed.charts && Array.isArray(parsed.charts) && parsed.charts.length > 0)) {
        if (!parsed.curves || !Array.isArray(parsed.curves) || parsed.curves.length === 0) {
          setError('Invalid chart data: curves array is required and must not be empty (or use charts array for multiple charts)')
          return
        }
      }

      setChartData(parsed as ChartData)
    } catch (e) {
      setError(`JSON Parse Error: ${(e as Error).message}`)
    }
  }, [input])

  const handleLoadExample = useCallback((example: typeof EXAMPLE_CHARTS[0]) => {
    setInput(JSON.stringify(example.data, null, 2))
    setError(null)
    setChartData(example.data)
  }, [])

  const handleClear = useCallback(() => {
    setInput('')
    setChartData(null)
    setError(null)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Chart Rendering Test</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Input chart source directive (JSON format) to render charts
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-foreground">Chart Source Directive</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleClear}
                  className="px-3 py-1.5 text-xs rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleRender}
                  className="px-4 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Render Chart
                </button>
              </div>
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`{
  "title": "Chart Title",
  "xLabel": "X Axis",
  "yLabel": "Y Axis",
  "xRange": [0, 10],
  "yRange": [0, 10],
  "curves": [
    { "id": "D", "label": "D", "type": "linear", "slope": -1, "intercept": 8 }
  ]
}`}
              className="w-full h-80 p-4 rounded-lg border border-border bg-card text-foreground font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50"
              spellCheck={false}
            />

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                {error}
              </div>
            )}

            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-2">Example Charts</h3>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_CHARTS.map((example) => (
                  <button
                    key={example.name}
                    onClick={() => handleLoadExample(example)}
                    className="px-3 py-1.5 text-xs rounded-md border border-border bg-card text-foreground hover:bg-accent hover:border-primary/50 transition-all"
                  >
                    {example.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-foreground">Rendered Chart</h2>
            <div
              className={cn(
                "flex-1 min-h-[400px] rounded-lg border border-border bg-chart-panel-bg",
                "flex items-center justify-center"
              )}
            >
              {chartData ? (
                <div className="w-full h-full p-2">
                  <EconChart chart={chartData} />
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">
                  Chart will be rendered here
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 rounded-lg border border-border bg-card">
          <h3 className="text-sm font-medium text-foreground mb-3">Quick Reference</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs text-muted-foreground">
            <div>
              <h4 className="font-medium text-foreground mb-1">Curve Types</h4>
              <ul className="space-y-0.5">
                <li><code className="text-primary">linear</code> - slope, intercept</li>
                <li><code className="text-primary">uShape</code> - minimum, leftIntercept</li>
                <li><code className="text-primary">nShape</code> - maximum, leftIntercept</li>
                <li><code className="text-primary">vertical</code> - x</li>
                <li><code className="text-primary">horizontal</code> - y</li>
                <li><code className="text-primary">pointSet</code> - points[]</li>
                <li><code className="text-primary">derivedMR</code> - fromCurve</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Point Definitions</h4>
              <ul className="space-y-0.5">
                <li><code className="text-primary">fixed</code> - x, y</li>
                <li><code className="text-primary">intersection</code> - curve1, curve2</li>
                <li><code className="text-primary">onCurve</code> - curve, x</li>
                <li><code className="text-primary">curveMinimum</code> - curve</li>
                <li><code className="text-primary">curveMaximum</code> - curve</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Line Definitions</h4>
              <ul className="space-y-0.5">
                <li><code className="text-primary">segment</code> - from, to</li>
                <li><code className="text-primary">dashedToX</code> - from, xLabel</li>
                <li><code className="text-primary">dashedToY</code> - from, yLabel</li>
                <li><code className="text-primary">horizontal</code> - from, to</li>
                <li><code className="text-primary">vertical</code> - from, to</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
