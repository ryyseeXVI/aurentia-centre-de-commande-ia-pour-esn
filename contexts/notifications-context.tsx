'use client';

// NotificationsContext - Manages user notifications
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/utils/supabase/client';
import type { Notification } from '../types';

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

interface NotificationsProviderProps {
  children: React.ReactNode;
}

export function NotificationsProvider({ children }: NotificationsProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createBrowserSupabaseClient();

  // Fetch notifications from API
  const refreshNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications?limit=50');

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setNotifications(result.data.notifications || []);
      setUnreadCount(result.data.unreadCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, readAt: new Date().toISOString() }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications.filter(n => !n.readAt).map(n => n.id);

      await Promise.all(unreadIds.map(id => markAsRead(id)));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, [notifications, markAsRead]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      // Update local state
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));

      const wasUnread = notifications.find(n => n.id === notificationId && !n.readAt);
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, [notifications]);

  // Load notifications on mount
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Subscribe to real-time notifications
  useEffect(() => {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification',
        },
        (payload) => {
          const newNotification = payload.new as any;

          // Transform from snake_case to camelCase
          const transformedNotification = {
            id: newNotification.id,
            userId: newNotification.user_id,
            organizationId: newNotification.organization_id,
            type: newNotification.type,
            title: newNotification.title,
            message: newNotification.message,
            link: newNotification.link,
            metadata: newNotification.metadata,
            readAt: newNotification.read_at,
            createdAt: newNotification.created_at,
          };

          // Add to notifications list
          setNotifications(prev => [transformedNotification, ...prev]);

          // Increment unread count
          if (!newNotification.read_at) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const value: NotificationsContextValue = {
    notifications,
    unreadCount,
    isLoading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);

  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }

  return context;
}
