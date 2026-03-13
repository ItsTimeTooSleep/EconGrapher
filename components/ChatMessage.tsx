'use client'

import { memo, useEffect, useRef, useState, useCallback } from 'react'
import { User, Bot, Loader2, RotateCcw, Pencil, ChevronLeft, ChevronRight, Send, X, AlertCircle } from 'lucide-react'
import type { Message, MessageBranch, ContentBlock } from '@/lib/types'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import dynamic from 'next/dynamic'
import AnalysisCard from './AnalysisCard'
import GraphLoadingPreview from './GraphLoadingPreview'
import MarkdownRenderer from './MarkdownRenderer'
import ThinkingBlock from './ThinkingBlock'

const EconChart = dynamic(() => import('./charts/EconChart'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-40 rounded-lg border border-border bg-card">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  )
})

interface Props {
  message: Message
  isStreaming?: boolean
  isGeneratingChart?: boolean
  onRetry?: (messageId: string) => void
  onEdit?: (messageId: string, newContent: string) => void
  onSwitchBranch?: (messageId: string, branchIndex: number) => void
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
          style={{ animationDelay: `${i * 0.2}s`, animationDuration: '1.2s' }}
        />
      ))}
    </div>
  )
}

function AbortedIndicator() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
      <AlertCircle className="w-3.5 h-3.5" />
      <span>Generation stopped - partial content saved</span>
    </div>
  )
}

function StreamingText({ text, isStreaming, enableMarkdown = false }: { text: string; isStreaming: boolean; enableMarkdown?: boolean }) {
  const [displayedText, setDisplayedText] = useState('')
  const prevTextRef = useRef('')

  useEffect(() => {
    if (text.startsWith(prevTextRef.current)) {
      const newText = text.slice(prevTextRef.current.length)
      if (newText) {
        setDisplayedText(prev => prev + newText)
      }
    } else {
      setDisplayedText(text)
    }
    prevTextRef.current = text
  }, [text])

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(text)
    }
  }, [isStreaming, text])

  if (enableMarkdown && !isStreaming) {
    return <MarkdownRenderer content={displayedText} />
  }

  if (enableMarkdown && isStreaming) {
    return <MarkdownRenderer content={displayedText} isStreaming={true} />
  }

  return (
    <span className="whitespace-pre-wrap">
      {displayedText}
      {isStreaming && <span className="streaming-cursor" />}
    </span>
  )
}

function BranchNavigator({ 
  branches, 
  currentIndex, 
  onSwitch 
}: { 
  branches: MessageBranch[]
  currentIndex: number
  onSwitch: (index: number) => void
}) {
  if (branches.length <= 1) return null

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onSwitch(currentIndex - 1)}
        disabled={currentIndex <= 0}
        className={cn(
          'p-1 rounded transition-colors',
          currentIndex > 0 
            ? 'text-muted-foreground hover:text-foreground hover:bg-accent' 
            : 'text-muted-foreground/30 cursor-not-allowed'
        )}
        aria-label="Previous version"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-[10px] text-muted-foreground min-w-[40px] text-center">
        {currentIndex + 1} / {branches.length}
      </span>
      <button
        onClick={() => onSwitch(currentIndex + 1)}
        disabled={currentIndex >= branches.length - 1}
        className={cn(
          'p-1 rounded transition-colors',
          currentIndex < branches.length - 1 
            ? 'text-muted-foreground hover:text-foreground hover:bg-accent' 
            : 'text-muted-foreground/30 cursor-not-allowed'
        )}
        aria-label="Next version"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

