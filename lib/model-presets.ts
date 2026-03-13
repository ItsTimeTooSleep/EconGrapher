/**
 * 模型预设配置模块
 * 
 * 为不同 API 提供商定义推荐模型列表，包括模型特性信息。
 * 支持智能思考模型检测和动态模型列表生成。
 * 
 * @module model-presets
 * @author EconGrapher Team
 */

import type { ApiProvider } from './provider-detector'

/**
 * 模型特性标志
 */
export interface ModelFeatures {
  isThinking: boolean
  isVision: boolean
  isFast: boolean
  isReasoning: boolean
}

/**
 * 模型预设信息
 */
export interface ModelPreset {
  id: string
  displayName: string
  features: ModelFeatures
  description?: string
  maxTokens?: number
  recommended?: boolean
}

/**
 * 提供商的模型预设配置
 */
export interface ProviderModelPresets {
  provider: ApiProvider
  models: ModelPreset[]
  defaultModel: string
}

/**
 * 思考模型关键词列表
 * 用于智能检测模型是否为思考模型
 */
export const THINKING_MODEL_KEYWORDS = [
  'deepseek-reasoner',
  'deepseek-r1',
  'o1',
  'o1-mini',
  'o1-preview',
  'o3',
  'o3-mini',
  'o4-mini',
  'reasoner',
  'r1',
  'thinking'
]

/**
 * 视觉模型关键词列表
 */
export const VISION_MODEL_KEYWORDS = [
  'vision',
  'gpt-4o',
  'gpt-4-turbo',
  'claude-3',
  'gemini',
  'qwen-vl'
]

/**
 * 快速模型关键词列表
 */
export const FAST_MODEL_KEYWORDS = [
  'mini',
  'flash',
  'turbo',
  'instant',
  'fast'
]

/**
 * OpenAI 模型预设
 */
export const OPENAI_MODELS: ModelPreset[] = [
  { id: 'gpt-4o', displayName: 'GPT-4o', features: { isThinking: false, isVision: true, isFast: true, isReasoning: false }, recommended: true, description: 'Most capable model' },
  { id: 'gpt-4o-mini', displayName: 'GPT-4o Mini', features: { isThinking: false, isVision: true, isFast: true, isReasoning: false }, description: 'Fast and affordable' },
  { id: 'gpt-4-turbo', displayName: 'GPT-4 Turbo', features: { isThinking: false, isVision: true, isFast: false, isReasoning: false }, description: 'Previous generation flagship' },
  { id: 'gpt-4', displayName: 'GPT-4', features: { isThinking: false, isVision: false, isFast: false, isReasoning: false }, description: 'Original GPT-4' },
  { id: 'gpt-3.5-turbo', displayName: 'GPT-3.5 Turbo', features: { isThinking: false, isVision: false, isFast: true, isReasoning: false }, description: 'Fast and economical' },
  { id: 'o1', displayName: 'o1', features: { isThinking: true, isVision: false, isFast: false, isReasoning: true }, description: 'Advanced reasoning' },
  { id: 'o1-mini', displayName: 'o1 Mini', features: { isThinking: true, isVision: false, isFast: true, isReasoning: true }, description: 'Fast reasoning model' },
  { id: 'o1-preview', displayName: 'o1 Preview', features: { isThinking: true, isVision: false, isFast: false, isReasoning: true }, description: 'Preview reasoning model' },
  { id: 'o3-mini', displayName: 'o3 Mini', features: { isThinking: true, isVision: false, isFast: true, isReasoning: true }, recommended: true, description: 'Latest reasoning model' }
]

/**
 * DeepSeek 模型预设
 */
export const DEEPSEEK_MODELS: ModelPreset[] = [
  { id: 'deepseek-chat', displayName: 'DeepSeek Chat', features: { isThinking: false, isVision: false, isFast: true, isReasoning: false }, recommended: true, description: 'General purpose chat' },
  { id: 'deepseek-reasoner', displayName: 'DeepSeek Reasoner (R1)', features: { isThinking: true, isVision: false, isFast: false, isReasoning: true }, recommended: true, description: 'Advanced reasoning model' },
  { id: 'deepseek-r1', displayName: 'DeepSeek R1', features: { isThinking: true, isVision: false, isFast: false, isReasoning: true }, description: 'Reasoning model alias' },
  { id: 'deepseek-coder', displayName: 'DeepSeek Coder', features: { isThinking: false, isVision: false, isFast: true, isReasoning: false }, description: 'Code specialized model' }
]

