# API Overview

Complete reference for all 80+ API endpoints in Aurentia AI Command Center.

## Base URL

```
Development: http://localhost:3000/api
Production:  https://your-domain.com/api
```

## Authentication

All endpoints require authentication via Supabase Auth unless otherwise specified. Session is managed via HTTP-only cookies.

## Global Rate Limits

| Operation Type | Default Limit |
|----------------|---------------|
| Read (GET) | 60 requests/minute |
| Create (POST) | 30 requests/minute |
| Update (PUT/PATCH) | 30 requests/minute |
| Delete (DELETE) | 10 requests/minute |

**Note:** Specific endpoints may have stricter limits (e.g., organization creation: 3/hour).

## Response Format

### Success Response
```json
{
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "error": "Error message description"
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH, DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Validation error, malformed request |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Authenticated but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

---

## API Endpoints by Category

### 🔐 Authentication & Profile

| Endpoint | Method | Description | Auth | Rate Limit |
|----------|--------|-------------|------|------------|
| `/api/profile` | GET | Get current user profile | Required | 60/min |
| `/api/profile` | PATCH | Update user profile | Required | 30/min |
| `/api/profile/avatar` | POST | Upload avatar image | Required | 10/min |
| `/api/profile/avatar` | DELETE | Delete avatar | Required | 10/min |
| `/api/profiles/all` | GET | Get all profiles (for dropdowns) | Required | 60/min |

**Note:** Authentication (signup, login, logout) is handled via Server Actions in `app/(auth)/actions.ts`, not API routes.

---

### 🏢 Organizations

| Endpoint | Method | Description | Auth | Detailed Docs |
|----------|--------|-------------|------|---------------|
| `/api/organizations` | GET | List user's organizations | Required | [View](./02-organizations.md#get-apiorganizations) |
| `/api/organizations` | POST | Create organization | Required | [View](./02-organizations.md#post-apiorganizations) |
| `/api/organizations/[orgId]` | GET | Get organization details | Required | [View](./02-organizations.md#get-apiorganizationsorgid) |
| `/api/organizations/[orgId]` | PUT | Update organization | Required (ADMIN/OWNER) | [View](./02-organizations.md#put-apiorganizationsorgid) |
| `/api/organizations/[orgId]` | DELETE | Delete organization | Required (OWNER) | [View](./02-organizations.md#delete-apiorganizationsorgid) |
| `/api/organizations/[orgId]/members` | GET | List organization members | Required | [View](./02-organizations.md#get-apiorganizationsorgidmembers) |
| `/api/organizations/[orgId]/members` | POST | Add member | Required (ADMIN/OWNER) | [View](./02-organizations.md#post-apiorganizationsorgidmembers) |
| `/api/organizations/[orgId]/consultants` | GET | List consultants | Required | - |
| `/api/organizations/[orgId]/consultants` | POST | Create/delete consultants (bulk) | Required (ADMIN/OWNER) | - |
| `/api/organizations/[orgId]/consultants/[consultantId]` | GET | Get consultant details | Required | - |
| `/api/organizations/[orgId]/consultants/[consultantId]` | PATCH | Update consultant | Required (ADMIN/OWNER) | - |
| `/api/organizations/[orgId]/consultants/[consultantId]` | DELETE | Delete consultant | Required (ADMIN/OWNER) | - |
| `/api/organizations/[orgId]/projects` | GET | List organization projects | Required | - |
| `/api/organizations/[orgId]/projects` | POST | Create project | Required (ADMIN/MANAGER) | - |
| `/api/organizations/[orgId]/invitations` | POST | Send email invitations | Required (ADMIN/OWNER) | - |
| `/api/organizations/[orgId]/join-codes` | PATCH | Manage join codes | Required (ADMIN/OWNER) | - |
| `/api/organizations/[orgId]/analytics` | GET | Organization analytics | Required | - |
| `/api/organizations/[orgId]/my-tasks` | GET | Current user's tasks in org | Required | - |

---

### 📊 Projects

| Endpoint | Method | Description | Auth | Rate Limit |
|----------|--------|-------------|------|------------|
| `/api/projects` | GET | List accessible projects | Required | 60/min |
| `/api/projects` | POST | Create project | Required (ADMIN/MANAGER) | 30/min |
| `/api/projects/[projectId]` | GET | Get project details | Required | 60/min |
| `/api/projects/[projectId]` | PATCH | Update project | Required (ADMIN/MANAGER) | 30/min |
| `/api/projects/[projectId]` | DELETE | Delete project | Required (ADMIN/OWNER) | 10/min |
| `/api/projects/[projectId]/tasks` | GET | List project tasks | Required | 60/min |
| `/api/projects/[projectId]/tasks` | POST | Create task | Required | 30/min |
| `/api/projects/[projectId]/members` | GET | Get project team members | Required | 60/min |
| `/api/projects/[projectId]/milestones` | GET | List project milestones | Required | 60/min |
| `/api/projects/[projectId]/milestones` | POST | Create milestone | Required (MANAGER/ADMIN) | 30/min |
| `/api/projects/[projectId]/stats` | GET | Get project statistics | Required | 60/min |
| `/api/projects/[projectId]/tags` | GET | Get project tags | Required | 60/min |

---

### ✅ Tasks

| Endpoint | Method | Description | Auth | Rate Limit |
|----------|--------|-------------|------|------------|
| `/api/tasks/[taskId]` | GET | Get task details | Required | 60/min |
| `/api/tasks/[taskId]` | PATCH | Update task | Required | 30/min |
| `/api/tasks/[taskId]` | DELETE | Delete task | Required (ADMIN/MANAGER) | 10/min |
| `/api/tasks/[taskId]/move` | POST | Move task (Kanban drag-drop) | Required | 60/min |

---

### 🎯 Milestones

| Endpoint | Method | Description | Auth | Rate Limit |
|----------|--------|-------------|------|------------|
| `/api/milestones/[milestoneId]` | GET | Get milestone details | Required | 60/min |
| `/api/milestones/[milestoneId]` | PATCH | Update milestone | Required (MANAGER/ADMIN) | 30/min |
| `/api/milestones/[milestoneId]` | DELETE | Delete milestone | Required (ADMIN) | 10/min |
| `/api/milestones/[milestoneId]/tasks` | GET | Get milestone tasks | Required | 60/min |
| `/api/milestones/[milestoneId]/tasks` | POST | Add task to milestone | Required (MANAGER/ADMIN) | 30/min |
| `/api/milestones/[milestoneId]/tasks` | DELETE | Remove task from milestone | Required (MANAGER/ADMIN) | 30/min |
| `/api/milestones/[milestoneId]/assignments` | POST | Assign resource to milestone | Required (MANAGER/ADMIN) | 30/min |
| `/api/milestones/[milestoneId]/assignments` | DELETE | Unassign resource | Required (MANAGER/ADMIN) | 30/min |
| `/api/milestones/[milestoneId]/dependencies` | POST | Create milestone dependency | Required (MANAGER/ADMIN) | 30/min |
| `/api/milestones/[milestoneId]/dependencies` | DELETE | Delete dependency | Required (MANAGER/ADMIN) | 30/min |

---

### 👥 Consultants

| Endpoint | Method | Description | Auth | Rate Limit |
|----------|--------|-------------|------|------------|
| `/api/consultants` | GET | List all consultants (user's orgs) | Required | 60/min |
| `/api/consultants` | POST | Create consultant | Required (ADMIN) | 30/min |
| `/api/consultants/[consultantId]` | GET | Get consultant details | Required | 60/min |
| `/api/consultants/[consultantId]` | PATCH | Update consultant | Required (ADMIN/MANAGER) | 30/min |
| `/api/consultants/[consultantId]` | DELETE | Delete consultant | Required (ADMIN) | 10/min |

---

### 💬 Messaging & Chat

| Endpoint | Method | Description | Auth | Rate Limit |
|----------|--------|-------------|------|------------|
| `/api/messenger/channels` | GET | List organization channels | Required | 60/min |
| `/api/messenger/channels` | POST | Create channel | Required (ADMIN) | 30/min |
| `/api/messenger/messages` | GET | Fetch channel messages | Required | 60/min |
| `/api/messenger/messages` | POST | Send message to channel | Required | 60/min |
| `/api/messenger/direct-messages` | GET | List DM conversations | Required | 60/min |
| `/api/messenger/direct-messages` | POST | Send direct message | Required | 60/min |
| `/api/messenger/reactions` | POST | Add reaction to message | Required | 60/min |
| `/api/messenger/reactions` | DELETE | Remove reaction | Required | 60/min |
| `/api/messenger/typing` | POST | Send typing indicator | Required | 120/min |
| `/api/chat/channels` | GET | List chat channels | Required | 60/min |
| `/api/chat/channels` | POST | Create chat channel | Required (ADMIN) | 30/min |
| `/api/chat/messages` | GET | Fetch chat messages | Required | 60/min |
| `/api/chat/messages` | POST | Send chat message | Required | 60/min |
| `/api/chat/groups` | GET | List group chats | Required | 60/min |
| `/api/chat/groups` | POST | Create group chat | Required | 30/min |
| `/api/chat/group-messages` | GET | Fetch group chat messages | Required | 60/min |
| `/api/chat/group-messages` | POST | Send group message | Required | 60/min |

---

### 🔔 Notifications

| Endpoint | Method | Description | Auth | Rate Limit |
|----------|--------|-------------|------|------------|
| `/api/notifications` | GET | Fetch user notifications | Required | 60/min |
| `/api/notifications/[notificationId]` | PATCH | Mark notification as read | Required | 60/min |
| `/api/notifications/[notificationId]` | DELETE | Delete notification | Required | 60/min |

---

### 📈 Analytics & Reporting

| Endpoint | Method | Description | Auth | Rate Limit |
|----------|--------|-------------|------|------------|
| `/api/analytics/overview` | GET | 6 key metrics (revenue, costs, margin, hours, consultants, projects at risk) | Required | 60/min |
| `/api/analytics/financial` | GET | Financial analytics (revenue breakdown, costs, profit margins) | Required (ADMIN/MANAGER) | 60/min |
| `/api/analytics/time-tracking` | GET | Time tracking insights (hours worked, utilization) | Required | 60/min |
| `/api/analytics/team` | GET | Team performance analytics | Required (ADMIN/MANAGER) | 60/min |
| `/api/analytics/project-scores` | GET | Project health scores and risk data | Required | 60/min |

---

### 📊 Dashboard & Statistics

| Endpoint | Method | Description | Auth | Rate Limit |
|----------|--------|-------------|------|------------|
| `/api/dashboard/stats` | GET | Dashboard statistics for current user | Required | 60/min |
| `/api/stats/consultants` | GET | Global consultant statistics | Required | 60/min |
| `/api/stats/projects` | GET | Global project statistics | Required | 60/min |
| `/api/stats/organizations` | GET | Global organization statistics | Required (ADMIN/OWNER) | 60/min |
| `/api/stats/hours-this-month` | GET | Calculate hours worked this month | Required | 60/min |

---

### 📝 Activity Logs

| Endpoint | Method | Description | Auth | Rate Limit |
|----------|--------|-------------|------|------------|
| `/api/activity` | GET | Fetch activity logs with filtering and pagination | Required | 60/min |

---

### 🔀 Workflows & Sticky Notes (Planned Feature)

| Endpoint | Method | Description | Auth | Rate Limit |
|----------|--------|-------------|------|------------|
| `/api/workflows` | GET | List workflows | Required | 60/min |
| `/api/workflows` | POST | Create workflow | Required (ADMIN/MANAGER) | 30/min |
| `/api/workflows/[workflowId]` | GET | Get workflow details | Required | 60/min |
| `/api/workflows/[workflowId]` | PUT | Update workflow | Required (ADMIN/MANAGER) | 30/min |
| `/api/workflows/[workflowId]` | DELETE | Delete workflow | Required (ADMIN) | 10/min |
| `/api/workflows/[workflowId]/sticky-notes` | GET | List sticky notes | Required | 60/min |
| `/api/workflows/[workflowId]/sticky-notes` | POST | Create sticky note | Required | 30/min |
| `/api/workflows/[workflowId]/sticky-notes` | PATCH | Update sticky note | Required | 30/min |
| `/api/workflows/[workflowId]/sticky-notes/[noteId]` | PUT | Update sticky note | Required | 30/min |
| `/api/workflows/[workflowId]/sticky-notes/[noteId]` | DELETE | Delete sticky note | Required | 30/min |

---

### 🔧 Admin Panel Endpoints

All admin endpoints require **ADMIN or OWNER** role.

#### Users

| Endpoint | Method | Description | Auth | Rate Limit |
|----------|--------|-------------|------|------------|
| `/api/admin/users` | GET | List all users | ADMIN/OWNER | 60/min |
| `/api/admin/users` | POST | Create user | ADMIN/OWNER | 30/min |
| `/api/admin/users/[userId]` | PATCH | Update user | ADMIN/OWNER | 30/min |
| `/api/admin/users/[userId]` | DELETE | Delete user | ADMIN/OWNER | 10/min |

#### Organizations (Admin)

| Endpoint | Method | Description | Auth | Rate Limit |
|----------|--------|-------------|------|------------|
| `/api/admin/organizations` | GET | List all organizations | ADMIN/OWNER | 60/min |
| `/api/admin/organizations` | POST | Create organization | ADMIN/OWNER | 30/min |
| `/api/admin/organizations/[orgId]` | PATCH | Update organization | ADMIN/OWNER | 30/min |
| `/api/admin/organizations/[orgId]` | DELETE | Delete organization | ADMIN/OWNER | 10/min |

#### Consultants (Admin)

| Endpoint | Method | Description | Auth | Rate Limit |
|----------|--------|-------------|------|------------|
| `/api/admin/consultants` | GET | List all consultants | ADMIN/OWNER | 60/min |
| `/api/admin/consultants` | POST | Create/bulk delete consultants | ADMIN/OWNER | 30/min |
| `/api/admin/consultants/[consultantId]` | PATCH | Update consultant | ADMIN/OWNER | 30/min |
| `/api/admin/consultants/[consultantId]` | DELETE | Delete consultant | ADMIN/OWNER | 10/min |

#### Clients (Admin)

| Endpoint | Method | Description | Auth | Rate Limit |
|----------|--------|-------------|------|------------|
| `/api/admin/clients` | GET | List all clients | ADMIN/OWNER | 60/min |
| `/api/admin/clients` | POST | Create/bulk delete clients | ADMIN/OWNER | 30/min |
| `/api/admin/clients/[clientId]` | PATCH | Update client | ADMIN/OWNER | 30/min |
| `/api/admin/clients/[clientId]` | DELETE | Delete client | ADMIN/OWNER | 10/min |

#### Projects (Admin)

| Endpoint | Method | Description | Auth | Rate Limit |
|----------|--------|-------------|------|------------|
| `/api/admin/projects` | GET | List all projects | ADMIN/OWNER | 60/min |
| `/api/admin/projects` | POST | Create project | ADMIN/OWNER | 30/min |
| `/api/admin/projects/[projectId]` | PATCH | Update project | ADMIN/OWNER | 30/min |
| `/api/admin/projects/[projectId]` | DELETE | Delete project | ADMIN/OWNER | 10/min |
| `/api/admin/projects/[projectId]/health-history` | GET | Get project health score history | ADMIN/OWNER | 60/min |

#### Tasks (Admin)

| Endpoint | Method | Description | Auth | Rate Limit |
|----------|--------|-------------|------|------------|
| `/api/admin/tasks` | GET | List all tasks | ADMIN/OWNER | 60/min |
| `/api/admin/tasks` | POST | Create task | ADMIN/OWNER | 30/min |
| `/api/admin/tasks/[taskId]` | PATCH | Update task | ADMIN/OWNER | 30/min |
| `/api/admin/tasks/[taskId]` | DELETE | Delete task | ADMIN/OWNER | 10/min |

#### Milestones (Admin)

| Endpoint | Method | Description | Auth | Rate Limit |
|----------|--------|-------------|------|------------|
| `/api/admin/milestones` | GET | List all milestones | ADMIN/OWNER | 60/min |
| `/api/admin/milestones` | POST | Create milestone | ADMIN/OWNER | 30/min |
| `/api/admin/milestones/[milestoneId]` | PATCH | Update milestone | ADMIN/OWNER | 30/min |
| `/api/admin/milestones/[milestoneId]` | DELETE | Delete milestone | ADMIN/OWNER | 10/min |

#### Notifications (Admin)

| Endpoint | Method | Description | Auth | Rate Limit |
|----------|--------|-------------|------|------------|
| `/api/admin/notifications` | GET | List all notifications | ADMIN/OWNER | 60/min |
| `/api/admin/notifications` | POST | Create notification | ADMIN/OWNER | 30/min |
| `/api/admin/notifications/[notificationId]` | PATCH | Update notification | ADMIN/OWNER | 30/min |
| `/api/admin/notifications/[notificationId]` | DELETE | Delete notification | ADMIN/OWNER | 10/min |

#### Messaging (Admin)

| Endpoint | Method | Description | Auth | Rate Limit |
|----------|--------|-------------|------|------------|
| `/api/admin/messaging/channels` | GET | List all channels | ADMIN/OWNER | 60/min |
| `/api/admin/messaging/channels` | POST | Create channel | ADMIN/OWNER | 30/min |
| `/api/admin/messaging/channels/[channelId]` | DELETE | Delete channel | ADMIN/OWNER | 10/min |
| `/api/admin/messaging/messages` | GET | List all messages | ADMIN/OWNER | 60/min |
| `/api/admin/messaging/messages` | POST | Create message | ADMIN/OWNER | 30/min |
| `/api/admin/messaging/messages/[messageId]` | DELETE | Delete message | ADMIN/OWNER | 10/min |

---

## Common Request Patterns

### Pagination (Planned)

```
GET /api/resources?page=1&limit=20
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Filtering (Implementation Varies)

