/**
 * 提供商 API 适配器模块
 * 
 * 处理不同 API 提供商之间的参数差异，包括：
 * - 参数名称映射
 * - 参数值范围限制
 * - 特殊参数处理
 * - 请求体格式调整
 * 
 * @module provider-adapter
 * @author EconGrapher Team
 */

import type { ApiProvider } from './provider-detector'
import type { ApiParameters } from './types'

/**
 * 提供商参数配置
 */
export interface ProviderParameterConfig {
  temperature: {
    supported: boolean
    min: number
    max: number
    default: number
    paramName: string
  }
  maxTokens: {
    supported: boolean
    paramName: string
    max?: number
  }
  topP: {
    supported: boolean
    min: number
    max: number
    paramName: string
  }
  frequencyPenalty: {
    supported: boolean
    min: number
    max: number
    paramName: string
  }
  presencePenalty: {
    supported: boolean
    min: number
    max: number
    paramName: string
  }
  streamOptions: {
    supported: boolean
    includeUsage: boolean
  }
}

/**
 * 提供商适配器配置
 */
export interface ProviderAdapterConfig {
  provider: ApiProvider
  name: string
  parameters: ProviderParameterConfig
  specialHandling: {
    thinkingModelNoSampling: boolean
    requiresStreamOptions: boolean
    customHeaders?: Record<string, string>
    bodyTransform?: (body: Record<string, unknown>) => Record<string, unknown>
  }
}

/**
 * OpenAI 适配器配置
 */
const OPENAI_ADAPTER: ProviderAdapterConfig = {
  provider: 'openai',
  name: 'OpenAI',
  parameters: {
    temperature: { supported: true, min: 0, max: 2, default: 0.3, paramName: 'temperature' },
    maxTokens: { supported: true, paramName: 'max_tokens' },
    topP: { supported: true, min: 0, max: 1, paramName: 'top_p' },
    frequencyPenalty: { supported: true, min: -2, max: 2, paramName: 'frequency_penalty' },
    presencePenalty: { supported: true, min: -2, max: 2, paramName: 'presence_penalty' },
    streamOptions: { supported: true, includeUsage: true }
  },
  specialHandling: {
    thinkingModelNoSampling: true,
    requiresStreamOptions: false
  }
}

/**
 * DeepSeek 适配器配置
 */
const DEEPSEEK_ADAPTER: ProviderAdapterConfig = {
  provider: 'deepseek',
  name: 'DeepSeek',
  parameters: {
    temperature: { supported: true, min: 0, max: 2, default: 0.3, paramName: 'temperature' },
    maxTokens: { supported: true, paramName: 'max_tokens' },
    topP: { supported: true, min: 0, max: 1, paramName: 'top_p' },
    frequencyPenalty: { supported: true, min: -2, max: 2, paramName: 'frequency_penalty' },
    presencePenalty: { supported: true, min: -2, max: 2, paramName: 'presence_penalty' },
    streamOptions: { supported: true, includeUsage: false }
  },
  specialHandling: {
    thinkingModelNoSampling: true,
    requiresStreamOptions: false
  }
}

/**
 * Anthropic 适配器配置
 */
const ANTHROPIC_ADAPTER: ProviderAdapterConfig = {
  provider: 'anthropic',
  name: 'Anthropic',
  parameters: {
    temperature: { supported: true, min: 0, max: 1, default: 0.3, paramName: 'temperature' },
    maxTokens: { supported: true, paramName: 'max_tokens', max: 4096 },
    topP: { supported: true, min: 0, max: 1, paramName: 'top_p' },
    frequencyPenalty: { supported: false, min: 0, max: 0, paramName: '' },
    presencePenalty: { supported: false, min: 0, max: 0, paramName: '' },
    streamOptions: { supported: true, includeUsage: false }
  },
  specialHandling: {
    thinkingModelNoSampling: false,
    requiresStreamOptions: false
  }
}

/**
 * Google 适配器配置
 */
const GOOGLE_ADAPTER: ProviderAdapterConfig = {
  provider: 'google',
  name: 'Google AI',
  parameters: {
    temperature: { supported: true, min: 0, max: 2, default: 0.3, paramName: 'temperature' },
    maxTokens: { supported: true, paramName: 'maxOutputTokens' },
    topP: { supported: true, min: 0, max: 1, paramName: 'topP' },
    frequencyPenalty: { supported: false, min: 0, max: 0, paramName: '' },
    presencePenalty: { supported: false, min: 0, max: 0, paramName: '' },
    streamOptions: { supported: true, includeUsage: false }
  },
  specialHandling: {
    thinkingModelNoSampling: false,
    requiresStreamOptions: false
  }
}

/**
 * Azure OpenAI 适配器配置
 */
