'use client'

import { memo, useState, useEffect, useRef } from 'react'
import { Brain, ChevronDown, ChevronRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ThinkingContent } from '@/lib/types'

interface ThinkingBlockProps {
  thinking: ThinkingContent
  isStreaming?: boolean
}

function ThinkingBlock({ thinking, isStreaming = false }: ThinkingBlockProps) {
  const [isExpanded, setIsExpanded] = useState(isStreaming)
  const [displayedContent, setDisplayedContent] = useState('')
  const prevContentRef = useRef('')

  useEffect(() => {
    if (isStreaming) {
      setIsExpanded(true)
    }
  }, [isStreaming])

  useEffect(() => {
    if (thinking.content.startsWith(prevContentRef.current)) {
      const newText = thinking.content.slice(prevContentRef.current.length)
      if (newText) {
        setDisplayedContent(prev => prev + newText)
      }
    } else {
      setDisplayedContent(thinking.content)
    }
    prevContentRef.current = thinking.content
  }, [thinking.content])

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedContent(thinking.content)
    }
  }, [isStreaming, thinking.content])

  return (
    <div className="thinking-block-wrapper">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="thinking-block-header"
        aria-expanded={isExpanded}
        aria-controls="thinking-content"
      >
        <div className="flex items-center gap-2">
          <div className="thinking-icon-wrapper">
            <Brain className="w-4 h-4 text-primary" />
            {isStreaming && (
              <Sparkles className="w-3 h-3 text-primary/60 animate-pulse absolute -top-1 -right-1" />
            )}
          </div>
          <span className="text-sm font-medium text-primary">
            {isStreaming ? 'Thinking...' : 'Thought Process'}
          </span>
          {isStreaming && (
            <div className="thinking-dots">
              <span className="thinking-dot" style={{ animationDelay: '0ms' }} />
              <span className="thinking-dot" style={{ animationDelay: '150ms' }} />
              <span className="thinking-dot" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      <div
        id="thinking-content"
        className={cn(
          'thinking-block-content',
          isExpanded ? 'thinking-block-expanded' : 'thinking-block-collapsed'
        )}
      >
        <div className="thinking-content-inner">
          <div className="thinking-text">
            {displayedContent}
            {isStreaming && <span className="thinking-cursor" />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(ThinkingBlock)
