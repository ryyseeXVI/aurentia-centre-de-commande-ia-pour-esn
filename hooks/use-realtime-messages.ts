'use client'

/**
 * Real-time Messaging Hooks
 *
 * @fileoverview Hooks for real-time messaging functionality including
 * channel messages, direct messages, typing indicators, and reactions.
 *
 * @module hooks/use-realtime-messages
 */

import { useEffect, useState } from 'react'
import { useRealtimeSubscription, useRealtimeMultiSubscription } from './use-realtime'
import type { Database } from '@/lib/supabase/types'

type ChannelMessage = Database['public']['Tables']['channel_messages']['Row']
type DirectMessage = Database['public']['Tables']['direct_messages']['Row']
type TypingIndicator = Database['public']['Tables']['typing_indicators']['Row']
type MessageReaction = Database['public']['Tables']['message_reactions']['Row']

/**
 * Hook for subscribing to channel messages in real-time
 *
 * @param channelId - The channel ID to subscribe to
 * @param channelType - Type of channel ('organization' or 'project')
 * @param onNewMessage - Callback when a new message is received
 * @param onMessageUpdate - Callback when a message is updated
 * @param onMessageDelete - Callback when a message is deleted
 *
 * @example
 * ```typescript
 * useRealtimeChannelMessages(
 *   channelId,
 *   'project',
 *   (message) => setMessages(prev => [...prev, message]),
 *   (message) => setMessages(prev => prev.map(m => m.id === message.id ? message : m)),
 *   (messageId) => setMessages(prev => prev.filter(m => m.id !== messageId))
 * )
 * ```
 */
export function useRealtimeChannelMessages(
  channelId: string | undefined,
  channelType: 'organization' | 'project',
  onNewMessage?: (message: ChannelMessage) => void,
  onMessageUpdate?: (message: ChannelMessage) => void,
  onMessageDelete?: (messageId: string) => void
) {
  useRealtimeMultiSubscription(
    channelId
      ? [
          {
            table: 'channel_messages',
            event: 'INSERT',
            filter: { channel_id: channelId, channel_type: channelType },
            callback: (payload) => {
              if (onNewMessage && payload.new) {
                onNewMessage(payload.new as ChannelMessage)
              }
            },
          },
          {
            table: 'channel_messages',
            event: 'UPDATE',
            filter: { channel_id: channelId, channel_type: channelType },
            callback: (payload) => {
              if (onMessageUpdate && payload.new) {
                onMessageUpdate(payload.new as ChannelMessage)
              }
            },
          },
          {
            table: 'channel_messages',
            event: 'DELETE',
            filter: { channel_id: channelId, channel_type: channelType },
            callback: (payload) => {
              if (onMessageDelete && payload.old) {
                onMessageDelete((payload.old as ChannelMessage).id)
              }
            },
          },
        ]
      : []
  )
}

/**
 * Hook for subscribing to direct messages in real-time
 *
 * @param userId - Current user ID
 * @param onNewMessage - Callback when a new direct message is received
 * @param onMessageUpdate - Callback when a message is updated
 *
 * @example
 * ```typescript
 * useRealtimeDirectMessages(
 *   userId,
 *   (message) => {
 *     if (message.recipient_id === userId) {
 *       setMessages(prev => [...prev, message])
 *       showNotification(message)
 *     }
 *   }
 * )
 * ```
 */
export function useRealtimeDirectMessages(
  userId: string | undefined,
  onNewMessage?: (message: DirectMessage) => void,
  onMessageUpdate?: (message: DirectMessage) => void
) {
  useRealtimeSubscription(
    'direct_messages',
    (payload) => {
      const message = payload.new as DirectMessage
      if (!message || !userId) return

      // Only process messages where user is sender or recipient
      if (message.sender_id === userId || message.recipient_id === userId) {
        if (payload.eventType === 'INSERT' && onNewMessage) {
          onNewMessage(message)
        } else if (payload.eventType === 'UPDATE' && onMessageUpdate) {
          onMessageUpdate(message)
        }
      }
    },
    undefined,
    '*'
  )
}