function MessageActions({ 
  isUser, 
  onRetry, 
  onEditClick,
  hasBranches,
  branches,
  currentIndex,
  onSwitchBranch
}: { 
  isUser: boolean
  onRetry?: () => void
  onEditClick?: () => void
  hasBranches: boolean
  branches: MessageBranch[]
  currentIndex: number
  onSwitchBranch: (index: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      {hasBranches && (
        <BranchNavigator 
          branches={branches} 
          currentIndex={currentIndex} 
          onSwitch={onSwitchBranch} 
        />
      )}
      {isUser && onEditClick && (
        <button
          type="button"
          onClick={onEditClick}
          className="message-action-btn edit-btn"
          aria-label="Edit message"
        >
          <Pencil className="w-3.5 h-3.5 transition-transform duration-200" />
        </button>
      )}
      {!isUser && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="message-action-btn retry-btn"
          aria-label="Retry generation"
        >
          <RotateCcw className="w-3.5 h-3.5 transition-transform duration-200" />
        </button>
      )}
    </div>
  )
}

function EditBox({ 
  initialContent, 
  onSend, 
  onCancel 
}: { 
  initialContent: string
  onSend: (content: string) => void
  onCancel: () => void
}) {
  const [content, setContent] = useState(initialContent)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(initialContent.length, initialContent.length)
    }
  }, [initialContent.length])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (content.trim()) {
        onSend(content.trim())
      }
    }
    if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full min-h-[60px] max-h-[200px] px-3 py-2 text-sm bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
        placeholder="Edit your message..."
      />
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border border-border"
        >
          <X className="w-3.5 h-3.5" />
          <span>Cancel</span>
        </button>
        <button
          onClick={() => content.trim() && onSend(content.trim())}
          disabled={!content.trim()}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors',
            content.trim()
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </div>
    </div>
  )
}

function ContentBlockRenderer({ 
  block, 
  isStreaming, 
  isGeneratingChart,
  isUser 
}: { 
  block: ContentBlock
  isStreaming: boolean
  isGeneratingChart: boolean
  isUser: boolean
}) {
  switch (block.type) {
    case 'thinking':
      if (!block.thinking) return null
      return (
        <ThinkingBlock 
          thinking={block.thinking} 
          isStreaming={isStreaming} 
        />
      )
    case 'text':
      if (!block.content) return null
      return (
        <div className={cn(
          'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-message-user-bg text-foreground rounded-tr-sm border border-border/50'
            : 'bg-message-ai-bg text-foreground rounded-tl-sm border border-border/50'
        )}>
          <StreamingText 
            text={block.content} 
            isStreaming={isStreaming} 
            enableMarkdown={!isUser}
          />
        </div>
      )
    case 'chart':
      if (!block.chart) return null
      if (isGeneratingChart) {
        return (
          <div className="w-full max-w-md">
            <GraphLoadingPreview />
          </div>
        )
      }
      return (
        <div className="w-full animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <EconChart chart={block.chart} />
        </div>
      )
    case 'analysis':
      if (!block.analysis) return null
      if (isGeneratingChart) {
        return (
          <div className="w-full max-w-md">
            <GraphLoadingPreview />
          </div>
        )
      }
      return (
        <div className="w-full animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <AnalysisCard analysis={block.analysis} />
        </div>
      )
    default:
      return null
  }
}

