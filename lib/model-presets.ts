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
  'deepseek-v4',
  'o1',
  'o1-mini',
  'o1-preview',
  'o3',
  'o3-mini',
  'o4',
  'o4-mini',
  'reasoner',
  'r1',
  'thinking',
  'v4'
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
  { id: 'gpt-5.4', displayName: 'GPT-5.4', features: { isThinking: false, isVision: true, isFast: true, isReasoning: false }, recommended: true, description: 'Latest flagship model' },
  { id: 'gpt-4.1', displayName: 'GPT-4.1', features: { isThinking: false, isVision: true, isFast: true, isReasoning: false }, description: 'Enhanced GPT-4 model' },
  { id: 'gpt-4o', displayName: 'GPT-4o', features: { isThinking: false, isVision: true, isFast: true, isReasoning: false }, description: 'Previous flagship' },
  { id: 'gpt-4o-mini', displayName: 'GPT-4o Mini', features: { isThinking: false, isVision: true, isFast: true, isReasoning: false }, description: 'Fast and affordable' },
  { id: 'o4', displayName: 'o4', features: { isThinking: true, isVision: false, isFast: false, isReasoning: true }, recommended: true, description: 'Latest reasoning model' },
  { id: 'o4-mini', displayName: 'o4 Mini', features: { isThinking: true, isVision: false, isFast: true, isReasoning: true }, description: 'Fast reasoning model' },
  { id: 'o3-mini', displayName: 'o3 Mini', features: { isThinking: true, isVision: false, isFast: true, isReasoning: true }, description: 'Previous reasoning model' }
]

/**
 * DeepSeek 模型预设
 */
export const DEEPSEEK_MODELS: ModelPreset[] = [
  { id: 'deepseek-reasoner', displayName: 'DeepSeek Reasoner (R1)', features: { isThinking: true, isVision: false, isFast: false, isReasoning: true }, recommended: true, description: 'Advanced reasoning model' },
  { id: 'deepseek-chat', displayName: 'DeepSeek Chat', features: { isThinking: false, isVision: false, isFast: true, isReasoning: false }, description: 'General purpose chat' }
]

/**
 * Anthropic 模型预设
 */
export const ANTHROPIC_MODELS: ModelPreset[] = [
  { id: 'claude-4-opus', displayName: 'Claude 4 Opus', features: { isThinking: false, isVision: true, isFast: false, isReasoning: false }, recommended: true, description: 'Most powerful Claude' },
  { id: 'claude-4-sonnet', displayName: 'Claude 4 Sonnet', features: { isThinking: false, isVision: true, isFast: true, isReasoning: false }, recommended: true, description: 'Latest flagship model' },
  { id: 'claude-4-haiku', displayName: 'Claude 4 Haiku', features: { isThinking: false, isVision: true, isFast: true, isReasoning: false }, description: 'Fast and efficient' },
  { id: 'claude-3-5-sonnet-20241022', displayName: 'Claude 3.5 Sonnet', features: { isThinking: false, isVision: true, isFast: true, isReasoning: false }, description: 'Previous generation' }
]

/**
 * Google 模型预设
 */
export const GOOGLE_MODELS: ModelPreset[] = [
  { id: 'gemini-3.1-pro', displayName: 'Gemini 3.1 Pro', features: { isThinking: false, isVision: true, isFast: false, isReasoning: false }, recommended: true, description: 'Most capable model' },
  { id: 'gemini-3.0-flash', displayName: 'Gemini 3.0 Flash', features: { isThinking: false, isVision: true, isFast: true, isReasoning: false }, recommended: true, description: 'Latest fast model' },
  { id: 'gemini-2.0-flash', displayName: 'Gemini 2.0 Flash', features: { isThinking: false, isVision: true, isFast: true, isReasoning: false }, description: 'Previous generation' },
  { id: 'gemini-2.0-flash-lite', displayName: 'Gemini 2.0 Flash Lite', features: { isThinking: false, isVision: true, isFast: true, isReasoning: false }, description: 'Lightweight version' }
]

/**
 * Groq 模型预设
 */
export const GROQ_MODELS: ModelPreset[] = [
  { id: 'llama-4-scout-17b-16e-instruct', displayName: 'Llama 4 Scout 17B', features: { isThinking: false, isVision: false, isFast: true, isReasoning: false }, recommended: true, description: 'Latest Llama model' },
  { id: 'llama-3.3-70b-versatile', displayName: 'Llama 3.3 70B', features: { isThinking: false, isVision: false, isFast: true, isReasoning: false }, description: 'Versatile model' },
  { id: 'llama-3.1-70b-versatile', displayName: 'Llama 3.1 70B', features: { isThinking: false, isVision: false, isFast: true, isReasoning: false }, description: 'Previous generation' },
  { id: 'qwen-3-72b-instruct', displayName: 'Qwen 3 72B', features: { isThinking: false, isVision: true, isFast: true, isReasoning: false }, description: 'Qwen vision model' }
]

/**
 * Mistral 模型预设
 */
export const MISTRAL_MODELS: ModelPreset[] = [
  { id: 'mistral-neural-7b', displayName: 'Mistral Neural 7B', features: { isThinking: false, isVision: true, isFast: true, isReasoning: false }, recommended: true, description: 'Latest flagship model' },
  { id: 'mistral-large-3', displayName: 'Mistral Large 3', features: { isThinking: false, isVision: true, isFast: false, isReasoning: false }, recommended: true, description: 'Powerful vision model' },
  { id: 'codestral-mamba-2501', displayName: 'Codestral Mamba', features: { isThinking: false, isVision: false, isFast: true, isReasoning: false }, description: 'Code specialized' }
]

