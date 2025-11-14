# Chat System Quick Reference Guide

## File Structure

```
components/chat/
├── chat-sidebar.tsx         # Conversation list selector
├── chat-window.tsx          # Main message interface
└── new-chat-dialog.tsx      # Create DM or group chat

hooks/
└── use-realtime-chat.ts     # Real-time sync & state management

app/api/chat/
├── channels/route.ts        # Organization channels CRUD
├── groups/route.ts          # Group chat CRUD
└── group-messages/route.ts  # Group messages

app/api/messenger/
├── messages/route.ts        # Channel messages CRUD
├── direct-messages/route.ts # Direct message CRUD
├── typing/route.ts          # Typing indicator
└── reactions/route.ts       # (Schema ready)

lib/validations/
└── chat.ts                  # Zod schemas

utils/transformers/
├── chat-transformers.ts     # snake_case ↔ camelCase
└── message-transformers.ts  # Message format conversion

app/app/chat/
└── page.tsx                 # Main chat layout page
```

## Chat Types

| Type | Scope | Table | Real-time | Cross-org |
|------|-------|-------|-----------|-----------|
| **organization** | Organization | channel_messages | ✓ | ✗ |
| **project** | Project | channel_messages | ✓ | ✗ |
| **direct** | User-to-user | direct_messages | ✓ | ✓ |
| **group** | Organization | channel_messages | ✓ | ✗ |

## API Endpoint Mapping

```
┌─────────────────────────────────────────────────────┐
│            CHAT TYPE → ENDPOINT                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  organization/project messages:                     │
│    GET /api/messenger/messages                      │
│    POST /api/messenger/messages                     │
│                                                      │
│  Direct messages:                                   │
│    GET /api/messenger/direct-messages               │
│    POST /api/messenger/direct-messages              │
│                                                      │
│  Group messages:                                    │
│    GET /api/chat/group-messages                     │
│    POST /api/chat/group-messages                    │
│                                                      │
│  Group management:                                  │
│    GET /api/chat/groups                             │
│    POST /api/chat/groups                            │
│                                                      │
│  Channel management:                                │
│    GET /api/chat/channels                           │
│    POST /api/chat/channels (admin only)             │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## useRealtimeChat Hook - Usage Example

```typescript
'use client'

import { useRealtimeChat } from '@/hooks/use-realtime-chat'

function MyChat() {
  const {
    messages,        // ChatMessage[]
    loading,         // boolean
    sendMessage,     // async (content: string) => Promise<boolean>
    sendTyping,      // async (isTyping: boolean) => void
    refreshMessages  // async () => void
  } = useRealtimeChat({
    chatType: 'organization',     // or 'project', 'direct', 'group'
    chatId: 'channel-id-uuid',
    organizationId: 'org-id-uuid', // optional for direct
    onMessage: (msg) => console.log('New message:', msg),
    onTyping: (userId, isTyping) => console.log('Typing:', userId, isTyping)
  })

  const handleSend = async (content: string) => {
    const success = await sendMessage(content)
    if (success) console.log('Sent!')
  }

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  )
}
```

## Key Design Patterns

### 1. Optimistic Updates
**What**: Update UI immediately before server confirmation
```typescript
// Add to state first
setMessages(prev => [...prev, newMessage])

// Then POST to server
const response = await fetch('/api/...')
```
**Why**: Instant feedback, better UX
**Risk**: Duplicate if same message from real-time

### 2. Message Deduplication
**What**: Prevent same message from appearing twice
```typescript
// Check if message ID already exists
if (prev.some(msg => msg.id === newMessage.id)) {
  return prev  // Skip duplicate
}
```
**Where**: 
- Optimistic update
- Real-time INSERT handler
**Result**: No duplicates

### 3. Smart Filtering
**What**: Only fetch/show relevant messages
```typescript
// Channel messages filtered by channel_id
.eq("channel_id", channelId)

// Direct messages filtered bidirectionally
.or(`and(sender_id.eq.${user.id},...), and(sender_id.eq.${recipient.id},...))`)
```

### 4. Cascade Operations
**What**: Clean up related data on creation failure
```typescript
// Create group
const { data: group } = await supabase.from('group_chats').insert(...)

// Add members
const { error: membersError } = await supabase.from('group_chat_members').insert(...)

// If members fail, delete group
if (membersError) {
  await supabase.from('group_chats').delete().eq('id', group.id)
}
```

## Common Workflows

### Send a Message

```
User types message
    ↓
Form submit with `sendMessage(content)`
    ↓
Optimistic add to state (if sent returns true)
    ↓
POST /api/{type} → Server validates & inserts
    ↓
Server returns full message with sender profile
    ↓
Toast notification ("Message sent")
    ↓
Real-time subscription fires (dedupe prevents double-add)
```

### Create a Direct Message

```
User clicks "+" → NewChatDialog opens
    ↓
Direct Message tab selected
    ↓
Click on user → handleSelectUser()
    ↓
Chat selection doesn't create anything (DM is implicit)
    ↓
ChatWindow loads and sends first message
```

### Create a Group Chat

```
User clicks "+" → NewChatDialog opens
    ↓
Group Chat tab selected
    ↓
Enter name, optional description, select members
    ↓
Click "Create Group" → handleCreateGroup()
    ↓
POST /api/chat/groups {name, description, memberIds}
    ↓
Server creates group + adds creator + members
    ↓
Group returns in response
    ↓
Chat selected and opened
```

### Switch Chat Type

```
User clicks tab (Channels/Direct/Groups)
    ↓
activeTab state updates
    ↓
ChatSidebar re-renders with new type prop
    ↓
useEffect detects type change
    ↓
fetchItems() → API call with type
    ↓
Items populated in sidebar
    ↓
