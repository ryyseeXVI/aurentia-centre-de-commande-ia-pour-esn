# Chat System Component Dependencies & Data Flow

## Component Hierarchy

```
ChatPage (Server Component with @ts-nocheck)
├── useAuth() hook
├── useRouter() hook
└── Children (Client Components):
    ├── Card (UI - Left Sidebar)
    │   ├── Tab Navigation
    │   │   ├── Tab: Channels
    │   │   ├── Tab: Direct
    │   │   └── Tab: Groups
    │   │       └── TabContent (dynamic)
    │   │           └── ChatSidebar
    │   │               ├── useEffect (fetch items)
    │   │               ├── useState (items, loading, showAllUsers)
    │   │               ├── ScrollArea (UI)
    │   │               ├── Avatar, AvatarImage, AvatarFallback (UI)
    │   │               ├── Button (UI)
    │   │               ├── Icon components (Hash, User, etc.)
    │   │               └── Conditional rendering (loading/empty states)
    │   │
    │   └── New Chat Button
    │       └── NewChatDialog
    │           ├── useState (activeTab, users, loading, creating, groupState)
    │           ├── useCallback hooks
    │           ├── Dialog, DialogContent, DialogHeader (UI)
    │           ├── Tabs, TabsList, TabsContent (UI)
    │           ├── ScrollArea (UI)
    │           ├── Avatar, Checkbox (UI)
    │           ├── Button, Input, Label, Textarea (UI)
    │           └── Toast notifications (sonner)
    │
    ├── Card (Center - Main Chat Area)
    │   └── ChatWindow
    │       ├── useRealtimeChat hook
    │       │   ├── useState (messages, loading, channel)
    │       │   ├── useCallback (fetchMessages, sendMessage, sendTyping)
    │       │   ├── useEffect (subscribe to real-time, cleanup)
    │       │   └── Supabase real-time subscriptions
    │       │
    │       ├── useRef (scrollRef, inputRef)
    │       ├── useState (newMessage, sending)
    │       ├── useEffect (auto-scroll, focus)
    │       ├── Card, CardHeader, CardContent (UI)
    │       ├── Avatar, AvatarImage, AvatarFallback (UI)
    │       ├── Button, Input (UI)
    │       ├── ScrollArea (UI)
    │       ├── Icon components (Hash, Send, Users, Loader2)
    │       ├── Message rendering loop
    │       │   └── Dynamic styling based on isOwnMessage
    │       └── Toast notifications (sonner)
    │
    └── NewChatDialog (same as above)
```

## Props & State Flow

```
ChatPage
  ├─ state:
  │  ├─ selectedChat: ChatItem | null
  │  ├─ newChatOpen: boolean
  │  └─ activeTab: "channels" | "direct" | "groups"
  │
  └─ passes to children:
     ├─ ChatSidebar
     │  ├─ type: "channels" | "direct" | "groups"
     │  ├─ organizationId: string
     │  ├─ selectedChat: ChatItem | null
     │  └─ onSelectChat: (chat: ChatItem) => void
     │      └─ updates ChatPage.selectedChat
     │
     ├─ ChatWindow
     │  ├─ chat: ChatItem
     │  ├─ userId: string (from useAuth)
     │  └─ organizationId: string
     │      └─ passed to useRealtimeChat
     │
     └─ NewChatDialog
        ├─ open: boolean
        ├─ onOpenChange: (open: boolean) => void
        ├─ organizationId: string
        └─ onChatCreated: (chat: ChatItem) => void
            └─ updates ChatPage.selectedChat & newChatOpen
```

## Data Flow: Message Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                  MESSAGE SEND FLOW                              │
└─────────────────────────────────────────────────────────────────┘