```
GET /api/tasks?status=TODO&priority=high&assigneeId=uuid
```

### Sorting (Planned)

```
GET /api/projects?sortBy=createdAt&order=desc
```

### Search (Planned)

```
GET /api/projects?search=acme
```

---

## Error Handling

### Validation Errors

```json
{
  "error": "Validation failed",
  "details": {
    "name": ["Name is required"],
    "email": ["Invalid email format"]
  }
}
```

### Authentication Errors

```json
{
  "error": "Not authenticated"
}
```

### Authorization Errors

```json
{
  "error": "Insufficient permissions. ADMIN role required."
}
```

### Rate Limit Errors

```json
{
  "error": "Rate limit exceeded. Please try again in 45 seconds."
}
```

**Headers:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1699977600
Retry-After: 45
```

---

## Best Practices

### 1. Always Include Credentials

```typescript
fetch('/api/endpoint', {
  credentials: 'include', // Send session cookie
})
```

### 2. Handle Errors Gracefully

```typescript
async function apiCall() {
  try {
    const response = await fetch('/api/endpoint', {
      credentials: 'include',
    })

    if (!response.ok) {
      const { error } = await response.json()
      throw new Error(error)
    }

    const { data } = await response.json()
    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}
```

### 3. Implement Retry Logic (for 429 errors)

```typescript
async function fetchWithRetry(url: string, options = {}, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options)

    if (response.status !== 429) {
      return response
    }

    const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10)
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
  }

  throw new Error('Max retries exceeded')
}
```

### 4. Use TypeScript Types

```typescript
import type { Database } from '@/lib/supabase/types'