Previous chat selection cleared (or persisted per type)
```

## Message Structure

### ChatMessage (Hook & Display)
```typescript
{
  id: string                    // UUID
  content: string               // Message text
  sender_id: string             // User ID
  created_at: string            // ISO timestamp
  edited_at: string | null      // ISO timestamp or null
  sender: {
    id: string
    prenom: string              // First name
    nom: string                 // Last name
    avatar_url: string | null   // Avatar URL or null
  }
}
```

### Database Storage
```typescript
// channel_messages
{
  id: UUID
  channel_id: UUID
  channel_type: 'organization' | 'project'
  sender_id: UUID
  organization_id: UUID
  content: string
  created_at: timestamp
  edited_at: timestamp | null
  updated_at: timestamp
}

// direct_messages
{
  id: UUID
  sender_id: UUID
  recipient_id: UUID
  content: string
  organization_id: UUID | null
  created_at: timestamp
  edited_at: timestamp | null
  updated_at: timestamp
}
```

## Real-time Subscriptions

### Channel Naming
```
chat:{chatType}:{chatId}

Examples:
- chat:organization:550e8400-e29b-41d4-a716-446655440000
- chat:direct:user-uuid
- chat:group:group-uuid
```

### Events Handled
```
INSERT → New message: Fetch with sender, dedup, add to state
UPDATE → Edited message: Update in place
DELETE → Removed message: Filter from state
```

### Subscription Cleanup
```typescript
useEffect(() => {
  // Subscribe
  const channel = supabase.channel(...).subscribe()
  
  // Cleanup on unmount
  return () => {
    supabase.removeChannel(channel)  // IMPORTANT!
  }
}, [deps])
```

## Validation Rules

| Field | Rules | Example |
|-------|-------|---------|
| Message content | 1-5000 chars, trimmed | "Hello world" |
| Channel name | 1-100 chars, lowercase alphanumeric + hyphens | "project-planning" |
| Group name | 1-100 chars | "Q1 Planning Team" |
| Description | 0-500 chars, optional | "For budget discussions" |
| Members | 1-50 people | [uuid1, uuid2] |

## Access Control

```
┌────────────────────────────────────────────────┐
│         WHO CAN DO WHAT                         │
├────────────────────────────────────────────────┤
│                                                 │
│  Send channel message:                          │
│  └─ Any org member                              │
│                                                 │
│  Create channel:                                │
│  └─ Organization ADMIN only                     │
│                                                 │
│  Send direct message:                           │
│  └─ Any authenticated user                      │
│  └─ Can message across orgs                     │
│                                                 │
│  Create group:                                  │
│  └─ Any org member                              │
│  └─ Groups scoped to organization               │
│                                                 │
│  View chats:                                    │
│  └─ Only chats user is member of               │
│                                                 │
└────────────────────────────────────────────────┘
```

## Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 401 | Not authenticated | Login required |
| 403 | Access denied | Check membership |
| 404 | Channel/recipient not found | Verify IDs |
| 400 | Invalid input | Check validation schema |
| 409 | Channel name exists | Choose different name |
| 500 | Server error | Check logs, retry |

## Performance Tips

1. **Deduplication**: Messages won't duplicate even with optimistic + real-time
2. **Pagination**: Ready to implement with cursor-based `before` parameter
3. **Auto-scroll**: Only triggers on new messages, not historical
4. **Smart avatars**: Only rendered when sender changes, reduces DOM
5. **Toast notifications**: Used instead of error alerts, non-blocking

## Testing Checklist

- [ ] Send message in organization channel
- [ ] Send message in project channel
- [ ] Send direct message to org member
- [ ] Send direct message across org
- [ ] Create group with multiple members
- [ ] Receive real-time message
- [ ] Handle concurrent sends
- [ ] Verify message deduplication
- [ ] Test access control (non-member trying to message)
- [ ] Test empty states (no chats, no messages)
- [ ] Test loading states
- [ ] Test error toasts

## Common Issues & Solutions

| Issue | Cause | Fix |
|-------|-------|-----|
| Duplicate messages | Missing dedup check | Verify both optimistic + real-time check msg ID |
| No real-time updates | Subscription not active | Check unsubscribe cleanup, verify channel name |
| Lost messages | Offline sends | Browser fetch queue handles (no special logic needed) |
| Slow load | Fetching too many | Implement pagination with `before` cursor |
| Memory leak | Subscription not cleaned | Add cleanup return in useEffect |
| "No organization" error | User profile has null org | Check user_organizations membership |

## Integration Points

### Authentication
- `useAuth()` provides `user.id` and `profile.organization_id`
- All API routes verify session via `supabase.auth.getUser()`

### Notifications System
- Message count could feed into badge
- Real-time events available for custom notifications

### Activity Logging
- Channel creation logs to `activity_logs` table
- Direct messages not logged (privacy)
- Group creation logs with metadata

### UI Components
- Uses shadcn/ui components (Button, Input, Dialog, etc.)
- Lucide icons for visual indicators
- Sonner for toast notifications

## Future Enhancement Ideas

```
Priority: High
- Message search
- Typing indicator display
- Read receipts
- Message deletion UI

Priority: Medium
- Message reactions
- Message editing UI
- Pin important messages
- Thread replies

Priority: Low
- Rich text formatting
- File attachments
- Voice messages
- Video integration
```

---

## Key Takeaways

1. **Four chat types**: Organization/Project channels, Direct messages, Group chats
2. **Real-time subscriptions**: Automatic updates via Supabase
3. **Optimistic updates**: Instant UI feedback with deduplication safety
4. **Modular design**: Hook for logic, components for UI, clear separation
5. **Security**: Server-side validation, access control, XSS prevention
6. **Extensible**: Easy to add reactions, editing, deletion, search, etc.
