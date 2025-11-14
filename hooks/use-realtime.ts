// @ts-nocheck
'use client'

/**
 * Real-time Subscription Hooks
 *
 * @fileoverview Hooks for subscribing to real-time changes in Supabase tables.
 * Provides automatic cleanup and re-subscription on dependency changes.
 *
 * @module hooks/use-realtime
 */

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type Tables = Database['public']['Tables']
type TableName = keyof Tables

/**
 * Generic real-time subscription hook
 *
 * @param table - The table name to subscribe to
 * @param callback - Function called when changes occur
 * @param filter - Optional filter for the subscription
 * @param event - Type of event to listen for (default: '*' for all)
 *
 * @example
 * ```typescript
 * useRealtimeSubscription(
 *   'channel_messages',
 *   (payload) => {
 *     if (payload.eventType === 'INSERT') {
 *       setMessages(prev => [...prev, payload.new])
 *     }
 *   },
 *   { channel_id: 'abc-123' }
 * )
 * ```
 */
export function useRealtimeSubscription<T extends TableName>(
  table: T,
  callback: (payload: RealtimePostgresChangesPayload<Tables[T]['Row']>) => void,
  filter?: { [key: string]: string | number },
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*'
) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Create filter string for Supabase
    let filterString = ''
    if (filter) {
      filterString = Object.entries(filter)
        .map(([key, value]) => `${key}=eq.${value}`)
        .join(',')
    }

    // Create unique channel name with safe string conversion
    const channelName = `${String(table)}_${filterString || 'all'}_${Date.now()}`

    // Subscribe to changes
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          filter: filterString || undefined,
        },
        callback as any
      )
      .subscribe()

    channelRef.current = channel

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [table, event, JSON.stringify(filter)])

  return channelRef
}

/**
 * Hook for subscribing to multiple table changes
 *
 * @param subscriptions - Array of subscription configurations
 *
 * @example
 * ```typescript
 * useRealtimeMultiSubscription([
 *   {
 *     table: 'channel_messages',
 *     callback: handleMessageChange,
 *     filter: { channel_id: channelId }
 *   },
 *   {
 *     table: 'typing_indicators',
 *     callback: handleTypingChange,
 *     filter: { channel_id: channelId }
 *   }
 * ])
 * ```
 */
export function useRealtimeMultiSubscription(
  subscriptions: Array<{
    table: TableName
    callback: (payload: any) => void
    filter?: { [key: string]: string | number }
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  }>
) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const channelName = `multi_${Date.now()}`
    let channel = supabase.channel(channelName)

    // Add all subscriptions to the same channel
    subscriptions.forEach(({ table, callback, filter, event = '*' }) => {
      let filterString = ''
      if (filter) {
        filterString = Object.entries(filter)
          .map(([key, value]) => `${key}=eq.${value}`)
          .join(',')
      }

      channel = channel.on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          filter: filterString || undefined,
        },
        callback
      )
    })

    // Subscribe once with all listeners
    channel.subscribe()
    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptions.length, JSON.stringify(subscriptions.map(s => ({ table: s.table, filter: s.filter, event: s.event })))])

  return channelRef
}
