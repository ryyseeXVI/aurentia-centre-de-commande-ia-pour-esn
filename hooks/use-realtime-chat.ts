'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface ChatMessage {
  id: string
  content: string
  sender_id: string
  created_at: string
  edited_at: string | null
  sender: {
    id: string
    prenom: string
    nom: string
    avatar_url: string | null
  }
}

export interface UseRealtimeChatOptions {
  chatType: 'organization' | 'project' | 'direct' | 'group'
  chatId: string
  organizationId?: string
  onMessage?: (message: ChatMessage) => void
  onTyping?: (userId: string, isTyping: boolean) => void
}

export function useRealtimeChat({
  chatType,
  chatId,
  organizationId,
  onMessage,
  onTyping,
}: UseRealtimeChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const supabase = createClient()

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true)

      let query
      if (chatType === 'direct') {
        // organizationId is optional for cross-organization messaging
        const params = new URLSearchParams({ recipientId: chatId })
        if (organizationId) {
          params.append('organizationId', organizationId)
        }
        const response = await fetch(`/api/messenger/direct-messages?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setMessages(data.messages || [])
        }
      } else if (chatType === 'group') {
        const response = await fetch(`/api/chat/group-messages?groupId=${chatId}`)
        if (response.ok) {
          const data = await response.json()
          setMessages(data.messages || [])
        }
      } else {
        const response = await fetch(`/api/messenger/messages?channelId=${chatId}&channelType=${chatType}`)
        if (response.ok) {
          const data = await response.json()
          setMessages(data.messages || [])
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }, [chatType, chatId, organizationId])

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    try {
      let response: Response

      if (chatType === 'direct') {
        // organizationId is optional for cross-organization messaging
        const payload: any = { recipientId: chatId, content }
        if (organizationId) {
          payload.organizationId = organizationId
        }
        response = await fetch('/api/messenger/direct-messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else if (chatType === 'group') {
        response = await fetch('/api/chat/group-messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupId: chatId, content }),
        })
      } else {
        response = await fetch('/api/messenger/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelId: chatId, channelType: chatType, content }),
        })
      }

      if (response.ok) {
        // Parse response and add message to state immediately (optimistic update)
        const data = await response.json()
        if (data.message) {
          setMessages((prev) => {
            // Dedupe: Check if message already exists
            if (prev.some(msg => msg.id === data.message.id)) {
              return prev
            }
            return [...prev, data.message as ChatMessage]
          })
        }
        return true
      }
      return false
    } catch (error) {
      console.error('Error sending message:', error)
      return false
    }
  }, [chatType, chatId, organizationId])

  // Send typing indicator
  const sendTyping = useCallback(async (isTyping: boolean) => {
    try {
      await fetch('/api/messenger/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatType,
          chatId,
          isTyping,
        }),
      })
    } catch (error) {
      console.error('Error sending typing indicator:', error)
    }
  }, [chatType, chatId])

  // Set up real-time subscriptions
  useEffect(() => {
    fetchMessages()

    const tableName = chatType === 'direct' ? 'direct_messages' :
                     chatType === 'group' ? 'channel_messages' :
                     'channel_messages'

    const newChannel = supabase
      .channel(`chat:${chatType}:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: tableName,
          filter: chatType === 'direct'
            ? undefined  // Filter handled server-side
            : `channel_id=eq.${chatId}`,
        },
        async (payload) => {
          // Fetch the complete message with sender info
          const { data } = await supabase
            .from(tableName)
            .select(`
              *,
              sender:profiles!${tableName}_sender_id_fkey(id, prenom, nom, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            const newMessage = data as unknown as ChatMessage
            setMessages((prev) => {
              // Dedupe: Check if message already exists (from optimistic update)
              if (prev.some(msg => msg.id === newMessage.id)) {
                return prev
              }
              return [...prev, newMessage]
            })
            onMessage?.(newMessage)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: tableName,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id ? { ...msg, ...payload.new } as ChatMessage : msg
            )
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: tableName,
        },
        (payload) => {
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id))
        }
      )
      .subscribe()

    setChannel(newChannel)

    return () => {
      newChannel.unsubscribe()
    }
  }, [chatType, chatId, supabase, fetchMessages, onMessage])

  return {
    messages,
    loading,
    sendMessage,
    sendTyping,
    refreshMessages: fetchMessages,
  }
}
