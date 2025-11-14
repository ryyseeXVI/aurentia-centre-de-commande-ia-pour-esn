'use client'

/**
 * Real-time Analytics Hooks
 *
 * @fileoverview Hooks for real-time analytics including activity logs,
 * notifications, risk predictions, drift detection, and incidents.
 *
 * @module hooks/use-realtime-analytics
 */

import { useRealtimeSubscription, useRealtimeMultiSubscription } from './use-realtime'
import type { Database } from '@/lib/supabase/types'

type ActivityLog = Database['public']['Tables']['activity_logs']['Row']
type Notification = Database['public']['Tables']['notifications']['Row']
type DetectionDerive = Database['public']['Tables']['detection_derive']['Row']
type PredictionRisque = Database['public']['Tables']['prediction_risque']['Row']
type Incident = Database['public']['Tables']['incident']['Row']

/**
 * Hook for subscribing to activity logs in real-time
 *
 * @param organizationId - Organization ID to filter by
 * @param onNewActivity - Callback when a new activity log is created
 *
 * @example
 * ```typescript
 * useRealtimeActivityLogs(orgId, (activity) => {
 *   setActivities(prev => [activity, ...prev].slice(0, 50)) // Keep last 50
 *   if (activity.action === 'PROJECT_CREATED') {
 *     showNotification('New project created!')
 *   }
 * })
 * ```
 */
export function useRealtimeActivityLogs(
  organizationId: string | undefined,
  onNewActivity?: (activity: ActivityLog) => void
) {
  useRealtimeSubscription(
    'activity_logs',
    (payload) => {
      if (payload.eventType === 'INSERT' && payload.new && onNewActivity) {
        onNewActivity(payload.new as ActivityLog)
      }
    },
    organizationId ? { organization_id: organizationId } : undefined,
    'INSERT'
  )
}

/**
 * Hook for subscribing to notifications in real-time
 *
 * @param userId - User ID to monitor
 * @param onNewNotification - Callback when a new notification arrives
 * @param onNotificationRead - Callback when a notification is marked as read
 *
 * @example
 * ```typescript
 * useRealtimeNotifications(
 *   userId,
 *   (notification) => {
 *     setNotifications(prev => [notification, ...prev])
 *     showToast(notification.title, notification.message)
 *     playNotificationSound()
 *   },
 *   (notification) => {
 *     setNotifications(prev => prev.map(n =>
 *       n.id === notification.id ? notification : n
 *     ))
 *   }
 * )
 * ```
 */
export function useRealtimeNotifications(
  userId: string | undefined,
  onNewNotification?: (notification: Notification) => void,
  onNotificationRead?: (notification: Notification) => void
) {
  useRealtimeSubscription(
    'notifications',
    (payload) => {
      if (payload.eventType === 'INSERT' && payload.new && onNewNotification) {
        onNewNotification(payload.new as Notification)
      } else if (payload.eventType === 'UPDATE' && payload.new && onNotificationRead) {
        const notification = payload.new as Notification
        // Check if read_at was just set
        if (notification.read_at && !(payload.old as Notification).read_at) {
          onNotificationRead(notification)
        }
      }
    },
    userId ? { user_id: userId } : undefined
  )
}

/**
 * Hook for subscribing to drift detection events in real-time
 *
 * @param organizationId - Organization ID to filter by
 * @param projectId - Optional project ID to filter by specific project
 * @param onDriftDetected - Callback when drift is detected
 *
 * @example
 * ```typescript
 * useRealtimeDriftDetection(orgId, undefined, (drift) => {
 *   if (drift.gravite === 'CRITICAL') {
 *     showUrgentAlert('Critical drift detected!', drift.description)
 *   }
 *   setDrifts(prev => [drift, ...prev])
 * })
 * ```
 */
export function useRealtimeDriftDetection(
  organizationId: string | undefined,
  projectId?: string,
  onDriftDetected?: (drift: DetectionDerive) => void
) {
  useRealtimeSubscription(
    'detection_derive',
    (payload) => {
      if (payload.eventType === 'INSERT' && payload.new && onDriftDetected) {
        const drift = payload.new as DetectionDerive
        // Filter by projectId if specified
        if (!projectId || drift.projet_id === projectId) {
          onDriftDetected(drift)
        }
      }
    },
    organizationId ? { organization_id: organizationId } : undefined,
    'INSERT'
  )
}

/**
 * Hook for subscribing to risk predictions in real-time
 *
 * @param organizationId - Organization ID to filter by
 * @param projectId - Optional project ID to filter by specific project
 * @param onRiskPredicted - Callback when a risk is predicted
 *
 * @example
 * ```typescript
 * useRealtimeRiskPredictions(orgId, projectId, (risk) => {
 *   if (risk.probabilite_pct && risk.probabilite_pct > 70) {
 *     showAlert('High risk detected', risk.justification)
 *   }
 *   setRisks(prev => [...prev, risk])
 * })
 * ```
 */
