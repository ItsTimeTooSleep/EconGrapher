'use client'

import { BarChart2, Github, ExternalLink, Heart, Sparkles, Zap, TrendingUp, X, Shield } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'

interface AboutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 关于弹窗组件
 * 采用Editorial Magazine + Data Visualization美学风格
 * @param open - 控制弹窗显示状态
 * @param onOpenChange - 弹窗状态变化回调
 */
export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[540px] p-0 overflow-visible border-0 gap-0 bg-transparent shadow-none"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">About EconGrapher</DialogTitle>
        <div className="relative">
          <button
            onClick={() => onOpenChange(false)}
            className="absolute -top-2 -right-2 z-50 w-8 h-8 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 hover:scale-110"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-2xl">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-primary/20 via-chart-2/10 to-transparent rounded-full blur-3xl" />
              <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-tr from-chart-2/15 via-primary/10 to-transparent rounded-full blur-3xl" />
              
              <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                    <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
              
              <div className="absolute top-8 right-8 flex gap-2">
                <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: '0s' }} />
                <div className="w-2 h-2 rounded-full bg-chart-2/40 animate-pulse" style={{ animationDelay: '0.5s' }} />
                <div className="w-2 h-2 rounded-full bg-chart-3/40 animate-pulse" style={{ animationDelay: '1s' }} />
              </div>
            </div>
            
            <div className="relative">
              <div className="px-8 pt-8 pb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <div className="relative w-12 h-12 rounded-xl bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center">
                          <BarChart2 className="w-6 h-6 text-neutral-100 dark:text-neutral-900" />
                        </div>
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                          EconGrapher
                        </h1>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Sparkles className="w-3 h-3 text-chart-2" />
                          <span className="text-xs font-medium text-chart-2">AI Economics Assistant</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-chart-2/20 text-chart-2 font-semibold ml-1">24+ Graphs</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                      Your intelligent companion for economics learning and visualization. 
                      Ask questions, explore concepts, and generate interactive graphs through natural language.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="px-8 py-4 bg-muted/30 border-y border-border/50">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center group">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-violet-500/10 mb-2 group-hover:bg-violet-500/20 transition-colors">
                      <Shield className="w-5 h-5 text-violet-500" />
                    </div>
                    <p className="text-xs font-medium text-foreground">Privacy</p>
                    <p className="text-[10px] text-muted-foreground">First</p>
                  </div>
                  <div className="text-center group">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10 mb-2 group-hover:bg-amber-500/20 transition-colors">
                      <TrendingUp className="w-5 h-5 text-amber-500" />
                    </div>
                    <p className="text-xs font-medium text-foreground">Smart</p>
                    <p className="text-[10px] text-muted-foreground">Analysis</p>
                  </div>
                  <div className="text-center group">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-rose-500/10 mb-2 group-hover:bg-rose-500/20 transition-colors">
                      <Zap className="w-5 h-5 text-rose-500" />
                    </div>
                    <p className="text-xs font-medium text-foreground">Instant</p>
                    <p className="text-[10px] text-muted-foreground">Generation</p>
                  </div>
                </div>
              </div>
              
              <div className="px-8 py-5 space-y-3">
                <div className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-muted/50 to-transparent border border-border/50 group hover:border-primary/30 transition-all duration-300">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
                    <Heart className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Created by</p>
                    <p className="text-xs text-muted-foreground">William Zhang</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <span className="text-[10px] font-semibold text-primary">v1.0.0</span>
                  </div>
                </div>
                
                <a
                  href="https://github.com/itstimetoosleep/econgrapher"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-muted/50 to-transparent border border-border/50 group hover:border-foreground/20 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-foreground/5 group-hover:bg-foreground/10 transition-colors">
                    <Github className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Open Source</p>
                    <p className="text-xs text-muted-foreground">Star us on GitHub</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
                </a>
              </div>
              
              <div className="px-8 py-4 bg-muted/20 border-t border-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      <div className="w-5 h-5 rounded-full bg-primary/80 border-2 border-card" />
                      <div className="w-5 h-5 rounded-full bg-chart-2/80 border-2 border-card" />
                      <div className="w-5 h-5 rounded-full bg-chart-3/80 border-2 border-card" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">Built with Next.js, React & AI</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60">
                    © 2026 ItsTimeTooSleep
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