ChatWindow.handleSendMessage()
    ↓
  sendMessage(content) from useRealtimeChat
    ├─ Route based on chat type:
    │  ├─ direct → POST /api/messenger/direct-messages
    │  ├─ group → POST /api/chat/group-messages
    │  └─ organization/project → POST /api/messenger/messages
    │
    ├─ Optimistic update:
    │  └─ setMessages(prev => [...prev, newMessage])
    │     └─ Dedup: Check if msg.id already exists
    │
    └─ Returns: boolean
       ├─ true → Toast.success("Message sent")
       └─ false → Toast.error("Failed to send message")

POST /api/{endpoint}
    ├─ Server-side validation (Zod schema)
    ├─ Auth check: supabase.auth.getUser()
    ├─ Access control: Verify membership
    ├─ Insert into database
    └─ Return full message with sender profile

Supabase real-time subscription
    ├─ Channel: chat:{chatType}:{chatId}
    ├─ Event: INSERT
    ├─ Fetch full message with sender
    ├─ Dedup: Check if message already in state
    └─ Add to messages state OR skip (if from optimistic update)

UI Update
    └─ ChatWindow re-renders with new message
       └─ Auto-scroll anchor scrollIntoView()


┌─────────────────────────────────────────────────────────────────┐
│                  MESSAGE RECEIVE FLOW                           │
└─────────────────────────────────────────────────────────────────┘

Another user sends message to same chat
    ↓
Message inserted into database
    ↓
Supabase real-time fires INSERT event
    ↓
useRealtimeChat subscription listener
    ├─ Fetch message with sender profile
    ├─ Dedup check
    ├─ setMessages(prev => [...prev, newMessage])
    └─ Call onMessage callback (if provided)
    ↓
ChatWindow re-renders
    ├─ Message appears in list
    └─ Auto-scroll to bottom


┌─────────────────────────────────────────────────────────────────┐
│               CHAT SELECTION FLOW                               │
└─────────────────────────────────────────────────────────────────┘

ChatSidebar renders chat list
    ↓
User clicks on chat item
    ↓
onSelectChat(item) → updates ChatPage.selectedChat
    ↓
ChatWindow mounts with new chat prop
    ├─ useRealtimeChat hook initializes
    ├─ fetchMessages() loads initial messages
    │  ├─ Routes based on chatType
    │  └─ Populates messages state
    │
    ├─ Subscribe to real-time events
    │  ├─ Channel name: chat:{chatType}:{chatId}
    │  └─ Listen for INSERT/UPDATE/DELETE
    │
    └─ Cleanup on unmount
       └─ Unsubscribe from real-time channel


┌─────────────────────────────────────────────────────────────────┐
│              GROUP CREATION FLOW                                │
└─────────────────────────────────────────────────────────────────┘

User clicks "+" button
    ↓
setNewChatOpen(true)
    ↓
NewChatDialog opens
    ├─ Load organization members
    └─ Initialize form state
    ↓
User selects "Group Chat" tab
    ├─ Enter group name
    ├─ Enter description (optional)
    └─ Multi-select members
    ↓
Click "Create Group"
    ↓
handleCreateGroup()
    ├─ Validate: name (required), members (1-50)
    └─ setCreating(true)
    ↓
POST /api/chat/groups
    ├─ Validate with Zod schema
    ├─ Get user's organization_id from profile
    ├─ Create group_chats record
    ├─ Add creator + selected members to group_chat_members
    ├─ On failure: Delete group (cascade cleanup)
    └─ Return created group with ID
    ↓
Client receives response
    ├─ onChatCreated(group) → updates ChatPage.selectedChat
    ├─ setNewChatOpen(false)
    ├─ Toast.success("Group created successfully")
    └─ ChatWindow mounts with new group


┌─────────────────────────────────────────────────────────────────┐
│            DIRECT MESSAGE FLOW (No Creation)                    │
└─────────────────────────────────────────────────────────────────┘

User clicks "+" button
    ↓
NewChatDialog opens
    ├─ Load org members or all users
    └─ activeTab = "direct"
    ↓
User clicks on person
    ↓
handleSelectUser(user)
    ├─ Create ChatItem with user's ID
    └─ Call onChatCreated() → updates selectedChat
    ↓