const ChatMessage = memo(function ChatMessage({ 
  message, 
  isStreaming = false,
  isGeneratingChart = false,
  onRetry,
  onEdit,
  onSwitchBranch
}: Props) {
  const isUser = message.role === 'user'
  const [isEditing, setIsEditing] = useState(false)

  const branches: MessageBranch[] = message.branches || [{
    content: message.content,
    chart: message.chart,
    analysis: message.analysis,
    timestamp: message.timestamp,
    blocks: message.blocks
  }]
  const currentBranchIndex = message.currentBranchIndex ?? 0
  const currentBranch = branches[currentBranchIndex] || branches[0]
  const hasBranches = branches.length > 1

  /**
   * 流式响应时优先使用 message.blocks，否则使用 currentBranch.blocks
   * 这样可以确保重试/编辑时流式内容能正确显示
   */
  const activeBlocks = (isStreaming || message.isLoading) && message.blocks && message.blocks.length > 0
    ? message.blocks
    : currentBranch.blocks
  const hasBlocks = activeBlocks && activeBlocks.length > 0

  const handleRetry = useCallback(() => {
    onRetry?.(message.id)
  }, [message.id, onRetry])

  const handleEditClick = useCallback(() => {
    setIsEditing(true)
  }, [])

  const handleEditSend = useCallback((newContent: string) => {
    setIsEditing(false)
    onEdit?.(message.id, newContent)
  }, [message.id, onEdit])

  const handleEditCancel = useCallback(() => {
    setIsEditing(false)
  }, [])

  const handleSwitchBranch = useCallback((index: number) => {
    onSwitchBranch?.(message.id, index)
  }, [message.id, onSwitchBranch])

  const showActions = !message.isLoading && !isGeneratingChart && !isStreaming
  const showAbortedIndicator = message.isAborted && !isUser

  const renderContent = () => {
    if (isEditing && isUser) {
      return (
        <EditBox 
          initialContent={currentBranch.content || ''} 
          onSend={handleEditSend}
          onCancel={handleEditCancel}
        />
      )
    }

    if (hasBlocks) {
      const hasChartOrAnalysisBlock = activeBlocks!.some(b => b.type === 'chart' || b.type === 'analysis')
      
      return (
        <>
          {activeBlocks!.map((block, index) => {
            const isLastBlock = index === activeBlocks!.length - 1
            const blockIsStreaming = isStreaming && isLastBlock && (block.type === 'text' || block.type === 'thinking')
            const blockIsGeneratingChart = isGeneratingChart && isLastBlock && (block.type === 'chart' || block.type === 'analysis')
            
            return (
              <ContentBlockRenderer
                key={`${block.type}-${index}`}
                block={block}
                isStreaming={blockIsStreaming}
                isGeneratingChart={blockIsGeneratingChart}
                isUser={isUser}
              />
            )
          })}
          {!isUser && isGeneratingChart && !hasChartOrAnalysisBlock && (
            <div className="w-full max-w-md">
              <GraphLoadingPreview />
            </div>
          )}
        </>
      )
    }

    return (
      <>
        {currentBranch.content && (
          <div className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'bg-message-user-bg text-foreground rounded-tr-sm border border-border/50'
              : 'bg-message-ai-bg text-foreground rounded-tl-sm border border-border/50'
          )}>
            <StreamingText 
              text={currentBranch.content} 
              isStreaming={isStreaming && !isGeneratingChart} 
              enableMarkdown={!isUser}
            />
          </div>
        )}

        {!isUser && isGeneratingChart && (
          <div className="w-full max-w-md">
            <GraphLoadingPreview />
          </div>
        )}

        {currentBranch.chart && !isGeneratingChart && (
          <div className="w-full animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            <EconChart chart={currentBranch.chart} />
          </div>
        )}

        {currentBranch.analysis && !isGeneratingChart && (
          <div className="w-full animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            <AnalysisCard analysis={currentBranch.analysis} />
          </div>
        )}
      </>
    )
  }

  return (
    <div className={cn('flex gap-3 w-full', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div className={cn(
        'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5',
        isUser ? 'bg-primary/20' : 'bg-muted'
      )}>
        {isUser
          ? <User className="w-4 h-4 text-primary" />
          : <Bot className="w-4 h-4 text-muted-foreground" />}
      </div>

      <div className={cn(
        'flex flex-col gap-2',
        isUser ? (isEditing ? 'items-end w-full max-w-[95%]' : 'items-end max-w-[80%]') : 'items-start flex-1 min-w-0'
      )}>
        {message.isLoading && !isGeneratingChart && !hasBlocks && (
          <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
            <TypingIndicator />
          </div>
        )}

        {(!message.isLoading || isGeneratingChart) && renderContent()}

        {showAbortedIndicator && (
          <AbortedIndicator />
        )}

        {showActions && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground px-1">
              {format(currentBranch.timestamp, 'HH:mm')}
            </span>
            <MessageActions 
              isUser={isUser}
              onRetry={handleRetry}
              onEditClick={handleEditClick}
              hasBranches={hasBranches}
              branches={branches}
              currentIndex={currentBranchIndex}
              onSwitchBranch={handleSwitchBranch}
            />
          </div>
        )}
      </div>
    </div>
  )
})

export default ChatMessage
