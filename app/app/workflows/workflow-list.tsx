'use client'

import { useState, useMemo } from 'react'
import { Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { WorkflowCard } from '@/components/workflows/workflow-card'
import type { WorkflowDocumentation } from '@/lib/validations/workflow-documentation'

interface WorkflowListProps {
  workflows: (WorkflowDocumentation & {
    sticky_note_count?: number
    step_count?: number
    data_table_count?: number
  })[]
  readonly?: boolean
  canCreate?: boolean
}

export function WorkflowList({
  workflows,
  readonly = false,
  canCreate = false
}: WorkflowListProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [phaseFilter, setPhaseFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  // Filter workflows
  const filteredWorkflows = useMemo(() => {
    return workflows.filter((workflow) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesSearch =
          workflow.workflow_name.toLowerCase().includes(searchLower) ||
          workflow.workflow_code.toLowerCase().includes(searchLower) ||
          workflow.objective.toLowerCase().includes(searchLower)

        if (!matchesSearch) return false
      }

      // Status filter
      if (statusFilter !== 'all' && workflow.status !== statusFilter) {
        return false
      }

      // Phase filter
      if (phaseFilter !== 'all' && workflow.phase !== phaseFilter) {
        return false
      }

      // Priority filter
      if (priorityFilter !== 'all' && workflow.priority !== priorityFilter) {
        return false
      }

      return true
    })
  }, [workflows, search, statusFilter, phaseFilter, priorityFilter])

  // Group workflows by phase
  const workflowsByPhase = useMemo(() => {
    const groups: Record<string, typeof filteredWorkflows> = {
      MVP: [],
      PRODUCTION: [],
      OPTIMIZATION: [],
      OTHER: []
    }

    filteredWorkflows.forEach((workflow) => {
      const phase = workflow.phase || 'OTHER'
      if (!groups[phase]) {
        groups[phase] = []
      }
      groups[phase].push(workflow)
    })

    return groups
  }, [filteredWorkflows])

  const handleCreateWorkflow = () => {
    // TODO: Open dialog to create new workflow
    alert('Fonctionnalité à venir : Créer un nouveau workflow')
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un workflow..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="ACTIVE">Actif</SelectItem>
            <SelectItem value="INACTIVE">Inactif</SelectItem>
            <SelectItem value="DEVELOPMENT">Développement</SelectItem>
            <SelectItem value="TESTING">Test</SelectItem>
          </SelectContent>
        </Select>

        <Select value={phaseFilter} onValueChange={setPhaseFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Phase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les phases</SelectItem>
            <SelectItem value="MVP">MVP</SelectItem>
            <SelectItem value="PRODUCTION">Production</SelectItem>
            <SelectItem value="OPTIMIZATION">Optimisation</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les priorités</SelectItem>
            <SelectItem value="CRITICAL">Critique</SelectItem>
            <SelectItem value="HIGH">Haute</SelectItem>
            <SelectItem value="MEDIUM">Moyenne</SelectItem>
            <SelectItem value="LOW">Basse</SelectItem>
          </SelectContent>
        </Select>

        {canCreate && (
          <Button onClick={handleCreateWorkflow}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau workflow
          </Button>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {filteredWorkflows.length} workflow{filteredWorkflows.length > 1 ? 's' : ''}{' '}
        {filteredWorkflows.length !== workflows.length && (
          <span>sur {workflows.length}</span>
        )}
      </div>

      {/* Workflows by Phase */}
      {filteredWorkflows.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {workflows.length === 0
              ? 'Aucun workflow trouvé. Créez votre premier workflow pour commencer.'
              : 'Aucun workflow ne correspond à vos critères de recherche.'}
          </p>
          {canCreate && workflows.length === 0 && (
            <Button className="mt-4" onClick={handleCreateWorkflow}>
              <Plus className="h-4 w-4 mr-2" />
              Créer le premier workflow
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(workflowsByPhase).map(([phase, phaseWorkflows]) => {
            if (phaseWorkflows.length === 0) return null

            const phaseLabels: Record<string, string> = {
              MVP: 'Phase 1 - MVP',
              PRODUCTION: 'Phase 2 - Production',
              OPTIMIZATION: 'Phase 3 - Optimisation',
              OTHER: 'Autres'
            }

            return (
              <div key={phase} className="space-y-4">
                <h2 className="text-xl font-semibold">{phaseLabels[phase]}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {phaseWorkflows.map((workflow) => (
                    <WorkflowCard key={workflow.id} workflow={workflow} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