onOpenChange(false) → close dialog
    ↓
ChatWindow mounts
    ├─ useRealtimeChat with chatType='direct'
    ├─ Fetches existing messages (if any)
    ├─ Subscribes to real-time updates
    └─ Ready to send first message


┌─────────────────────────────────────────────────────────────────┐
│            CHAT TYPE SWITCHING FLOW                             │
└─────────────────────────────────────────────────────────────────┘

User clicks tab: Channels/Direct/Groups
    ↓
setActiveTab(newTab)
    ↓
ChatSidebar re-renders with type={newTab}
    ↓
useEffect in ChatSidebar
    ├─ Detect type or organizationId change
    └─ fetchItems()
    ↓
Route based on type:
    ├─ channels → GET /api/chat/channels
    ├─ direct → GET /api/profiles/all OR /api/organizations/{id}/members
    └─ groups → GET /api/chat/groups
    ↓
Response → setItems(transformedData)
    ↓
ChatSidebar re-renders with new items
    ├─ Selected chat may no longer exist in new type
    └─ User needs to select a new chat
```

## State Dependencies Map

```
┌─────────────────────────────────────────────────────────────────┐
│  Component State Dependencies                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ChatPage (Parent State)                                         │
│  ├─ selectedChat → ChatSidebar, ChatWindow                       │
│  ├─ newChatOpen → NewChatDialog                                  │
│  └─ activeTab → ChatSidebar                                      │
│                                                                  │
│  ChatSidebar (Local State)                                       │
│  ├─ items → depends on type prop                                 │
│  ├─ loading → UI loading state                                   │
│  └─ showAllUsers → affects "direct" type fetch endpoint          │
│                                                                  │
│  ChatWindow (Local State + Hook State)                           │
│  ├─ newMessage → input field value                               │
│  ├─ sending → button disabled state                              │
│  ├─ messages (from hook) → message list rendering                │
│  ├─ loading (from hook) → loading indicator                      │
│  └─ scrollRef, inputRef → imperative DOM access                  │
│                                                                  │
│  NewChatDialog (Local State)                                     │
│  ├─ activeTab → Tab content display                              │
│  ├─ users → rendered list                                        │
│  ├─ loading → loading state                                      │
│  ├─ creating → button disabled state                             │
│  ├─ groupName, groupDescription → form fields                    │
│  └─ selectedMembers → checkboxes                                 │
│                                                                  │
│  useRealtimeChat Hook (Shared State)                             │
│  ├─ messages → ChatWindow message list                           │
│  ├─ loading → ChatWindow loading indicator                       │
│  └─ channel → cleanup reference                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## API Endpoint Call Graph

```
ChatSidebar
├─ GET /api/chat/channels
│  └─ Fetch organization channels
│     ├─ Auth required
│     ├─ Auto-filters by user's org
│     └─ Returns: { channels: DbOrganizationChannel[] }
│
├─ GET /api/organizations/{id}/members
│  └─ Fetch org members (direct messages)
│     ├─ Auth required
│     └─ Returns: { members: Profile[] }
│
├─ GET /api/profiles/all
│  └─ Fetch all platform users (cross-org direct)
│     ├─ Auth required
│     └─ Returns: { users: Profile[] }
│
└─ GET /api/chat/groups
   └─ Fetch user's groups
      ├─ Auth required
      └─ Returns: { groups: GroupChat[] }


ChatWindow (via useRealtimeChat)
├─ Initial load:
│  ├─ GET /api/messenger/messages?channelId=X&channelType=Y
│  ├─ GET /api/messenger/direct-messages?recipientId=X
│  └─ GET /api/chat/group-messages?groupId=X
│
├─ Send message:
│  ├─ POST /api/messenger/messages
│  ├─ POST /api/messenger/direct-messages
│  └─ POST /api/chat/group-messages
│
└─ Typing indicator:
   └─ POST /api/messenger/typing


NewChatDialog
├─ Load users (on open):
│  └─ GET /api/organizations/{id}/members
│
└─ Create group:
   └─ POST /api/chat/groups
      └─ Server creates group + adds members
         └─ On failure: Cascade delete group
```

