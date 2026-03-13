/**
 * API 格式适配器模块
 * 
 * 处理不同 API 提供商之间的接口格式差异，包括：
 * - 请求体格式转换
 * - 响应解析
 * - 流式响应处理
 * - 端点路径映射
 * - 用户自定义格式支持
 * 
 * @module api-format-adapter
 * @author EconGrapher Team
 */

import type { ApiProvider } from './provider-detector'
import type { ApiParameters } from './types'

/**
 * API 格式类型
 */
export type ApiFormatType = 
  | 'openai'        // OpenAI 兼容格式
  | 'anthropic'     // Anthropic Claude 格式
  | 'google'        // Google Gemini 格式
  | 'ollama'        // Ollama 本地格式
  | 'custom'        // 用户自定义格式

/**
 * 消息格式
 */
export interface FormattedMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | ContentPart[]
}

/**
 * 内容部分
 */
export interface ContentPart {
  type: 'text' | 'image'
  text?: string
  image_url?: { url: string }
}

/**
 * 请求格式配置
 */
export interface RequestFormatConfig {
  endpoint: string
  method: 'POST' | 'GET'
  headers: Record<string, string>
  bodyBuilder: (config: RequestBuildConfig) => Record<string, unknown>
}

/**
 * 请求构建配置
 */
export interface RequestBuildConfig {
  model: string
  messages: FormattedMessage[]
  parameters: ApiParameters
  stream: boolean
  systemPrompt?: string
}

/**
 * 响应解析配置
 */
export interface ResponseParserConfig {
  parseNonStream: (response: unknown) => ParsedResponse
  parseStreamChunk: (chunk: string) => StreamChunkResult
  isStreamDone: (chunk: string) => boolean
}

/**
 * 解析后的响应
 */
export interface ParsedResponse {
  content: string
  thinking?: string
  finishReason?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * 流式块结果
 */
export interface StreamChunkResult {
  content?: string
  thinking?: string
  done: boolean
}

/**
 * API 格式适配器配置
 */
export interface ApiFormatAdapterConfig {
  formatType: ApiFormatType
  name: string
  description: string
  requestFormat: RequestFormatConfig
  responseParser: ResponseParserConfig
}

/**
 * OpenAI 兼容格式适配器
 */
const OPENAI_FORMAT_ADAPTER: ApiFormatAdapterConfig = {
  formatType: 'openai',
  name: 'OpenAI Compatible',
  description: 'Standard OpenAI API format, compatible with most providers',
  requestFormat: {
    endpoint: '/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    bodyBuilder: (config: RequestBuildConfig) => {
      const body: Record<string, unknown> = {
        model: config.model,
        messages: config.messages,
        stream: config.stream
      }

      if (config.parameters.temperature !== undefined) {
        body.temperature = config.parameters.temperature
      }
      if (config.parameters.maxTokens !== undefined) {
        body.max_tokens = config.parameters.maxTokens
      }
      if (config.parameters.topP !== undefined) {
        body.top_p = config.parameters.topP
      }
      if (config.parameters.frequencyPenalty !== undefined) {
        body.frequency_penalty = config.parameters.frequencyPenalty
      }
      if (config.parameters.presencePenalty !== undefined) {
        body.presence_penalty = config.parameters.presencePenalty
      }

      if (config.stream) {
        body.stream_options = { include_usage: true }
      }

      return body
    }
  },
  responseParser: {
    parseNonStream: (response: unknown) => {
      const data = response as Record<string, unknown>
      const choice = (data.choices as Array<Record<string, unknown>>)?.[0]
      const message = choice?.message as Record<string, unknown>
      const usage = data.usage as Record<string, number> | undefined

      return {
        content: (message?.content as string) || '',
        thinking: message?.reasoning_content as string | undefined,
        finishReason: choice?.finish_reason as string | undefined,
        usage: usage ? {
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
          totalTokens: usage.total_tokens || 0
        } : undefined
      }
    },
    parseStreamChunk: (chunk: string) => {
      if (chunk.includes('[DONE]')) {
        return { done: true }
      }

      try {
        const data = JSON.parse(chunk)
        const delta = data.choices?.[0]?.delta
        
        return {
          content: delta?.content || undefined,
          thinking: delta?.reasoning_content || undefined,
          done: false
        }
      } catch {
        return { done: false }
      }
    },
    isStreamDone: (chunk: string) => {
      return chunk.includes('[DONE]')
    }
  }
}

/**
 * Anthropic 格式适配器
 */
