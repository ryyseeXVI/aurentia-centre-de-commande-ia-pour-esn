# 🔔 Notifications & Activity System - Complete Integration Guide

## 📍 **Where Are Notifications Integrated?**

### **Primary Location: Sidebar Bell Icon**

Notifications are integrated in the **application sidebar** and appear via:

1. **Bell Icon** - Located in the sidebar header (top-right area)
   - File: `/components/sidebar/app-sidebar.tsx` (line 197)
   - Component: `<NotificationsDropdown />`

2. **Notification Dropdown**
   - File: `/components/navbar/notifications-dropdown.tsx`
   - Features:
     - Real-time notification display
     - Unread count badge
     - Mark as read functionality
     - Mark all as read button
     - Scrollable list
     - Relative timestamps ("2 hours ago")

3. **Notification Context**
   - File: `/contexts/notifications-context.tsx`
   - Provides:
     - `notifications` - Array of all notifications
     - `unreadCount` - Number of unread notifications
     - `isLoading` - Loading state
     - `error` - Error state
     - `refreshNotifications()` - Manual refresh
     - `markAsRead(id)` - Mark single notification as read
     - `markAllAsRead()` - Mark all as read
     - `deleteNotification(id)` - Delete notification
   - Real-time updates via Supabase subscriptions

4. **Layout Integration**
   - File: `/app/app/layout-client.tsx` (line 17)
   - `<NotificationsProvider>` wraps the entire application
   - Ensures notifications are available everywhere

### **Visual Layout**

```
┌─────────────────────────────────────┐
│ [Organization Switcher]  [🔔 3]    │ ← Bell Icon with Badge
├─────────────────────────────────────┤
│ [Project Switcher]                  │
├─────────────────────────────────────┤
│ Navigation Items...                 │
└─────────────────────────────────────┘

When bell is clicked:
┌─────────────────────────────────────┐
│ Notifications                       │
│ ───────────────────────────────────│
│ [Mark all as read]                 │
│ ───────────────────────────────────│
│ 🔵 Task Assigned                   │
│    You have been assigned to...    │
│    2 hours ago                      │
│ ───────────────────────────────────│
│ ⚪ Project Created                  │
│    New project "Website"...         │
│    1 day ago                        │
│ ───────────────────────────────────│
│ [View older]                        │
└─────────────────────────────────────┘
```

---

## 📋 **Where Is Recent Activity Integrated?**

### **Primary Location: Dashboard Page**

Recent Activity is displayed on the **main dashboard** at `/app`:

1. **Dashboard Display**
   - File: `/app/app/page.tsx` (line 416)
   - Component: `<RecentActivity limit={10} />`
   - Shows last 10 activities
   - Auto-refreshes when organization changes

2. **Recent Activity Component**
   - File: `/components/dashboard/recent-activity.tsx`
   - Features:
     - User avatar display
     - Action badge (color-coded by action type)
     - Description of what happened
     - Resource type indication
     - Relative timestamp
     - Hover effects for better UX

3. **Activity API Endpoint**
   - File: `/app/api/activity/route.ts`
   - Endpoint: `GET /api/activity`
   - Parameters:
     - `limit` (optional, max 100, default 50)
     - `organizationId` (optional, filters by organization)
   - Returns user-relevant activities across their organizations

4. **Admin Activity Logs**
   - File: `/app/admin/activity-logs/page.tsx`
   - URL: `/admin/activity-logs`
   - Admin-only comprehensive view
   - Shows all activities across all organizations

### **Visual Layout**

```
Dashboard Page:
┌─────────────────────────────────────────────────────┐
│ Welcome back, John!                                 │
├─────────────────────────────────────────────────────┤
│ [Stats Cards]                                       │
├─────────────────────────────────────────────────────┤
│ [Organizations] [Recent Projects]                   │
├─────────────────────────────────────────────────────┤
│ [Quick Actions]                                     │
├─────────────────────────────────────────────────────┤
│ Recent Activity                                     │
│ Your latest actions across all organizations       │
│ ─────────────────────────────────────────────────  │
│ [JD] [TASK_CREATED]  tache                         │
│      Created task: Fix bug...                       │
│      ⏱ 2 hours ago                                  │
│ ─────────────────────────────────────────────────  │
│ [JD] [PROJECT_UPDATED]  projet                     │
│      Updated project: Website                       │
│      ⏱ 5 hours ago                                  │
│ ─────────────────────────────────────────────────  │
│ [MS] [MILESTONE_COMPLETED]  milestone              │
│      Completed milestone: Phase 1                   │
│      ⏱ 1 day ago                                    │
└─────────────────────────────────────────────────────┘
```

