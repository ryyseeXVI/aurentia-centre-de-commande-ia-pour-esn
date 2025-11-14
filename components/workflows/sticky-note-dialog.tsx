'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { StickyNote, NoteType, NoteColor } from '@/lib/validations/workflow-documentation'

const stickyNoteFormSchema = z.object({
  note_type: z.enum([
    'overview',
    'step',
    'data',
    'dependency',
    'warning',
    'cost',
    'custom'
  ]),
  title: z.string().min(1, 'Le titre est requis').max(255),
  content: z.string().min(1, 'Le contenu est requis'),
  color: z.enum(['yellow', 'blue', 'green', 'red', 'orange', 'purple', 'pink']),
  group_id: z.string().optional(),
  width: z.number().min(200).max(800),
  height: z.number().min(150).max(600)
})

type StickyNoteFormData = z.infer<typeof stickyNoteFormSchema>

interface StickyNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflowId: string
  note?: StickyNote
  onSuccess?: () => void
}

const noteTypeOptions: { value: NoteType; label: string; description: string }[] = [
  { value: 'overview', label: "Vue d'ensemble", description: 'Description générale du workflow' },
  { value: 'step', label: 'Étape', description: 'Une étape spécifique du workflow' },
  { value: 'data', label: 'Données', description: 'Tables ou données utilisées' },
  { value: 'dependency', label: 'Dépendance', description: 'Dépendance avec un autre workflow' },
  { value: 'warning', label: 'Attention', description: 'Point d\'attention ou avertissement' },
  { value: 'cost', label: 'Coût', description: 'Information de coût' },
  { value: 'custom', label: 'Personnalisé', description: 'Note personnalisée' }
]

const colorOptions: { value: NoteColor; label: string; class: string }[] = [
  { value: 'yellow', label: 'Jaune', class: 'bg-yellow-200 border-yellow-400' },
  { value: 'blue', label: 'Bleu', class: 'bg-blue-200 border-blue-400' },
  { value: 'green', label: 'Vert', class: 'bg-green-200 border-green-400' },
  { value: 'red', label: 'Rouge', class: 'bg-red-200 border-red-400' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-200 border-orange-400' },
  { value: 'purple', label: 'Violet', class: 'bg-purple-200 border-purple-400' },
  { value: 'pink', label: 'Rose', class: 'bg-pink-200 border-pink-400' }
]

export function StickyNoteDialog({
  open,
  onOpenChange,
  workflowId,
  note,
  onSuccess
}: StickyNoteDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!note

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<StickyNoteFormData>({
    resolver: zodResolver(stickyNoteFormSchema),
    defaultValues: {
      note_type: 'overview',
      title: '',
      content: '',
      color: 'yellow',
      group_id: '',
      width: 300,
      height: 200
    }
  })

  // Reset form when note changes
  useEffect(() => {
    if (note) {
      reset({
        note_type: note.note_type,
        title: note.title,
        content: note.content,
        color: note.color,
        group_id: note.group_id || '',
        width: note.width,
        height: note.height
      })
    } else {
      reset({
        note_type: 'overview',
        title: '',
        content: '',
        color: 'yellow',
        group_id: '',
        width: 300,
        height: 200
      })
    }
  }, [note, reset])

  const selectedNoteType = watch('note_type')
  const selectedColor = watch('color')

  const onSubmit = async (data: StickyNoteFormData) => {
    setIsLoading(true)

    try {
      const url = isEditing
        ? `/api/workflows/${workflowId}/sticky-notes/${note.id}`
        : `/api/workflows/${workflowId}/sticky-notes`

      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la sauvegarde')
      }

      toast.success(
        isEditing ? 'Note mise à jour avec succès' : 'Note créée avec succès'
      )

      onSuccess?.()
      onOpenChange(false)
      reset()
    } catch (error) {
      console.error('Error saving sticky note:', error)
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors de la sauvegarde'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier la note' : 'Créer une nouvelle note'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifiez les informations de votre note.'
              : 'Ajoutez une note pour documenter votre workflow.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Note Type */}
          <div className="space-y-2">
            <Label htmlFor="note_type">Type de note</Label>
            <Select
              value={selectedNoteType}
              onValueChange={(value) => setValue('note_type', value as NoteType)}
            >
              <SelectTrigger id="note_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {noteTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              placeholder="Titre de la note"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Contenu</Label>
            <Textarea
              id="content"
              placeholder="Décrivez les détails de cette note..."
              rows={6}
              {...register('content')}
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content.message}</p>
            )}
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Couleur</Label>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setValue('color', option.value)}
                  className={`
                    h-10 w-20 rounded-md border-2 transition-all
                    ${option.class}
                    ${
                      selectedColor === option.value
                        ? 'ring-2 ring-primary ring-offset-2 scale-110'
                        : 'hover:scale-105'
                    }
                  `}
                  title={option.label}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Couleur sélectionnée : {colorOptions.find((c) => c.value === selectedColor)?.label}
            </p>
          </div>

          {/* Group ID (optional) */}
          <div className="space-y-2">
            <Label htmlFor="group_id">Groupe (optionnel)</Label>
            <Input
              id="group_id"
              placeholder="Ex: configuration, données, sécurité"
              {...register('group_id')}
            />
            <p className="text-xs text-muted-foreground">
              Groupez vos notes par thématique pour mieux les organiser
            </p>
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Largeur (px)</Label>
              <Input
                id="width"
                type="number"
                min={200}
                max={800}
                {...register('width', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Hauteur (px)</Label>
              <Input
                id="height"
                type="number"
                min={150}
                max={600}
                {...register('height', { valueAsNumber: true })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
