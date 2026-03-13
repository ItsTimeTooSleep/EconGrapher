'use client'

import { useState, useEffect, useMemo } from 'react'
import { Settings, X, Eye, EyeOff, CheckCircle, XCircle, Loader2, ExternalLink, Brain, RotateCcw, ChevronDown, ChevronUp, Sparkles, Zap, AlertCircle, Plus, Trash2, Edit2, Code } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { getApiSettings, saveApiSettings, clearApiSettings } from '@/lib/storage'
import { testApiConnection } from '@/lib/ai-service'
import type { ApiSettings, ApiParameters } from '@/lib/types'
import { DEFAULT_ENDPOINT, DEFAULT_MODEL, DEFAULT_PARAMETERS } from '@/lib/types'
import { detectProvider, type ApiProvider, type ProviderConfig } from '@/lib/provider-detector'
import { getProviderModels, detectThinkingModel, generateModelOptions, getProviderDefaultModel, type ModelPreset } from '@/lib/model-presets'
import { getProviderAdapter, getSupportedParameters, type ProviderAdapterConfig } from '@/lib/provider-adapter'
import { 
  getAvailableFormats, 
  getCustomFormats, 
  saveCustomFormat, 
  deleteCustomFormat,
  getProviderFormatType,
  type ApiFormatType,
  type CustomFormatConfig
} from '@/lib/api-format-adapter'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (settings: ApiSettings) => void
}