const AZURE_ADAPTER: ProviderAdapterConfig = {
  provider: 'azure',
  name: 'Azure OpenAI',
  parameters: {
    temperature: { supported: true, min: 0, max: 2, default: 0.3, paramName: 'temperature' },
    maxTokens: { supported: true, paramName: 'max_tokens' },
    topP: { supported: true, min: 0, max: 1, paramName: 'top_p' },
    frequencyPenalty: { supported: true, min: -2, max: 2, paramName: 'frequency_penalty' },
    presencePenalty: { supported: true, min: -2, max: 2, paramName: 'presence_penalty' },
    streamOptions: { supported: true, includeUsage: true }
  },
  specialHandling: {
    thinkingModelNoSampling: true,
    requiresStreamOptions: false
  }
}

/**
 * OpenRouter 适配器配置
 */
const OPENROUTER_ADAPTER: ProviderAdapterConfig = {
  provider: 'openrouter',
  name: 'OpenRouter',
  parameters: {
    temperature: { supported: true, min: 0, max: 2, default: 0.3, paramName: 'temperature' },
    maxTokens: { supported: true, paramName: 'max_tokens' },
    topP: { supported: true, min: 0, max: 1, paramName: 'top_p' },
    frequencyPenalty: { supported: true, min: -2, max: 2, paramName: 'frequency_penalty' },
    presencePenalty: { supported: true, min: -2, max: 2, paramName: 'presence_penalty' },
    streamOptions: { supported: true, includeUsage: false }
  },
  specialHandling: {
    thinkingModelNoSampling: true,
    requiresStreamOptions: false,
    customHeaders: {
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
      'X-Title': 'EconGrapher'
    }
  }
}

/**
 * Groq 适配器配置
 */
const GROQ_ADAPTER: ProviderAdapterConfig = {
  provider: 'groq',
  name: 'Groq',
  parameters: {
    temperature: { supported: true, min: 0, max: 2, default: 0.3, paramName: 'temperature' },
    maxTokens: { supported: true, paramName: 'max_tokens' },
    topP: { supported: true, min: 0, max: 1, paramName: 'top_p' },
    frequencyPenalty: { supported: true, min: -2, max: 2, paramName: 'frequency_penalty' },
    presencePenalty: { supported: true, min: -2, max: 2, paramName: 'presence_penalty' },
    streamOptions: { supported: true, includeUsage: false }
  },
  specialHandling: {
    thinkingModelNoSampling: false,
    requiresStreamOptions: false
  }
}

/**
 * Mistral 适配器配置
 */
const MISTRAL_ADAPTER: ProviderAdapterConfig = {
  provider: 'mistral',
  name: 'Mistral AI',
  parameters: {
    temperature: { supported: true, min: 0, max: 1, default: 0.3, paramName: 'temperature' },
    maxTokens: { supported: true, paramName: 'max_tokens' },
    topP: { supported: true, min: 0, max: 1, paramName: 'top_p' },
    frequencyPenalty: { supported: false, min: 0, max: 0, paramName: '' },
    presencePenalty: { supported: false, min: 0, max: 0, paramName: '' },
    streamOptions: { supported: true, includeUsage: false }
  },
  specialHandling: {
    thinkingModelNoSampling: false,
    requiresStreamOptions: false
  }
}

/**
 * Moonshot 适配器配置
 */
const MOONSHOT_ADAPTER: ProviderAdapterConfig = {
  provider: 'moonshot',
  name: 'Moonshot AI',
  parameters: {
    temperature: { supported: true, min: 0, max: 2, default: 0.3, paramName: 'temperature' },
    maxTokens: { supported: true, paramName: 'max_tokens' },
    topP: { supported: true, min: 0, max: 1, paramName: 'top_p' },
    frequencyPenalty: { supported: false, min: 0, max: 0, paramName: '' },
    presencePenalty: { supported: false, min: 0, max: 0, paramName: '' },
    streamOptions: { supported: true, includeUsage: false }
  },
  specialHandling: {
    thinkingModelNoSampling: false,
    requiresStreamOptions: false
  }
}

/**
 * Zhipu 适配器配置
 */
const ZHIPU_ADAPTER: ProviderAdapterConfig = {
  provider: 'zhipu',
  name: 'Zhipu AI',
  parameters: {
    temperature: { supported: true, min: 0.01, max: 1, default: 0.3, paramName: 'temperature' },
    maxTokens: { supported: true, paramName: 'max_tokens' },
    topP: { supported: true, min: 0, max: 1, paramName: 'top_p' },
    frequencyPenalty: { supported: false, min: 0, max: 0, paramName: '' },
    presencePenalty: { supported: false, min: 0, max: 0, paramName: '' },
    streamOptions: { supported: true, includeUsage: false }
  },
  specialHandling: {
    thinkingModelNoSampling: false,
    requiresStreamOptions: false
  }
}

