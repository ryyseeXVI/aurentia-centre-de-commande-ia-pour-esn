'use client'

import { useState, useCallback } from 'react'
import { Plus, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { StickyNote } from './sticky-note'
import type { StickyNote as StickyNoteType } from '@/lib/validations/workflow-documentation'

interface StickyNoteBoardProps {
  notes: StickyNoteType[]
  onAddNote?: () => void
  onEditNote?: (note: StickyNoteType) => void
  onDeleteNote?: (noteId: string) => void
  onPinNote?: (noteId: string, isPinned: boolean) => void
  onPositionChange?: (noteId: string, x: number, y: number) => void
  readonly?: boolean
}

export function StickyNoteBoard({
  notes,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onPinNote,
  onPositionChange,
  readonly = false
}: StickyNoteBoardProps) {
  const [draggingNote, setDraggingNote] = useState<StickyNoteType | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterGroup, setFilterGroup] = useState<string>('all')

  // Filter notes
  const filteredNotes = notes.filter((note) => {
    if (filterType !== 'all' && note.note_type !== filterType) return false
    if (filterGroup !== 'all' && note.group_id !== filterGroup) return false
    return true
  })

  // Separate pinned and unpinned notes
  const pinnedNotes = filteredNotes.filter((note) => note.is_pinned)
  const unpinnedNotes = filteredNotes.filter((note) => !note.is_pinned)

  // Get unique groups
  const groups = Array.from(new Set(notes.map((n) => n.group_id).filter(Boolean)))

  // Get unique note types
  const noteTypes = Array.from(new Set(notes.map((n) => n.note_type)))

  const handleDragStart = useCallback((note: StickyNoteType) => {
    setDraggingNote(note)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggingNote(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!draggingNote || readonly) return

      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      onPositionChange?.(draggingNote.id, x, y)
      setDraggingNote(null)
    },
    [draggingNote, onPositionChange, readonly]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type de note" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {noteTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {groups.length > 0 && (
            <Select value={filterGroup} onValueChange={setFilterGroup}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Groupe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les groupes</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group} value={group || 'no-group'}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {!readonly && (
          <Button onClick={onAddNote}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une note
          </Button>
        )}
      </div>

      {/* Pinned Notes Section */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
            >
              <path
                d="M9.62129 1.13607C9.81656 0.940808 10.1331 0.940809 10.3284 1.13607L11.3891 2.19673L12.8033 3.61094L13.8639 4.6716C14.0592 4.86687 14.0592 5.18345 13.8639 5.37871C13.6687 5.57397 13.3521 5.57397 13.1568 5.37871L12.5038 4.7257L8.86727 9.57443L9.97485 10.682C10.1701 10.8773 10.1701 11.1939 9.97485 11.3891C9.77959 11.5844 9.463 11.5844 9.26774 11.3891L7.85353 9.97491L6.79287 8.91425L3.5225 12.1846C3.32724 12.3799 3.01065 12.3799 2.81539 12.1846C2.62013 11.9894 2.62013 11.6728 2.81539 11.4775L6.08576 8.20714L5.0251 7.14648L3.61089 5.73226C3.41563 5.537 3.41562 5.22042 3.61089 5.02516C3.80615 4.8299 4.12273 4.8299 4.31799 5.02516L5.42557 6.13274L10.2743 2.49619L9.62129 1.84318C9.42603 1.64792 9.42603 1.33133 9.62129 1.13607Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
              />
            </svg>
            Notes épinglées
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pinnedNotes.map((note) => (
              <StickyNote
                key={note.id}
                note={note}
                isDragging={draggingNote?.id === note.id}
                onEdit={onEditNote}
                onDelete={onDeleteNote}
                onPin={onPinNote}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                readonly={readonly}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Notes Board */}
      <div
        className="relative min-h-[600px] border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 bg-muted/5"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {unpinnedNotes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">
                {notes.length === 0
                  ? 'Aucune note pour le moment'
                  : 'Aucune note ne correspond aux filtres'}
              </p>
              {!readonly && notes.length === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={onAddNote}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer la première note
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {unpinnedNotes.map((note) => (
              <div
                key={note.id}
                style={{
                  gridColumn: 'span 1',
                  gridRow: 'span 1'
                }}
              >
                <StickyNote
                  note={note}
                  isDragging={draggingNote?.id === note.id}
                  onEdit={onEditNote}
                  onDelete={onDeleteNote}
                  onPin={onPinNote}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  readonly={readonly}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>Total: {filteredNotes.length} notes</span>
        {pinnedNotes.length > 0 && <span>Épinglées: {pinnedNotes.length}</span>}
      </div>
    </div>
  )
}