const ANTHROPIC_FORMAT_ADAPTER: ApiFormatAdapterConfig = {
  formatType: 'anthropic',
  name: 'Anthropic Claude',
  description: 'Anthropic Claude API format',
  requestFormat: {
    endpoint: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    bodyBuilder: (config: RequestBuildConfig) => {
      const messages = config.messages.filter(m => m.role !== 'system')
      
      const body: Record<string, unknown> = {
        model: config.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        max_tokens: config.parameters.maxTokens || 4096,
        stream: config.stream
      }

      const systemMessage = config.messages.find(m => m.role === 'system')
      if (systemMessage || config.systemPrompt) {
        body.system = typeof systemMessage?.content === 'string' 
          ? systemMessage.content 
          : config.systemPrompt || ''
      }

      if (config.parameters.temperature !== undefined) {
        body.temperature = config.parameters.temperature
      }
      if (config.parameters.topP !== undefined) {
        body.top_p = config.parameters.topP
      }

      return body
    }
  },
  responseParser: {
    parseNonStream: (response: unknown) => {
      const data = response as Record<string, unknown>
      const content = (data.content as Array<Record<string, unknown>>) || []
      const textBlock = content.find(b => b.type === 'text')
      const thinkingBlock = content.find(b => b.type === 'thinking')
      const usage = data.usage as Record<string, number> | undefined

      return {
        content: (textBlock?.text as string) || '',
        thinking: thinkingBlock?.thinking as string | undefined,
        finishReason: data.stop_reason as string | undefined,
        usage: usage ? {
          promptTokens: usage.input_tokens || 0,
          completionTokens: usage.output_tokens || 0,
          totalTokens: (usage.input_tokens || 0) + (usage.output_tokens || 0)
        } : undefined
      }
    },
    parseStreamChunk: (chunk: string) => {
      try {
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))
            
            if (data.type === 'content_block_delta') {
              const delta = data.delta
              if (delta.type === 'text_delta') {
                return { content: delta.text, done: false }
              }
              if (delta.type === 'thinking_delta') {
                return { thinking: delta.thinking, done: false }
              }
            }
            
            if (data.type === 'message_stop') {
              return { done: true }
            }
          }
        }
        return { done: false }
      } catch {
        return { done: false }
      }
    },
    isStreamDone: (chunk: string) => {
      return chunk.includes('"type":"message_stop"')
    }
  }
}

/**
 * Google Gemini 格式适配器
 */
const GOOGLE_FORMAT_ADAPTER: ApiFormatAdapterConfig = {
  formatType: 'google',
  name: 'Google Gemini',
  description: 'Google Gemini API format',
  requestFormat: {
    endpoint: '', // Will be constructed dynamically
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    bodyBuilder: (config: RequestBuildConfig) => {
      const contents = config.messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: typeof m.content === 'string' ? m.content : '' }]
        }))

      const body: Record<string, unknown> = {
        contents,
        generationConfig: {}
      }

      const systemMessage = config.messages.find(m => m.role === 'system')
      if (systemMessage || config.systemPrompt) {
        body.systemInstruction = {
          parts: [{ 
            text: typeof systemMessage?.content === 'string' 
              ? systemMessage.content 
              : config.systemPrompt || '' 
          }]
        }
      }

      const genConfig = body.generationConfig as Record<string, unknown>
      if (config.parameters.temperature !== undefined) {
        genConfig.temperature = config.parameters.temperature
      }
      if (config.parameters.maxTokens !== undefined) {
        genConfig.maxOutputTokens = config.parameters.maxTokens
      }
      if (config.parameters.topP !== undefined) {
        genConfig.topP = config.parameters.topP
      }

      return body
    }
  },
  responseParser: {
    parseNonStream: (response: unknown) => {
      const data = response as Record<string, unknown>
      const candidates = (data.candidates as Array<Record<string, unknown>>) || []
      const candidate = candidates[0]
      const content = candidate?.content as Record<string, unknown>
      const parts = (content?.parts as Array<Record<string, unknown>>) || []
      const textPart = parts.find(p => p.text)
      const usage = data.usageMetadata as Record<string, number> | undefined

      return {
        content: (textPart?.text as string) || '',
        finishReason: candidate?.finishReason as string | undefined,
        usage: usage ? {
          promptTokens: usage.promptTokenCount || 0,
          completionTokens: usage.candidatesTokenCount || 0,
          totalTokens: usage.totalTokenCount || 0
        } : undefined
      }
    },
    parseStreamChunk: (chunk: string) => {
      try {
        const data = JSON.parse(chunk)
        const candidates = data.candidates || []
        const candidate = candidates[0]
        const content = candidate?.content
        const parts = content?.parts || []
        const textPart = parts.find((p: Record<string, unknown>) => p.text)

        return {
          content: textPart?.text || undefined,
          done: candidate?.finishReason === 'STOP'
        }
      } catch {
        return { done: false }
      }
    },
    isStreamDone: (chunk: string) => {
      try {
        const data = JSON.parse(chunk)
        return data.candidates?.[0]?.finishReason === 'STOP'
      } catch {
        return false
      }
    }
  }
}

