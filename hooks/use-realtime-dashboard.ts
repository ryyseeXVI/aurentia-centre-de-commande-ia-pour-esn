'use client'

/**
 * Real-time Dashboard Hooks
 *
 * @fileoverview Hooks for real-time dashboard updates including projects,
 * tasks, time tracking, and consultant assignments.
 *
 * @module hooks/use-realtime-dashboard
 */

import { useRealtimeMultiSubscription } from './use-realtime'
import type { Database } from '@/lib/supabase/types'

type Projet = Database['public']['Tables']['projet']['Row']
type Tache = Database['public']['Tables']['tache']['Row']
type TempsPasse = Database['public']['Tables']['temps_passe']['Row']
type Affectation = Database['public']['Tables']['affectation']['Row']
type Consultant = Database['public']['Tables']['consultant']['Row']

interface DashboardCallbacks {
  onProjectChange?: (projet: Projet, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
  onTaskChange?: (tache: Tache, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
  onTimeEntryChange?: (tempsPasse: TempsPasse, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
  onAssignmentChange?: (affectation: Affectation, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
  onConsultantChange?: (consultant: Consultant, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
}

/**
 * Hook for subscribing to all dashboard-related changes in real-time
 *
 * @param organizationId - Organization ID to filter by
 * @param callbacks - Object containing callbacks for different entity types
 *
 * @example
 * ```typescript
 * useRealtimeDashboard(orgId, {
 *   onProjectChange: (projet, eventType) => {
 *     if (eventType === 'INSERT') {
 *       setProjects(prev => [...prev, projet])
 *     }
 *   },
 *   onTaskChange: (tache, eventType) => {
 *     if (eventType === 'UPDATE') {
 *       fetchDashboardStats() // Refresh stats
 *     }
 *   }
 * })
 * ```
 */
export function useRealtimeDashboard(
  organizationId: string | undefined,
  callbacks: DashboardCallbacks
) {
  const subscriptions = []

  if (organizationId) {
    if (callbacks.onProjectChange) {
      subscriptions.push({
        table: 'projet' as const,
        callback: (payload: any) => {
          if (payload.new) {
            callbacks.onProjectChange!(
              payload.new as Projet,
              payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
            )
          } else if (payload.old && payload.eventType === 'DELETE') {
            callbacks.onProjectChange!(
              payload.old as Projet,
              'DELETE'
            )
          }
        },
        filter: { organization_id: organizationId },
      })
    }

    if (callbacks.onTaskChange) {
      subscriptions.push({
        table: 'tache' as const,
        callback: (payload: any) => {
          if (payload.new) {
            callbacks.onTaskChange!(
              payload.new as Tache,
              payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
            )
          } else if (payload.old && payload.eventType === 'DELETE') {
            callbacks.onTaskChange!(
              payload.old as Tache,
              'DELETE'
            )
          }
        },
        filter: { organization_id: organizationId },
      })
    }

    if (callbacks.onTimeEntryChange) {
      subscriptions.push({
        table: 'temps_passe' as const,
        callback: (payload: any) => {
          if (payload.new) {
            callbacks.onTimeEntryChange!(
              payload.new as TempsPasse,
              payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
            )
          } else if (payload.old && payload.eventType === 'DELETE') {
            callbacks.onTimeEntryChange!(
              payload.old as TempsPasse,
              'DELETE'
            )
          }
        },
        filter: { organization_id: organizationId },
      })
    }

    if (callbacks.onAssignmentChange) {
      subscriptions.push({
        table: 'affectation' as const,
        callback: (payload: any) => {
          if (payload.new) {
            callbacks.onAssignmentChange!(
              payload.new as Affectation,
              payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
            )
          } else if (payload.old && payload.eventType === 'DELETE') {
            callbacks.onAssignmentChange!(
              payload.old as Affectation,
              'DELETE'
            )
          }
        },
        filter: { organization_id: organizationId },
      })
    }

    if (callbacks.onConsultantChange) {
      subscriptions.push({
        table: 'consultant' as const,
        callback: (payload: any) => {
          if (payload.new) {
            callbacks.onConsultantChange!(
              payload.new as Consultant,
              payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
            )
          } else if (payload.old && payload.eventType === 'DELETE') {
            callbacks.onConsultantChange!(
              payload.old as Consultant,
              'DELETE'
            )
          }
        },
        filter: { organization_id: organizationId },
      })
    }
  }

  useRealtimeMultiSubscription(subscriptions)
}

/**
 * Hook for subscribing to project-specific changes in real-time
 *
 * @param projectId - Project ID to monitor
 * @param onTaskChange - Callback when a task changes
 * @param onTimeEntryChange - Callback when a time entry changes
 * @param onAssignmentChange - Callback when an assignment changes
 *
 * @example
 * ```typescript
 * useRealtimeProject(projectId, {
 *   onTaskChange: (task) => {
 *     setTasks(prev => {
 *       const index = prev.findIndex(t => t.id === task.id)
 *       if (index >= 0) {
 *         const newTasks = [...prev]
 *         newTasks[index] = task
 *         return newTasks
 *       }
 *       return [...prev, task]
 *     })
 *   }
 * })
 * ```
 */
export function useRealtimeProject(
  projectId: string | undefined,
  callbacks: {
    onTaskChange?: (tache: Tache, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
    onTimeEntryChange?: (tempsPasse: TempsPasse, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
    onAssignmentChange?: (affectation: Affectation, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
  }
) {
  const subscriptions = []

  if (projectId) {
    if (callbacks.onTaskChange) {
      subscriptions.push({
        table: 'tache' as const,
        callback: (payload: any) => {
          if (payload.new) {
            callbacks.onTaskChange!(
              payload.new as Tache,
              payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
            )
          } else if (payload.old && payload.eventType === 'DELETE') {
            callbacks.onTaskChange!(
              payload.old as Tache,
              'DELETE'
            )
          }
        },
        filter: { projet_id: projectId },
      })
    }

    if (callbacks.onTimeEntryChange) {
      subscriptions.push({
        table: 'temps_passe' as const,
        callback: (payload: any) => {
          if (payload.new) {
            callbacks.onTimeEntryChange!(
              payload.new as TempsPasse,
              payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
            )
          } else if (payload.old && payload.eventType === 'DELETE') {
            callbacks.onTimeEntryChange!(
              payload.old as TempsPasse,
              'DELETE'
            )
          }
        },
        filter: { projet_id: projectId },
      })
    }

    if (callbacks.onAssignmentChange) {
      subscriptions.push({
        table: 'affectation' as const,
        callback: (payload: any) => {
          if (payload.new) {
            callbacks.onAssignmentChange!(
              payload.new as Affectation,
              payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
            )
          } else if (payload.old && payload.eventType === 'DELETE') {
            callbacks.onAssignmentChange!(
              payload.old as Affectation,
              'DELETE'
            )
          }
        },
        filter: { projet_id: projectId },
      })
    }
  }

  useRealtimeMultiSubscription(subscriptions)
}
