'use client'

import { useEffect, useState } from 'react'
import { BarChart2, TrendingUp, LineChart, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GraphLoadingPreviewProps {
  className?: string
}

const loadingSteps = [
  { icon: BarChart2, label: 'Analyzing your request...' },
  { icon: TrendingUp, label: 'Thinking about the title...' },
  { icon: LineChart, label: 'Adding labels...' },
  { icon: Activity, label: 'Calculating axis ranges...' },
  { icon: BarChart2, label: 'Selecting colors...' },
  { icon: TrendingUp, label: 'Optimizing layout...' },
  { icon: LineChart, label: 'Adding annotations...' },
  { icon: Activity, label: 'Refining the design...' }
]

export default function GraphLoadingPreview({ className }: GraphLoadingPreviewProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const iconInterval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % loadingSteps.length)
    }, 2500)

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev
        return prev + Math.random() * 5
      })
    }, 350)

    return () => {
      clearInterval(iconInterval)
      clearInterval(progressInterval)
    }
  }, [])

  const ActiveIcon = loadingSteps[activeIndex].icon

  return (
    <div className={cn(
      'relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6',
      className
    )}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-4 -top-4 h-32 w-32 rounded-full bg-primary/10 blur-3xl animate-slow-pulse" />
        <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-full bg-primary/10 blur-3xl animate-slow-pulse delay-500" />
      </div>

      <div className="relative flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 animate-slow-ping opacity-20">
            <ActiveIcon className="h-12 w-12 text-primary" />
          </div>
          <div className="relative animate-slow-bounce">
            <ActiveIcon className="h-12 w-12 text-primary transition-all duration-700" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground animate-slow-pulse">
            AI is Working...
          </h3>
          <p className="text-sm text-muted-foreground transition-all duration-700">
            {loadingSteps[activeIndex].label}
          </p>
        </div>

        <div className="w-full max-w-xs space-y-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-primary/10">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-500 ease-out"
              style={{ width: `${Math.min(progress, 95)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Analyzing parameters...</span>
            <span>{Math.round(Math.min(progress, 95))}%</span>
          </div>
        </div>

        <div className="flex gap-1.5 mt-2">
          {loadingSteps.map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-2 w-2 rounded-full transition-all duration-500',
                index === activeIndex 
                  ? 'bg-primary scale-125' 
                  : 'bg-primary/30'
              )}
            />
          ))}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </div>
  )
}