type Organization = Database['public']['Tables']['organizations']['Row']

async function fetchOrganizations(): Promise<Organization[]> {
  const response = await fetch('/api/organizations', {
    credentials: 'include',
  })

  const { data } = await response.json()
  return data
}
```

### 5. Implement Loading States

```typescript
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  fetch('/api/endpoint', { credentials: 'include' })
    .then(res => res.json())
    .then(({ data }) => {
      setData(data)
      setLoading(false)
    })
    .catch(err => {
      setError(err.message)
      setLoading(false)
    })
}, [])
```

---

## Postman Collection

Import the Postman collection for easy API testing:

```bash
# Download collection
curl -o aurentia-api.postman_collection.json \
  https://your-domain.com/api/postman-collection

# Import in Postman
# File → Import → Select file
```

**Environment Variables:**
- `BASE_URL`: `http://localhost:3000/api`
- `SESSION_TOKEN`: (obtained after login)

---

## OpenAPI / Swagger Documentation

Interactive API documentation available at:

```
http://localhost:3000/api/docs
```

**Features:**
- Try endpoints directly in browser
- View request/response schemas
- Download OpenAPI spec (JSON/YAML)

---

**See Also:**
- [Organizations API (Detailed)](./02-organizations.md)
- [Authentication](../core-concepts/01-authentication.md)
- [Database Schema](../core-concepts/03-database-schema.md)
- [Rate Limiting](../core-concepts/04-api-conventions.md#rate-limiting)
