# Chat System Implementation Analysis

## Overview

The Aurentia chat system is a comprehensive real-time messaging platform supporting multiple chat types: organization channels, project channels, direct messages, and group chats. It leverages Supabase real-time subscriptions for live updates and follows a client-server architecture pattern.

---

## Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Chat Page (Server)                       │
│  - Auth validation & profile loading                             │
│  - Tab management (Channels/Direct/Groups)                       │
└──────────────────┬──────────────────────────────────────────────┘
                   │
        ┌──────────┴──────────────┐
        │                         │
        v                         v
┌──────────────────────┐  ┌──────────────────────┐
│   ChatSidebar        │  │   ChatWindow         │
│   (Client Component) │  │  (Client Component)  │
│                      │  │                      │
│ - Channels list      │  │ - Message display    │
│ - Direct users       │  │ - Real-time updates  │
│ - Group chats        │  │ - Message input      │
│ - Selection logic    │  │ - Auto-scroll        │
└────────┬─────────────┘  └──────────┬───────────┘
         │                           │
         └───────────┬───────────────┘
                     │
              useRealtimeChat Hook
              - Real-time subscriptions
              - Optimistic updates
              - Message deduplication
              │
    ┌─────────┴────────────┬─────────────────┐
    │                      │                  │
    v                      v                  v
/api/chat/         /api/messenger/     /api/chat/
channels           messages            groups
direct-messages
```

---

## Key Components

### 1. ChatPage (`app/app/chat/page.tsx`)

**Role**: Main orchestrator and layout container

**Responsibilities**:
- Authentication & authorization checks
- Layout management (3-column: sidebar, chat window, placeholder)
- Tab state management (Channels/Direct/Groups)
- Chat selection logic
- Dialog state for creating new chats

**Key Features**:
- Responsive design (hidden on mobile, full on desktop)
- Gradient title styling
- Empty state placeholder
- Integration with NewChatDialog

**State Management**:
```typescript
selectedChat: ChatItem | null          // Currently selected chat
newChatOpen: boolean                   // New chat dialog visibility
activeTab: string                      // Currently active tab
```

**ChatItem Type**:
```typescript
interface ChatItem {
  id: string
  name: string
  type: "organization" | "project" | "direct" | "group"
  description?: string
  avatar_url?: string
  unread_count?: number
}
```

---

### 2. ChatSidebar (`components/chat/chat-sidebar.tsx`)

**Role**: Dynamic list of conversations

**Responsibilities**:
- Fetch and display chats based on type
- Handle user selection
- Manage sidebar state (loading, empty states)
- Support multiple list views (Organization/All users for direct messages)

**Chat Types Handled**:

| Type | Endpoint | Data Model | Behavior |
|------|----------|-----------|----------|
| **channels** | `/api/chat/channels` | Organization channels | Default scoped to user's org |
| **direct** | `/api/profiles/all` or `/api/organizations/{id}/members` | User list | Toggle between org members and all users |
| **groups** | `/api/chat/groups` | Group chats | User's group memberships |

**Features**:
- Tab switcher for direct messages (My Organization / All Users)
- Unread count badges
- Avatar/Icon rendering with fallbacks
- Smooth animations and transitions
- Loading states with spinner
- Empty state messages

**Rendering Logic**:
```
For Channels:
  └─ Hash icon + channel name + description

For Direct:
  └─ User avatar + full name + optional description

For Groups:
  └─ User icon (or group avatar) + name + description
