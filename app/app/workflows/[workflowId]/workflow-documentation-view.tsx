'use client'

import { useState } from 'react'
import {
  ArrowLeft,
  Edit,
  ExternalLink,
  Database,
  GitBranch,
  ListOrdered
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StickyNoteBoard } from '@/components/workflows/sticky-note-board'
import { StickyNoteDialog } from '@/components/workflows/sticky-note-dialog'
import { cn } from '@/lib/utils'
import { useStickyNotes } from '@/hooks/use-sticky-notes'
import type { WorkflowWithRelations, StickyNote } from '@/lib/validations/workflow-documentation'

interface WorkflowDocumentationViewProps {
  workflow: WorkflowWithRelations
  readonly?: boolean
}

const statusColors = {
  ACTIVE: 'bg-green-500',
  INACTIVE: 'bg-gray-500',
  DEVELOPMENT: 'bg-blue-500',
  TESTING: 'bg-yellow-500'
}

const statusLabels = {
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
  DEVELOPMENT: 'Développement',
  TESTING: 'Test'
}

export function WorkflowDocumentationView({
  workflow,
  readonly = false
}: WorkflowDocumentationViewProps) {
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [editingNote, setEditingNote] = useState<StickyNote | undefined>()

  // Use the custom hook for sticky notes management
  const {
    notes: stickyNotes,
    deleteNote,
    pinNote,
    updatePositions,
    refresh
  } = useStickyNotes({
    workflowId: workflow.id,
    initialNotes: workflow.sticky_notes || []
  })

  const statusColor = statusColors[workflow.status] || statusColors.INACTIVE
  const statusLabel = statusLabels[workflow.status] || workflow.status

  const handleAddNote = () => {
    setEditingNote(undefined)
    setShowNoteDialog(true)
  }

  const handleEditNote = (note: StickyNote) => {
    setEditingNote(note)
    setShowNoteDialog(true)
  }

  const handleDeleteNote = async (noteId: string) => {
    await deleteNote(noteId)
  }

  const handlePinNote = async (noteId: string, isPinned: boolean) => {
    await pinNote(noteId, isPinned)
  }

  const handlePositionChange = async (noteId: string, x: number, y: number) => {
    // Batch update would be better for performance
    await updatePositions([{ id: noteId, position_x: x, position_y: y }])
  }

  const handleDialogSuccess = () => {
    refresh()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/app/workflows">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="font-mono">
                {workflow.workflow_code}
              </Badge>
              <div className="flex items-center gap-1">
                <div className={cn('h-2 w-2 rounded-full', statusColor)} />
                <span className="text-sm text-muted-foreground">{statusLabel}</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {workflow.workflow_name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {workflow.n8n_workflow_url && (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={workflow.n8n_workflow_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ouvrir dans N8N
              </Link>
            </Button>
          )}
          {!readonly && (
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Modifier le workflow
            </Button>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stickyNotes.length}</div>
            <p className="text-xs text-muted-foreground">
              {stickyNotes.filter((n) => n.is_pinned).length} épinglées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Étapes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflow.steps?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Dans le workflow
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflow.data_flows?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {workflow.data_flows?.filter((d) => d.flow_type === 'READ').length || 0}{' '}
              lecture /{' '}
              {workflow.data_flows?.filter((d) => d.flow_type === 'WRITE').length || 0}{' '}
              écriture
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Coût mensuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${workflow.cost_per_month?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              ${workflow.cost_per_execution?.toFixed(4) || '0.00'} / exécution
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sticky-notes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sticky-notes">
            Documentation (Notes)
          </TabsTrigger>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="data-flows">
            <Database className="h-4 w-4 mr-2" />
            Flux de données
          </TabsTrigger>
          <TabsTrigger value="dependencies">
            <GitBranch className="h-4 w-4 mr-2" />
            Dépendances
          </TabsTrigger>
          <TabsTrigger value="steps">
            <ListOrdered className="h-4 w-4 mr-2" />
            Étapes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sticky-notes" className="space-y-4">
          <StickyNoteBoard
            notes={stickyNotes}
            onAddNote={handleAddNote}
            onEditNote={handleEditNote}
            onDeleteNote={handleDeleteNote}
            onPinNote={handlePinNote}
            onPositionChange={handlePositionChange}
            readonly={readonly}
          />
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Objectif</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {workflow.objective}
              </p>
            </CardContent>
          </Card>

          {workflow.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {workflow.description}
                </p>
              </CardContent>
            </Card>
          )}

          {workflow.trigger_config && (
            <Card>
              <CardHeader>
                <CardTitle>Configuration du déclencheur</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  {JSON.stringify(workflow.trigger_config, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="data-flows" className="space-y-4">
          {workflow.data_flows && workflow.data_flows.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workflow.data_flows.map((dataFlow) => (
                <Card key={dataFlow.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-mono">
                        {dataFlow.table_name}
                      </CardTitle>
                      <Badge
                        variant={
                          dataFlow.flow_type === 'READ'
                            ? 'secondary'
                            : dataFlow.flow_type === 'WRITE'
                            ? 'default'
                            : 'outline'
                        }
                      >
                        {dataFlow.flow_type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {dataFlow.purpose && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {dataFlow.purpose}
                      </p>
                    )}
                    {dataFlow.columns_used && dataFlow.columns_used.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-1">Colonnes utilisées:</p>
                        <div className="flex flex-wrap gap-1">
                          {dataFlow.columns_used.map((col) => (
                            <Badge key={col} variant="outline" className="text-xs">
                              {col}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Aucun flux de données défini pour ce workflow.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="dependencies" className="space-y-4">
          {workflow.dependencies && workflow.dependencies.length > 0 ? (
            <div className="space-y-3">
              {workflow.dependencies.map((dep: any) => (
                <Card key={dep.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          {dep.depends_on?.workflow_code} -{' '}
                          {dep.depends_on?.workflow_name}
                        </p>
                        {dep.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {dep.description}
                          </p>
                        )}
                      </div>
                      <Badge>{dep.dependency_type}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Ce workflow n'a aucune dépendance.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="steps" className="space-y-4">
          {workflow.steps && workflow.steps.length > 0 ? (
            <div className="space-y-3">
              {workflow.steps.map((step) => (
                <Card key={step.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono">
                        {step.step_number}
                      </Badge>
                      <CardTitle className="text-base">{step.step_name}</CardTitle>
                      {step.step_type && (
                        <Badge variant="secondary">{step.step_type}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {step.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {step.description}
                      </p>
                    )}
                    {step.code_snippet && (
                      <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs mt-2">
                        {step.code_snippet}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Aucune étape définie pour ce workflow.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Sticky Note Dialog */}
      <StickyNoteDialog
        open={showNoteDialog}
        onOpenChange={setShowNoteDialog}
        workflowId={workflow.id}
        note={editingNote}
        onSuccess={handleDialogSuccess}
      />
    </div>
  )
}
