'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProject } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Client {
  id: string
  nom: string
  contact_principal: string | null
}

interface Manager {
  user_id: string
  role: string
  profiles: {
    id: string
    nom: string | null
    prenom: string | null
    email: string
  } | null
}

interface CreateProjectFormProps {
  clients: Client[]
  managers: Manager[]
}

export function CreateProjectForm({ clients, managers }: CreateProjectFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    client_id: '',
    chef_projet_id: '',
    date_debut: '',
    date_fin_prevue: '',
    statut: 'PLANIFIE' as const,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
    setError(null)
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
    setError(null)
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nom.trim()) {
      newErrors.nom = 'Project name is required'
    } else if (formData.nom.length < 3) {
      newErrors.nom = 'Project name must be at least 3 characters'
    } else if (formData.nom.length > 200) {
      newErrors.nom = 'Project name is too long'
    }

    if (!formData.client_id) {
      newErrors.client_id = 'Client is required'
    }

    if (!formData.date_debut) {
      newErrors.date_debut = 'Start date is required'
    }

    if (formData.date_debut && formData.date_fin_prevue) {
      const debut = new Date(formData.date_debut)
      const fin = new Date(formData.date_fin_prevue)
      if (fin < debut) {
        newErrors.date_fin_prevue = 'End date must be after or equal to start date'
      }
    }

    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'Description is too long (max 2000 characters)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Clean up the form data - remove chef_projet_id if empty
      const submitData = {
        ...formData,
        chef_projet_id: formData.chef_projet_id || undefined,
        date_fin_prevue: formData.date_fin_prevue || undefined,
      }

      const result = await createProject(submitData)

      if (result.error) {
        setError(result.error)
        setSubmitting(false)
      } else if (result.success) {
        // Redirect to the projects list or the new project page
        router.push('/app/projects')
        router.refresh()
      }
    } catch (err) {
      console.error('Form submission error:', err)
      setError('An unexpected error occurred. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="nom">
              Project Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nom"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              placeholder="e.g., AI Command Center Development"
              className={errors.nom ? 'border-destructive' : ''}
            />
            {errors.nom && (
              <p className="text-sm text-destructive">{errors.nom}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Optional project description..."
              rows={4}
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client_id">
              Client <span className="text-destructive">*</span>
            </Label>
            {clients.length === 0 ? (
              <div className="text-sm text-muted-foreground p-3 border rounded-md">
                No clients available. Please create a client first.
              </div>
            ) : (
              <Select
                value={formData.client_id}
                onValueChange={(value) => handleSelectChange('client_id', value)}
              >
                <SelectTrigger className={errors.client_id ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nom}
                      {client.contact_principal && ` (${client.contact_principal})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.client_id && (
              <p className="text-sm text-destructive">{errors.client_id}</p>
            )}
          </div>

          {/* Project Manager Selection */}
          <div className="space-y-2">
            <Label htmlFor="chef_projet_id">Project Manager</Label>
            <Select
              value={formData.chef_projet_id}
              onValueChange={(value) => handleSelectChange('chef_projet_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project manager (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {managers.map((manager) => {
                  const profile = manager.profiles
                  const displayName = profile
                    ? `${profile.prenom || ''} ${profile.nom || ''}`.trim() || profile.email
                    : manager.user_id
                  return (
                    <SelectItem key={manager.user_id} value={manager.user_id}>
                      {displayName} ({manager.role})
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_debut">
                Start Date <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                id="date_debut"
                name="date_debut"
                value={formData.date_debut}
                onChange={handleChange}
                className={errors.date_debut ? 'border-destructive' : ''}
              />
              {errors.date_debut && (
                <p className="text-sm text-destructive">{errors.date_debut}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_fin_prevue">Expected End Date</Label>
              <Input
                type="date"
                id="date_fin_prevue"
                name="date_fin_prevue"
                value={formData.date_fin_prevue}
                onChange={handleChange}
                className={errors.date_fin_prevue ? 'border-destructive' : ''}
              />
              {errors.date_fin_prevue && (
                <p className="text-sm text-destructive">{errors.date_fin_prevue}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="statut">Status</Label>
            <Select
              value={formData.statut}
              onValueChange={(value) =>
                handleSelectChange('statut', value as 'PLANIFIE' | 'ACTIF' | 'TERMINE')
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLANIFIE">Planned</SelectItem>
                <SelectItem value="ACTIF">Active</SelectItem>
                <SelectItem value="TERMINE">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || clients.length === 0}>
              {submitting ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
