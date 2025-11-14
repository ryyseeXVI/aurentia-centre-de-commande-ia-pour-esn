# Real-time Functionality Documentation

This document provides comprehensive guidance on using the real-time features in the Aurentia AI Command Center.

## Overview

Real-time functionality is implemented using Supabase Realtime, which provides WebSocket-based subscriptions to database changes. The application includes pre-built hooks for common real-time patterns.

## Enabled Tables

The following tables have real-time replication enabled:

### Messaging
- `channel_messages` - Channel/group messages
- `direct_messages` - One-on-one messages
- `typing_indicators` - Who's typing indicators
- `message_reactions` - Message reactions/emojis

### Dashboard
- `projet` - Projects
- `tache` - Tasks
- `temps_passe` - Time tracking entries
- `affectation` - Consultant assignments
- `consultant` - Consultant records

### Analytics
- `activity_logs` - User activity audit trail
- `notifications` - User notifications
- `detection_derive` - Drift detection events
- `prediction_risque` - AI risk predictions
- `incident` - Project incidents
- `profiles` - User profiles (for presence/status)

## Available Hooks

### Base Hooks (`hooks/use-realtime.ts`)

#### `useRealtimeSubscription`
Generic hook for subscribing to any table.

```typescript
import { useRealtimeSubscription } from '@/hooks/use-realtime'

useRealtimeSubscription(
  'channel_messages',
  (payload) => {
    console.log('Event:', payload.eventType)
    console.log('New data:', payload.new)
    console.log('Old data:', payload.old)
  },
  { channel_id: 'abc-123' }, // Filter
  'INSERT' // Event type (INSERT, UPDATE, DELETE, or *)
)
```

#### `useRealtimeMultiSubscription`
Subscribe to multiple tables with a single WebSocket connection.

```typescript
import { useRealtimeMultiSubscription } from '@/hooks/use-realtime'

useRealtimeMultiSubscription([
  {
    table: 'channel_messages',
    callback: handleMessage,
    filter: { channel_id: channelId }
  },
  {
    table: 'typing_indicators',
    callback: handleTyping,
    filter: { channel_id: channelId }
  }
])
```

### Messaging Hooks (`hooks/use-realtime-messages.ts`)

#### `useRealtimeChannelMessages`
Subscribe to channel messages with separate callbacks for insert, update, and delete.

```typescript
import { useRealtimeChannelMessages } from '@/hooks/use-realtime-messages'

useRealtimeChannelMessages(
  channelId,
  'project', // or 'organization'
  (message) => {
    // New message received
    setMessages(prev => [...prev, message])
    playNotificationSound()
  },
  (message) => {
    // Message updated (edited)
    setMessages(prev => prev.map(m => m.id === message.id ? message : m))
  },
  (messageId) => {
    // Message deleted
    setMessages(prev => prev.filter(m => m.id !== messageId))
  }
)
```

#### `useRealtimeDirectMessages`
Subscribe to direct messages for the current user.

```typescript
import { useRealtimeDirectMessages } from '@/hooks/use-realtime-messages'

useRealtimeDirectMessages(
  userId,
  (message) => {
    // Only receives messages where user is sender or recipient
    if (message.recipient_id === userId) {
      showNotification('New message from ' + message.sender_id)
    }
    setMessages(prev => [...prev, message])
  }
)
```

#### `useRealtimeTypingIndicators`
Monitor who's currently typing in a channel.

```typescript
import { useRealtimeTypingIndicators } from '@/hooks/use-realtime-messages'

const typingUsers = useRealtimeTypingIndicators(channelId, 'project')

// Display: {typingUsers.length} user(s) typing...
```

#### `useRealtimeMessageReactions`
Subscribe to reactions on a specific message.

```typescript
import { useRealtimeMessageReactions } from '@/hooks/use-realtime-messages'

useRealtimeMessageReactions(
  messageId,
  'channel',
  (reaction) => {
    // Reaction added
    setReactions(prev => [...prev, reaction])
  },
  (reactionId) => {
    // Reaction removed
    setReactions(prev => prev.filter(r => r.id !== reactionId))
  }
)
```

#### `useRealtimeUserPresence`
Monitor user online/offline status changes.

```typescript
import { useRealtimeUserPresence } from '@/hooks/use-realtime-messages'

useRealtimeUserPresence(
  organizationId,
  (profile) => {
    // User status changed (online, offline, away)
    updateUserStatus(profile.id, profile.status)
  }
)
```

### Dashboard Hooks (`hooks/use-realtime-dashboard.ts`)

#### `useRealtimeDashboard`
Subscribe to all dashboard-related changes for an organization.

