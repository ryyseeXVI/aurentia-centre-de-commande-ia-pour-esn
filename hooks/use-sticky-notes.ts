'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { StickyNote } from '@/lib/validations/workflow-documentation'

interface UseStickyNotesOptions {
  workflowId: string
  initialNotes?: StickyNote[]
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseStickyNotesReturn {
  notes: StickyNote[]
  isLoading: boolean
  error: Error | null

  // Actions
  createNote: (data: Partial<StickyNote>) => Promise<StickyNote | null>
  updateNote: (noteId: string, data: Partial<StickyNote>) => Promise<StickyNote | null>
  deleteNote: (noteId: string, permanent?: boolean) => Promise<boolean>
  pinNote: (noteId: string, isPinned: boolean) => Promise<boolean>
  updatePositions: (updates: Array<{ id: string; position_x: number; position_y: number }>) => Promise<boolean>

  // Utils
  refresh: () => Promise<void>
  getNoteById: (noteId: string) => StickyNote | undefined
  getNotesByType: (noteType: string) => StickyNote[]
  getNotesByGroup: (groupId: string) => StickyNote[]
  getPinnedNotes: () => StickyNote[]
}

export function useStickyNotes({
  workflowId,
  initialNotes = [],
  autoRefresh = false,
  refreshInterval = 30000 // 30 seconds
}: UseStickyNotesOptions): UseStickyNotesReturn {
  const router = useRouter()
  const [notes, setNotes] = useState<StickyNote[]>(initialNotes)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Fetch notes from API
  const fetchNotes = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/workflows/${workflowId}/sticky-notes`)

      if (!response.ok) {
        throw new Error('Failed to fetch sticky notes')
      }

      const data = await response.json()
      setNotes(data.data || [])
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      console.error('Error fetching sticky notes:', error)
    } finally {
      setIsLoading(false)
    }
  }, [workflowId])

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchNotes()
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, fetchNotes])

  // Create note
  const createNote = useCallback(
    async (data: Partial<StickyNote>): Promise<StickyNote | null> => {
      try {
        const response = await fetch(`/api/workflows/${workflowId}/sticky-notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })

        if (!response.ok) {
          throw new Error('Failed to create sticky note')
        }

        const result = await response.json()
        const newNote = result.data

        // Optimistic update
        setNotes((prev) => [...prev, newNote])

        toast.success('Note créée avec succès')
        router.refresh()

        return newNote
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        toast.error('Erreur lors de la création de la note')
        console.error('Error creating sticky note:', error)
        return null
      }
    },
    [workflowId, router]
  )

  // Update note
  const updateNote = useCallback(
    async (noteId: string, data: Partial<StickyNote>): Promise<StickyNote | null> => {
      try {
        const response = await fetch(
          `/api/workflows/${workflowId}/sticky-notes/${noteId}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          }
        )

        if (!response.ok) {
          throw new Error('Failed to update sticky note')
        }

        const result = await response.json()
        const updatedNote = result.data

        // Optimistic update
        setNotes((prev) =>
          prev.map((note) => (note.id === noteId ? { ...note, ...updatedNote } : note))
        )

        toast.success('Note mise à jour')
        router.refresh()

        return updatedNote
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        toast.error('Erreur lors de la mise à jour')
        console.error('Error updating sticky note:', error)
        return null
      }
    },
    [workflowId, router]
  )

  // Delete note
  const deleteNote = useCallback(
    async (noteId: string, permanent = false): Promise<boolean> => {
      try {
        const url = permanent
          ? `/api/workflows/${workflowId}/sticky-notes/${noteId}?permanent=true`
          : `/api/workflows/${workflowId}/sticky-notes/${noteId}`

        const response = await fetch(url, { method: 'DELETE' })

        if (!response.ok) {
          throw new Error('Failed to delete sticky note')
        }

        // Optimistic update
        setNotes((prev) => prev.filter((note) => note.id !== noteId))

        toast.success(permanent ? 'Note supprimée définitivement' : 'Note archivée')
        router.refresh()

        return true
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        toast.error('Erreur lors de la suppression')
        console.error('Error deleting sticky note:', error)
        return false
      }
    },
    [workflowId, router]
  )

  // Pin/unpin note
  const pinNote = useCallback(
    async (noteId: string, isPinned: boolean): Promise<boolean> => {
      try {
        const response = await fetch(
          `/api/workflows/${workflowId}/sticky-notes/${noteId}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_pinned: isPinned })
          }
        )

        if (!response.ok) {
          throw new Error('Failed to pin sticky note')
        }

        // Optimistic update
        setNotes((prev) =>
          prev.map((note) => (note.id === noteId ? { ...note, is_pinned: isPinned } : note))
        )

        toast.success(isPinned ? 'Note épinglée' : 'Note détachée')
        router.refresh()

        return true
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        toast.error('Erreur lors de la modification')
        console.error('Error pinning sticky note:', error)
        return false
      }
    },
    [workflowId, router]
  )

  // Batch update positions
  const updatePositions = useCallback(
    async (updates: Array<{ id: string; position_x: number; position_y: number }>): Promise<boolean> => {
      try {
        const response = await fetch(`/api/workflows/${workflowId}/sticky-notes`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates })
        })

        if (!response.ok) {
          throw new Error('Failed to update positions')
        }

        // Optimistic update
        setNotes((prev) =>
          prev.map((note) => {
            const update = updates.find((u) => u.id === note.id)
            return update
              ? { ...note, position_x: update.position_x, position_y: update.position_y }
              : note
          })
        )

        return true
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        console.error('Error updating positions:', error)
        return false
      }
    },
    [workflowId]
  )

  // Utility functions
  const getNoteById = useCallback(
    (noteId: string) => notes.find((note) => note.id === noteId),
    [notes]
  )

  const getNotesByType = useCallback(
    (noteType: string) => notes.filter((note) => note.note_type === noteType),
    [notes]
  )

  const getNotesByGroup = useCallback(
    (groupId: string) => notes.filter((note) => note.group_id === groupId),
    [notes]
  )

  const getPinnedNotes = useCallback(
    () => notes.filter((note) => note.is_pinned),
    [notes]
  )

  const refresh = useCallback(async () => {
    await fetchNotes()
  }, [fetchNotes])

  return {
    notes,
    isLoading,
    error,
    createNote,
    updateNote,
    deleteNote,
    pinNote,
    updatePositions,
    refresh,
    getNoteById,
    getNotesByType,
    getNotesByGroup,
    getPinnedNotes
  }
}