export function useRealtimeRiskPredictions(
  organizationId: string | undefined,
  projectId?: string,
  onRiskPredicted?: (risk: PredictionRisque) => void
) {
  useRealtimeSubscription(
    'prediction_risque',
    (payload) => {
      if (payload.eventType === 'INSERT' && payload.new && onRiskPredicted) {
        const risk = payload.new as PredictionRisque
        // Filter by projectId if specified
        if (!projectId || risk.projet_id === projectId) {
          onRiskPredicted(risk)
        }
      }
    },
    organizationId ? { organization_id: organizationId } : undefined,
    'INSERT'
  )
}

/**
 * Hook for subscribing to incident updates in real-time
 *
 * @param organizationId - Organization ID to filter by
 * @param projectId - Optional project ID to filter by specific project
 * @param onIncidentChange - Callback when an incident is created or updated
 *
 * @example
 * ```typescript
 * useRealtimeIncidents(orgId, undefined, (incident, eventType) => {
 *   if (eventType === 'INSERT' && incident.severite === 'CRITICAL') {
 *     alertOnCall('Critical incident!', incident.titre)
 *   }
 *   setIncidents(prev => {
 *     if (eventType === 'INSERT') return [incident, ...prev]
 *     return prev.map(i => i.id === incident.id ? incident : i)
 *   })
 * })
 * ```
 */
export function useRealtimeIncidents(
  organizationId: string | undefined,
  projectId?: string,
  onIncidentChange?: (incident: Incident, eventType: 'INSERT' | 'UPDATE') => void
) {
  useRealtimeSubscription(
    'incident',
    (payload) => {
      if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new && onIncidentChange) {
        const incident = payload.new as Incident
        // Filter by projectId if specified
        if (!projectId || incident.projet_id === projectId) {
          onIncidentChange(incident, payload.eventType as 'INSERT' | 'UPDATE')
        }
      }
    },
    organizationId ? { organization_id: organizationId } : undefined
  )
}

/**
 * Hook for subscribing to all analytics events for comprehensive monitoring
 *
 * @param organizationId - Organization ID to filter by
 * @param callbacks - Object containing all analytics callbacks
 *
 * @example
 * ```typescript
 * useRealtimeAnalytics(orgId, {
 *   onNewActivity: (activity) => logActivity(activity),
 *   onNewNotification: (notification) => showNotification(notification),
 *   onDriftDetected: (drift) => handleDrift(drift),
 *   onRiskPredicted: (risk) => handleRisk(risk),
 *   onIncidentChange: (incident) => handleIncident(incident)
 * })
 * ```
 */
export function useRealtimeAnalytics(
  organizationId: string | undefined,
  callbacks: {
    onNewActivity?: (activity: ActivityLog) => void
    onNewNotification?: (notification: Notification) => void
    onDriftDetected?: (drift: DetectionDerive) => void
    onRiskPredicted?: (risk: PredictionRisque) => void
    onIncidentChange?: (incident: Incident, eventType: 'INSERT' | 'UPDATE') => void
  }
) {
  const subscriptions = []

  if (organizationId) {
    if (callbacks.onNewActivity) {
      subscriptions.push({
        table: 'activity_logs' as const,
        event: 'INSERT' as const,
        callback: (payload: any) => {
          if (payload.new) {
            callbacks.onNewActivity!(payload.new as ActivityLog)
          }
        },
        filter: { organization_id: organizationId },
      })
    }

    if (callbacks.onNewNotification) {
      subscriptions.push({
        table: 'notifications' as const,
        event: 'INSERT' as const,
        callback: (payload: any) => {
          if (payload.new) {
            callbacks.onNewNotification!(payload.new as Notification)
          }
        },
        filter: { organization_id: organizationId },
      })
    }

    if (callbacks.onDriftDetected) {
      subscriptions.push({
        table: 'detection_derive' as const,
        event: 'INSERT' as const,
        callback: (payload: any) => {
          if (payload.new) {
            callbacks.onDriftDetected!(payload.new as DetectionDerive)
          }
        },
        filter: { organization_id: organizationId },
      })
    }

    if (callbacks.onRiskPredicted) {
      subscriptions.push({
        table: 'prediction_risque' as const,
        event: 'INSERT' as const,
        callback: (payload: any) => {
          if (payload.new) {
            callbacks.onRiskPredicted!(payload.new as PredictionRisque)
          }
        },
        filter: { organization_id: organizationId },
      })
    }

    if (callbacks.onIncidentChange) {
      subscriptions.push({
        table: 'incident' as const,
        callback: (payload: any) => {
          if (payload.new && (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE')) {
            callbacks.onIncidentChange!(
              payload.new as Incident,
              payload.eventType as 'INSERT' | 'UPDATE'
            )
          }
        },
        filter: { organization_id: organizationId },
      })
    }
  }

  useRealtimeMultiSubscription(subscriptions)
}