export default function SettingsModal({ open, onClose, onSave }: Props) {
  const [apiKey, setApiKey] = useState('')
  const [endpoint, setEndpoint] = useState(DEFAULT_ENDPOINT)
  const [model, setModel] = useState(DEFAULT_MODEL)
  const [customModel, setCustomModel] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [parameters, setParameters] = useState<ApiParameters>({ ...DEFAULT_PARAMETERS })
  const [formatType, setFormatType] = useState<ApiFormatType>('openai')
  const [customFormats, setCustomFormats] = useState<CustomFormatConfig[]>([])
  const [selectedCustomFormatId, setSelectedCustomFormatId] = useState<string | undefined>()
  const [showFormatEditor, setShowFormatEditor] = useState(false)
  const [editingFormat, setEditingFormat] = useState<CustomFormatConfig | null>(null)

  const provider = useMemo<ProviderConfig>(() => detectProvider(endpoint), [endpoint])
  const adapter = useMemo<ProviderAdapterConfig>(() => getProviderAdapter(provider.id), [provider.id])
  const supportedParams = useMemo<string[]>(() => getSupportedParameters(provider.id), [provider.id])
  const modelOptions = useMemo<ModelPreset[]>(() => generateModelOptions(provider.id), [provider.id])
  const isThinking = useMemo<boolean>(() => detectThinkingModel(model === 'custom' ? customModel : model), [model, customModel])
  const effectiveModel = model === 'custom' ? customModel : model
  const availableFormats = useMemo(() => getAvailableFormats(), [])
  const detectedFormatType = useMemo(() => getProviderFormatType(provider.id), [provider.id])

  useEffect(() => {
    if (open) {
      const saved = getApiSettings()
      if (saved) {
        setApiKey(saved.apiKey)
        setEndpoint(saved.endpoint || DEFAULT_ENDPOINT)
        setParameters(saved.parameters || { ...DEFAULT_PARAMETERS })
        setFormatType(saved.formatType || detectedFormatType)
        setSelectedCustomFormatId(saved.customFormatId)
        
        const modelPresets = getProviderModels(detectProvider(saved.endpoint).id)
        const isPresetModel = modelPresets.models.some(m => m.id === saved.model)
        setModel(isPresetModel ? saved.model : 'custom')
        if (!isPresetModel) setCustomModel(saved.model)
      }
      setCustomFormats(getCustomFormats())
      setTestResult(null)
    }
  }, [open, detectedFormatType])

  const handleEndpointChange = (value: string) => {
    setEndpoint(value)
    const newProvider = detectProvider(value)
    const defaultModel = getProviderDefaultModel(newProvider.id)
    const detectedFormat = getProviderFormatType(newProvider.id)
    setModel(defaultModel)
    setCustomModel('')
    setFormatType(detectedFormat)
    setTestResult(null)
  }

  const handleTest = async () => {
    if (!apiKey.trim()) return
    setTesting(true)
    setTestResult(null)
    const success = await testApiConnection({ 
      apiKey: apiKey.trim(), 
      endpoint: endpoint.trim(), 
      model: effectiveModel,
      parameters,
      formatType,
      customFormatId: formatType === 'custom' ? selectedCustomFormatId : undefined
    })
    setTestResult({ 
      success, 
      message: success 
        ? `Connected to ${provider.displayName} successfully!` 
        : 'Connection failed. Please check your API key and endpoint.' 
    })
    setTesting(false)
  }

  const handleSave = () => {
    if (!apiKey.trim()) return
    const settings: ApiSettings = {
      apiKey: apiKey.trim(),
      endpoint: endpoint.trim() || DEFAULT_ENDPOINT,
      model: effectiveModel || DEFAULT_MODEL,
      parameters,
      formatType,
      customFormatId: formatType === 'custom' ? selectedCustomFormatId : undefined
    }
    saveApiSettings(settings)
    onSave(settings)
    onClose()
  }

  const handleClear = () => {
    clearApiSettings()
    setApiKey('')
    setEndpoint(DEFAULT_ENDPOINT)
    setModel(DEFAULT_MODEL)
    setCustomModel('')
    setParameters({ ...DEFAULT_PARAMETERS })
    setFormatType('openai')
    setSelectedCustomFormatId(undefined)
    setTestResult(null)
  }

  const handleFormatChange = (value: ApiFormatType) => {
    setFormatType(value)
    if (value !== 'custom') {
      setSelectedCustomFormatId(undefined)
    }
    setTestResult(null)
  }

  const handleCreateCustomFormat = () => {
    const newFormat: CustomFormatConfig = {
      id: `custom-${Date.now()}`,
      name: 'New Custom Format',
      endpointTemplate: '/chat/completions',
      bodyTemplate: JSON.stringify({
        model: '{{model}}',
        messages: '{{messages}}',
        stream: '{{stream}}'
      }, null, 2),
      responsePath: {
        content: 'choices[0].message.content',
        thinking: 'choices[0].message.reasoning_content',
        finishReason: 'choices[0].finish_reason'
      },
      streamConfig: {
        doneMarker: '[DONE]',
        contentPath: 'choices[0].delta.content',
        thinkingPath: 'choices[0].delta.reasoning_content'
      }
    }
    setEditingFormat(newFormat)
    setShowFormatEditor(true)
  }

  const handleEditCustomFormat = (format: CustomFormatConfig) => {
    setEditingFormat({ ...format })
    setShowFormatEditor(true)
  }

  const handleDeleteCustomFormat = (id: string) => {
    deleteCustomFormat(id)
    setCustomFormats(getCustomFormats())
    if (selectedCustomFormatId === id) {
      setSelectedCustomFormatId(undefined)
    }
  }

  const handleSaveCustomFormat = () => {
    if (!editingFormat) return
    saveCustomFormat(editingFormat)
    setCustomFormats(getCustomFormats())
    setSelectedCustomFormatId(editingFormat.id)
    setShowFormatEditor(false)
    setEditingFormat(null)
  }

  const handleResetParameters = () => {
    const providerDefaults = {
      temperature: adapter.parameters.temperature.default,
      maxTokens: undefined,
      topP: undefined,
      frequencyPenalty: undefined,
      presencePenalty: undefined
    }
    setParameters(providerDefaults)
  }

  const handleParameterChange = (key: keyof ApiParameters, value: number | undefined) => {
    setParameters(prev => ({ ...prev, [key]: value }))
  }

  const isParameterModified = (key: keyof ApiParameters): boolean => {
    const providerDefaults = {
      temperature: adapter.parameters.temperature.default,
      maxTokens: undefined,
      topP: undefined,
      frequencyPenalty: undefined,
      presencePenalty: undefined
    }
    return parameters[key] !== providerDefaults[key]
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border text-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Settings className="w-4 h-4 text-primary" />
            API Configuration
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          {/* Provider Badge */}
          {provider.id !== 'unknown' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Detected: {provider.displayName}
              </span>
              {provider.description && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {provider.description}
                </span>
              )}
            </div>
          )}

          {/* Security notice */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground leading-relaxed">
            Your API key is stored only in your browser using localStorage obfuscation. 
            No data is sent to our servers. Use a restricted-scope key for added security.
            {' '}
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer"
              className="text-primary inline-flex items-center gap-1 hover:underline">
              Get a key <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* API Key */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="api-key" className="text-foreground text-sm font-medium">API Key</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                placeholder="sk-..."
                value={apiKey}
                onChange={e => { setApiKey(e.target.value); setTestResult(null) }}
                className="pr-10 bg-input border-border text-foreground placeholder:text-muted-foreground font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Endpoint */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="endpoint" className="text-foreground text-sm font-medium">
              API Endpoint
              <span className="ml-2 text-xs text-muted-foreground font-normal">(OpenAI compatible)</span>
            </Label>
            <Input
              id="endpoint"
              type="url"
              placeholder="https://api.openai.com/v1"
              value={endpoint}
              onChange={e => handleEndpointChange(e.target.value)}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground font-mono text-sm"
            />
          </div>

          {/* API Format */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-foreground text-sm font-medium">
                API Format
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  (Auto-detected: {availableFormats.find(f => f.type === detectedFormatType)?.name})
                </span>
              </Label>
              {formatType === 'custom' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCreateCustomFormat}
                  className="h-6 px-2 text-xs text-primary hover:text-primary"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  New Format
                </Button>
              )}
            </div>
            <Select value={formatType} onValueChange={handleFormatChange}>
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {availableFormats.map(f => (
                  <SelectItem key={f.type} value={f.type} className="text-foreground focus:bg-accent">
                    <div className="flex items-center gap-2">
                      {f.type === 'custom' && <Code className="w-3.5 h-3.5 text-primary" />}
                      <span>{f.name}</span>
                      <span className="text-xs text-muted-foreground">- {f.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Custom Format Selection */}
            {formatType === 'custom' && customFormats.length > 0 && (
              <div className="mt-2 space-y-2">
                <Label className="text-xs text-muted-foreground">Select Custom Format:</Label>
                <div className="flex flex-col gap-1">
                  {customFormats.map(cf => (
                    <div 
                      key={cf.id}
                      className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${
                        selectedCustomFormatId === cf.id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedCustomFormatId(cf.id)}
                    >
                      <span className="text-sm">{cf.name}</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleEditCustomFormat(cf) }}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleDeleteCustomFormat(cf.id) }}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {formatType === 'custom' && customFormats.length === 0 && (
              <div className="text-xs text-muted-foreground bg-muted/30 border border-border rounded p-2">
                No custom formats defined. Click "New Format" to create one.
              </div>
            )}
          </div>

          {/* Model */}
          <div className="flex flex-col gap-2">
            <Label className="text-foreground text-sm font-medium">Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border max-h-60">
                {modelOptions.map(m => {
                  const isModelThinking = m.id !== 'custom' && detectThinkingModel(m.id)
                  return (
                    <SelectItem key={m.id} value={m.id} className="text-foreground focus:bg-accent">
                      <div className="flex items-center gap-2">
                        {isModelThinking && <Brain className="w-3.5 h-3.5 text-primary" />}
                        {m.features.isFast && m.id !== 'custom' && <Zap className="w-3 h-3.5 text-amber-500" />}
                        <span>{m.displayName}</span>
                        {m.recommended && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">Recommended</span>
                        )}
                        {isModelThinking && <span className="text-[10px] text-primary/70">(thinking)</span>}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            {model === 'custom' && (
              <Input
                placeholder="Enter model name, e.g. gpt-4-turbo-preview"
                value={customModel}
                onChange={e => { setCustomModel(e.target.value); setTestResult(null) }}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground text-sm"
              />
            )}
            {isThinking && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                <Brain className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  This is a <strong className="text-primary">thinking model</strong> that shows its reasoning process before responding.
                  Temperature and other sampling parameters are not supported.
                </span>
              </div>
            )}
          </div>

          {/* Advanced Parameters */}
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-medium text-foreground"
            >
              <span className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Advanced Parameters
              </span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showAdvanced && (
              <div className="p-4 space-y-5 bg-card">
                {/* Provider-specific info */}
                {adapter.provider !== 'unknown' && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 border border-border rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Parameters are adjusted for <strong className="text-foreground">{adapter.name}</strong>. 
                      Some parameters may not be supported by this provider.
                    </span>
                  </div>
                )}

                {/* Temperature */}
                {adapter.parameters.temperature.supported && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-foreground">
                        Temperature
                        <span className="ml-2 text-xs text-muted-foreground font-normal">
                          ({adapter.parameters.temperature.min}-{adapter.parameters.temperature.max}: 0 = deterministic, {adapter.parameters.temperature.max} = creative)
                        </span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-primary min-w-[3rem] text-right">
                          {parameters.temperature.toFixed(2)}
                        </span>
                        {isParameterModified('temperature') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleParameterChange('temperature', adapter.parameters.temperature.default)}
                            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Reset
                          </Button>
                        )}
                      </div>
                    </div>
                    <Slider
                      value={[parameters.temperature]}
                      min={adapter.parameters.temperature.min}
                      max={adapter.parameters.temperature.max}
                      step={0.01}
                      onValueChange={([value]) => handleParameterChange('temperature', value)}
                      disabled={isThinking}
                      className={isThinking ? 'opacity-50' : ''}
                    />
                  </div>
                )}

                {/* Max Tokens */}
                {adapter.parameters.maxTokens.supported && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="max-tokens" className="text-sm font-medium text-foreground">
                        Max Tokens
                        <span className="ml-2 text-xs text-muted-foreground font-normal">
                          {adapter.parameters.maxTokens.max ? `(Max: ${adapter.parameters.maxTokens.max})` : '(Leave empty for auto)'}
                        </span>
                      </Label>
                      {isParameterModified('maxTokens') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleParameterChange('maxTokens', undefined)}
                          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Reset
                        </Button>
                      )}
                    </div>
                    <Input
                      id="max-tokens"
                      type="number"
                      placeholder="Auto"
                      value={parameters.maxTokens || ''}
                      onChange={e => handleParameterChange('maxTokens', e.target.value ? parseInt(e.target.value) : undefined)}
                      disabled={isThinking}
                      className={`bg-input border-border text-foreground text-sm ${isThinking ? 'opacity-50' : ''}`}
                    />
                  </div>
                )}

                {/* Top P */}
                {adapter.parameters.topP.supported && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-foreground">
                        Top P
                        <span className="ml-2 text-xs text-muted-foreground font-normal">
                          (Nucleus sampling: {adapter.parameters.topP.min}-{adapter.parameters.topP.max})
                        </span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-primary min-w-[3rem] text-right">
                          {parameters.topP !== undefined ? parameters.topP.toFixed(2) : 'auto'}
                        </span>
                        {isParameterModified('topP') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleParameterChange('topP', undefined)}
                            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Reset
                          </Button>
                        )}
                      </div>
                    </div>
                    <Slider
                      value={[parameters.topP ?? 1]}
                      min={adapter.parameters.topP.min}
                      max={adapter.parameters.topP.max}
                      step={0.01}
                      onValueChange={([value]) => handleParameterChange('topP', value)}
                      disabled={isThinking}
                      className={isThinking ? 'opacity-50' : ''}
                    />
                  </div>
                )}

                {/* Frequency Penalty */}
                {adapter.parameters.frequencyPenalty.supported && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-foreground">
                        Frequency Penalty
                        <span className="ml-2 text-xs text-muted-foreground font-normal">
                          (Reduce repetition: {adapter.parameters.frequencyPenalty.min} to {adapter.parameters.frequencyPenalty.max})
                        </span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-primary min-w-[3rem] text-right">
                          {parameters.frequencyPenalty !== undefined ? parameters.frequencyPenalty.toFixed(2) : '0'}
                        </span>
                        {isParameterModified('frequencyPenalty') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleParameterChange('frequencyPenalty', undefined)}
                            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Reset
                          </Button>
                        )}
                      </div>
                    </div>
                    <Slider
                      value={[parameters.frequencyPenalty ?? 0]}
                      min={adapter.parameters.frequencyPenalty.min}
                      max={adapter.parameters.frequencyPenalty.max}
                      step={0.01}
                      onValueChange={([value]) => handleParameterChange('frequencyPenalty', value)}
                      disabled={isThinking}
                      className={isThinking ? 'opacity-50' : ''}
                    />
                  </div>
                )}

                {/* Presence Penalty */}
                {adapter.parameters.presencePenalty.supported && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-foreground">
                        Presence Penalty
                        <span className="ml-2 text-xs text-muted-foreground font-normal">
                          (Encourage new topics: {adapter.parameters.presencePenalty.min} to {adapter.parameters.presencePenalty.max})
                        </span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-primary min-w-[3rem] text-right">
                          {parameters.presencePenalty !== undefined ? parameters.presencePenalty.toFixed(2) : '0'}
                        </span>
                        {isParameterModified('presencePenalty') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleParameterChange('presencePenalty', undefined)}
                            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Reset
                          </Button>
                        )}
                      </div>
                    </div>
                    <Slider
                      value={[parameters.presencePenalty ?? 0]}
                      min={adapter.parameters.presencePenalty.min}
                      max={adapter.parameters.presencePenalty.max}
                      step={0.01}
                      onValueChange={([value]) => handleParameterChange('presencePenalty', value)}
                      disabled={isThinking}
                      className={isThinking ? 'opacity-50' : ''}
                    />
                  </div>
                )}

                {/* Unsupported parameters notice */}
                {supportedParams.length < 5 && (
                  <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      This provider does not support: {['temperature', 'maxTokens', 'topP', 'frequencyPenalty', 'presencePenalty']
                        .filter(p => !supportedParams.includes(p))
                        .map(p => p.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()))
                        .join(', ')}
                    </span>
                  </div>
                )}

                {/* Reset All */}
                <div className="pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetParameters}
                    className="w-full text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="w-3 h-3 mr-2" />
                    Reset All Parameters to Default
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`rounded-lg border p-3 text-xs flex items-start gap-2 ${
              testResult.success
                ? 'border-green-500/30 bg-green-500/10 text-green-300'
                : 'border-red-500/30 bg-red-500/10 text-red-300'
            }`}>
              {testResult.success
                ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs"
            >
              <X className="w-3 h-3 mr-1" /> Clear saved key
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={!apiKey.trim() || testing}
                className="border-border text-foreground hover:bg-accent text-xs"
              >
                {testing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                Test Connection
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!apiKey.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
              >
                Save & Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Custom Format Editor Dialog */}
      <Dialog open={showFormatEditor} onOpenChange={setShowFormatEditor}>
        <DialogContent className="sm:max-w-2xl bg-card border-border text-foreground max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Code className="w-4 h-4 text-primary" />
              {editingFormat?.id.startsWith('custom-') && !customFormats.some(f => f.id === editingFormat?.id) 
                ? 'Create Custom Format' 
                : 'Edit Custom Format'}
            </DialogTitle>
          </DialogHeader>
          
          {editingFormat && (
            <div className="flex flex-col gap-4 py-2">
              {/* Format Name */}
              <div className="flex flex-col gap-2">
                <Label className="text-foreground text-sm font-medium">Format Name</Label>
                <Input
                  value={editingFormat.name}
                  onChange={e => setEditingFormat({ ...editingFormat, name: e.target.value })}
                  className="bg-input border-border text-foreground text-sm"
                  placeholder="My Custom API Format"
                />
              </div>

              {/* Endpoint Template */}
              <div className="flex flex-col gap-2">
                <Label className="text-foreground text-sm font-medium">
                  Endpoint Path
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    (Appended to base URL)
                  </span>
                </Label>
                <Input
                  value={editingFormat.endpointTemplate}
                  onChange={e => setEditingFormat({ ...editingFormat, endpointTemplate: e.target.value })}
                  className="bg-input border-border text-foreground font-mono text-sm"
                  placeholder="/chat/completions"
                />
              </div>

              {/* Body Template */}
              <div className="flex flex-col gap-2">
                <Label className="text-foreground text-sm font-medium">
                  Request Body Template
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    {"(JSON with {{variable}} placeholders)"}
                  </span>
                </Label>
                <textarea
                  value={editingFormat.bodyTemplate}
                  onChange={e => setEditingFormat({ ...editingFormat, bodyTemplate: e.target.value })}
                  className="bg-input border-border text-foreground font-mono text-xs p-3 rounded-md min-h-[150px] resize-y"
                  placeholder={JSON.stringify({
                    model: '{{model}}',
                    messages: '{{messages}}',
                    stream: '{{stream}}',
                    temperature: '{{temperature}}'
                  }, null, 2)}
                />
                <div className="text-xs text-muted-foreground">
                  Available variables: model, messages, stream, temperature, maxTokens, topP, frequencyPenalty, presencePenalty
                </div>
              </div>

              {/* Response Path */}
              <div className="flex flex-col gap-2">
                <Label className="text-foreground text-sm font-medium">Response Paths</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Content Path</Label>
                    <Input
                      value={editingFormat.responsePath.content}
                      onChange={e => setEditingFormat({
                        ...editingFormat,
                        responsePath: { ...editingFormat.responsePath, content: e.target.value }
                      })}
                      className="bg-input border-border text-foreground font-mono text-xs"
                      placeholder="choices[0].message.content"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Thinking Path (optional)</Label>
                    <Input
                      value={editingFormat.responsePath.thinking || ''}
                      onChange={e => setEditingFormat({
                        ...editingFormat,
                        responsePath: { ...editingFormat.responsePath, thinking: e.target.value || undefined }
                      })}
                      className="bg-input border-border text-foreground font-mono text-xs"
                      placeholder="choices[0].message.reasoning_content"
                    />
                  </div>
                </div>
              </div>

              {/* Stream Config */}
              <div className="flex flex-col gap-2">
                <Label className="text-foreground text-sm font-medium">Stream Configuration</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Done Marker</Label>
                    <Input
                      value={editingFormat.streamConfig?.doneMarker || ''}
                      onChange={e => setEditingFormat({
                        ...editingFormat,
                        streamConfig: { 
                          ...editingFormat.streamConfig, 
                          doneMarker: e.target.value,
                          contentPath: editingFormat.streamConfig?.contentPath || '',
                          thinkingPath: editingFormat.streamConfig?.thinkingPath
                        }
                      })}
                      className="bg-input border-border text-foreground font-mono text-xs"
                      placeholder="[DONE]"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Stream Content Path</Label>
                    <Input
                      value={editingFormat.streamConfig?.contentPath || ''}
                      onChange={e => setEditingFormat({
                        ...editingFormat,
                        streamConfig: { 
                          ...editingFormat.streamConfig, 
                          contentPath: e.target.value,
                          doneMarker: editingFormat.streamConfig?.doneMarker || '[DONE]',
                          thinkingPath: editingFormat.streamConfig?.thinkingPath
                        }
                      })}
                      className="bg-input border-border text-foreground font-mono text-xs"
                      placeholder="choices[0].delta.content"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowFormatEditor(false); setEditingFormat(null) }}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveCustomFormat}
                  className="bg-primary text-primary-foreground text-xs"
                >
                  Save Format
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
