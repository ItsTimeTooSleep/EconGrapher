'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * 视觉隐藏组件 - 用于 accessibility 目的
 * 元素在屏幕上隐藏但仍可被屏幕阅读器访问
 * @param children - 要隐藏的内容
 * @param className - 额外的 CSS 类名
 */
function VisuallyHidden({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'absolute [clip:rect(0_0_0_0)] [clip-path:inset(50%)] [height:1px] [width:1px] overflow-hidden whitespace-nowrap',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export { VisuallyHidden }