/**
 * Ollama 格式适配器
 */
const OLLAMA_FORMAT_ADAPTER: ApiFormatAdapterConfig = {
  formatType: 'ollama',
  name: 'Ollama',
  description: 'Ollama local LLM format',
  requestFormat: {
    endpoint: '/api/chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    bodyBuilder: (config: RequestBuildConfig) => {
      const body: Record<string, unknown> = {
        model: config.model,
        messages: config.messages.map(m => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : ''
        })),
        stream: config.stream
      }

      const options: Record<string, unknown> = {}
      if (config.parameters.temperature !== undefined) {
        options.temperature = config.parameters.temperature
      }
      if (config.parameters.maxTokens !== undefined) {
        options.num_predict = config.parameters.maxTokens
      }
      if (config.parameters.topP !== undefined) {
        options.top_p = config.parameters.topP
      }

      if (Object.keys(options).length > 0) {
        body.options = options
      }

      return body
    }
  },
  responseParser: {
    parseNonStream: (response: unknown) => {
      const data = response as Record<string, unknown>
      const message = data.message as Record<string, unknown> | undefined
      
      return {
        content: (message?.content as string) || '',
        finishReason: data.done ? 'stop' : undefined,
        usage: data.eval_count !== undefined ? {
          promptTokens: Number(data.prompt_eval_count) || 0,
          completionTokens: Number(data.eval_count) || 0,
          totalTokens: (Number(data.prompt_eval_count) || 0) + (Number(data.eval_count) || 0)
        } : undefined
      }
    },
    parseStreamChunk: (chunk: string) => {
      try {
        const data = JSON.parse(chunk)
        
        return {
          content: data.message?.content || undefined,
          done: data.done || false
        }
      } catch {
        return { done: false }
      }
    },
    isStreamDone: (chunk: string) => {
      try {
        const data = JSON.parse(chunk)
        return data.done === true
      } catch {
        return false
      }
    }
  }
}

/**
 * 提供商到格式的映射
 */
export const PROVIDER_FORMAT_MAP: Record<ApiProvider, ApiFormatType> = {
  openai: 'openai',
  deepseek: 'openai',
  anthropic: 'anthropic',
  google: 'google',
  azure: 'openai',
  openrouter: 'openai',
  together: 'openai',
  groq: 'openai',
  mistral: 'openai',
  moonshot: 'openai',
  zhipu: 'openai',
  ollama: 'ollama',
  unknown: 'openai'
}

/**
 * 格式适配器映射
 */
export const FORMAT_ADAPTERS: Record<ApiFormatType, ApiFormatAdapterConfig> = {
  openai: OPENAI_FORMAT_ADAPTER,
  anthropic: ANTHROPIC_FORMAT_ADAPTER,
  google: GOOGLE_FORMAT_ADAPTER,
  ollama: OLLAMA_FORMAT_ADAPTER,
  custom: OPENAI_FORMAT_ADAPTER // Default to OpenAI for custom
}

/**
 * 获取提供商的API格式类型
 * 
 * @param provider - 提供商ID
 * @returns API格式类型
 */
export function getProviderFormatType(provider: ApiProvider): ApiFormatType {
  return PROVIDER_FORMAT_MAP[provider] || 'openai'
}

/**
 * 获取格式适配器
 * 
 * @param formatType - 格式类型
 * @returns 格式适配器配置
 */
export function getFormatAdapter(formatType: ApiFormatType): ApiFormatAdapterConfig {
  return FORMAT_ADAPTERS[formatType] || OPENAI_FORMAT_ADAPTER
}

/**
 * 获取提供商的格式适配器
 * 
 * @param provider - 提供商ID
 * @returns 格式适配器配置
 */
export function getProviderFormatAdapter(provider: ApiProvider): ApiFormatAdapterConfig {
  const formatType = getProviderFormatType(provider)
  return getFormatAdapter(formatType)
}

/**
 * 构建API请求URL
 * 
 * @param baseUrl - 基础URL
 * @param model - 模型名称
 * @param formatType - 格式类型
 * @param apiKey - API密钥（用于Google等需要放在URL中的提供商）
 * @returns 完整的请求URL
 */
export function buildApiUrl(
  baseUrl: string, 
  model: string, 
  formatType: ApiFormatType,
  apiKey?: string
): string {
  const cleanBaseUrl = baseUrl.replace(/\/$/, '')
  
  switch (formatType) {
    case 'google':
      return `${cleanBaseUrl}/models/${model}:${apiKey ? 'generateContent?key=' + apiKey : 'generateContent'}`
    default:
      return `${cleanBaseUrl}/chat/completions`
  }
}

