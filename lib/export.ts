import type { Message, Session, ChartData, MessageBranch } from './types'
import { getStoredRawRequests, exportRawRequests, type RequestResponsePair } from './ai-service'

interface ExportOptions {
  format: 'json' | 'markdown'
  includeChartDetails: boolean
}

interface ExportData {
  session: Session | null
  messages: Message[]
  exportedAt: string
}

/**
 * 格式化时间戳为可读字符串
 * @param timestamp - Unix 时间戳（毫秒）
 * @returns 格式化后的日期时间字符串
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * 获取图表类型的中文描述
 * @param chartType - 图表类型标识
 * @returns 图表类型的中文名称
 */
function getChartTypeName(chartType: string): string {
  const chartTypeNames: Record<string, string> = {
    chart: '经济学图表',
    supply_demand: '供需曲线',
    ad_as: '总需求-总供给模型',
    cost_curves: '成本曲线',
    money_market: '货币市场',
    phillips_curve: '菲利普斯曲线',
    loanable_funds: '可贷资金市场',
    ppc: '生产可能性曲线',
    consumer_producer_surplus: '消费者与生产者剩余',
    price_control: '价格管制',
    tax_subsidy: '税收与补贴',
    perfect_competition: '完全竞争',
    monopoly: '垄断',
    natural_monopoly: '自然垄断',
    monopolistic_competition: '垄断竞争',
    labor_market: '劳动力市场',
    monopsony: '买方垄断',
    externality: '外部性',
    lorenz_curve: '洛伦兹曲线',
    business_cycle: '经济周期',
    reserve_market: '准备金市场',
    forex_market: '外汇市场',
    balance_of_payments: '国际收支平衡',
    circular_flow: '循环流向图',
    multi_chart: '多图表组合'
  }
  return chartTypeNames[chartType] || chartType
}

/**
 * 将图表数据转换为 Markdown 格式的描述
 * @param chart - 图表数据对象
 * @param indent - 缩进空格数
 * @returns Markdown 格式的图表描述
 */
function chartToMarkdown(chart: ChartData, indent: number = 0): string {
  const spaces = ' '.repeat(indent)
  let md = `${spaces}### 📊 图表: ${chart.title}\n\n`
  md += `${spaces}- **类型**: ${getChartTypeName(chart.type)}\n`

  if (chart.xLabel) {
    md += `${spaces}- **X轴**: ${chart.xLabel}\n`
  }
  if (chart.yLabel) {
    md += `${spaces}- **Y轴**: ${chart.yLabel}\n`
  }

  if (chart.curves && chart.curves.length > 0) {
    md += `${spaces}- **曲线**:\n`
    chart.curves.forEach((curve) => {
      md += `${spaces}  - ${curve.label} (${curve.type})\n`
    })
  }

  if (chart.points && chart.points.length > 0) {
    md += `${spaces}- **点**:\n`
    chart.points.forEach((point) => {
      if (point.label) {
        md += `${spaces}  - ${point.label}\n`
      }
    })
  }

  if (chart.areas && chart.areas.length > 0) {
    md += `${spaces}- **区域**:\n`
    chart.areas.forEach((area) => {
      if (area.label) {
        md += `${spaces}  - ${area.label}\n`
      }
    })
  }

  if (chart.charts && chart.charts.length > 0) {
    md += `\n${spaces}#### 子图表:\n\n`
    chart.charts.forEach((subChart) => {
      md += chartToMarkdown(subChart, indent + 2)
      md += '\n'
    })
  }

  return md
}

/**
 * 将消息分支转换为 Markdown 格式
 * @param branches - 消息分支数组
 * @param currentIndex - 当前分支索引
 * @param role - 消息角色
 * @param indent - 缩进空格数
 * @returns Markdown 格式的分支描述
 */
function branchesToMarkdown(
  branches: MessageBranch[],
  currentIndex: number,
  role: 'user' | 'assistant',
  indent: number = 0
): string {
  const spaces = ' '.repeat(indent)
  let md = `${spaces}#### 🔄 消息分支 (共 ${branches.length} 个版本)\n\n`

  branches.forEach((branch, index) => {
    const isCurrent = index === currentIndex
    const marker = isCurrent ? '✅ **[当前版本]**' : '📌'
    const time = formatTimestamp(branch.timestamp)

    md += `${spaces}${marker} **分支 ${index + 1}** - ${time}\n`

    if (branch.content) {
      md += `${spaces}> ${branch.content.split('\n').join(`\n${spaces}> `)}\n`
    }

    if (role === 'assistant' && branch.chart) {
      md += '\n'
      md += chartToMarkdown(branch.chart, indent + 2)
    }

    if (branch.analysis) {
      md += `${spaces}- **变化类型**: ${branch.analysis.changeType}\n`
      md += `${spaces}- **市场**: ${branch.analysis.market}\n`
      md += `${spaces}- **影响**: ${branch.analysis.impact}\n`
      if (branch.analysis.additionalNotes) {
        md += `${spaces}- **备注**: ${branch.analysis.additionalNotes}\n`
      }
    }

    md += '\n'
  })

  return md
}

/**
 * 将单条消息转换为 Markdown 格式
 * @param message - 消息对象
 * @param includeChartDetails - 是否包含图表详细信息
 * @returns Markdown 格式的消息内容
 */
