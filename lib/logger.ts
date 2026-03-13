/**
 * AI服务日志系统
 * @module lib/logger
 * @description 提供详细的日志跟踪功能，记录AI请求、响应、工具调用等关键信息
 */

import type { FormattedMessage, ContentPart } from './api-format-adapter'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  category: string
  message: string
  data?: unknown
  duration?: number
  sessionId?: string
  requestId?: string
}

interface LoggerConfig {
  enabled: boolean
  minLevel: LogLevel
  persistToStorage: boolean
  maxStoredLogs: number
  consoleOutput: boolean
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

const STORAGE_KEY = 'econgrapher_ai_logs'

class AILogger {
  private config: LoggerConfig = {
    enabled: true,
    minLevel: 'debug',
    persistToStorage: true,
    maxStoredLogs: 500,
    consoleOutput: true
  }

  private currentSessionId: string | null = null
  private currentRequestId: string | null = null
  private requestStartTime: number | null = null

  /**
   * 生成唯一ID
   * @returns 唯一标识符
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 格式化时间戳
   * @returns ISO格式的时间戳
   */
  private getTimestamp(): string {
    return new Date().toISOString()
  }

  /**
   * 获取日志级别对应的控制台样式
   * @param level - 日志级别
   * @returns CSS样式字符串
   */
  private getLevelStyle(level: LogLevel): string {
    const styles: Record<LogLevel, string> = {
      debug: 'color: #6B7280; font-weight: normal',
      info: 'color: #3B82F6; font-weight: bold',
      warn: 'color: #F59E0B; font-weight: bold',
      error: 'color: #EF4444; font-weight: bold'
    }
    return styles[level]
  }

  /**
   * 获取日志级别对应的前缀图标
   * @param level - 日志级别
   * @returns 图标字符串
   */
  private getLevelIcon(level: LogLevel): string {
    const icons: Record<LogLevel, string> = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌'
    }
    return icons[level]
  }