/**
 * Ollama 适配器配置
 */
const OLLAMA_ADAPTER: ProviderAdapterConfig = {
  provider: 'ollama',
  name: 'Ollama',
  parameters: {
    temperature: { supported: true, min: 0, max: 2, default: 0.3, paramName: 'temperature' },
    maxTokens: { supported: true, paramName: 'num_predict' },
    topP: { supported: true, min: 0, max: 1, paramName: 'top_p' },
    frequencyPenalty: { supported: false, min: 0, max: 0, paramName: '' },
    presencePenalty: { supported: false, min: 0, max: 0, paramName: '' },
    streamOptions: { supported: true, includeUsage: false }
  },
  specialHandling: {
    thinkingModelNoSampling: false,
    requiresStreamOptions: false
  }
}

/**
 * Together AI 适配器配置
 */
const TOGETHER_ADAPTER: ProviderAdapterConfig = {
  provider: 'together',
  name: 'Together AI',
  parameters: {
    temperature: { supported: true, min: 0, max: 2, default: 0.3, paramName: 'temperature' },
    maxTokens: { supported: true, paramName: 'max_tokens' },
    topP: { supported: true, min: 0, max: 1, paramName: 'top_p' },
    frequencyPenalty: { supported: true, min: -2, max: 2, paramName: 'frequency_penalty' },
    presencePenalty: { supported: true, min: -2, max: 2, paramName: 'presence_penalty' },
    streamOptions: { supported: true, includeUsage: false }
  },
  specialHandling: {
    thinkingModelNoSampling: true,
    requiresStreamOptions: false
  }
}

/**
 * Unknown 适配器配置（默认使用 OpenAI 兼容格式）
 */
const UNKNOWN_ADAPTER: ProviderAdapterConfig = {
  provider: 'unknown',
  name: 'Custom Provider',
  parameters: {
    temperature: { supported: true, min: 0, max: 2, default: 0.3, paramName: 'temperature' },
    maxTokens: { supported: true, paramName: 'max_tokens' },
    topP: { supported: true, min: 0, max: 1, paramName: 'top_p' },
    frequencyPenalty: { supported: true, min: -2, max: 2, paramName: 'frequency_penalty' },
    presencePenalty: { supported: true, min: -2, max: 2, paramName: 'presence_penalty' },
    streamOptions: { supported: true, includeUsage: false }
  },
  specialHandling: {
    thinkingModelNoSampling: true,
    requiresStreamOptions: false
  }
}

/**
 * 提供商适配器映射
 */
export const PROVIDER_ADAPTERS: Record<ApiProvider, ProviderAdapterConfig> = {
  openai: OPENAI_ADAPTER,
  deepseek: DEEPSEEK_ADAPTER,
  anthropic: ANTHROPIC_ADAPTER,
  google: GOOGLE_ADAPTER,
  azure: AZURE_ADAPTER,
  openrouter: OPENROUTER_ADAPTER,
  together: TOGETHER_ADAPTER,
  groq: GROQ_ADAPTER,
  mistral: MISTRAL_ADAPTER,
  moonshot: MOONSHOT_ADAPTER,
  zhipu: ZHIPU_ADAPTER,
  ollama: OLLAMA_ADAPTER,
  unknown: UNKNOWN_ADAPTER
}

/**
 * 获取提供商适配器配置
 * 
 * @param provider - 提供商ID
 * @returns 适配器配置
 */
export function getProviderAdapter(provider: ApiProvider): ProviderAdapterConfig {
  return PROVIDER_ADAPTERS[provider] || UNKNOWN_ADAPTER
}

/**
 * 构建请求体参数
 * 
 * @param provider - 提供商ID
 * @param params - API参数
 * @param isThinkingModel - 是否为思考模型
 * @returns 请求体参数对象
 */
export function buildRequestBodyParams(
  provider: ApiProvider,
  params: ApiParameters,
  isThinkingModel: boolean
): Record<string, unknown> {
  const adapter = getProviderAdapter(provider)
  const config = adapter.parameters
  const body: Record<string, unknown> = {}

  if (isThinkingModel && adapter.specialHandling.thinkingModelNoSampling) {
    return body
  }

  if (config.temperature.supported && params.temperature !== undefined) {
    const temp = Math.max(config.temperature.min, Math.min(config.temperature.max, params.temperature))
    body[config.temperature.paramName] = temp
  }

  if (config.maxTokens.supported && params.maxTokens !== undefined) {
    const maxTokens = config.maxTokens.max 
      ? Math.min(params.maxTokens, config.maxTokens.max) 
      : params.maxTokens
    body[config.maxTokens.paramName] = maxTokens
  }

  if (config.topP.supported && params.topP !== undefined) {
    const topP = Math.max(config.topP.min, Math.min(config.topP.max, params.topP))
    body[config.topP.paramName] = topP
  }

  if (config.frequencyPenalty.supported && params.frequencyPenalty !== undefined) {
    const freq = Math.max(config.frequencyPenalty.min, Math.min(config.frequencyPenalty.max, params.frequencyPenalty))
    body[config.frequencyPenalty.paramName] = freq
  }

  if (config.presencePenalty.supported && params.presencePenalty !== undefined) {
    const pres = Math.max(config.presencePenalty.min, Math.min(config.presencePenalty.max, params.presencePenalty))
    body[config.presencePenalty.paramName] = pres
  }

  return body
}