/**
 * Anthropic 模型预设
 */
export const ANTHROPIC_MODELS: ModelPreset[] = [
  { id: 'claude-3-5-sonnet-20241022', displayName: 'Claude 3.5 Sonnet', features: { isThinking: false, isVision: true, isFast: true, isReasoning: false }, recommended: true, description: 'Latest Claude model' },
  { id: 'claude-3-5-haiku-20241022', displayName: 'Claude 3.5 Haiku', features: { isThinking: false, isVision: true, isFast: true, isReasoning: false }, description: 'Fast and efficient' },
  { id: 'claude-3-opus-20240229', displayName: 'Claude 3 Opus', features: { isThinking: false, isVision: true, isFast: false, isReasoning: false }, description: 'Most powerful Claude' },
  { id: 'claude-3-sonnet-20240229', displayName: 'Claude 3 Sonnet', features: { isThinking: false, isVision: true, isFast: true, isReasoning: false }, description: 'Balanced performance' },
  { id: 'claude-3-haiku-20240307', displayName: 'Claude 3 Haiku', features: { isThinking: false, isVision: true, isFast: true, isReasoning: false }, description: 'Fast responses' }
]

/**
 * Google 模型预设
 */
export const GOOGLE_MODELS: ModelPreset[] = [
  { id: 'gemini-2.0-flash', displayName: 'Gemini 2.0 Flash', features: { isThinking: false, isVision: true, isFast: true, isReasoning: false }, recommended: true, description: 'Latest fast model' },
  { id: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro', features: { isThinking: false, isVision: true, isFast: false, isReasoning: false }, description: 'Long context model' },
  { id: 'gemini-1.5-flash', displayName: 'Gemini 1.5 Flash', features: { isThinking: false, isVision: true, isFast: true, isReasoning: false }, description: 'Fast and efficient' },
  { id: 'gemini-1.5-flash-8b', displayName: 'Gemini 1.5 Flash 8B', features: { isThinking: false, isVision: false, isFast: true, isReasoning: false }, description: 'Smaller, faster model' }
]

/**
 * Groq 模型预设
 */
export const GROQ_MODELS: ModelPreset[] = [
  { id: 'llama-3.3-70b-versatile', displayName: 'Llama 3.3 70B', features: { isThinking: false, isVision: false, isFast: true, isReasoning: false }, recommended: true, description: 'Fast inference' },
  { id: 'llama-3.1-70b-versatile', displayName: 'Llama 3.1 70B', features: { isThinking: false, isVision: false, isFast: true, isReasoning: false }, description: 'Versatile model' },
  { id: 'llama-3.1-8b-instant', displayName: 'Llama 3.1 8B', features: { isThinking: false, isVision: false, isFast: true, isReasoning: false }, description: 'Ultra-fast responses' },
  { id: 'mixtral-8x7b-32768', displayName: 'Mixtral 8x7B', features: { isThinking: false, isVision: false, isFast: true, isReasoning: false }, description: 'Mixture of experts' },
  { id: 'gemma2-9b-it', displayName: 'Gemma 2 9B', features: { isThinking: false, isVision: false, isFast: true, isReasoning: false }, description: 'Google Gemma' }
]

/**
 * Mistral 模型预设
 */
export const MISTRAL_MODELS: ModelPreset[] = [
  { id: 'mistral-large-latest', displayName: 'Mistral Large', features: { isThinking: false, isVision: false, isFast: false, isReasoning: false }, recommended: true, description: 'Flagship model' },
  { id: 'mistral-small-latest', displayName: 'Mistral Small', features: { isThinking: false, isVision: false, isFast: true, isReasoning: false }, description: 'Fast model' },
  { id: 'codestral-latest', displayName: 'Codestral', features: { isThinking: false, isVision: false, isFast: true, isReasoning: false }, description: 'Code specialized' },
  { id: 'open-mistral-nemo', displayName: 'Mistral Nemo', features: { isThinking: false, isVision: false, isFast: true, isReasoning: false }, description: 'Open model' }
]

/**
 * Moonshot 模型预设
 */
export const MOONSHOT_MODELS: ModelPreset[] = [
  { id: 'moonshot-v1-8k', displayName: 'Moonshot V1 8K', features: { isThinking: false, isVision: false, isFast: true, isReasoning: false }, description: '8K context' },
  { id: 'moonshot-v1-32k', displayName: 'Moonshot V1 32K', features: { isThinking: false, isVision: false, isFast: false, isReasoning: false }, recommended: true, description: '32K context' },
  { id: 'moonshot-v1-128k', displayName: 'Moonshot V1 128K', features: { isThinking: false, isVision: false, isFast: false, isReasoning: false }, description: '128K context' }
]

/**
 * Zhipu 模型预设
 */
export const ZHIPU_MODELS: ModelPreset[] = [
  { id: 'glm-4-plus', displayName: 'GLM-4 Plus', features: { isThinking: false, isVision: false, isFast: false, isReasoning: false }, recommended: true, description: 'Enhanced GLM-4' },
  { id: 'glm-4-0520', displayName: 'GLM-4', features: { isThinking: false, isVision: false, isFast: false, isReasoning: false }, description: 'Flagship model' },
  { id: 'glm-4-air', displayName: 'GLM-4 Air', features: { isThinking: false, isVision: false, isFast: true, isReasoning: false }, description: 'Fast model' },
  { id: 'glm-4-flash', displayName: 'GLM-4 Flash', features: { isThinking: false, isVision: false, isFast: true, isReasoning: false }, description: 'Ultra-fast model' }
]

/**
 * OpenRouter 模型预设 (精选)
 */
export const OPENROUTER_MODELS: ModelPreset[] = [
  { id: 'openai/gpt-4o', displayName: 'GPT-4o (via OpenRouter)', features: { isThinking: false, isVision: true, isFast: true, isReasoning: false }, recommended: true },
  { id: 'anthropic/claude-3.5-sonnet', displayName: 'Claude 3.5 Sonnet', features: { isThinking: false, isVision: true, isFast: true, isReasoning: false } },
  { id: 'deepseek/deepseek-r1', displayName: 'DeepSeek R1', features: { isThinking: true, isVision: false, isFast: false, isReasoning: true } },
  { id: 'google/gemini-2.0-flash-exp', displayName: 'Gemini 2.0 Flash', features: { isThinking: false, isVision: true, isFast: true, isReasoning: false } },
  { id: 'meta-llama/llama-3.3-70b-instruct', displayName: 'Llama 3.3 70B', features: { isThinking: false, isVision: false, isFast: false, isReasoning: false } }
]

/**
 * Together AI 模型预设
 */
export const TOGETHER_MODELS: ModelPreset[] = [
  { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', displayName: 'Llama 3.3 70B', features: { isThinking: false, isVision: false, isFast: true, isReasoning: false }, recommended: true },
  { id: 'deepseek-ai/DeepSeek-R1', displayName: 'DeepSeek R1', features: { isThinking: true, isVision: false, isFast: false, isReasoning: true } },
  { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', displayName: 'Qwen 2.5 72B', features: { isThinking: false, isVision: false, isFast: true, isReasoning: false } },
  { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1', displayName: 'Mixtral 8x7B', features: { isThinking: false, isVision: false, isFast: true, isReasoning: false } }
]

/**
 * 提供商模型预设映射
 */
export const PROVIDER_MODEL_PRESETS: Record<ApiProvider, ProviderModelPresets> = {
  openai: { provider: 'openai', models: OPENAI_MODELS, defaultModel: 'gpt-4o' },
  deepseek: { provider: 'deepseek', models: DEEPSEEK_MODELS, defaultModel: 'deepseek-chat' },
  anthropic: { provider: 'anthropic', models: ANTHROPIC_MODELS, defaultModel: 'claude-3-5-sonnet-20241022' },
  google: { provider: 'google', models: GOOGLE_MODELS, defaultModel: 'gemini-2.0-flash' },
  azure: { provider: 'azure', models: OPENAI_MODELS, defaultModel: 'gpt-4o' },
  openrouter: { provider: 'openrouter', models: OPENROUTER_MODELS, defaultModel: 'openai/gpt-4o' },
  together: { provider: 'together', models: TOGETHER_MODELS, defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo' },
  groq: { provider: 'groq', models: GROQ_MODELS, defaultModel: 'llama-3.3-70b-versatile' },
  mistral: { provider: 'mistral', models: MISTRAL_MODELS, defaultModel: 'mistral-large-latest' },
  moonshot: { provider: 'moonshot', models: MOONSHOT_MODELS, defaultModel: 'moonshot-v1-32k' },
  zhipu: { provider: 'zhipu', models: ZHIPU_MODELS, defaultModel: 'glm-4-plus' },
  ollama: { provider: 'ollama', models: [], defaultModel: 'llama3.2' },
  unknown: { provider: 'unknown', models: [], defaultModel: 'gpt-4o' }
}

/**
 * 获取提供商的模型预设列表
 * 
 * @param provider - 提供商ID
 * @returns 模型预设配置
 */
export function getProviderModels(provider: ApiProvider): ProviderModelPresets {
  return PROVIDER_MODEL_PRESETS[provider] || PROVIDER_MODEL_PRESETS.unknown
}

/**
 * 智能检测模型是否为思考模型
 * 
 * @param modelId - 模型ID
 * @returns 是否为思考模型
 */
export function detectThinkingModel(modelId: string): boolean {
  if (!modelId || typeof modelId !== 'string') return false
  
  const normalizedModel = modelId.toLowerCase().trim()
  
  for (const keyword of THINKING_MODEL_KEYWORDS) {
    if (normalizedModel.includes(keyword.toLowerCase())) {
      return true
    }
  }
  
  return false
}

/**
 * 检测模型的完整特性
 * 
 * @param modelId - 模型ID
 * @param provider - 可选的提供商ID，用于更精确的检测
 * @returns 模型特性
 */
export function detectModelFeatures(modelId: string, provider?: ApiProvider): ModelFeatures {
  if (!modelId || typeof modelId !== 'string') {
    return { isThinking: false, isVision: false, isFast: false, isReasoning: false }
  }

  const normalizedModel = modelId.toLowerCase().trim()
  
  if (provider && provider !== 'unknown') {
    const presets = PROVIDER_MODEL_PRESETS[provider]
    const preset = presets.models.find(m => m.id.toLowerCase() === normalizedModel)
    if (preset) {
      return preset.features
    }
  }

  const isThinking = THINKING_MODEL_KEYWORDS.some(k => normalizedModel.includes(k.toLowerCase()))
  const isVision = VISION_MODEL_KEYWORDS.some(k => normalizedModel.includes(k.toLowerCase()))
  const isFast = FAST_MODEL_KEYWORDS.some(k => normalizedModel.includes(k.toLowerCase()))
  const isReasoning = isThinking

  return { isThinking, isVision, isFast, isReasoning }
}

/**
 * 获取模型的显示名称
 * 
 * @param modelId - 模型ID
 * @param provider - 可选的提供商ID
 * @returns 显示名称
 */
export function getModelDisplayName(modelId: string, provider?: ApiProvider): string {
  if (!modelId) return 'Unknown Model'

  if (provider && provider !== 'unknown') {
    const presets = PROVIDER_MODEL_PRESETS[provider]
    const preset = presets.models.find(m => m.id === modelId)
    if (preset) {
      return preset.displayName
    }
  }

  return modelId
}

/**
 * 获取提供商的默认模型
 * 
 * @param provider - 提供商ID
 * @returns 默认模型ID
 */
export function getProviderDefaultModel(provider: ApiProvider): string {
  return PROVIDER_MODEL_PRESETS[provider]?.defaultModel || 'gpt-4o'
}

/**
 * 生成模型选择列表
 * 
 * @param provider - 提供商ID
 * @param includeCustom - 是否包含自定义选项
 * @returns 模型选项列表
 */
export function generateModelOptions(provider: ApiProvider, includeCustom: boolean = true): ModelPreset[] {
  const presets = PROVIDER_MODEL_PRESETS[provider]
  const models = [...presets.models]
  
  if (includeCustom) {
    models.push({
      id: 'custom',
      displayName: 'Custom model...',
      features: { isThinking: false, isVision: false, isFast: false, isReasoning: false }
    })
  }
  
  return models
}
