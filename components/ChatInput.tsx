'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Send, Square, FileDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SUPPORTED_COMMANDS } from '@/lib/export'

interface Props {
  onSend: (text: string) => void
  onStop?: () => void
  disabled?: boolean
  isLoading?: boolean
  placeholder?: string
}

export default function ChatInput({ onSend, onStop, disabled, isLoading, placeholder }: Props) {
  const [text, setText] = useState('')
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false)
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const filteredCommands = text.startsWith('/')
    ? SUPPORTED_COMMANDS.filter(cmd =>
        cmd.command.toLowerCase().startsWith(text.toLowerCase())
      )
    : []

  useEffect(() => {
    if (text.startsWith('/') && filteredCommands.length > 0) {
      setShowCommandSuggestions(true)
      setSelectedCommandIndex(0)
    } else {
      setShowCommandSuggestions(false)
    }
  }, [text, filteredCommands.length])

  const handleCommandSelect = useCallback((command: string) => {
    setText(command + ' ')
    setShowCommandSuggestions(false)
    textareaRef.current?.focus()
  }, [])

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
    setShowCommandSuggestions(false)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [text, disabled, onSend])

  const handleStop = useCallback(() => {
    onStop?.()
  }, [onStop])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommandSuggestions && filteredCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedCommandIndex(prev =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        )
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedCommandIndex(prev =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        )
        return
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault()
        handleCommandSelect(filteredCommands[selectedCommandIndex].command)
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setShowCommandSuggestions(false)
        return
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px'
  }

  return (
    <div className="relative">
      {showCommandSuggestions && filteredCommands.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50">
          {filteredCommands.map((cmd, index) => (
            <button
              key={cmd.command}
              onClick={() => handleCommandSelect(cmd.command)}
              className={cn(
                'w-full px-4 py-3 text-left flex items-start gap-3 transition-colors',
                index === selectedCommandIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50'
              )}
            >
              <FileDown className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{cmd.command}</div>
                <div className="text-xs text-muted-foreground">{cmd.description}</div>
              </div>
            </button>
          ))}
          <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border bg-muted/30">
            Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Tab</kbd> OR <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Enter</kbd> to select · <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> to close
          </div>
        </div>
      )}
      <div className={cn(
        'flex items-end gap-2 rounded-xl border border-border bg-input px-4 py-3 transition-all',
        'focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20'
      )}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Ask an economics question... (输入 / 查看命令)'}
          disabled={disabled}
          rows={1}
          className={cn(
            'flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground',
            'outline-none leading-relaxed min-h-[24px] max-h-[180px]',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label="Chat input"
        />
        <button
          onClick={isLoading ? handleStop : handleSend}
          disabled={disabled || (!isLoading && !text.trim())}
          aria-label={isLoading ? 'Stop generation' : 'Send message'}
          className={cn(
            'shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all',
            isLoading
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-95'
              : disabled || !text.trim()
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95'
          )}
        >
          {isLoading
            ? <Square className="w-4 h-4 fill-current" />
            : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