/**
 * Hook for subscribing to typing indicators in real-time
 *
 * @param channelId - The channel ID to monitor
 * @param channelType - Type of channel
 * @returns Array of user IDs currently typing
 *
 * @example
 * ```typescript
 * const typingUsers = useRealtimeTypingIndicators(channelId, 'project')
 * // Display: {typingUsers.length} user(s) typing...
 * ```
 */
export function useRealtimeTypingIndicators(
  channelId: string | undefined,
  channelType: 'organization' | 'project' | 'direct'
) {
  const [typingUsers, setTypingUsers] = useState<string[]>([])

  useRealtimeSubscription(
    'typing_indicators',
    (payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        const indicator = payload.new as TypingIndicator
        setTypingUsers((prev) => {
          if (prev.includes(indicator.user_id)) return prev
          return [...prev, indicator.user_id]
        })

        // Auto-remove after 3 seconds (typing indicators should be ephemeral)
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((id) => id !== indicator.user_id))
        }, 3000)
      } else if (payload.eventType === 'DELETE' && payload.old) {
        const indicator = payload.old as TypingIndicator
        setTypingUsers((prev) => prev.filter((id) => id !== indicator.user_id))
      }
    },
    channelId ? { channel_id: channelId, channel_type: channelType } : undefined
  )

  return typingUsers
}

/**
 * Hook for subscribing to message reactions in real-time
 *
 * @param messageId - The message ID to monitor for reactions
 * @param messageType - Type of message ('channel' or 'direct')
 * @param onReactionAdd - Callback when a reaction is added
 * @param onReactionRemove - Callback when a reaction is removed
 *
 * @example
 * ```typescript
 * useRealtimeMessageReactions(
 *   messageId,
 *   'channel',
 *   (reaction) => setReactions(prev => [...prev, reaction]),
 *   (reactionId) => setReactions(prev => prev.filter(r => r.id !== reactionId))
 * )
 * ```
 */
export function useRealtimeMessageReactions(
  messageId: string | undefined,
  messageType: 'channel' | 'direct',
  onReactionAdd?: (reaction: MessageReaction) => void,
  onReactionRemove?: (reactionId: string) => void
) {
  useRealtimeSubscription(
    'message_reactions',
    (payload) => {
      if (payload.eventType === 'INSERT' && payload.new && onReactionAdd) {
        onReactionAdd(payload.new as MessageReaction)
      } else if (payload.eventType === 'DELETE' && payload.old && onReactionRemove) {
        onReactionRemove((payload.old as MessageReaction).id)
      }
    },
    messageId ? { message_id: messageId, message_type: messageType } : undefined
  )
}

/**
 * Hook for subscribing to user presence (online/offline status)
 *
 * @param organizationId - Organization to monitor
 * @param onStatusChange - Callback when user status changes
 *
 * @example
 * ```typescript
 * useRealtimeUserPresence(
 *   orgId,
 *   (profile) => {
 *     setUsers(prev => prev.map(u =>
 *       u.id === profile.id ? { ...u, status: profile.status } : u
 *     ))
 *   }
 * )
 * ```
 */
export function useRealtimeUserPresence(
  organizationId: string | undefined,
  onStatusChange?: (profile: Database['public']['Tables']['profiles']['Row']) => void
) {
  useRealtimeSubscription(
    'profiles',
    (payload) => {
      if (payload.eventType === 'UPDATE' && payload.new && onStatusChange) {
        const profile = payload.new as Database['public']['Tables']['profiles']['Row']
        // Only process status or last_seen changes
        if (payload.old && (
          (payload.old as any).status !== profile.status ||
          (payload.old as any).last_seen !== profile.last_seen
        )) {
          onStatusChange(profile)
        }
      }
    },
    organizationId ? { organization_id: organizationId } : undefined,
    'UPDATE'
  )
}