---

## 🔄 **How The Systems Work Together**

### **Notifications vs Activity Logs**

| Feature | **Notifications** | **Activity Logs** |
|---------|------------------|-------------------|
| **Purpose** | Alert users of important events | Track audit trail of actions |
| **Location** | Bell icon in sidebar | Dashboard & Admin page |
| **Audience** | Targeted (assignees, managers) | All users in organization |
| **Trigger** | Specific business events | Every logged action |
| **Read State** | Yes (read/unread) | No |
| **Real-time** | Yes (Supabase subscriptions) | On page load/refresh |
| **User Control** | Mark as read, delete | View only |
| **Database** | `notification` table | `activity_logs` table |

### **Data Flow**

```
User Action (e.g., Create Task)
         ↓
API Route Handler
         ↓
    ┌────────┴────────┐
    ↓                 ↓
Activity Log      Notification
Inserted          Created (if relevant)
    ↓                 ↓
activity_logs     notification
table             table
    ↓                 ↓
Dashboard         Bell Icon
Recent Activity   Dropdown
```

---

## 🎯 **Integration Points**

### **Where Notifications Are Created**

Notifications are automatically created in these scenarios:

1. **Tasks** (`/app/api/tasks/...` & `/app/api/projects/[projectId]/tasks/...`)
   - ✅ Task created → Assignee + PM notified
   - ✅ Task assigned → New assignee notified
   - ✅ Task reassigned → Old + new assignee + PM notified
   - ✅ Task status changed → Assignee + PM notified
   - ✅ Task deleted → Assignee notified

2. **Milestones** (`/app/api/milestones/...`)
   - ✅ Milestone assigned → Assignee notified
   - ✅ Milestone completed → Organization-wide celebration notification
   - ✅ Milestone deleted → Assigned users + PM notified

3. **Projects** (`/app/api/projects/...`)
   - ✅ Project created → PM + admins notified
   - ✅ Project deleted → PM + team + admins notified

4. **Organizations** (`/app/api/organizations/[orgId]/members/...`)
   - ✅ Member added → New member (welcome) + admins notified

### **Where Activity Logs Are Created**

Activity logs are created for **ALL** actions including:
- All of the above notification events
- User login/logout
- Profile updates
- Organization operations
- Consultant operations
- Analytics queries
- Any admin actions

---

## 🚀 **Using The Systems**

### **Creating Notifications (Server-Side)**

```typescript
import { notifyTaskAssigned } from '@/lib/notifications';

// In your API route
await notifyTaskAssigned({
  assigneeId: userId,
  assignerId: currentUserId,
  organizationId: orgId,
  taskTitle: "Fix critical bug",
  taskId: taskId,
});
```

### **Creating Notifications (Client-Side)**

```typescript
'use client';
import { notifyTaskAssignedClient } from '@/lib/notifications-client';

await notifyTaskAssignedClient({
  assigneeId: userId,
  organizationId: orgId,
  taskTitle: "Review PR",
  taskId: taskId,
});
```

### **Accessing Notifications in Components**

```typescript
'use client';
import { useNotifications } from '@/contexts/notifications-context';

export function MyComponent() {
  const { notifications, unreadCount, markAsRead } = useNotifications();

  return (
    <div>
      <p>You have {unreadCount} unread notifications</p>
      {notifications.map(notif => (
        <div key={notif.id} onClick={() => markAsRead(notif.id)}>
          {notif.title}
        </div>
      ))}
    </div>
  );
}
```

### **Displaying Activity Logs**

```typescript
// In any component
import { RecentActivity } from '@/components/dashboard/recent-activity';

<RecentActivity limit={10} organizationId="optional-org-id" />
```

---

## 📊 **Database Schema**

### **Notification Table**

```sql
Table: notification
├── id: uuid (primary key)
├── user_id: uuid (references auth.users)
├── organization_id: uuid (references organizations)
├── type: text (notification type)
├── title: text (notification title)
├── message: text (notification message)
├── link: text (optional URL)
├── metadata: jsonb (additional data)
├── read_at: timestamp (null if unread)
├── created_at: timestamp
└── updated_at: timestamp
```

### **Activity Logs Table**

```sql
Table: activity_logs
├── id: uuid (primary key)
├── user_id: uuid (references auth.users)
├── organization_id: uuid (references organizations)
├── action: text (action type)
├── description: text (human-readable description)
├── resource_type: text (e.g., 'tache', 'projet')
├── resource_id: uuid (ID of affected resource)
├── metadata: jsonb (additional data)
└── created_at: timestamp
```