## Real-time Subscription Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              Real-time Subscription Setup                        │
└─────────────────────────────────────────────────────────────────┘

useRealtimeChat Hook
    │
    ├─ useEffect (chatType, chatId, dependencies)
    │  │
    │  ├─ Create channel:
    │  │  └─ supabase.channel(`chat:{chatType}:{chatId}`)
    │  │
    │  ├─ Setup listeners:
    │  │  ├─ INSERT event
    │  │  │  ├─ Fetch full message with sender
    │  │  │  ├─ Dedup check
    │  │  │  └─ Add to state
    │  │  │
    │  │  ├─ UPDATE event
    │  │  │  └─ Update message in place
    │  │  │
    │  │  └─ DELETE event
    │  │     └─ Remove from state
    │  │
    │  ├─ Subscribe
    │  │  └─ setChannel(channel)
    │  │
    │  └─ Cleanup (return function)
    │     └─ newChannel.unsubscribe() ← CRITICAL!
    │
    └─ Dependency array
       ├─ chatType, chatId
       ├─ supabase
       ├─ fetchMessages
       └─ onMessage


Database Table → Supabase Real-time Bridge
    │
    ├─ channel_messages table
    │  └─ Trigger on INSERT/UPDATE/DELETE
    │     └─ Broadcast to subscribers
    │
    ├─ direct_messages table
    │  └─ Trigger on INSERT/UPDATE/DELETE
    │     └─ Broadcast to subscribers
    │
    └─ group_chats table (for metadata)
       └─ One-time fetch (no streaming)


Subscription Channels:
├─ chat:organization:{orgId}
├─ chat:project:{projectId}
├─ chat:direct:{userId}  (bidirectional)
└─ chat:group:{groupId}
```

## Error Boundaries & Handling

```
ChatPage
├─ @ts-nocheck (type safety disabled - TODO: Fix)
├─ Auth check → Redirect to /login if no user
└─ useAuth() hook
   └─ Handles authentication context

ChatWindow
├─ useRealtimeChat error handling:
│  ├─ Fetch errors → console.error (logged)
│  ├─ Send errors → return false → Toast.error()
│  └─ Typing errors → Silent fail (non-critical)
│
└─ Component error boundaries:
   ├─ Empty message state
   ├─ Loading state
   └─ Offline handling (browser fetch queue)

API Routes (Server)
├─ 401: Not authenticated
├─ 403: Access denied (membership check)
├─ 404: Resource not found
├─ 400: Invalid input (Zod validation)
├─ 409: Conflict (e.g., duplicate channel name)
└─ 500: Server error (logged with console.error)

NewChatDialog
└─ Toast notifications:
   ├─ Error loading users → Toast.error()
   ├─ Error creating group → Toast.error()
   └─ Success creating group → Toast.success()
