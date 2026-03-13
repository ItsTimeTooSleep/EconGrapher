'use client'

import { useToast } from '@/hooks/use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'
import { CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react'

const variantIcons = {
  default: Sparkles,
  success: CheckCircle2,
  destructive: AlertCircle,
  info: Info,
}

const variantIconColors = {
  default: 'text-primary',
  success: 'text-emerald-500',
  destructive: 'text-destructive',
  info: 'text-blue-500',
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant = 'default', ...props }) {
        const Icon = variantIcons[variant as keyof typeof variantIcons] || Sparkles
        const iconColor = variantIconColors[variant as keyof typeof variantIconColors] || 'text-primary'
        
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3">
              <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="grid gap-1 flex-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