---

## 🎨 **Notification Types**

```typescript
type NotificationType =
  | "INFO"              // General information
  | "SUCCESS"           // Success messages
  | "WARNING"           // Warnings
  | "ERROR"             // Errors
  | "TASK_CREATED"      // Task created
  | "TASK_ASSIGNED"     // Task assigned
  | "TASK_REASSIGNED"   // Task reassigned
  | "TASK_STATUS_CHANGED" // Task status changed
  | "TASK_COMPLETED"    // Task completed
  | "TASK_UPDATED"      // Task updated
  | "TASK_DELETED"      // Task deleted
  | "MILESTONE_CREATED" // Milestone created
  | "MILESTONE_ASSIGNED" // Milestone assigned
  | "MILESTONE_UNASSIGNED" // Milestone unassigned
  | "MILESTONE_UPDATED" // Milestone updated
  | "MILESTONE_COMPLETED" // Milestone completed
  | "MILESTONE_DELETED" // Milestone deleted
  | "MILESTONE_TASK_LINKED" // Task linked to milestone
  | "MILESTONE_REACHED" // Milestone reached
  | "PROJECT_CREATED"   // Project created
  | "PROJECT_UPDATED"   // Project updated
  | "PROJECT_DELETED"   // Project deleted
  | "PROJECT_UPDATE"    // General project update
  | "CONSULTANT_CREATED" // Consultant created
  | "CONSULTANT_UPDATED" // Consultant updated
  | "ORG_MEMBER_ADDED"  // Organization member added
  | "ORG_CREATED"       // Organization created
  | "WELCOME_TO_ORG"    // Welcome message
  | "WELCOME_ORG_ADMIN" // Admin welcome
  | "SYSTEM";           // System messages
```

---

## ✅ **Testing The Systems**

### **Test Notifications**

1. **Create a task** and assign it to someone
   - Check: Assignee receives "Task Assigned" notification
   - Bell icon shows unread badge

2. **Reassign a task**
   - Check: Old assignee gets "Task Reassigned"
   - Check: New assignee gets "Task Assigned"
   - Check: PM gets update

3. **Complete a milestone**
   - Check: Everyone in organization gets celebration notification

4. **Add a member to organization**
   - Check: New member gets welcome notification
   - Check: Admins get "Member Added" notification

### **Test Recent Activity**

1. **Navigate to dashboard** (`/app`)
   - Check: Recent Activity card is visible
   - Check: Shows your recent actions

2. **Perform an action** (e.g., create a task)
   - Refresh dashboard
   - Check: New activity appears at the top

3. **Check as admin** (`/admin/activity-logs`)
   - Check: All activities across all organizations are visible

---

## 🔧 **Configuration**

### **Notification Settings**

Edit `/lib/notifications.ts` to:
- Add new notification helper functions
- Modify notification messages
- Change notification types
- Adjust targeting logic

### **Activity Log Settings**

Edit `/app/api/activity/route.ts` to:
- Change default limit
- Modify filtering logic
- Add additional fields
- Change sort order

### **UI Customization**

Edit `/components/dashboard/recent-activity.tsx` to:
- Change badge colors
- Modify layout
- Add action buttons
- Change date formatting

---

## 📁 **File Structure Summary**

```
Notifications System:
├── contexts/notifications-context.tsx      (Context & state management)
├── components/navbar/notifications-dropdown.tsx (UI component)
├── components/sidebar/app-sidebar.tsx      (Integration point)
├── lib/notifications.ts                    (Server-side helpers)
├── lib/notifications-client.ts             (Client-side helpers)
├── lib/validations/notification.ts         (Validation schemas)
├── app/api/notifications/route.ts          (User API endpoint)
├── app/api/admin/notifications/route.ts    (Admin API endpoint)
└── app/app/layout-client.tsx               (Provider wrapper)

Activity System:
├── app/api/activity/route.ts               (Activity API endpoint)
├── components/dashboard/recent-activity.tsx (UI component)
├── app/app/page.tsx                        (Dashboard integration)
└── app/admin/activity-logs/page.tsx        (Admin page)
```

---

## 🎉 **Summary**

✅ **Notifications** are integrated via **bell icon in sidebar**
✅ **Recent Activity** is integrated on the **dashboard page**
✅ Both systems work independently but complement each other
✅ Notifications are real-time, activity logs are on-demand
✅ Comprehensive coverage across all business events
✅ Smart targeting to avoid spam
✅ Beautiful UI with proper UX patterns

Your application now has a **top-tier notification and activity tracking system**! 🚀
