'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { BarChart2, Sparkles } from 'lucide-react'
import type { Message, ApiSettings } from '@/lib/types'
import { PRESET_QUESTIONS } from '@/lib/types'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import { ScrollArea } from '@/components/ui/scroll-area'

const SCROLL_THRESHOLD = 100

function getRandomQuestions(questions: string[], count: number): string[] {
  const shuffled = [...questions].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

interface Props {
  messages: Message[]
  isLoading: boolean
  apiSettings: ApiSettings | null
  currentModel: string
  onSend: (text: string) => void
  onStop?: () => void
  onOpenSettings: () => void
  streamingMessageId?: string | null
  isGeneratingChart?: boolean
  onRetry?: (messageId: string) => void
  onEdit?: (messageId: string, newContent: string) => void
  onSwitchBranch?: (messageId: string, branchIndex: number) => void
}

function WelcomeScreen({ onPreset, onOpenSettings, hasApiKey }: {
  onPreset: (q: string) => void
  onOpenSettings: () => void
  hasApiKey: boolean
}) {
  const [randomQuestions, setRandomQuestions] = useState<string[]>([])

  useEffect(() => {
    setRandomQuestions(getRandomQuestions(PRESET_QUESTIONS, 6))
  }, [])

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-8 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/15 border border-primary/20 mb-4">
        <BarChart2 className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-foreground text-balance mb-2">EconGrapher</h1>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed text-pretty mb-6">
        Generate professional AP Economics charts through natural language. 
        Ask about supply &amp; demand, AD-AS, cost curves, monetary policy, and more.
      </p>

      {!hasApiKey && (
        <button
          onClick={onOpenSettings}
          className="mb-6 px-4 py-2 rounded-lg bg-primary/15 border border-primary/30 text-primary text-sm hover:bg-primary/25 transition-colors flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Configure API Key to get started
        </button>
      )}

      <div className="w-full max-w-xl">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3 font-medium">Try an example</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {randomQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => onPreset(q)}
              className="example-btn"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ChatArea({
  messages,
  isLoading,
  apiSettings,
  currentModel,
  onSend,
  onStop,
  onOpenSettings,
  streamingMessageId,
  isGeneratingChart,
  onRetry,
  onEdit,
  onSwitchBranch
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)
  const visibleMessages = messages.filter(m => !m.id.startsWith('_'))

  const checkIfNearBottom = useCallback(() => {
    const viewport = scrollViewportRef.current
    if (!viewport) return true
    
    const { scrollTop, scrollHeight, clientHeight } = viewport
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    return distanceFromBottom < SCROLL_THRESHOLD
  }, [])

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const viewport = scrollViewportRef.current
    if (viewport) {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior
      })
    }
  }, [])

  const handleScroll = useCallback(() => {
    isNearBottomRef.current = checkIfNearBottom()
  }, [checkIfNearBottom])

  useEffect(() => {
    const viewport = scrollViewportRef.current
    if (!viewport) return

    viewport.addEventListener('scroll', handleScroll)
    return () => viewport.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom('smooth')
    }
  }, [messages, scrollToBottom])

  return (
    <div className="flex flex-col h-full min-h-0">
      <ScrollArea className="flex-1 h-full min-h-0" viewportRef={scrollViewportRef}>
        <div className="max-w-3xl mx-auto w-full">
          {visibleMessages.length === 0 ? (
            <WelcomeScreen
              onPreset={onSend}
              onOpenSettings={onOpenSettings}
              hasApiKey={!!apiSettings?.apiKey}
            />
          ) : (
            <div className="flex flex-col gap-5 px-4 py-6">
              {visibleMessages.map(message => (
                <ChatMessage 
                  key={message.id} 
                  message={message}
                  isStreaming={message.id === streamingMessageId}
                  isGeneratingChart={message.id === streamingMessageId && isGeneratingChart}
                  onRetry={onRetry}
                  onEdit={onEdit}
                  onSwitchBranch={onSwitchBranch}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border bg-background/95 backdrop-blur-sm px-4 py-3">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-2">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
            <span>
              {apiSettings?.apiKey
                ? <>Using <span className="text-primary font-mono">{currentModel}</span></>
                : <button onClick={onOpenSettings} className="text-primary hover:underline">Set API key to start</button>
              }
            </span>
            <span>Shift+Enter for new line</span>
          </div>
          <ChatInput
            onSend={onSend}
            onStop={onStop}
            disabled={!apiSettings?.apiKey}
            isLoading={isLoading}
            placeholder={
              !apiSettings?.apiKey
                ? 'Configure your API key first...'
                : 'Ask an economics question, e.g. "Show supply and demand with a price ceiling"'
            }
          />
        </div>
      </div>
    </div>
  )
}
