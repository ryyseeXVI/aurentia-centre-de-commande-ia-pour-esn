# 🔔 Notification System Guide

## Overview

The notification system is now fully implemented end-to-end with real-time updates, user-facing UI, admin management interface, and helper functions for easy integration.

## Features

✅ **Real-time notifications** - Instant updates using Supabase real-time subscriptions  
✅ **Bell icon with unread badge** - Shows count of unread notifications  
✅ **Dropdown interface** - View, mark as read, and manage notifications  
✅ **Admin management** - Full CRUD + broadcast capabilities for admins  
✅ **Type-safe helpers** - Easy-to-use functions for creating notifications  
✅ **Automatic updates** - Context auto-refreshes when new notifications arrive  

---

## User Experience

### Notification Bell
- Located in the sidebar header next to the organization switcher
- Shows red badge with unread count
- Click to open dropdown with notification list
- Real-time updates without page refresh

### Dropdown Features
- **Mark as Read**: Click any notification to mark it as read
- **Mark All as Read**: Button to clear all unread notifications
- **Time Display**: Shows relative time (e.g., "2 hours ago")
- **Link Support**: Notifications can link to relevant pages
- **Scrollable**: Handles large number of notifications

---

## For Developers

### 1. Creating Notifications (Server-Side)

Use the helper functions from `lib/notifications.ts`:

```typescript
import { notifyTaskAssigned, createNotification, notifyOrganization } from '@/lib/notifications';

// ✅ Task assignment notification
await notifyTaskAssigned({
  assigneeId: userId,
  assignerId: currentUserId,
  organizationId: orgId,
  taskTitle: "Fix bug in dashboard",
  taskId: taskId,
});

// ✅ Custom notification
await createNotification({
  userId: recipientId,
  organizationId: orgId,
  type: "INFO",
  title: "Welcome!",
  message: "Your account has been created successfully.",
  link: "/app/profile",
  metadata: { source: "onboarding" },
});

// ✅ Notify entire organization
await notifyOrganization({
  organizationId: orgId,
  type: "PROJECT_UPDATE",
  title: "New Feature Released",
  message: "Check out our new analytics dashboard!",
  link: "/app/analytics",
});
```

### 2. Creating Notifications (Client-Side)

Use the helper functions from `lib/notifications-client.ts`:

```typescript
'use client';
import { notifyTaskAssignedClient, broadcastNotificationClient } from '@/lib/notifications-client';

// ✅ Task assignment (client-side)
await notifyTaskAssignedClient({
  assigneeId: userId,
  organizationId: orgId,
  taskTitle: "Review PR",
  taskId: taskId,
});

// ✅ Broadcast to all users (client-side)
await broadcastNotificationClient({
  organizationId: orgId,
  type: "INFO",
  title: "Maintenance Window",
  message: "Scheduled maintenance on Sunday at 2 AM",
  recipientType: "ALL",
});

// ✅ Broadcast to specific role
await broadcastNotificationClient({
  organizationId: orgId,
  type: "WARNING",
  title: "Action Required",
  message: "Please review pending approvals",
  recipientType: "ROLE",
  role: "MANAGER",
});
```

### 3. Available Notification Types

```typescript
type NotificationType = 
  | "INFO"              // General information
  | "SUCCESS"           // Success messages
  | "WARNING"           // Warnings
  | "ERROR"             // Errors
  | "TASK_ASSIGNED"     // Task assignments
  | "TASK_COMPLETED"    // Task completions
  | "PROJECT_UPDATE"    // Project updates
  | "MILESTONE_REACHED" // Milestone achievements
  | "SYSTEM";           // System messages
```

### 4. Using the Notifications Context

Access notification state in any Client Component:

```typescript
'use client';
import { useNotifications } from '@/contexts/notifications-context';

export function MyComponent() {
  const {
    notifications,       // Array of all notifications
    unreadCount,        // Number of unread notifications
    isLoading,          // Loading state
    error,              // Error state
    refreshNotifications,  // Manually refresh
    markAsRead,         // Mark single as read
    markAllAsRead,      // Mark all as read
    deleteNotification, // Delete notification
  } = useNotifications();

  return (
    <div>
      <p>You have {unreadCount} unread notifications</p>
      {notifications.map(notif => (
        <div key={notif.id}>{notif.title}</div>
      ))}
    </div>
  );
}
```

---

## Admin Features