```typescript
import { useRealtimeDashboard } from '@/hooks/use-realtime-dashboard'

useRealtimeDashboard(organizationId, {
  onProjectChange: (projet, eventType) => {
    if (eventType === 'INSERT') {
      setProjects(prev => [...prev, projet])
    } else if (eventType === 'UPDATE') {
      setProjects(prev => prev.map(p => p.id === projet.id ? projet : p))
    } else if (eventType === 'DELETE') {
      setProjects(prev => prev.filter(p => p.id !== projet.id))
    }
    // Refresh dashboard stats
    refreshStats()
  },
  onTaskChange: (tache, eventType) => {
    // Handle task changes
    handleTaskUpdate(tache, eventType)
  },
  onTimeEntryChange: (tempsPasse, eventType) => {
    // Update time tracking display
    refreshTimeStats()
  },
  onAssignmentChange: (affectation, eventType) => {
    // Update consultant assignments
    refreshAssignments()
  },
  onConsultantChange: (consultant, eventType) => {
    // Update consultant list
    refreshConsultants()
  }
})
```

#### `useRealtimeProject`
Subscribe to changes for a specific project.

```typescript
import { useRealtimeProject } from '@/hooks/use-realtime-dashboard'

useRealtimeProject(projectId, {
  onTaskChange: (task, eventType) => {
    // Real-time task updates for project detail view
    setTasks(prev => {
      if (eventType === 'INSERT') return [...prev, task]
      if (eventType === 'UPDATE') return prev.map(t => t.id === task.id ? task : t)
      if (eventType === 'DELETE') return prev.filter(t => t.id !== task.id)
      return prev
    })
  },
  onTimeEntryChange: (entry, eventType) => {
    // Update time tracking in real-time
    recalculateProjectHours()
  },
  onAssignmentChange: (assignment, eventType) => {
    // Update team assignments
    refreshTeamMembers()
  }
})
```

### Analytics Hooks (`hooks/use-realtime-analytics.ts`)

#### `useRealtimeActivityLogs`
Subscribe to activity logs for audit trail display.

```typescript
import { useRealtimeActivityLogs } from '@/hooks/use-realtime-analytics'

useRealtimeActivityLogs(organizationId, (activity) => {
  // Add to activity feed (keep last 50)
  setActivities(prev => [activity, ...prev].slice(0, 50))

  // Show notification for important actions
  if (activity.action === 'PROJECT_CREATED') {
    toast.success('New project created by ' + activity.user_id)
  }
})
```

#### `useRealtimeNotifications`
Subscribe to user notifications in real-time.

```typescript
import { useRealtimeNotifications } from '@/hooks/use-realtime-analytics'

useRealtimeNotifications(
  userId,
  (notification) => {
    // New notification received
    setNotifications(prev => [notification, ...prev])
    showToast(notification.title, notification.message)
    playNotificationSound()
    updateUnreadCount(prev => prev + 1)
  },
  (notification) => {
    // Notification marked as read
    setNotifications(prev => prev.map(n =>
      n.id === notification.id ? notification : n
    ))
    updateUnreadCount(prev => Math.max(0, prev - 1))
  }
)
```

#### `useRealtimeDriftDetection`
Monitor drift detection events in real-time.

```typescript
import { useRealtimeDriftDetection } from '@/hooks/use-realtime-analytics'

useRealtimeDriftDetection(
  organizationId,
  projectId, // Optional: filter by project
  (drift) => {
    setDrifts(prev => [drift, ...prev])

    // Alert for critical drifts
    if (drift.gravite === 'CRITICAL') {
      showUrgentAlert('Critical drift detected!', drift.description)
      notifyProjectManager(drift)
    }
  }
)
```

#### `useRealtimeRiskPredictions`
Monitor AI risk predictions in real-time.

```typescript
import { useRealtimeRiskPredictions } from '@/hooks/use-realtime-analytics'

useRealtimeRiskPredictions(
  organizationId,
  projectId, // Optional
  (risk) => {
    setRisks(prev => [...prev, risk])

    // High probability risks
    if (risk.probabilite_pct && risk.probabilite_pct > 70) {
      showWarning('High risk detected', risk.justification)
    }
  }
)
```

#### `useRealtimeIncidents`
Monitor incident creation and updates.

```typescript
import { useRealtimeIncidents } from '@/hooks/use-realtime-analytics'

useRealtimeIncidents(
  organizationId,
  projectId, // Optional
  (incident, eventType) => {
    if (eventType === 'INSERT') {
      setIncidents(prev => [incident, ...prev])

      // Alert for critical incidents
      if (incident.severite === 'CRITICAL') {
        alertOnCall('Critical incident!', incident.titre)
      }
    } else {
      // Update existing incident
      setIncidents(prev => prev.map(i =>
        i.id === incident.id ? incident : i
      ))
    }
  }
)
```

#### `useRealtimeAnalytics`
Subscribe to all analytics events at once.

