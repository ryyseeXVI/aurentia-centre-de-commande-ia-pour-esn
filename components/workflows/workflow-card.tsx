'use client'

import Link from 'next/link'
import { FileText, Calendar, DollarSign, PlayCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { WorkflowDocumentation } from '@/lib/validations/workflow-documentation'

interface WorkflowCardProps {
  workflow: WorkflowDocumentation & {
    sticky_note_count?: number
    step_count?: number
    data_table_count?: number
  }
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

const phaseLabels = {
  MVP: 'MVP',
  PRODUCTION: 'Production',
  OPTIMIZATION: 'Optimisation'
}

const priorityColors = {
  CRITICAL: 'destructive',
  HIGH: 'default',
  MEDIUM: 'secondary',
  LOW: 'outline'
}

const triggerTypeLabels = {
  schedule: 'Programmé',
  webhook: 'Webhook',
  manual: 'Manuel',
  event: 'Événement'
}

export function WorkflowCard({ workflow }: WorkflowCardProps) {
  const statusColor = statusColors[workflow.status] || statusColors.INACTIVE
  const statusLabel = statusLabels[workflow.status] || workflow.status
  const priorityColor = workflow.priority
    ? priorityColors[workflow.priority]
    : 'outline'

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="font-mono text-xs">
                {workflow.workflow_code}
              </Badge>
              {workflow.priority && (
                <Badge variant={priorityColor as any} className="text-xs">
                  {workflow.priority}
                </Badge>
              )}
              {workflow.phase && (
                <Badge variant="secondary" className="text-xs">
                  {phaseLabels[workflow.phase]}
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg truncate">
              {workflow.workflow_name}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className={cn('h-2 w-2 rounded-full', statusColor)} />
            <span className="text-xs text-muted-foreground">{statusLabel}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Objective */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {workflow.objective}
        </p>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {workflow.trigger_type && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {triggerTypeLabels[workflow.trigger_type]}
              </span>
            </div>
          )}

          {workflow.cost_per_month !== undefined && workflow.cost_per_month !== null && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                ${workflow.cost_per_month.toFixed(2)}/mois
              </span>
            </div>
          )}

          {workflow.sticky_note_count !== undefined && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {workflow.sticky_note_count} notes
              </span>
            </div>
          )}

          {workflow.step_count !== undefined && (
            <div className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {workflow.step_count} étapes
              </span>
            </div>
          )}
        </div>

        {/* Updated date */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <Calendar className="h-3 w-3" />
          <span>
            Mis à jour le{' '}
            {new Date(workflow.updated_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button asChild variant="default" size="sm" className="flex-1">
            <Link href={`/app/workflows/${workflow.id}`}>
              Voir la documentation
            </Link>
          </Button>
          {workflow.n8n_workflow_url && (
            <Button asChild variant="outline" size="sm">
              <Link
                href={workflow.n8n_workflow_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                N8N
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