/**
 * Moonshot 模型预设
 */
export const MOONSHOT_MODELS: ModelPreset[] = [
  { id: 'moonshot-v2-32k', displayName: 'Moonshot V2 32K', features: { isThinking: false, isVision: true, isFast: true, isReasoning: false }, recommended: true, description: 'Latest with vision' },
  { id: 'moonshot-v2-128k', displayName: 'Moonshot V2 128K', features: { isThinking: false, isVision: true, isFast: false, isReasoning: false }, description: 'Long context vision' },
  { id: 'moonshot-v1-32k', displayName: 'Moonshot V1 32K', features: { isThinking: false, isVision: false, isFast: false, isReasoning: false }, description: 'Previous generation' }
]

/**
 * Zhipu 模型预设
 */
export const ZHIPU_MODELS: ModelPreset[] = [
  { id: 'glm-5-pro', displayName: 'GLM-5 Pro', features: { isThinking: false, isVision: true, isFast: false, isReasoning: false }, recommended: true, description: 'Latest flagship model' },
  { id: 'glm-5-flash', displayName: 'GLM-5 Flash', features: { isThinking: false, isVision: true, isFast: true, isReasoning: false }, description: 'Fast vision model' },
  { id: 'glm-4-plus', displayName: 'GLM-4 Plus', features: { isThinking: false, isVision: false, isFast: false, isReasoning: false }, description: 'Previous generation' }
]

/**
 * OpenRouter 模型预设 (精选)
 */
export const OPENROUTER_MODELS: ModelPreset[] = [
  { id: 'openai/gpt-5.4', displayName: 'GPT-5.4 (via OpenRouter)', features: { isThinking: false, isVision: true, isFast: true, isReasoning: false }, recommended: true },
  { id: 'openai/o4', displayName: 'o4 (via OpenRouter)', features: { isThinking: true, isVision: false, isFast: false, isReasoning: true } },
  { id: 'anthropic/claude-4-sonnet', displayName: 'Claude 4 Sonnet', features: { isThinking: false, isVision: true, isFast: true, isReasoning: false } },
  { id: 'deepseek/deepseek-v4', displayName: 'DeepSeek V4', features: { isThinking: true, isVision: true, isFast: false, isReasoning: true } },
  { id: 'google/gemini-3.1-pro', displayName: 'Gemini 3.1 Pro', features: { isThinking: false, isVision: true, isFast: false, isReasoning: false } }
]

/**
 * Together AI 模型预设
 */
export const TOGETHER_MODELS: ModelPreset[] = [
  { id: 'meta-llama/Llama-4-Scout-17B-16E-Instruct', displayName: 'Llama 4 Scout 17B', features: { isThinking: false, isVision: false, isFast: true, isReasoning: false }, recommended: true },
  { id: 'deepseek-ai/DeepSeek-V4', displayName: 'DeepSeek V4', features: { isThinking: true, isVision: true, isFast: false, isReasoning: true } },
  { id: 'Qwen/Qwen3-72B-Instruct', displayName: 'Qwen 3 72B', features: { isThinking: false, isVision: true, isFast: true, isReasoning: false } },
  { id: 'mistralai/Mistral-Neural-7B', displayName: 'Mistral Neural 7B', features: { isThinking: false, isVision: true, isFast: true, isReasoning: false } }
]

/**
 * 提供商模型预设映射
 */
export const PROVIDER_MODEL_PRESETS: Record<ApiProvider, ProviderModelPresets> = {
  openai: { provider: 'openai', models: OPENAI_MODELS, defaultModel: 'gpt-5.4' },
  deepseek: { provider: 'deepseek', models: DEEPSEEK_MODELS, defaultModel: 'deepseek-v4' },
  anthropic: { provider: 'anthropic', models: ANTHROPIC_MODELS, defaultModel: 'claude-4-sonnet' },
  google: { provider: 'google', models: GOOGLE_MODELS, defaultModel: 'gemini-3.0-flash' },
  azure: { provider: 'azure', models: OPENAI_MODELS, defaultModel: 'gpt-5.4' },
  openrouter: { provider: 'openrouter', models: OPENROUTER_MODELS, defaultModel: 'openai/gpt-5.4' },
  together: { provider: 'together', models: TOGETHER_MODELS, defaultModel: 'meta-llama/Llama-4-Scout-17B-16E-Instruct' },
  groq: { provider: 'groq', models: GROQ_MODELS, defaultModel: 'llama-4-scout-17b-16e-instruct' },
  mistral: { provider: 'mistral', models: MISTRAL_MODELS, defaultModel: 'mistral-neural-7b' },
  moonshot: { provider: 'moonshot', models: MOONSHOT_MODELS, defaultModel: 'moonshot-v2-32k' },
  zhipu: { provider: 'zhipu', models: ZHIPU_MODELS, defaultModel: 'glm-5-pro' },
  ollama: { provider: 'ollama', models: [], defaultModel: 'llama4' },
  unknown: { provider: 'unknown', models: [], defaultModel: 'gpt-5.4' }
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
