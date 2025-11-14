'use client'

import { useState } from 'react'
import { Grip, Pin, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { StickyNote as StickyNoteType } from '@/lib/validations/workflow-documentation'

// Color palette for sticky notes
const colorClasses = {
  yellow: 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700',
  blue: 'bg-blue-100 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700',
  green: 'bg-green-100 border-green-300 dark:bg-green-900/20 dark:border-green-700',
  red: 'bg-red-100 border-red-300 dark:bg-red-900/20 dark:border-red-700',
  orange: 'bg-orange-100 border-orange-300 dark:bg-orange-900/20 dark:border-orange-700',
  purple: 'bg-purple-100 border-purple-300 dark:bg-purple-900/20 dark:border-purple-700',
  pink: 'bg-pink-100 border-pink-300 dark:bg-pink-900/20 dark:border-pink-700'
}

const noteTypeLabels = {
  overview: 'Vue d\'ensemble',
  step: 'Étape',
  data: 'Données',
  dependency: 'Dépendance',
  warning: 'Attention',
  cost: 'Coût',
  custom: 'Personnalisé'
}

interface StickyNoteProps {
  note: StickyNoteType
  isDragging?: boolean
  onEdit?: (note: StickyNoteType) => void
  onDelete?: (noteId: string) => void
  onPin?: (noteId: string, isPinned: boolean) => void
  onDragStart?: (note: StickyNoteType) => void
  onDragEnd?: () => void
  readonly?: boolean
}

export function StickyNote({
  note,
  isDragging = false,
  onEdit,
  onDelete,
  onPin,
  onDragStart,
  onDragEnd,
  readonly = false
}: StickyNoteProps) {
  const [isCollapsed, setIsCollapsed] = useState(note.is_collapsed)

  const colorClass = colorClasses[note.color] || colorClasses.yellow

  const handleDragStart = (e: React.DragEvent) => {
    if (readonly) return
    e.dataTransfer.effectAllowed = 'move'
    onDragStart?.(note)
  }

  const handleEdit = () => {
    if (readonly) return
    onEdit?.(note)
  }

  const handleDelete = () => {
    if (readonly) return
    onDelete?.(note.id)
  }

  const handlePin = () => {
    if (readonly) return
    onPin?.(note.id, !note.is_pinned)
  }

  const handleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <Card
      className={cn(
        'relative transition-all duration-200 shadow-md hover:shadow-lg',
        colorClass,
        isDragging && 'opacity-50 scale-95',
        'border-2'
      )}
      style={{
        width: note.width,
        minHeight: isCollapsed ? 'auto' : note.height
      }}
      draggable={!readonly}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 p-3 border-b border-current/10">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {!readonly && (
            <Grip
              className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0"
              aria-label="Drag handle"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{note.title}</h3>
            <Badge variant="outline" className="text-xs mt-1">
              {noteTypeLabels[note.note_type]}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {note.is_pinned && (
            <Pin className="h-3 w-3 text-muted-foreground" fill="currentColor" />
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCollapse}
          >
            {isCollapsed ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )}
          </Button>

          {!readonly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <span className="sr-only">More options</span>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                  >
                    <path
                      d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM12.5 8.625C13.1213 8.625 13.625 8.12132 13.625 7.5C13.625 6.87868 13.1213 6.375 12.5 6.375C11.8787 6.375 11.375 6.87868 11.375 7.5C11.375 8.12132 11.8787 8.625 12.5 8.625Z"
                      fill="currentColor"
                    />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handlePin}>
                  <Pin className="h-4 w-4 mr-2" />
                  {note.is_pinned ? 'Détacher' : 'Épingler'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-3">
          <p className="text-sm whitespace-pre-wrap break-words">
            {note.content}
          </p>

          {/* Metadata */}
          {note.metadata && Object.keys(note.metadata).length > 0 && (
            <div className="mt-3 pt-3 border-t border-current/10">
              <div className="text-xs text-muted-foreground space-y-1">
                {Object.entries(note.metadata).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-semibold">{key}:</span>{' '}
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Group indicator */}
          {note.group_id && (
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                Groupe: {note.group_id}
              </Badge>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