```

## Type System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                  Type Hierarchy                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Public Types (exported from hooks/components)                   │
│  ├─ ChatItem (app/app/chat/page.tsx)                             │
│  │  ├─ id: string                                                │
│  │  ├─ name: string                                              │
│  │  ├─ type: "organization" | "project" | "direct" | "group"    │
│  │  ├─ description?: string                                      │
│  │  ├─ avatar_url?: string                                       │
│  │  └─ unread_count?: number                                     │
│  │                                                                │
│  ├─ ChatMessage (hooks/use-realtime-chat.ts)                     │
│  │  ├─ id: string                                                │
│  │  ├─ content: string                                           │
│  │  ├─ sender_id: string                                         │
│  │  ├─ created_at: string (ISO)                                  │
│  │  ├─ edited_at: string | null                                  │
│  │  └─ sender: ProfileWithoutEmail                               │
│  │                                                                │
│  └─ UseRealtimeChatOptions (hooks/use-realtime-chat.ts)          │
│     ├─ chatType: ChatType                                        │
│     ├─ chatId: string                                            │
│     ├─ organizationId?: string                                   │
│     ├─ onMessage?: (message: ChatMessage) => void                │
│     └─ onTyping?: (userId: string, isTyping: boolean) => void    │
│                                                                   │
│  Validation Types (lib/validations/chat.ts)                      │
│  ├─ SendChannelMessageInput                                      │
│  ├─ SendDirectMessageInput                                       │
│  ├─ SendGroupMessageInput                                        │
│  ├─ CreateChannelInput                                           │
│  ├─ CreateGroupInput                                             │
│  ├─ TypingIndicatorInput                                         │
│  └─ ...more                                                      │
│                                                                   │
│  Transformer Types (utils/transformers/chat-transformers.ts)     │
│  ├─ DbOrganizationChannel → ApiOrganizationChannel              │
│  ├─ DbChannelMessage → ApiChannelMessage                         │
│  ├─ DbGroupChat → ApiGroupChat                                   │
│  └─ (Conversion functions provided)                              │
│                                                                   │
│  Internal Component State Types                                  │
│  ├─ ChatSidebar: { items, loading, showAllUsers }               │
│  ├─ ChatWindow: { newMessage, sending, scrollRef, inputRef }    │
│  ├─ NewChatDialog: { activeTab, users, groupState, ... }        │
│  └─ useRealtimeChat: { messages, loading, channel }              │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

## Performance Optimization Strategies

```
1. Message Deduplication
   └─ Prevention of duplicates from:
      ├─ Optimistic update (client adds to state)
      └─ Real-time subscription (server broadcast)

2. Smart Avatar Rendering
   └─ Only render when sender changes
      ├─ Reduces DOM nodes
      └─ Improves visual grouping

3. Lazy Scrolling
   └─ Auto-scroll only on new messages
      └─ Not triggered on history load

4. Pagination Ready
   └─ cursor-based "before" parameter
      ├─ Server supports it
      ├─ Client ready (not UI implemented)
      └─ Load older messages on scroll up

5. Component Splitting
   └─ Heavy components isolated:
      ├─ ChatWindow can be lazy loaded
      ├─ NewChatDialog is modal (on-demand)
      └─ ChatSidebar separate from window

6. State Efficiency
   └─ useRealtimeChat hook manages message state
      ├─ Singleton pattern (one per chat)
      ├─ No context providers (minimal re-renders)
      └─ Direct prop passing

7. Real-time Batching
   └─ Supabase automatically batches events
      └─ No need for client-side throttling
```

## Testing Coverage Map

```
Unit Tests Needed:
├─ Deduplication logic (useRealtimeChat)
├─ Zod validation schemas
├─ Transformer functions
└─ Chat type routing logic

Integration Tests:
├─ Send message → Real-time update flow
├─ Create group → Member addition
├─ Channel creation → Access control
├─ Direct message cross-org support
└─ Chat type switching

E2E Tests:
├─ Full message send workflow
├─ Create group chat and participate
├─ Direct message to user across org
├─ Receive real-time updates
├─ Error handling (network, auth, validation)
└─ UI interactions (scroll, input, tabs)
```

## Key Integration Points

```
Authentication System
├─ useAuth() hook
├─ ChatPage checks user & profile
└─ All API routes verify session

Database (Supabase)
├─ Real-time subscriptions
├─ Message tables
├─ User/organization tables
└─ Activity logging

Notifications System
├─ Could consume real-time events
├─ Message count for badges
└─ Toast notifications (Sonner)

Activity Logging
├─ Channel creation logs
├─ Group creation logs
└─ Direct messages NOT logged (privacy)

UI Component Library
├─ shadcn/ui (Button, Input, Dialog, etc.)
├─ Lucide icons
├─ Tailwind CSS styling
└─ Sonner toast notifications
```

