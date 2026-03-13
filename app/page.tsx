'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Settings, Menu, X, BarChart2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { cn } from '@/lib/utils'
import SessionSidebar from '@/components/SessionSidebar'
import ChatArea from '@/components/ChatArea'
import SettingsModal from '@/components/SettingsModal'
import {
  getSessions, saveSession, deleteSession, clearAllSessions,
  getMessages, saveMessage, deleteSessionMessages, getApiSettings
} from '@/lib/storage'
import { sendMessageStream } from '@/lib/ai-service'
import { exportChat, parseSlashCommand, parseExportCommand, exportDebugData } from '@/lib/export'
import type { Session, Message, ApiSettings, MessageBranch, ContentBlock, ChartData, EffectAnalysis } from '@/lib/types'
import { DEFAULT_MODEL } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'

function generateSessionTitle(text: string): string {
  const trimmed = text.trim()
  if (trimmed.length <= 40) return trimmed
  return trimmed.substring(0, 38) + '...'
}

function clearAllBranches(messages: Message[]): Message[] {
  return messages.map(m => {
    const { branches, currentBranchIndex, ...rest } = m
    return rest
  })
}

export default function HomePage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [apiSettings, setApiSettings] = useState<ApiSettings | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isGeneratingChart, setIsGeneratingChart] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const isInitialized = useRef(false)
  const isCreatingSession = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    const settings = getApiSettings()
    setApiSettings(settings)

    getSessions().then(s => {
      setSessions(s)
    })
  }, [])

  useEffect(() => {
    if (!currentSessionId) {
      setMessages([])
      return
    }
    if (isCreatingSession.current) {
      isCreatingSession.current = false
      return
    }
    getMessages(currentSessionId).then(msgs => {
      setMessages(msgs)
    })
  }, [currentSessionId])

  const handleNewChat = useCallback(() => {
    setCurrentSessionId(null)
    setMessages([])
  }, [])

  const handleSelectSession = useCallback((id: string) => {
    setCurrentSessionId(id)
  }, [])

  const handleDeleteSession = useCallback(async (id: string) => {
    await deleteSessionMessages(id)
    await deleteSession(id)
    const updated = await getSessions()
    setSessions(updated)
    if (currentSessionId === id) {
      setCurrentSessionId(null)
      setMessages([])
    }
  }, [currentSessionId])

  const handleClearAll = useCallback(async () => {
    await clearAllSessions()
    setSessions([])
    setCurrentSessionId(null)
    setMessages([])
  }, [])

  const handleSaveSettings = useCallback((settings: ApiSettings) => {
    setApiSettings(settings)
    toast({ description: 'API settings saved successfully.' })
  }, [toast])

  /**
   * 生成AI回复
   * @param sessionId - 会话ID
   * @param userMessageId - 用户消息ID
   * @param userText - 用户消息内容
   * @param assistantId - AI消息ID
   * @param existingMessages - 现有消息列表
   * @param isBranch - 是否为分支操作（重试/编辑）
   */
  const generateAssistantResponse = useCallback(async (
    sessionId: string,
    userMessageId: string,
    userText: string,
    assistantId: string,
    existingMessages: Message[],
    isBranch: boolean = false
  ) => {
    if (!apiSettings?.apiKey) return

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    let contextMessages: Message[]
    if (isBranch) {
      const userMsgIndex = existingMessages.findIndex(m => m.id === userMessageId)
      if (userMsgIndex === -1) {
        contextMessages = existingMessages
      } else {
        contextMessages = existingMessages.slice(0, userMsgIndex + 1)
      }
    } else {
      contextMessages = existingMessages
    }

    try {
      await sendMessageStream(
        contextMessages,
        userText,
        apiSettings,
        {
          onThinkingChunk: (chunk) => {
            setMessages(prev => prev.map(m => {
              if (m.id !== assistantId) return m
              const currentBlocks = m.blocks || []
              const lastBlock = currentBlocks[currentBlocks.length - 1]
              if (lastBlock?.type === 'thinking' && lastBlock.thinking) {
                const updatedBlocks = [...currentBlocks]
                updatedBlocks[updatedBlocks.length - 1] = {
                  ...lastBlock,
                  thinking: {
                    ...lastBlock.thinking,
                    content: lastBlock.thinking.content + chunk,
                    isStreaming: true
                  }
                }
                return { ...m, blocks: updatedBlocks, isLoading: false }
              }
              return {
                ...m,
                blocks: [...currentBlocks, { 
                  type: 'thinking' as const, 
                  thinking: { content: chunk, isStreaming: true } 
                }],
                isLoading: false
              }
            }))
          },
          onTextChunk: (chunk) => {
            setMessages(prev => prev.map(m => {
              if (m.id !== assistantId) return m
              const currentBlocks = m.blocks || []
              const lastBlock = currentBlocks[currentBlocks.length - 1]
              if (lastBlock?.type === 'text') {
                const updatedBlocks = [...currentBlocks]
                updatedBlocks[updatedBlocks.length - 1] = {
                  ...lastBlock,
                  content: (lastBlock.content || '') + chunk
                }
                return { ...m, blocks: updatedBlocks, isLoading: false }
              }
              return {
                ...m,
                blocks: [...currentBlocks, { type: 'text' as const, content: chunk }],
                isLoading: false
              }
            }))
          },
          onToolCallDetected: () => {
            console.log('[DEBUG] onToolCallDetected')
            setIsGeneratingChart(true)
          },
          onContentBlockAdded: (block, blocks) => {
            console.log('[DEBUG] onContentBlockAdded:', { blockType: block.type, blocksLength: blocks.length, blockTypes: blocks.map(b => b.type) })
            setMessages(prev => prev.map(m => 
              m.id === assistantId 
                ? { ...m, blocks: [...blocks], isLoading: false }
                : m
            ))
            if (block.type === 'chart' || block.type === 'analysis') {
              console.log('[DEBUG] Setting isGeneratingChart to false')
              setIsGeneratingChart(false)
            }
          },
          onComplete: async (result: { text: string; blocks: ContentBlock[]; chart?: ChartData; analysis?: EffectAnalysis }) => {
            setStreamingMessageId(null)
            setIsGeneratingChart(false)

            const finalBlocks = result.blocks.map(block => {
              if (block.type === 'thinking' && block.thinking) {
                return {
                  ...block,
                  thinking: {
                    ...block.thinking,
                    isStreaming: false
                  }
                }
              }
              return block
            })

            setMessages(prev => {
              const existingMessage = prev.find(m => m.id === assistantId)
              if (!existingMessage) return prev

              /**
               * 更新分支：如果有分支，更新当前分支索引对应的内容
               */
              let updatedBranches = existingMessage.branches
              if (existingMessage.branches && existingMessage.currentBranchIndex !== undefined) {
                const branchIndex = existingMessage.currentBranchIndex
                updatedBranches = existingMessage.branches.map((branch, idx) => {
                  if (idx === branchIndex) {
                    return {
                      content: result.text || undefined,
                      chart: result.chart,
                      analysis: result.analysis,
                      timestamp: Date.now(),
                      blocks: finalBlocks
                    }
                  }
                  return branch
                })
              }

              const finalMessage: Message = {
                id: assistantId,
                sessionId,
                role: 'assistant',
                content: result.text || undefined,
                chart: result.chart,
                analysis: result.analysis,
                timestamp: Date.now(),
                isLoading: false,
                blocks: finalBlocks,
                branches: updatedBranches,
                currentBranchIndex: existingMessage.currentBranchIndex
              }

              saveMessage(finalMessage)
              return prev.map(m => 
                m.id === assistantId ? finalMessage : m
              )
            })

            const sessionUpdate: Session = {
              id: sessionId,
              title: sessions.find(s => s.id === sessionId)?.title || generateSessionTitle(userText),
              createdAt: sessions.find(s => s.id === sessionId)?.createdAt || Date.now(),
              updatedAt: Date.now(),
              preview: result.text?.substring(0, 60) || `Chart: ${result.chart?.title || 'Economics chart'}`
            }
            await saveSession(sessionUpdate)
            setSessions(prev => [sessionUpdate, ...prev.filter(s => s.id !== sessionId)])
            setIsLoading(false)
          },
          onError: (error) => {
            setStreamingMessageId(null)
            setIsGeneratingChart(false)
            setIsLoading(false)

            const errorMsg: Message = {
              id: assistantId,
              sessionId,
              role: 'assistant',
              content: `Error: ${error.message}. Please check your API key and endpoint in Settings.`,
              timestamp: Date.now()
            }
            saveMessage(errorMsg)
            setMessages(prev => prev.map(m => 
              m.id === assistantId ? errorMsg : m
            ))
            toast({
              title: 'Request failed',
              description: error.message,
              variant: 'destructive'
            })
          },
          onAbort: async (result) => {
            setStreamingMessageId(null)
            setIsGeneratingChart(false)
            setIsLoading(false)

            const finalBlocks = result.blocks.map(block => {
              if (block.type === 'thinking' && block.thinking) {
                return {
                  ...block,
                  thinking: {
                    ...block.thinking,
                    isStreaming: false
                  }
                }
              }
              return block
            })

            const abortedMessage: Message = {
              id: assistantId,
              sessionId,
              role: 'assistant',
              content: result.text || undefined,
              chart: result.chart,
              analysis: result.analysis,
              timestamp: Date.now(),
              isLoading: false,
              isAborted: true,
              blocks: finalBlocks
            }

            await saveMessage(abortedMessage)
            setMessages(prev => prev.map(m => 
              m.id === assistantId ? abortedMessage : m
            ))

            toast({
              description: 'Generation stopped. Partial content has been saved.',
            })
          }
        },
        sessionId,
        abortController.signal
      )
    } catch (err) {
      setStreamingMessageId(null)
      setIsGeneratingChart(false)
      setIsLoading(false)

      const errorMsg: Message = {
        id: assistantId,
        sessionId,
        role: 'assistant',
        content: `Error: ${(err as Error).message}. Please check your API key and endpoint in Settings.`,
        timestamp: Date.now()
      }
      await saveMessage(errorMsg)
      setMessages(prev => prev.map(m => 
        m.id === assistantId ? errorMsg : m
      ))
      toast({
        title: 'Request failed',
        description: (err as Error).message,
        variant: 'destructive'
      })
    }
  }, [apiSettings, sessions, toast])

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setStreamingMessageId(null)
    setIsGeneratingChart(false)
    setIsLoading(false)
  }, [])

  const handleSend = useCallback(async (userText: string) => {
    const command = parseSlashCommand(userText)
    if (command === '/export') {
      const options = parseExportCommand(userText)
      const currentSession = sessions.find(s => s.id === currentSessionId) || null
      const success = exportChat(currentSession, messages, options)
      if (success) {
        toast({
          description: `聊天记录已导出为 ${options.format.toUpperCase()} 格式`
        })
      } else {
        toast({
          title: '导出失败',
          description: '请稍后重试',
          variant: 'destructive'
        })
      }
      return
    }

    if (command === '/debug') {
      const success = exportDebugData(currentSessionId)
      if (success) {
        toast({
          description: '原始 HTTP 请求数据已导出'
        })
      } else {
        toast({
          title: '导出失败',
          description: '请稍后重试',
          variant: 'destructive'
        })
      }
      return
    }

    if (!apiSettings?.apiKey || isLoading) return

    let sessionId = currentSessionId

    if (!sessionId) {
      sessionId = uuidv4()
      const newSession: Session = {
        id: sessionId,
        title: generateSessionTitle(userText),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        preview: userText.substring(0, 60)
      }
      await saveSession(newSession)
      isCreatingSession.current = true
      setCurrentSessionId(sessionId)
      setSessions(prev => [newSession, ...prev])
    }

    setMessages(prev => {
      const cleared = clearAllBranches(prev)
      return cleared
    })

    const userMessage: Message = {
      id: uuidv4(),
      sessionId,
      role: 'user',
      content: userText,
      timestamp: Date.now()
    }
    await saveMessage(userMessage)
    setMessages(prev => [...prev, userMessage])

    const assistantId = uuidv4()
    const assistantMessage: Message = {
      id: assistantId,
      sessionId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isLoading: true
    }
    setMessages(prev => [...prev, assistantMessage])
    setStreamingMessageId(assistantId)
    setIsLoading(true)

    const allMessages = await getMessages(sessionId)
    await generateAssistantResponse(sessionId, userMessage.id, userText, assistantId, allMessages)
  }, [apiSettings, isLoading, currentSessionId, sessions, messages, generateAssistantResponse, toast])

  /**
   * 处理消息重试
   * 重新生成AI回复，创建新的消息分支
   * @param messageId - 要重试的AI消息ID
   */
  const handleRetry = useCallback(async (messageId: string) => {
    if (!apiSettings?.apiKey || isLoading || !currentSessionId) return

    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex === -1) {
      toast({ title: '重试失败', description: '找不到该消息', variant: 'destructive' })
      return
    }

    const assistantMessage = messages[messageIndex]
    if (assistantMessage.role !== 'assistant') {
      toast({ title: '重试失败', description: '只能重试AI消息', variant: 'destructive' })
      return
    }

    const userMessageIndex = messageIndex - 1
    if (userMessageIndex < 0 || messages[userMessageIndex].role !== 'user') {
      toast({ title: '重试失败', description: '找不到对应的用户消息', variant: 'destructive' })
      return
    }

    const userMessage = messages[userMessageIndex]

    setIsLoading(true)

    const currentBranch: MessageBranch = {
      content: assistantMessage.content,
      chart: assistantMessage.chart,
      analysis: assistantMessage.analysis,
      timestamp: assistantMessage.timestamp,
      blocks: assistantMessage.blocks
    }

    const existingBranches = assistantMessage.branches || [currentBranch]
    const newBranchIndex = existingBranches.length

    const placeholderBranch: MessageBranch = {
      content: '',
      timestamp: Date.now()
    }

    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        return {
          ...m,
          branches: [...existingBranches, placeholderBranch],
          currentBranchIndex: newBranchIndex,
          isLoading: true,
          content: '',
          chart: undefined,
          analysis: undefined,
          blocks: undefined
        }
      }
      return m
    }))

    setStreamingMessageId(messageId)

    const contextMessages = messages.slice(0, messageIndex)
    await generateAssistantResponse(currentSessionId, userMessage.id, userMessage.content || '', messageId, contextMessages, true)
  }, [apiSettings, isLoading, currentSessionId, messages, generateAssistantResponse, toast])

  /**
   * 处理编辑用户消息
   * 编辑用户消息后重新生成AI回复
   * @param messageId - 要编辑的用户消息ID
   * @param newContent - 新的消息内容
   */
  const handleEdit = useCallback(async (messageId: string, newContent: string) => {
    if (!apiSettings?.apiKey || isLoading || !currentSessionId) return

    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex === -1) {
      toast({ title: '编辑失败', description: '找不到该消息', variant: 'destructive' })
      return
    }

    const userMessage = messages[messageIndex]
    if (userMessage.role !== 'user') {
      toast({ title: '编辑失败', description: '只能编辑用户消息', variant: 'destructive' })
      return
    }

    const assistantMessageIndex = messageIndex + 1
    if (assistantMessageIndex >= messages.length || messages[assistantMessageIndex].role !== 'assistant') {
      toast({ title: '编辑失败', description: '找不到对应的AI回复', variant: 'destructive' })
      return
    }

    const assistantMessage = messages[assistantMessageIndex]

    setIsLoading(true)

    const currentUserBranch: MessageBranch = {
      content: userMessage.content,
      timestamp: userMessage.timestamp
    }

    const existingUserBranches = userMessage.branches || [currentUserBranch]
    const newUserBranchIndex = existingUserBranches.length

    const currentAssistantBranch: MessageBranch = {
      content: assistantMessage.content,
      chart: assistantMessage.chart,
      analysis: assistantMessage.analysis,
      timestamp: assistantMessage.timestamp,
      blocks: assistantMessage.blocks
    }
    const existingAssistantBranches = assistantMessage.branches || [currentAssistantBranch]
    const newAssistantBranchIndex = existingAssistantBranches.length

    const placeholderUserBranch: MessageBranch = {
      content: newContent,
      timestamp: Date.now()
    }

    const placeholderAssistantBranch: MessageBranch = {
      content: '',
      timestamp: Date.now()
    }

    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        return {
          ...m,
          branches: [...existingUserBranches, placeholderUserBranch],
          currentBranchIndex: newUserBranchIndex,
          content: newContent,
          timestamp: Date.now()
        }
      }
      if (m.id === assistantMessage.id) {
        return {
          ...m,
          branches: [...existingAssistantBranches, placeholderAssistantBranch],
          currentBranchIndex: newAssistantBranchIndex,
          isLoading: true,
          content: '',
          chart: undefined,
          analysis: undefined,
          blocks: undefined
        }
      }
      return m
    }))

    setStreamingMessageId(assistantMessage.id)

    const contextMessages = messages.slice(0, messageIndex)
    await generateAssistantResponse(currentSessionId, messageId, newContent, assistantMessage.id, contextMessages, true)

    setMessages(prev => {
      const updatedMessages = prev.map(m => {
        if (m.id === messageId) {
          const currentBranches = m.branches || []
          const updatedBranches = currentBranches.map((branch, idx) => {
            if (idx === newUserBranchIndex) {
              return {
                content: newContent,
                timestamp: Date.now()
              }
            }
            return branch
          })
          const savedUserMessage = {
            ...m,
            branches: updatedBranches
          }
          saveMessage(savedUserMessage)
          return savedUserMessage
        }
        return m
      })
      return updatedMessages
    })
  }, [apiSettings, isLoading, currentSessionId, messages, generateAssistantResponse, toast])

  /**
   * 处理分支切换
   * 切换消息分支，同时同步关联消息的分支
   * @param messageId - 消息ID
   * @param branchIndex - 目标分支索引
   */
  const handleSwitchBranch = useCallback(async (messageId: string, branchIndex: number) => {
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex === -1) return

    const message = messages[messageIndex]
    if (!message || !message.branches) return

    const branch = message.branches[branchIndex]
    if (!branch) return

    const isUserMessage = message.role === 'user'
    let pairedMessageIndex = -1
    let pairedMessage: Message | undefined

    if (isUserMessage && messageIndex + 1 < messages.length) {
      pairedMessageIndex = messageIndex + 1
      pairedMessage = messages[pairedMessageIndex]
      if (pairedMessage.role !== 'assistant') {
        pairedMessage = undefined
        pairedMessageIndex = -1
      }
    } else if (!isUserMessage && messageIndex - 1 >= 0) {
      pairedMessageIndex = messageIndex - 1
      pairedMessage = messages[pairedMessageIndex]
      if (pairedMessage.role !== 'user') {
        pairedMessage = undefined
        pairedMessageIndex = -1
      }
    }

    setMessages(prev => {
      let savedMessage: Message | null = null
      let savedPairedMessage: Message | null = null

      const updatedMessages = prev.map((m, idx) => {
        if (m.id === messageId) {
          savedMessage = {
            ...m,
            content: branch.content,
            chart: branch.chart,
            analysis: branch.analysis,
            blocks: branch.blocks,
            currentBranchIndex: branchIndex
          }
          return savedMessage
        }

        if (pairedMessage && m.id === pairedMessage.id && pairedMessage.branches && pairedMessage.branches.length > branchIndex) {
          const pairedBranch = pairedMessage.branches[branchIndex]
          if (pairedBranch) {
            savedPairedMessage = {
              ...m,
              content: pairedBranch.content,
              chart: pairedBranch.chart,
              analysis: pairedBranch.analysis,
              blocks: pairedBranch.blocks,
              currentBranchIndex: branchIndex
            }
            return savedPairedMessage
          }
        }

        return m
      })

      if (savedMessage) {
        saveMessage(savedMessage)
      }
      if (savedPairedMessage) {
        saveMessage(savedPairedMessage)
      }

      return updatedMessages
    })
  }, [messages])

  const currentModel = apiSettings?.model || DEFAULT_MODEL

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <aside
        className={cn(
          'hidden md:flex flex-col transition-all duration-300 shrink-0',
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        )}
      >
        <SessionSidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onNewChat={handleNewChat}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          onClearAll={handleClearAll}
        />
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-50 w-72 md:hidden flex flex-col transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SessionSidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onNewChat={() => { handleNewChat(); setSidebarOpen(false) }}
          onSelectSession={(id) => { handleSelectSession(id); setSidebarOpen(false) }}
          onDeleteSession={handleDeleteSession}
          onClearAll={handleClearAll}
        />
      </aside>

      <main className="flex flex-col flex-1 min-w-0 h-full">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 bg-background/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className={cn(
              "flex items-center gap-2 transition-opacity duration-300",
              sidebarOpen ? "opacity-0 hidden md:hidden" : "opacity-100"
            )}>
              <BarChart2 className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm text-foreground">EconGrapher</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">
              AP Micro &amp; Macro Economics
            </span>
            <button
              onClick={() => setSettingsOpen(true)}
              className={cn(
                'group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 cursor-pointer border',
                apiSettings?.apiKey
                  ? 'text-muted-foreground border-border hover:text-primary hover:bg-primary/10 hover:border-primary/50 hover:shadow-md hover:scale-[1.02] active:scale-95'
                  : 'text-primary bg-primary/15 border-primary/30 hover:bg-primary/25 hover:shadow-md hover:scale-[1.02] active:scale-95'
              )}
              aria-label="Open settings"
            >
              <Settings className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-45" />
              <span>{apiSettings?.apiKey ? 'Settings' : 'Set API Key'}</span>
            </button>
          </div>
        </header>

        <div className="flex-1 min-h-0">
          <ChatArea
            messages={messages}
            isLoading={isLoading}
            apiSettings={apiSettings}
            currentModel={currentModel}
            onSend={handleSend}
            onStop={handleStop}
            onOpenSettings={() => setSettingsOpen(true)}
            streamingMessageId={streamingMessageId}
            isGeneratingChart={isGeneratingChart}
            onRetry={handleRetry}
            onEdit={handleEdit}
            onSwitchBranch={handleSwitchBranch}
          />
        </div>
      </main>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSaveSettings}
      />

      <Toaster />
    </div>
  )
}