```

---

### 3. ChatWindow (`components/chat/chat-window.tsx`)

**Role**: Main messaging interface

**Responsibilities**:
- Display messages in chronological order
- Handle message input and sending
- Manage typing indicators
- Auto-scroll behavior
- Message grouping and deduplication

**Key Features**:

**Message Display**:
- Smart avatar rendering (only show on new sender)
- Timestamp display (intelligent placement)
- Edited indicator
- Message bubbles with different styling for self vs others
- Sender name display (shows "You" for current user)

**Input Management**:
- Character counter (max 5000)
- Disabled state during sending
- Typing indicator broadcast
- Focus management (focus on chat change)
- Enter key support (via form submission)

**Auto-scroll**:
- Ref-based scroll anchor
- Smooth behavior on new messages
- Attached to bottom of message list

**Message Deduplication**:
```typescript
// Prevents duplicate messages from optimistic update + real-time
const newMessages = prev.filter(msg => msg.id !== newMessage.id)
```

---

### 4. NewChatDialog (`components/chat/new-chat-dialog.tsx`)

**Role**: Chat creation and initiation interface

**Responsibilities**:
- Direct message initiation
- Group chat creation
- Member selection
- User listing

**Two Modes**:

**Direct Message Tab**:
- Fetch organization members
- Single-click to start DM
- Immediate chat selection (no creation needed)

**Group Chat Tab**:
- Input group name (required)
- Input description (optional)
- Multi-select members
- Create group endpoint call
- Member count display

**Form Validation**:
- Group name: 1-100 chars
- Description: 0-500 chars (optional)
- Members: 1-50 selection
- User feedback via toast notifications

---

### 5. useRealtimeChat Hook (`hooks/use-realtime-chat.ts`)

**Role**: State management and real-time synchronization

**Architecture**:
```
┌─────────────────────────────────────────────────┐
│         useRealtimeChat Hook                     │
├─────────────────────────────────────────────────┤
│                                                  │
│  State:                                          │
│  - messages: ChatMessage[]                       │
│  - loading: boolean                              │
│  - channel: RealtimeChannel | null               │
│                                                  │
│  Lifecycle:                                      │
│  1. Mount → Fetch initial messages               │
│  2. Subscribe to INSERT, UPDATE, DELETE events   │
│  3. Unmount → Unsubscribe (cleanup)              │
└─────────────────────────────────────────────────┘
```

**Chat Type Support**:
```typescript
type ChatType = 'organization' | 'project' | 'direct' | 'group'
```

**API Endpoints Used**:

| Chat Type | Fetch Endpoint | Send Endpoint | Table |
|-----------|---|---|---|
| organization/project | `/api/messenger/messages` | `/api/messenger/messages` | channel_messages |
| direct | `/api/messenger/direct-messages` | `/api/messenger/direct-messages` | direct_messages |
| group | `/api/chat/group-messages` | `/api/chat/group-messages` | channel_messages |

**Message Structure**:
```typescript
interface ChatMessage {
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
```

**Lifecycle Methods**:

1. **fetchMessages()**: GET initial messages
   - Query parametrization varies by chat type
   - Handles pagination (future-ready)
   - Populates state with raw API response

2. **sendMessage(content)**: POST new message
   - Optimistic update (add to state immediately)
   - Deduplication check
   - Returns boolean success status
   - Handles all three chat type variants

3. **sendTyping(isTyping)**: POST typing indicator
   - Async fire-and-forget
   - No state modification
   - Server-side broadcasting

4. **Real-time Subscriptions**:
   ```
   Channel Name: chat:{chatType}:{chatId}
   
