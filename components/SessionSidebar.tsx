'use client'

import { useState } from 'react'
import { Plus, Trash2, MessageSquare, AlertTriangle, BarChart2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { AboutDialog } from '@/components/AboutDialog'
import type { Session } from '@/lib/types'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  sessions: Session[]
  currentSessionId: string | null
  onNewChat: () => void
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onClearAll: () => void
}

export default function SessionSidebar({
  sessions,
  currentSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onClearAll
}: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null)
  const [aboutOpen, setAboutOpen] = useState(false)

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDeleteSession(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border w-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold text-sidebar-foreground">EconGrapher</span>
        </div>
        <Button
          onClick={onNewChat}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-sm font-medium justify-start gap-2"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-2 py-2">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <MessageSquare className="w-8 h-8 text-muted-foreground/30 mb-3" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                No conversations yet. Start by asking an economics question!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {sessions.map(session => {
                const isCurrent = currentSessionId === session.id
                const isHovered = hoveredId === session.id
                
                return (
                  <div
                    key={session.id}
                    className={cn(
                      'group flex items-center gap-2 rounded-md px-3 py-2 cursor-pointer transition-all duration-200',
                      isCurrent
                        ? 'bg-sidebar-accent shadow-sm'
                        : 'hover:bg-sidebar-accent/70 hover:shadow-sm hover:border-l-2 hover:border-l-primary hover:pl-[10px]'
                    )}
                    onClick={() => onSelectSession(session.id)}
                    onMouseEnter={() => setHoveredId(session.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <MessageSquare className={cn(
                      'w-4 h-4 shrink-0 transition-colors',
                      isCurrent ? 'text-primary' : 'text-muted-foreground'
                    )} />
                    
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className={cn(
                        'text-sm font-medium truncate',
                        isCurrent ? 'text-sidebar-foreground' : 'text-sidebar-foreground/80'
                      )}>
                        {session.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {formatDistanceToNow(session.updatedAt, { addSuffix: true })}
                      </p>
                    </div>

                    <button
                      onClick={e => { 
                        e.stopPropagation()
                        setDeleteTarget(session)
                      }}
                      className={cn(
                        "shrink-0 p-1 rounded transition-all duration-150",
                        "hover:text-destructive hover:bg-destructive/10",
                        isHovered || isCurrent
                          ? "opacity-100 text-muted-foreground"
                          : "opacity-0"
                      )}
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete conversation?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-foreground hover:bg-accent">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-sidebar-border shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAboutOpen(true)}
          className="w-full text-muted-foreground hover:text-primary hover:bg-primary/10 hover:shadow-md active:scale-[0.98] h-8 text-xs justify-start gap-2 transition-all duration-200 border border-transparent hover:border-primary/20"
        >
          <Info className="w-3.5 h-3.5 transition-transform duration-200 hover:scale-110" />
          About
        </Button>
      </div>

      {/* About Dialog */}
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </div>
  )
}