/**
 * 获取自定义请求头
 * 
 * @param provider - 提供商ID
 * @returns 自定义请求头
 */
export function getCustomHeaders(provider: ApiProvider): Record<string, string> {
  const adapter = getProviderAdapter(provider)
  return adapter.specialHandling.customHeaders || {}
}

/**
 * 获取提供商支持的参数列表
 * 
 * @param provider - 提供商ID
 * @returns 支持的参数名称列表
 */
export function getSupportedParameters(provider: ApiProvider): string[] {
  const config = getProviderAdapter(provider).parameters
  const supported: string[] = []
  
  if (config.temperature.supported) supported.push('temperature')
  if (config.maxTokens.supported) supported.push('maxTokens')
  if (config.topP.supported) supported.push('topP')
  if (config.frequencyPenalty.supported) supported.push('frequencyPenalty')
  if (config.presencePenalty.supported) supported.push('presencePenalty')
  
  return supported
}

/**
 * 验证参数值是否在有效范围内
 * 
 * @param provider - 提供商ID
 * @param params - API参数
 * @returns 验证结果和调整后的参数
 */
export function validateAndAdjustParameters(
  provider: ApiProvider,
  params: ApiParameters
): { valid: boolean; adjusted: ApiParameters; warnings: string[] } {
  const config = getProviderAdapter(provider).parameters
  const adjusted: ApiParameters = { ...params }
  const warnings: string[] = []

  if (config.temperature.supported && params.temperature !== undefined) {
    if (params.temperature < config.temperature.min || params.temperature > config.temperature.max) {
      adjusted.temperature = Math.max(config.temperature.min, Math.min(config.temperature.max, params.temperature))
      warnings.push(`Temperature adjusted to ${adjusted.temperature} (valid range: ${config.temperature.min}-${config.temperature.max})`)
    }
  }

  if (config.maxTokens.supported && params.maxTokens !== undefined && config.maxTokens.max) {
    if (params.maxTokens > config.maxTokens.max) {
      adjusted.maxTokens = config.maxTokens.max
      warnings.push(`Max tokens adjusted to ${adjusted.maxTokens} (maximum: ${config.maxTokens.max})`)
    }
  }

  if (config.topP.supported && params.topP !== undefined) {
    if (params.topP < config.topP.min || params.topP > config.topP.max) {
      adjusted.topP = Math.max(config.topP.min, Math.min(config.topP.max, params.topP))
      warnings.push(`Top P adjusted to ${adjusted.topP} (valid range: ${config.topP.min}-${config.topP.max})`)
    }
  }

  if (config.frequencyPenalty.supported && params.frequencyPenalty !== undefined) {
    if (params.frequencyPenalty < config.frequencyPenalty.min || params.frequencyPenalty > config.frequencyPenalty.max) {
      adjusted.frequencyPenalty = Math.max(config.frequencyPenalty.min, Math.min(config.frequencyPenalty.max, params.frequencyPenalty))
      warnings.push(`Frequency penalty adjusted to ${adjusted.frequencyPenalty} (valid range: ${config.frequencyPenalty.min}-${config.frequencyPenalty.max})`)
    }
  }

  if (config.presencePenalty.supported && params.presencePenalty !== undefined) {
    if (params.presencePenalty < config.presencePenalty.min || params.presencePenalty > config.presencePenalty.max) {
      adjusted.presencePenalty = Math.max(config.presencePenalty.min, Math.min(config.presencePenalty.max, params.presencePenalty))
      warnings.push(`Presence penalty adjusted to ${adjusted.presencePenalty} (valid range: ${config.presencePenalty.min}-${config.presencePenalty.max})`)
    }
  }

  return {
    valid: warnings.length === 0,
    adjusted,
    warnings
  }
}

/**
 * 获取参数的默认值（针对特定提供商）
 * 
 * @param provider - 提供商ID
 * @returns 参数默认值
 */
export function getProviderDefaultParameters(provider: ApiProvider): ApiParameters {
  const config = getProviderAdapter(provider).parameters
  
  return {
    temperature: config.temperature.default,
    maxTokens: undefined,
    topP: undefined,
    frequencyPenalty: undefined,
    presencePenalty: undefined
  }
}
