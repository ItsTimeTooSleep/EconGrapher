/**
 * API 提供商检测模块
 * 
 * 根据用户配置的 API endpoint 智能检测对应的提供商，
 * 用于动态显示对应的模型列表和优化用户体验。
 * 
 * @module provider-detector
 * @author EconGrapher Team
 */

/**
 * API 提供商类型
 */
export type ApiProvider = 
  | 'openai'
  | 'deepseek'
  | 'anthropic'
  | 'google'
  | 'azure'
  | 'openrouter'
  | 'together'
  | 'groq'
  | 'mistral'
  | 'moonshot'
  | 'zhipu'
  | 'ollama'
  | 'unknown'

/**
 * 提供商配置信息
 */
export interface ProviderConfig {
  id: ApiProvider
  name: string
  displayName: string
  patterns: RegExp[]
  defaultEndpoint: string
  description?: string
}

/**
 * 已知提供商配置列表
 */
export const PROVIDER_CONFIGS: ProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    displayName: 'OpenAI',
    patterns: [
      /api\.openai\.com/i,
      /openai\.com\/v1$/i
    ],
    defaultEndpoint: 'https://api.openai.com/v1',
    description: 'Official OpenAI API'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    displayName: 'DeepSeek',
    patterns: [
      /api\.deepseek\.com/i,
      /deepseek\.com\/v1$/i,
      /api\.deepseek\.com\/v1$/i
    ],
    defaultEndpoint: 'https://api.deepseek.com/v1',
    description: 'DeepSeek AI API'
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    displayName: 'Anthropic',
    patterns: [
      /api\.anthropic\.com/i,
      /anthropic\.com/i
    ],
    defaultEndpoint: 'https://api.anthropic.com/v1',
    description: 'Anthropic Claude API'
  },
  {
    id: 'google',
    name: 'Google',
    displayName: 'Google AI',
    patterns: [
      /generativelanguage\.googleapis\.com/i,
      /aiplatform\.googleapis\.com/i
    ],
    defaultEndpoint: 'https://generativelanguage.googleapis.com/v1',
    description: 'Google Gemini API'
  },
  {
    id: 'azure',
    name: 'Azure',
    displayName: 'Azure OpenAI',
    patterns: [
      /\.openai\.azure\.com/i,
      /azure\.com/i
    ],
    defaultEndpoint: '',
    description: 'Azure OpenAI Service'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    displayName: 'OpenRouter',
    patterns: [
      /openrouter\.ai/i
    ],
    defaultEndpoint: 'https://openrouter.ai/api/v1',
    description: 'OpenRouter API Gateway'
  },
  {
    id: 'together',
    name: 'Together',
    displayName: 'Together AI',
    patterns: [
      /api\.together\.xyz/i,
      /together\.ai/i
    ],
    defaultEndpoint: 'https://api.together.xyz/v1',
    description: 'Together AI API'
  },
  {
    id: 'groq',
    name: 'Groq',
    displayName: 'Groq',
    patterns: [
      /api\.groq\.com/i,
      /groq\.com/i
    ],
    defaultEndpoint: 'https://api.groq.com/openai/v1',
    description: 'Groq Fast Inference API'
  },
  {
    id: 'mistral',
    name: 'Mistral',
    displayName: 'Mistral AI',
    patterns: [
      /api\.mistral\.ai/i,
      /mistral\.ai/i
    ],
    defaultEndpoint: 'https://api.mistral.ai/v1',
    description: 'Mistral AI API'
  },
  {
    id: 'moonshot',
    name: 'Moonshot',
    displayName: 'Moonshot AI (Kimi)',
    patterns: [
      /api\.moonshot\.cn/i,
      /moonshot\.cn/i
    ],
    defaultEndpoint: 'https://api.moonshot.cn/v1',
    description: 'Moonshot Kimi API'
  },
  {
    id: 'zhipu',
    name: 'Zhipu',
    displayName: 'Zhipu AI (智谱)',
    patterns: [
      /open\.bigmodel\.cn/i,
      /bigmodel\.cn/i
    ],
    defaultEndpoint: 'https://open.bigmodel.cn/api/paas/v4',
    description: 'Zhipu AI GLM API'
  },
  {
    id: 'ollama',
    name: 'Ollama',
    displayName: 'Ollama (Local)',
    patterns: [
      /localhost:11434/i,
      /127\.0\.0\.1:11434/i,
      /:11434\/v1$/i
    ],
    defaultEndpoint: 'http://localhost:11434/v1',
    description: 'Ollama Local LLM'
  }
]

/**
 * 根据 endpoint URL 检测提供商
 * 
 * @param endpoint - API endpoint URL
 * @returns 检测到的提供商配置，如果无法识别则返回 unknown
 */
export function detectProvider(endpoint: string): ProviderConfig {
  if (!endpoint || typeof endpoint !== 'string') {
    return {
      id: 'unknown',
      name: 'Unknown',
      displayName: 'Custom Provider',
      patterns: [],
      defaultEndpoint: endpoint || ''
    }
  }

  const normalizedEndpoint = endpoint.trim().toLowerCase()
  
  for (const config of PROVIDER_CONFIGS) {
    for (const pattern of config.patterns) {
      if (pattern.test(normalizedEndpoint)) {
        return config
      }
    }
  }

  return {
    id: 'unknown',
    name: 'Unknown',
    displayName: 'Custom Provider',
    patterns: [],
    defaultEndpoint: endpoint
  }
}

/**
 * 获取提供商的显示名称
 * 
 * @param provider - 提供商ID或配置
 * @returns 显示名称
 */
export function getProviderDisplayName(provider: ApiProvider | ProviderConfig): string {
  if (typeof provider === 'string') {
    const config = PROVIDER_CONFIGS.find(c => c.id === provider)
    return config?.displayName || 'Custom Provider'
  }
  return provider.displayName
}

/**
 * 检查是否为已知提供商
 * 
 * @param provider - 提供商ID
 * @returns 是否为已知提供商
 */
export function isKnownProvider(provider: ApiProvider): boolean {
  return provider !== 'unknown'
}

/**
 * 获取所有已知提供商列表
 * 
 * @returns 提供商配置列表
 */
export function getAllProviders(): ProviderConfig[] {
  return PROVIDER_CONFIGS
}