function messageToMarkdown(message: Message, includeChartDetails: boolean): string {
  const time = formatTimestamp(message.timestamp)
  const roleLabel = message.role === 'user' ? '👤 **用户**' : '🤖 **助手**'

  let md = `## ${roleLabel} - ${time}\n\n`

  if (message.content) {
    md += `${message.content}\n\n`
  }

  if (message.role === 'assistant' && message.chart && includeChartDetails) {
    md += chartToMarkdown(message.chart)
    md += '\n'
  }

  if (message.role === 'assistant' && message.analysis) {
    md += `### 📈 效应分析\n\n`
    md += `- **变化类型**: ${message.analysis.changeType}\n`
    md += `- **市场**: ${message.analysis.market}\n`
    md += `- **影响**: ${message.analysis.impact}\n`
    if (message.analysis.additionalNotes) {
      md += `- **备注**: ${message.analysis.additionalNotes}\n`
    }
    md += '\n'
  }

  if (message.branches && message.branches.length > 1) {
    md += branchesToMarkdown(
      message.branches,
      message.currentBranchIndex || 0,
      message.role
    )
    md += '\n'
  }

  md += '---\n\n'

  return md
}

/**
 * 将聊天数据导出为 Markdown 格式
 * @param data - 导出数据对象
 * @param options - 导出选项
 * @returns Markdown 格式的字符串
 */
function exportToMarkdown(data: ExportData, options: ExportOptions): string {
  let md = `# 💬 聊天记录导出\n\n`

  md += `> 导出时间: ${data.exportedAt}\n\n`

  if (data.session) {
    md += `## 📋 会话信息\n\n`
    md += `- **标题**: ${data.session.title}\n`
    md += `- **创建时间**: ${formatTimestamp(data.session.createdAt)}\n`
    md += `- **更新时间**: ${formatTimestamp(data.session.updatedAt)}\n`
    md += `- **预览**: ${data.session.preview}\n\n`
  }

  md += `---\n\n`

  md += `## 💭 消息记录\n\n`

  if (data.messages.length === 0) {
    md += `*暂无消息*\n`
  } else {
    data.messages.forEach((message) => {
      md += messageToMarkdown(message, options.includeChartDetails)
    })
  }

  md += `\n---\n\n`
  md += `*由 EconGrapher 导出*\n`

  return md
}

/**
 * 将聊天数据导出为 JSON 格式
 * @param data - 导出数据对象
 * @returns JSON 格式的字符串
 */
function exportToJson(data: ExportData): string {
  return JSON.stringify(data, null, 2)
}

/**
 * 触发文件下载
 * @param content - 文件内容
 * @param filename - 文件名
 * @param mimeType - MIME 类型
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 生成导出文件名
 * @param session - 会话对象（可选）
 * @param format - 导出格式
 * @returns 文件名字符串
 */
function generateFilename(session: Session | null, format: 'json' | 'markdown'): string {
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0]
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-')

  let baseName = 'chat-export'
  if (session?.title) {
    const safeTitle = session.title
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)
    baseName = safeTitle || baseName
  }

  const ext = format === 'json' ? 'json' : 'md'
  return `${baseName}_${dateStr}_${timeStr}.${ext}`
}

/**
 * 导出聊天记录
 * @param session - 当前会话对象
 * @param messages - 消息列表
 * @param options - 导出选项
 * @returns 导出是否成功
 */
export function exportChat(
  session: Session | null,
  messages: Message[],
  options: ExportOptions = { format: 'markdown', includeChartDetails: true }
): boolean {
  try {
    const exportData: ExportData = {
      session,
      messages: messages.map(m => ({
        ...m,
        isLoading: false
      })),
      exportedAt: new Date().toLocaleString('zh-CN')
    }

    let content: string
    let mimeType: string
    let filename: string

    if (options.format === 'json') {
      content = exportToJson(exportData)
      mimeType = 'application/json'
    } else {
      content = exportToMarkdown(exportData, options)
      mimeType = 'text/markdown'
    }

    filename = generateFilename(session, options.format)
    downloadFile(content, filename, mimeType)

    return true
  } catch (error) {
    console.error('Export failed:', error)
    return false
  }
}

/**
 * 检查输入是否为斜杠命令
 * @param text - 输入文本
 * @returns 命令名称，如果不是命令则返回 null
 */
export function parseSlashCommand(text: string): string | null {
  const trimmed = text.trim()
  if (!trimmed.startsWith('/')) {
    return null
  }

  const command = trimmed.toLowerCase().split(/\s+/)[0]
  return command
}

/**
 * 支持的斜杠命令列表
 */
export const SUPPORTED_COMMANDS = [
  {
    command: '/export',
    description: '导出当前聊天记录为 Markdown 格式',
    usage: '/export [format]',
    examples: ['/export', '/export json', '/export markdown']
  },
  {
    command: '/debug',
    description: '导出原始 HTTP 请求和响应数据（用于调试）',
    usage: '/debug [sessionId]',
    examples: ['/debug', '/debug all']
  }
]

/**
 * 解析导出命令的参数
 * @param text - 完整的命令文本
 * @returns 导出选项
 */
export function parseExportCommand(text: string): ExportOptions {
  const parts = text.trim().toLowerCase().split(/\s+/)
  const format = parts[1] === 'json' ? 'json' : 'markdown'

  return {
    format,
    includeChartDetails: true
  }
}

/**
 * 导出原始 HTTP 请求和响应数据
 * @param sessionId - 会话ID（可选，不提供则导出所有）
 * @returns 导出是否成功
 */
export function exportDebugData(sessionId?: string | null): boolean {
  try {
    let data: RequestResponsePair[]
    
    if (sessionId) {
      data = getStoredRawRequests().filter(r => r.sessionId === sessionId)
    } else {
      data = getStoredRawRequests()
    }
    
    const content = JSON.stringify(data, null, 2)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `debug-requests${sessionId ? `-${sessionId.substring(0, 8)}` : '-all'}_${timestamp}.json`
    
    downloadFile(content, filename, 'application/json')
    return true
  } catch (error) {
    console.error('Debug export failed:', error)
    return false
  }
}