/**
 * 构建请求体
 * 
 * @param formatType - 格式类型
 * @param config - 请求构建配置
 * @returns 请求体对象
 */
export function buildRequestBody(
  formatType: ApiFormatType,
  config: RequestBuildConfig
): Record<string, unknown> {
  const adapter = getFormatAdapter(formatType)
  return adapter.requestFormat.bodyBuilder(config)
}

/**
 * 解析非流式响应
 * 
 * @param formatType - 格式类型
 * @param response - 原始响应
 * @returns 解析后的响应
 */
export function parseResponse(
  formatType: ApiFormatType,
  response: unknown
): ParsedResponse {
  const adapter = getFormatAdapter(formatType)
  return adapter.responseParser.parseNonStream(response)
}

/**
 * 解析流式响应块
 * 
 * @param formatType - 格式类型
 * @param chunk - 原始块数据
 * @returns 解析结果
 */
export function parseStreamChunk(
  formatType: ApiFormatType,
  chunk: string
): StreamChunkResult {
  const adapter = getFormatAdapter(formatType)
  return adapter.responseParser.parseStreamChunk(chunk)
}

/**
 * 检查流是否结束
 * 
 * @param formatType - 格式类型
 * @param chunk - 原始块数据
 * @returns 是否结束
 */
export function isStreamDone(
  formatType: ApiFormatType,
  chunk: string
): boolean {
  const adapter = getFormatAdapter(formatType)
  return adapter.responseParser.isStreamDone(chunk)
}

/**
 * 用户自定义格式配置
 */
export interface CustomFormatConfig {
  id: string
  name: string
  endpointTemplate: string
  bodyTemplate: string
  headerTemplate?: string
  responsePath: {
    content: string
    thinking?: string
    finishReason?: string
  }
  streamConfig?: {
    doneMarker: string
    contentPath: string
    thinkingPath?: string
  }
}

/**
 * 自定义格式存储键
 */
const CUSTOM_FORMATS_KEY = 'econgrapher_custom_formats'

/**
 * 获取用户自定义格式列表
 * 
 * @returns 自定义格式配置列表
 */
export function getCustomFormats(): CustomFormatConfig[] {
  try {
    const raw = localStorage.getItem(CUSTOM_FORMATS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * 保存用户自定义格式
 * 
 * @param format - 自定义格式配置
 */
export function saveCustomFormat(format: CustomFormatConfig): void {
  const formats = getCustomFormats()
  const index = formats.findIndex(f => f.id === format.id)
  if (index >= 0) {
    formats[index] = format
  } else {
    formats.push(format)
  }
  localStorage.setItem(CUSTOM_FORMATS_KEY, JSON.stringify(formats))
}

/**
 * 删除用户自定义格式
 * 
 * @param id - 格式ID
 */
export function deleteCustomFormat(id: string): void {
  const formats = getCustomFormats().filter(f => f.id !== id)
  localStorage.setItem(CUSTOM_FORMATS_KEY, JSON.stringify(formats))
}

/**
 * 根据自定义格式构建请求体
 * 
 * @param template - 模板字符串
 * @param variables - 变量对象
 * @returns 构建后的对象
 */
export function buildFromTemplate(
  template: string,
  variables: Record<string, unknown>
): Record<string, unknown> {
  let result = template
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`
    result = result.replace(new RegExp(placeholder, 'g'), String(value ?? ''))
  }
  
  try {
    return JSON.parse(result)
  } catch {
    return { raw: result }
  }
}

/**
 * 从响应中提取值
 * 
 * @param response - 响应对象
 * @param path - 路径（如 "choices[0].message.content"）
 * @returns 提取的值
 */
export function extractFromPath(response: unknown, path: string): unknown {
  if (!path || !response) return undefined
  
  const parts = path.split(/[.\[\]]+/).filter(Boolean)
  let current: unknown = response
  
  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    
    if (typeof current === 'object') {
      const index = parseInt(part)
      if (!isNaN(index) && Array.isArray(current)) {
        current = current[index]
      } else {
        current = (current as Record<string, unknown>)[part]
      }
    } else {
      return undefined
    }
  }
  
  return current
}

/**
 * 获取所有可用的格式类型
 * 
 * @returns 格式类型列表
 */
export function getAvailableFormats(): Array<{ type: ApiFormatType; name: string; description: string }> {
  return [
    { type: 'openai', name: 'OpenAI Compatible', description: 'Standard OpenAI API format' },
    { type: 'anthropic', name: 'Anthropic Claude', description: 'Anthropic Claude API format' },
    { type: 'google', name: 'Google Gemini', description: 'Google Gemini API format' },
    { type: 'ollama', name: 'Ollama', description: 'Ollama local LLM format' },
    { type: 'custom', name: 'Custom', description: 'User-defined format' }
  ]
}