### Admin Dashboard
- **Location**: `/admin/notifications`
- **Features**:
  - View all notifications across all users
  - Filter by type, read status, organization
  - Bulk delete operations
  - CSV export

### Broadcasting Notifications
Admins can broadcast notifications to:
- **All users** in an organization
- **Specific roles** (ADMIN, MANAGER, CONSULTANT, CLIENT)
- **Selected users** (multi-select)

### Form Options
- **Single Notification**: Send to one specific user
- **Broadcast Mode**: Send to multiple users at once

---

## Integration Examples

### Example 1: Task Assignment

```typescript
// In your task creation/update logic
import { notifyTaskAssigned } from '@/lib/notifications';

async function assignTaskToUser(taskId: string, assigneeId: string) {
  // ... existing task assignment logic ...
  
  // Send notification
  await notifyTaskAssigned({
    assigneeId,
    assignerId: currentUser.id,
    organizationId: task.organization_id,
    taskTitle: task.title,
    taskId: task.id,
  });
}
```

### Example 2: Milestone Completion

```typescript
// When a milestone is marked as complete
import { notifyMilestoneReached } from '@/lib/notifications';

async function completeMilestone(milestoneId: string) {
  // ... update milestone status ...
  
  // Notify everyone in the organization
  await notifyMilestoneReached({
    organizationId: milestone.organization_id,
    milestoneId: milestone.id,
    milestoneName: milestone.nom,
    projectId: milestone.projet_id,
  });
}
```

### Example 3: Custom Notifications

```typescript
// Custom business logic notification
import { createNotification } from '@/lib/notifications';

async function handleImportantEvent(userId: string, details: any) {
  await createNotification({
    userId,
    organizationId: details.orgId,
    type: "WARNING",
    title: "Urgent: Review Required",
    message: `Document ${details.docName} requires your immediate attention.`,
    link: `/app/documents/${details.docId}`,
    metadata: {
      document_id: details.docId,
      priority: "high",
      deadline: details.deadline,
    },
  });
}
```

---

## Database Schema

```sql
Table: notification
- id: uuid (primary key)
- user_id: uuid (references auth.users)
- organization_id: uuid (references organizations)
- type: text (notification type)
- title: text (notification title)
- message: text (notification message)
- link: text (optional URL)
- metadata: jsonb (additional data)
- read_at: timestamp (null if unread)
- created_at: timestamp
- updated_at: timestamp
```

---

## API Endpoints

### User Endpoints
```
GET    /api/notifications              # Get user's notifications
PATCH  /api/notifications/:id          # Mark as read
DELETE /api/notifications/:id          # Delete notification
```

### Admin Endpoints
```
GET    /api/admin/notifications        # Get all notifications
POST   /api/admin/notifications        # Create or broadcast
PATCH  /api/admin/notifications/:id    # Update notification
DELETE /api/admin/notifications/:id    # Delete notification
```

---

## Real-time Updates

The system automatically subscribes to database changes:
- New notifications appear instantly
- Unread badge updates in real-time
- No polling required
- Efficient Supabase real-time subscriptions

---

## Best Practices

### ✅ DO:
- Use helper functions for common scenarios
- Include relevant links in notifications
- Use appropriate notification types
- Add metadata for tracking/filtering
- Keep messages concise and actionable

### ❌ DON'T:
- Send notifications for every minor action
- Use ERROR type for non-critical issues
- Create notifications without organization context
- Forget to handle errors from notification creation
- Spam users with duplicate notifications

---

## Troubleshooting

### Notifications not appearing?
1. Check that NotificationsProvider is in the layout
2. Verify user is authenticated
3. Check browser console for errors
4. Ensure database table name is `notification` (singular)

### Real-time not working?
1. Verify Supabase real-time is enabled
2. Check database permissions (RLS policies)
3. Ensure websocket connection is established
4. Check for firewall/network issues

### Unread count incorrect?
1. The API calculates unread count on fetch
2. Context updates count on mark as read
3. Check for database sync issues

---

## Future Enhancements

Potential improvements for the future:
- [ ] Push notifications (browser/mobile)
- [ ] Email digest of unread notifications
- [ ] Notification preferences per user
- [ ] Sound/vibration on new notifications
- [ ] Notification groups/threading
- [ ] Scheduled notifications
- [ ] Notification templates
- [ ] Analytics on notification engagement

---

## Support

For questions or issues:
1. Check this guide first
2. Review the code in `contexts/notifications-context.tsx`
3. Test in the admin interface at `/admin/notifications`
4. Check Supabase logs for database issues