   Events:
   - INSERT: New message → Fetch full data → Dedupe → Add to state
   - UPDATE: Message edit → Update in place
   - DELETE: Message deleted → Remove from state
   ```

**Deduplication Strategy**:
- Optimistic updates: Check if ID exists before adding
- Real-time: Same check to prevent duplicates
- Query deduplication: Check before setState

**Error Handling**:
```
- Fetch errors: Logged to console, state remains stable
- Send errors: Return false, user sees toast
- Typing errors: Silent failure (not critical)
```

---

## API Routes

### 1. GET/POST `/api/messenger/messages` (Channel Messages)

**GET Parameters**:
```
channelId: UUID (required)
channelType: 'organization' | 'project' (required)
limit: number (default: 50)
before: UUID (pagination cursor, optional)
```

**GET Response**:
```json
{
  "messages": [ChatMessage],
  "hasMore": boolean
}
```

**POST Body**:
```json
{
  "channelId": UUID,
  "channelType": "organization" | "project",
  "content": string (1-5000 chars)
}
```

**Key Logic**:
- Access control: Verify user membership in organization
- Message retrieval: Order by created_at descending, then reverse for display
- Pagination: Supports cursor-based pagination
- Sender info: Joins with profiles table

---

### 2. GET/POST `/api/messenger/direct-messages`

**GET Parameters**:
```
recipientId: UUID (required)
organizationId: UUID (optional, for cross-org support)
limit: number (default: 50)
before: UUID (pagination cursor, optional)
```

**GET Response**:
```json
{
  "messages": [ChatMessage],
  "hasMore": boolean
}
```

**POST Body**:
```json
{
  "recipientId": UUID,
  "content": string,
  "organizationId": UUID (optional)
}
```

**Key Features**:
- Cross-organization support: Can message users across orgs
- Bidirectional query: OR condition (A→B or B→A)
- Fallback org: Uses sender's org if not provided
- Recipient validation: Ensures recipient exists

---

### 3. GET/POST `/api/chat/groups`

**GET Response**:
```json
{
  "groups": [
    {
      "id": UUID,
      "name": string,
      "description": string | null,
      "created_by": UUID,
      "created_at": timestamp,
      "members": Count
    }
  ]
}
```

**POST Body**:
```json
{
  "name": string (required, 1-100 chars),
  "description": string (optional, 0-500 chars),
  "memberIds": UUID[] (1-50 members)
}
```

**POST Response**:
```json
{
  "group": {
    "id": UUID,
    "name": string,
    "description": string | null,
    "organization_id": UUID,
    "created_by": UUID
  }
}
```

**Key Logic**:
- Organizer scope: Groups are organization-scoped
- Creator inclusion: Creator automatically added to members
- Deduplication: Filters duplicate IDs in member list
- Cascade safety: Deletes group if member addition fails
- Activity logging: Records group creation

---

### 4. GET `/api/chat/channels`

**Response**:
```json
{
  "channels": [
    {
      "id": UUID,
      "organizationId": UUID,
      "name": string,
      "description": string | null,
      "createdBy": UUID,
      "createdAt": timestamp,
      "updatedAt": timestamp
    }
  ]
}
```

**Key Features**:
- Organization-scoped: Auto-filters by user's org
- Transform layer: Converts snake_case to camelCase
- Ordered: By creation date (ascending)

---

## Data Flow Patterns

### 1. Message Send & Update Flow

```
User Input
    ↓
Form Submit
    ↓
sendMessage() called with content
    ↓
POST /api/messenger/messages → Server
    ↓
Server creates DB record
    ↓
Server returns full message with sender info
    ↓
Client receives response
    ↓
Optimistic update check (dedup by ID)
    ↓
Add to state immediately
    ↓
Toast success
    ↓
Supabase real-time fires INSERT event (another copy)
    ↓
Subscription handler dedupes (message already exists)
    ↓
No double-add
```

### 2. Real-time Reception Flow

```
Message created in database
    ↓
Supabase fires INSERT event
    ↓
Channel subscription listener triggered
    ↓
Fetch full message with sender profile
    ↓
Dedup check: Is message already in state?
    │
    ├─ Yes → Skip (from optimistic update)
    │
    └─ No → Add to state & call onMessage callback
    ↓
React renders new message
    ↓
Auto-scroll anchor scrolls to bottom
```

### 3. Chat Type Selection Flow

```
Chat Page
    ↓
User clicks tab (Channels/Direct/Groups)
    ↓
activeTab state updates
    ↓
ChatSidebar re-renders with type prop
    ↓
useEffect detects type change
    ↓
fetchItems() called with new type
    ↓
API call to appropriate endpoint
    ↓
Response mapped to ChatItem[]
    ↓
Items rendered in sidebar
    ↓
User selects chat → setSelectedChat
    ↓
ChatWindow re-mounts with new chat prop
    ↓
useRealtimeChat hook initializes
    ↓
fetchMessages() populates initial state
    ↓
Subscribe to real-time events
```

---

## Validation & Security

### Input Validation (Zod Schemas)

**Channel Messages**:
```typescript
{
  channelId: UUID
  channelType: enum('organization', 'project')
  content: string (1-5000 chars)
}
```

**Direct Messages**:
```typescript
{
  receiverId: UUID
  content: string (1-5000 chars)
}
```

**Group Creation**:
```typescript
{
  name: string (1-100 chars)
  description: string (0-500 chars, optional)
  memberIds: UUID[] (1-50)
}
```

**Channel Creation**:
```typescript
{
  name: string (1-100 chars, lowercase alphanumeric + hyphens)
  description: string (0-500 chars, optional)
}
```

### Server-side Access Control

1. **Authentication**: All routes require valid user session
2. **Organization membership**: Verify user belongs to org
3. **Channel access**: Verify user has access to channel
4. **Admin checks**: Channel creation requires ADMIN role
5. **Direct message**: Recipient existence validation

---

## Performance Patterns

### 1. Optimistic Updates

**Benefit**: Instant UI feedback without waiting for server

```typescript
// Client immediately adds message
setMessages(prev => [...prev, newMessage])

// Server processes in background
const response = await fetch('/api/...')

// When real-time event arrives, dedup prevents double-add
```

### 2. Message Deduplication

**Three layers**:
1. Optimistic update dedup
2. Real-time subscription dedup
3. Initial fetch (single source)

### 3. Lazy Loading & Pagination

**Ready for implementation**:
- Cursor-based pagination parameter (`before`)
- `hasMore` boolean in response
- Load older messages on scroll up

### 4. Smart Avatar Rendering

**Optimization**:
- Only render avatar when sender changes
- Reduces DOM nodes
- Improves visual grouping

### 5. Auto-scroll Anchor

**Implementation**:
- Ref to div at bottom of messages
- Only triggered when new messages arrive
- Smooth scroll behavior

---

## Error Handling & Edge Cases

### Error Types

| Error | Location | Handling |
|-------|----------|----------|
| Auth required | API routes | 401 response |
| Not found | Channel/recipient missing | 404 response |
| Access denied | No membership | 403 response |
| Validation | Invalid input | 400 response |
| Server error | Unexpected | 500 response + console log |

### Edge Cases Handled

1. **Empty content**: Disabled send button, trim() validation
2. **Concurrent sends**: Optimistic update dedup
3. **Offline messages**: Hook uses fetch (browser will queue)
4. **Chat type mismatch**: Routed to correct endpoint
5. **Missing sender info**: Real-time subscription fetches full data
6. **Group member addition failure**: Cascade delete group
7. **No organization**: Blocked with 403 error
8. **Cross-org direct messages**: organizationId optional

---

## State Management Patterns

### Component State

**ChatPage**:
```typescript
selectedChat: ChatItem | null
newChatOpen: boolean
activeTab: string
```

**ChatSidebar**:
```typescript
items: ChatItem[]
loading: boolean
showAllUsers: boolean  // Direct messages only
```

**ChatWindow**:
```typescript
newMessage: string
sending: boolean
scrollRef: RefObject
inputRef: RefObject
```

**ChatWindow + useRealtimeChat**:
```typescript
messages: ChatMessage[]
loading: boolean
channel: RealtimeChannel | null
```

**NewChatDialog**:
```typescript
activeTab: "direct" | "group"
users: User[]
loading: boolean
creating: boolean
groupName: string
groupDescription: string
selectedMembers: Set<string>
```

### Props Drilling

**Minimal** - Messages passed via props, organization ID for scope

```typescript
// ChatPage passes to ChatSidebar
<ChatSidebar
  type="channels"
  organizationId={profile.organization_id}
  selectedChat={selectedChat}
  onSelectChat={setSelectedChat}
/>

// ChatPage passes to ChatWindow
<ChatWindow
  chat={selectedChat}
  userId={user.id}
  organizationId={profile.organization_id}
/>
```

---

## Design Patterns Applied

### 1. Custom Hook Pattern
**useRealtimeChat**: Encapsulates all real-time logic and message state

### 2. Composition Pattern
**ChatWindow uses useRealtimeChat**: Separates concerns (UI vs state)

### 3. Controlled Component Pattern
**ChatSidebar & ChatWindow**: Props control behavior, callbacks handle changes

### 4. Optimistic Update Pattern
**sendMessage()**: Update UI before confirmation

### 5. Deduplication Pattern
**Message handling**: Multiple sources prevented from creating duplicates

### 6. Unsubscribe on Cleanup
**Real-time subscriptions**: Cleanup effect prevents memory leaks

---

## TypeScript Patterns

### Discriminated Union (Chat Types)
```typescript
type ChatType = 'organization' | 'project' | 'direct' | 'group'

// Allows exhaustive type checking in switch statements
```

### Type Inference
```typescript
export type SendChannelMessageInput = z.infer<typeof sendChannelMessageSchema>
```

### Interface Hierarchies
```typescript
// DB format
interface DbChannelMessage { channel_id: ... }

// API format  
interface ApiChannelMessage { channelId: ... }

// Hook format (no transformation)
interface ChatMessage { ... }
```

---

## Real-time Subscription Details

### Table Subscriptions

**Organization/Project Channels**:
```
Table: channel_messages
Filter: channel_id = {chatId}
Events: INSERT, UPDATE, DELETE
```

**Direct Messages**:
```
Table: direct_messages
Filter: None (bidirectional query)
Events: INSERT, UPDATE, DELETE
```

**Group Messages**:
```
Table: channel_messages
Filter: channel_id = {groupId}
Events: INSERT, UPDATE, DELETE
```

### Channel Name Scheme
```
chat:{chatType}:{chatId}

Examples:
- chat:organization:org-uuid-123
- chat:project:proj-uuid-456
- chat:direct:user-uuid-789
- chat:group:group-uuid-000
```

---

## Integration Points

### With Authentication
- `useAuth()` hook provides user ID and profile
- Used in ChatPage for authorization
- Profile contains organization_id

### With Notifications
- Real-time subscriptions provide events
- Could trigger notification badges
- Activity logging available

### With Activity Logging
- Channel creation logs to activity_logs
- Direct messages not logged (privacy)
- Group creation logs to activity_logs

---

## Known Limitations & TODOs

1. **Message Search**: Not implemented
2. **Reactions**: Schema exists (add reaction endpoint missing)
3. **Message Editing**: Schema supports but UI not implemented
4. **Message Deletion**: Schema supports but UI not implemented
5. **Typing Indicators**: Sent to server but not displayed
6. **Read Receipts**: Not implemented
7. **File Attachments**: Not supported
8. **Markdown**: No formatting support
9. **Mentions**: No @mention support
10. **Thread Replies**: No threading
11. **Pagination UI**: Infrastructure ready but no UI
12. **Offline Mode**: No queue/sync on reconnect

---

## Best Practices Applied

1. **Validation**: All input validated with Zod on both client and server
2. **Authentication**: Token in cookie (handled by Supabase)
3. **Authorization**: Organization membership verified
4. **Error Handling**: Try-catch blocks with appropriate responses
5. **Type Safety**: Full TypeScript coverage
6. **Separation of Concerns**: Logic in hooks, UI in components
7. **Accessibility**: ARIA labels, keyboard support (form submit)
8. **Performance**: Optimistic updates, deduplication, lazy loading ready
9. **Security**: No XSS (React escapes), no SQL injection (Supabase)
10. **Documentation**: Clear function comments and type annotations

---

## Testing Considerations

### Unit Tests Needed
- Message deduplication logic
- Chat type routing
- Validation schemas
- Transformer functions

### Integration Tests Needed
- Send message → Real-time subscription
- Create group → Member addition
- Channel access control

### E2E Tests Needed
- Send message flow (client → server → real-time)
- Create group and add members
- Switch between chat types
- Direct message across orgs

---

## Future Enhancements

1. **Search Messages**: Full-text search integration
2. **Reactions**: Complete emoji reactions UI
3. **Message Threads**: Reply to specific messages
4. **Rich Text**: Markdown or WYSIWYG editor
5. **File Sharing**: Upload and attach files
6. **Voice Messages**: Audio recording support
7. **Video Chat**: Integrate with video service
8. **Message Pins**: Pin important messages
9. **Read Receipts**: Show who read messages
10. **Notifications**: Browser/mobile notifications