  /**
   * 检查日志级别是否应该输出
   * @param level - 要检查的日志级别
   * @returns 是否应该输出
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.minLevel]
  }

  /**
   * 从localStorage获取存储的日志
   * @returns 日志条目数组
   */
  private getStoredLogs(): LogEntry[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  /**
   * 将日志保存到localStorage
   * @param entry - 日志条目
   */
  private saveToStorage(entry: LogEntry): void {
    if (!this.config.persistToStorage) return

    try {
      const logs = this.getStoredLogs()
      logs.push(entry)

      if (logs.length > this.config.maxStoredLogs) {
        logs.splice(0, logs.length - this.config.maxStoredLogs)
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
    } catch (e) {
      console.warn('[AI Logger] Failed to save log to storage:', e)
    }
  }

  /**
   * 输出日志到控制台
   * @param entry - 日志条目
   */
  private logToConsole(entry: LogEntry): void {
    if (!this.config.consoleOutput) return

    const icon = this.getLevelIcon(entry.level)
    const style = this.getLevelStyle(entry.level)
    const prefix = `${icon} [AI Logger] [${entry.category}]`

    const consoleMethod = entry.level === 'error' ? console.error :
                          entry.level === 'warn' ? console.warn :
                          entry.level === 'debug' ? console.debug : console.log

    consoleMethod(
      `%c${prefix}`,
      style,
      entry.message,
      entry.data !== undefined ? '\n📦 Data:' : '',
      entry.data !== undefined ? entry.data : '',
      entry.duration !== undefined ? `\n⏱️ Duration: ${entry.duration}ms` : '',
      entry.requestId ? `\n🔗 Request ID: ${entry.requestId}` : '',
      entry.sessionId ? `\n💬 Session: ${entry.sessionId}` : ''
    )
  }

  /**
   * 记录日志
   * @param level - 日志级别
   * @param category - 日志分类
   * @param message - 日志消息
   * @param data - 附加数据
   * @param duration - 持续时间（毫秒）
   */
  log(level: LogLevel, category: string, message: string, data?: unknown, duration?: number): void {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: this.getTimestamp(),
      level,
      category,
      message,
      data,
      duration,
      sessionId: this.currentSessionId || undefined,
      requestId: this.currentRequestId || undefined
    }

    this.logToConsole(entry)
    this.saveToStorage(entry)
  }

  /**
   * 记录调试级别日志
   * @param category - 日志分类
   * @param message - 日志消息
   * @param data - 附加数据
   * @param duration - 持续时间（毫秒）
   */
  debug(category: string, message: string, data?: unknown, duration?: number): void {
    this.log('debug', category, message, data, duration)
  }

  /**
   * 记录信息级别日志
   * @param category - 日志分类
   * @param message - 日志消息
   * @param data - 附加数据
   * @param duration - 持续时间（毫秒）
   */
  info(category: string, message: string, data?: unknown, duration?: number): void {
    this.log('info', category, message, data, duration)
  }

  /**
   * 记录警告级别日志
   * @param category - 日志分类
   * @param message - 日志消息
   * @param data - 附加数据
   * @param duration - 持续时间（毫秒）
   */
  warn(category: string, message: string, data?: unknown, duration?: number): void {
    this.log('warn', category, message, data, duration)
  }

  /**
   * 记录错误级别日志
   * @param category - 日志分类
   * @param message - 日志消息
   * @param data - 附加数据
   * @param duration - 持续时间（毫秒）
   */
  error(category: string, message: string, data?: unknown, duration?: number): void {
    this.log('error', category, message, data, duration)
  }

  /**
   * 开始一个新的请求跟踪
   * @param sessionId - 会话ID
   * @returns 请求ID
   */
  startRequest(sessionId?: string): string {
    this.currentSessionId = sessionId || null
    this.currentRequestId = this.generateId()
    this.requestStartTime = Date.now()

    this.info('REQUEST', 'Starting new AI request', {
      sessionId: this.currentSessionId,
      requestId: this.currentRequestId
    })

    return this.currentRequestId
  }

  /**
   * 结束当前请求跟踪
   */
  endRequest(): void {
    if (this.requestStartTime) {
      const duration = Date.now() - this.requestStartTime
      this.info('REQUEST', 'Request completed', { duration }, duration)
    }
    this.requestStartTime = null
  }

  /**
   * 记录API请求详情
   * @param endpoint - API端点
   * @param model - 模型名称
   * @param messageCount - 消息数量
   * @param userContent - 用户输入内容
   */
  logApiRequest(endpoint: string, model: string, messageCount: number, userContent: string): void {
    this.info('API_REQUEST', 'Sending API request', {
      endpoint,
      model,
      messageCount,
      userContentLength: userContent.length,
      userContentPreview: userContent.substring(0, 200) + (userContent.length > 200 ? '...' : '')
    })
  }

  /**
   * 记录API响应详情
   * @param statusCode - HTTP状态码
   * @param hasToolCalls - 是否有工具调用
   * @param hasContent - 是否有文本内容
   */
  logApiResponse(statusCode: number, hasToolCalls: boolean, hasContent: boolean): void {
    const duration = this.requestStartTime ? Date.now() - this.requestStartTime : undefined
    this.info('API_RESPONSE', 'Received API response', {
      statusCode,
      hasToolCalls,
      hasContent,
      duration
    }, duration)
  }

  /**
   * 记录流式响应开始
   */
  logStreamStart(): void {
    this.info('STREAM', 'Started streaming response')
  }

  /**
   * 记录流式响应数据块
   * @param chunkIndex - 数据块索引
   * @param content - 内容片段
   */
  logStreamChunk(chunkIndex: number, content: string): void {
    this.debug('STREAM', `Received chunk #${chunkIndex}`, {
      contentLength: content.length,
      contentPreview: content.substring(0, 50)
    })
  }

  /**
   * 记录流式响应结束
   * @param totalChunks - 总数据块数
   * @param totalContent - 总内容长度
   */
  logStreamEnd(totalChunks: number, totalContent: number): void {
    const duration = this.requestStartTime ? Date.now() - this.requestStartTime : undefined
    this.info('STREAM', 'Stream completed', {
      totalChunks,
      totalContentLength: totalContent,
      duration
    }, duration)
  }

  /**
   * 记录工具调用检测
   */
  logToolCallDetected(): void {
    this.info('TOOL_CALL', 'Tool call detected in response')
  }

  /**
   * 记录工具调用详情
   * @param toolName - 工具名称
   * @param args - 工具参数
   */
  logToolCall(toolName: string, args: unknown): void {
    this.info('TOOL_CALL', `Executing tool: ${toolName}`, {
      toolName,
      argsPreview: JSON.stringify(args).substring(0, 500)
    })
  }

  /**
   * 记录工具调用结果
   * @param toolName - 工具名称
   * @param success - 是否成功
   * @param result - 结果数据
   */
  logToolCallResult(toolName: string, success: boolean, result?: unknown): void {
    const level: LogLevel = success ? 'info' : 'error'
    this.log(level, 'TOOL_CALL', `Tool ${toolName} ${success ? 'completed' : 'failed'}`, {
      toolName,
      success,
      resultType: result ? typeof result : 'undefined'
    })
  }

  /**
   * 记录图表生成
   * @param chartType - 图表类型
   * @param chartTitle - 图表标题
   */
  logChartGenerated(chartType: string, chartTitle: string): void {
    this.info('CHART', 'Chart generated successfully', {
      chartType,
      chartTitle
    })
  }

  /**
   * 记录分析结果
   * @param analysis - 分析数据
   */
  logAnalysisGenerated(analysis: { changeType: string; market: string; impact: string }): void {
    this.info('ANALYSIS', 'Effect analysis generated', {
      changeType: analysis.changeType,
      market: analysis.market,
      impactPreview: analysis.impact.substring(0, 200)
    })
  }

  /**
   * 记录错误
   * @param context - 错误上下文
   * @param error - 错误对象或消息
   */
  logError(context: string, error: unknown): void {
    const errorData = error instanceof Error 
      ? { name: error.name, message: error.message, stack: error.stack }
      : { error }

    this.error('ERROR', `Error in ${context}`, errorData)
  }

  /**
   * 记录API错误
   * @param statusCode - HTTP状态码
   * @param errorMessage - 错误消息
   */
  logApiError(statusCode: number, errorMessage: string): void {
    this.error('API_ERROR', `API request failed with status ${statusCode}`, {
      statusCode,
      errorMessage: errorMessage.substring(0, 500)
    })
  }

  /**
   * 记录消息历史
   * @param messages - 消息数组
   */
  logMessageHistory(messages: FormattedMessage[]): void {
    this.debug('HISTORY', 'Message history context', {
      messageCount: messages.length,
      roles: messages.map(m => m.role),
      contentPreviews: messages.map(m => {
        let preview: string
        if (typeof m.content === 'string') {
          preview = m.content.substring(0, 100)
        } else if (Array.isArray(m.content)) {
          preview = `[${m.content.length} content parts]`
        } else {
          preview = ''
        }
        return {
          role: m.role,
          preview
        }
      })
    })
  }

  /**
   * 获取所有存储的日志
   * @returns 日志条目数组
   */
  getAllLogs(): LogEntry[] {
    return this.getStoredLogs()
  }

  /**
   * 获取特定会话的日志
   * @param sessionId - 会话ID
   * @returns 日志条目数组
   */
  getSessionLogs(sessionId: string): LogEntry[] {
    return this.getStoredLogs().filter(log => log.sessionId === sessionId)
  }

  /**
   * 获取特定请求的日志
   * @param requestId - 请求ID
   * @returns 日志条目数组
   */
  getRequestLogs(requestId: string): LogEntry[] {
    return this.getStoredLogs().filter(log => log.requestId === requestId)
  }

  /**
   * 清除所有存储的日志
   */
  clearLogs(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
      this.info('SYSTEM', 'All logs cleared')
    } catch (e) {
      console.warn('[AI Logger] Failed to clear logs:', e)
    }
  }

  /**
   * 导出日志为JSON字符串
   * @returns JSON格式的日志
   */
  exportLogs(): string {
    return JSON.stringify(this.getStoredLogs(), null, 2)
  }

  /**
   * 更新日志配置
   * @param config - 部分配置对象
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config }
    this.info('SYSTEM', 'Logger configuration updated', this.config)
  }

  /**
   * 获取当前配置
   * @returns 当前配置对象
   */
  getConfig(): LoggerConfig {
    return { ...this.config }
  }
}

export const aiLogger = new AILogger()

export default aiLogger