```typescript
import { useRealtimeAnalytics } from '@/hooks/use-realtime-analytics'

useRealtimeAnalytics(organizationId, {
  onNewActivity: (activity) => logToFeed(activity),
  onNewNotification: (notification) => showNotification(notification),
  onDriftDetected: (drift) => handleDrift(drift),
  onRiskPredicted: (risk) => handleRisk(risk),
  onIncidentChange: (incident, eventType) => handleIncident(incident, eventType)
})
```

## Complete Example: Chat Component

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRealtimeChannelMessages, useRealtimeTypingIndicators } from '@/hooks/use-realtime-messages'
import { createClient } from '@/lib/supabase/client'

export function ChatComponent({ channelId, userId }: { channelId: string, userId: string }) {
  const [messages, setMessages] = useState<any[]>([])
  const [inputValue, setInputValue] = useState('')

  // Subscribe to new messages, edits, and deletions
  useRealtimeChannelMessages(
    channelId,
    'project',
    (message) => setMessages(prev => [...prev, message]),
    (message) => setMessages(prev => prev.map(m => m.id === message.id ? message : m)),
    (messageId) => setMessages(prev => prev.filter(m => m.id !== messageId))
  )

  // Monitor typing indicators
  const typingUsers = useRealtimeTypingIndicators(channelId, 'project')

  const sendMessage = async () => {
    const supabase = createClient()
    await supabase.from('channel_messages').insert({
      channel_id: channelId,
      channel_type: 'project',
      sender_id: userId,
      content: inputValue
    })
    setInputValue('')
  }

  return (
    <div>
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id}>{msg.content}</div>
        ))}
      </div>

      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          {typingUsers.length} user(s) typing...
        </div>
      )}

      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
      />
    </div>
  )
}
```

## Complete Example: Dashboard with Real-time Stats

```typescript
'use client'

import { useState } from 'react'
import { useRealtimeDashboard } from '@/hooks/use-realtime-dashboard'

export function Dashboard({ organizationId }: { organizationId: string }) {
  const [stats, setStats] = useState({ projects: 0, tasks: 0, hours: 0 })

  const refreshStats = () => {
    // Fetch updated stats from API or recalculate
    // This is called whenever dashboard data changes
    fetchDashboardStats().then(setStats)
  }

  useRealtimeDashboard(organizationId, {
    onProjectChange: () => refreshStats(),
    onTaskChange: () => refreshStats(),
    onTimeEntryChange: () => refreshStats(),
  })

  return (
    <div>
      <div>Projects: {stats.projects}</div>
      <div>Tasks: {stats.tasks}</div>
      <div>Hours: {stats.hours}</div>
    </div>
  )
}
```

## Best Practices

### 1. Cleanup
All hooks automatically handle cleanup. Subscriptions are removed when components unmount.

### 2. Performance
- Use `useRealtimeMultiSubscription` when subscribing to multiple tables to reduce WebSocket connections
- Filter subscriptions by organization_id, project_id, or user_id to reduce bandwidth
- Avoid creating subscriptions in loops

### 3. Security
- Real-time subscriptions respect Row Level Security (RLS) policies
- Users only receive updates for data they have access to
- Always validate data on the server side

### 4. Error Handling
- Supabase Realtime automatically reconnects on connection loss
- Add error boundaries to handle unexpected issues

### 5. Testing
- Test real-time functionality in development with multiple browser tabs
- Use Supabase Studio to manually insert/update/delete records
- Check the browser console for subscription status

## Debugging

### Check Subscription Status
```typescript
const channelRef = useRealtimeSubscription(...)

useEffect(() => {
  if (channelRef.current) {
    console.log('Channel state:', channelRef.current.state)
  }
}, [channelRef])
```

### Monitor WebSocket Connection
Open browser DevTools > Network > WS (WebSocket) to see real-time messages.

### Verify Table is Enabled
```sql
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
```

## Troubleshooting

### Real-time Updates Not Received
1. Check that the table is added to `supabase_realtime` publication
2. Verify RLS policies allow SELECT on the table
3. Ensure filters match the data being changed
4. Check browser console for WebSocket errors

### Too Many Connections
Use `useRealtimeMultiSubscription` to combine multiple subscriptions into one channel.

### Stale Data
Real-time subscriptions complement, but don't replace, initial data fetching. Always fetch data on mount, then subscribe to updates.

## Migration Applied

The following migration has been applied to enable real-time:

```sql
-- Enable real-time replication for messaging tables
ALTER PUBLICATION supabase_realtime ADD TABLE channel_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;

-- Enable real-time replication for analytics and activity tables
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE consultant;
```

Tables that were already enabled: `projet`, `tache`, `temps_passe`, `affectation`, `detection_derive`, `incident`, `livrable`, `prediction_risque`, `recommandation_action`, `score_sante_projet`.
