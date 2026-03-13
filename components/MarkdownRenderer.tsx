'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
  isStreaming?: boolean
}

export default function MarkdownRenderer({ content, className, isStreaming = false }: MarkdownRendererProps) {
  return (
    <div className={cn('markdown-content', className, isStreaming && 'is-streaming')}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-foreground mb-3 mt-4 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-foreground mb-2 mt-3 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-foreground mb-1.5 mt-2 first:mt-0">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold text-foreground mb-1 mt-2 first:mt-0">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside ml-4 mb-2 space-y-0.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-4 mb-2 space-y-0.5">{children}</ol>
          ),
          li: ({ children }) => {
            const hasContent = children && 
              (Array.isArray(children) 
                ? children.some(c => c !== null && c !== undefined && c !== '')
                : children !== null && children !== undefined && children !== '')
            return (
              <li className={cn(
                'text-sm leading-relaxed',
                !hasContent && 'leading-none min-h-0 h-0 overflow-hidden'
              )}>{children}</li>
            )
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-primary/40 pl-3 my-2 text-muted-foreground italic">{children}</blockquote>
          ),
          code: ({ className, children, style, node, ...props }) => {
            const isInline = !className
            if (isInline) {
              return (
                <code 
                  className="px-1.5 py-0.5 rounded bg-muted text-primary font-mono text-xs"
                >
                  {children}
                </code>
              )
            }
            return (
              <code className={cn('block', className)} style={style}>
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="bg-muted/80 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono">
              {children}
            </pre>
          ),
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          hr: () => (
            <hr className="my-3 border-border" />
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody>{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-border">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-semibold text-foreground">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-foreground">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      {isStreaming && <span className="streaming-cursor" />}
    </div>
  )
}
