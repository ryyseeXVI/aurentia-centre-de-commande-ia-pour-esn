# Organizations API

Complete API reference for managing organizations in Aurentia AI Command Center.

## Base URL

```
http://localhost:3000/api/organizations
```

## Authentication

All endpoints require authentication via Supabase Auth. Include the session cookie in requests.

## Rate Limiting

| Operation | Limit |
|-----------|-------|
| GET requests | 60 requests/minute per user |
| POST requests (create) | 3 requests/hour per user |
| PUT/PATCH requests | 30 requests/minute per user |
| DELETE requests | 10 requests/minute per user |

---

## Endpoints Overview

| Method | Endpoint | Description | Auth | Rate Limit |
|--------|----------|-------------|------|------------|
| GET | `/api/organizations` | List user's organizations | Required | 60/min |
| POST | `/api/organizations` | Create new organization | Required | 3/hour |
| GET | `/api/organizations/[orgId]` | Get organization details | Required | 60/min |
| PUT | `/api/organizations/[orgId]` | Update organization | Required (ADMIN/OWNER) | 30/min |
| DELETE | `/api/organizations/[orgId]` | Delete organization | Required (OWNER) | 10/min |
| GET | `/api/organizations/[orgId]/members` | List organization members | Required | 60/min |
| POST | `/api/organizations/[orgId]/members` | Add member to organization | Required (ADMIN/OWNER) | 30/min |
| GET | `/api/organizations/[orgId]/consultants` | List consultants | Required | 60/min |
| POST | `/api/organizations/[orgId]/consultants` | Create/delete consultants | Required (ADMIN/OWNER) | 30/min |
| POST | `/api/organizations/[orgId]/invitations` | Send invitations | Required (ADMIN/OWNER) | 20/min |
| PATCH | `/api/organizations/[orgId]/join-codes` | Manage join codes | Required (ADMIN/OWNER) | 30/min |

---

## GET /api/organizations

Retrieve all organizations that the authenticated user is a member of.

### Request

**Headers:**
```
Cookie: sb-access-token=<session-token>
Content-Type: application/json
```

**Query Parameters:** None

### Response (200 OK)

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Acme Corporation",
      "slug": "acme-corp",
      "description": "Leading technology consulting firm",
      "logoUrl": "https://example.com/logo.png",
      "website": "https://acme.com",
      "image": "https://example.com/banner.png",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "userRole": "ADMIN",
      "memberCount": 25,
      "projectCount": 12
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Beta Solutions",
      "slug": "beta-solutions",
      "description": "Innovation consultancy",
      "logoUrl": null,
      "website": null,
      "image": null,
      "createdAt": "2024-02-01T14:20:00Z",
      "updatedAt": "2024-02-01T14:20:00Z",
      "userRole": "MEMBER",
      "memberCount": 8,
      "projectCount": 3
    }
  ]
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Organization unique identifier |
| name | string | Organization name |
| slug | string | URL-safe unique identifier (3-50 chars, lowercase, numbers, hyphens) |
| description | string | Organization description |
| logoUrl | string | Logo image URL |
| website | string | Organization website |
| image | string | Banner/cover image URL |
| createdAt | ISO 8601 | Creation timestamp |
| updatedAt | ISO 8601 | Last update timestamp |
| userRole | string | Current user's role in this organization (OWNER, ADMIN, MANAGER, MEMBER) |
| memberCount | number | Total number of members |
| projectCount | number | Total number of projects |

### Error Responses

**401 Unauthorized**
```json
{
  "error": "Not authenticated"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to fetch organizations"
}
```

### Example

```typescript
// Fetch user's organizations
async function fetchOrganizations() {
  const response = await fetch('/api/organizations', {
    method: 'GET',
    credentials: 'include', // Include session cookie
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch organizations')
  }

  const { data } = await response.json()
  return data
}

// Usage
const organizations = await fetchOrganizations()
console.log(`User is a member of ${organizations.length} organizations`)
```

---

## POST /api/organizations

Create a new organization. The authenticated user becomes the first member with ADMIN role.

### Request

**Headers:**
```
Cookie: sb-access-token=<session-token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "New Organization",
  "slug": "new-org",
  "description": "Organization description",
  "website": "https://example.com"
}
```

### Request Fields

| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| name | string | Yes | Organization name | 1-255 characters |
| slug | string | No | URL-safe identifier | 3-50 chars, ^[a-z0-9-]+$, auto-generated if not provided |
| description | string | No | Description | Max 2000 characters |
| website | string | No | Website URL | Valid URL format |
| logoUrl | string | No | Logo URL | Valid URL format |
| image | string | No | Banner image URL | Valid URL format |

### Validation Rules

**Slug Generation:**
- If not provided, automatically generated from `name`
- Converted to lowercase
- Spaces replaced with hyphens
- Non-alphanumeric characters removed
- Truncated to 50 characters
- Collision handling: appends `-2`, `-3`, etc.

**Examples:**
- `"Acme Corporation"` → `"acme-corporation"`
- `"My Super Cool Org!!!"` → `"my-super-cool-org"`
- `"Test" (collision)` → `"test-2"`

### Response (201 Created)

```json
{
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "name": "New Organization",
    "slug": "new-org",
    "description": "Organization description",
    "website": "https://example.com",
    "logoUrl": null,
    "image": null,
    "createdAt": "2024-11-14T15:45:00Z",
    "updatedAt": "2024-11-14T15:45:00Z"
  }
}
```

### Error Responses

**400 Bad Request - Validation Error**
```json
{
  "error": "Slug must be between 3 and 50 characters"
}
```

**400 Bad Request - Duplicate Slug**
```json
{
  "error": "Organization slug already exists"
}
```

**401 Unauthorized**
```json
{
  "error": "Not authenticated"
}
```

**429 Too Many Requests**
```json
{
  "error": "Rate limit exceeded. You can create 3 organizations per hour."
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to create organization"
}
```

### Side Effects

1. **Organization created** in `organizations` table
2. **User added** to `user_organizations` with role `ADMIN`
3. **Default channels created**:
   - `#general` (organization channel)
   - `#announcements` (organization channel)
4. **Activity logged** (ORGANIZATION_CREATED action)

### Example

```typescript
// Create organization
async function createOrganization(data: {
  name: string
  slug?: string
  description?: string
  website?: string
}) {
  const response = await fetch('/api/organizations', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const { error } = await response.json()
    throw new Error(error)
  }

  const { data: organization } = await response.json()
  return organization
}

// Usage
const newOrg = await createOrganization({
  name: 'My Consulting Firm',
  description: 'Expert IT consulting',
  website: 'https://myconsulting.com',
})

console.log(`Created organization: ${newOrg.name} (${newOrg.slug})`)
```

---

## GET /api/organizations/[orgId]

Get detailed information about a specific organization.

### Request

**URL Parameters:**
- `orgId` (uuid) - Organization ID

**Headers:**
```
Cookie: sb-access-token=<session-token>
```

### Authorization

User must be a member of the organization OR have OWNER role.

### Response (200 OK)

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Acme Corporation",
    "slug": "acme-corp",
    "description": "Leading technology consulting firm",
    "logoUrl": "https://example.com/logo.png",
    "website": "https://acme.com",
    "image": "https://example.com/banner.png",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "stats": {
      "memberCount": 25,
      "projectCount": 12,
      "activeProjectCount": 8,
      "consultantCount": 15,
      "taskCount": 145,
      "completedTaskCount": 89
    },
    "userRole": "ADMIN"
  }
}
```

### Error Responses

**401 Unauthorized**
```json
{
  "error": "Not authenticated"
}
```

**403 Forbidden**
```json
{
  "error": "Not authorized to access this organization"
}
```

**404 Not Found**
```json
{
  "error": "Organization not found"
}
```

### Example

```typescript
// Fetch organization details
async function fetchOrganization(orgId: string) {
  const response = await fetch(`/api/organizations/${orgId}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Organization not found')
    }
    throw new Error('Failed to fetch organization')
  }

  const { data } = await response.json()
  return data
}

// Usage
const org = await fetchOrganization('550e8400-e29b-41d4-a716-446655440000')
console.log(`${org.name} has ${org.stats.memberCount} members`)
```

---

## PUT /api/organizations/[orgId]

Update organization details.

### Request

**URL Parameters:**
- `orgId` (uuid) - Organization ID

**Headers:**
```
Cookie: sb-access-token=<session-token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "website": "https://newwebsite.com",
  "logoUrl": "https://example.com/new-logo.png",
  "image": "https://example.com/new-banner.png"
}
```

### Authorization

User must have **ADMIN or OWNER role** in the organization.

### Request Fields

All fields are optional. Only provided fields will be updated.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| name | string | Organization name | 1-255 characters |
| slug | string | URL identifier | 3-50 chars, ^[a-z0-9-]+$, must be unique |
| description | string | Description | Max 2000 characters |
| website | string | Website URL | Valid URL |
| logoUrl | string | Logo URL | Valid URL |
| image | string | Banner URL | Valid URL |

### Response (200 OK)

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Updated Name",
    "slug": "acme-corp",
    "description": "Updated description",
    "website": "https://newwebsite.com",
    "logoUrl": "https://example.com/new-logo.png",
    "image": "https://example.com/new-banner.png",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-11-14T16:00:00Z"
  }
}
```

### Error Responses

**400 Bad Request**
```json
{
  "error": "Invalid slug format"
}
```

**401 Unauthorized**
```json
{
  "error": "Not authenticated"
}
```

**403 Forbidden**
```json
{
  "error": "Insufficient permissions. ADMIN or OWNER role required."
}
```

**404 Not Found**
```json
{
  "error": "Organization not found"
}
```

### Side Effects

1. **Organization updated** in database
2. **Activity logged** (ORGANIZATION_UPDATED action)
3. **Cache invalidated** for organization data

### Example

```typescript
// Update organization
async function updateOrganization(orgId: string, updates: Partial<{
  name: string
  description: string
  website: string
  logoUrl: string
}>) {
  const response = await fetch(`/api/organizations/${orgId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const { error } = await response.json()
    throw new Error(error)
  }

  const { data } = await response.json()
  return data
}

// Usage
const updated = await updateOrganization('550e8400-e29b-41d4-a716-446655440000', {
  description: 'New description',
  website: 'https://newsite.com',
})
```

---

## DELETE /api/organizations/[orgId]

Delete an organization and all associated data.

### Request

**URL Parameters:**
- `orgId` (uuid) - Organization ID

**Headers:**
```
Cookie: sb-access-token=<session-token>
```

### Authorization

User must have **OWNER role** (global super-admin).

**⚠️ Warning:** This is a destructive operation. All data will be permanently deleted due to CASCADE constraints.

### Data Deleted

When an organization is deleted, the following data is also deleted:
- All organization members (user_organizations)
- All projects (projet)
- All tasks (tache)
- All consultants (consultant_details)
- All milestones (milestones)
- All time tracking entries (temps_passe)
- All invoices (facture)
- All channels and messages
- All notifications
- All activity logs
- All analytics data

### Response (200 OK)

```json
{
  "message": "Organization deleted successfully"
}
```

### Error Responses

**401 Unauthorized**
```json
{
  "error": "Not authenticated"
}
```

**403 Forbidden**
```json
{
  "error": "Only OWNER can delete organizations"
}
```

**404 Not Found**
```json
{
  "error": "Organization not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to delete organization"
}
```

### Side Effects

1. **Organization and all data deleted** (CASCADE)
2. **Activity logged** (ORGANIZATION_DELETED action)
3. **Users removed** from organization
4. **No undo available**

### Example

```typescript
// Delete organization (with confirmation)
async function deleteOrganization(orgId: string) {
  const confirmed = confirm(
    'Are you sure? This will permanently delete the organization and all associated data.'
  )

  if (!confirmed) return

  const response = await fetch(`/api/organizations/${orgId}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    const { error } = await response.json()
    throw new Error(error)
  }

  const { message } = await response.json()
  return message
}

// Usage
await deleteOrganization('550e8400-e29b-41d4-a716-446655440000')
console.log('Organization deleted')
```

---

## GET /api/organizations/[orgId]/members

List all members of an organization.

### Request

**URL Parameters:**
- `orgId` (uuid) - Organization ID

**Headers:**
```
Cookie: sb-access-token=<session-token>
```

### Authorization

User must be a member of the organization.

### Response (200 OK)

```json
{
  "data": [
    {
      "id": "user-uuid-1",
      "email": "john.doe@example.com",
      "nom": "Doe",
      "prenom": "John",
      "role": "ADMIN",
      "avatarUrl": "https://example.com/avatar1.jpg",
      "phone": "+33612345678",
      "status": "online",
      "lastSeen": "2024-11-14T16:30:00Z",
      "joinedAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "user-uuid-2",
      "email": "jane.smith@example.com",
      "nom": "Smith",
      "prenom": "Jane",
      "role": "CONSULTANT",
      "avatarUrl": null,
      "phone": null,
      "status": "offline",
      "lastSeen": "2024-11-14T14:00:00Z",
      "joinedAt": "2024-02-01T09:00:00Z"
    }
  ]
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | User ID |
| email | string | User email |
| nom | string | Last name |
| prenom | string | First name |
| role | string | Role in organization (ADMIN, MANAGER, CONSULTANT, MEMBER) |
| avatarUrl | string | Profile picture URL |
| phone | string | Phone number |
| status | string | Online status (online, offline, away) |
| lastSeen | ISO 8601 | Last activity timestamp |
| joinedAt | ISO 8601 | When user joined organization |

### Example

```typescript
// Fetch organization members
async function fetchMembers(orgId: string) {
  const response = await fetch(`/api/organizations/${orgId}/members`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch members')
  }

  const { data } = await response.json()
  return data
}

// Usage
const members = await fetchMembers('550e8400-e29b-41d4-a716-446655440000')
console.log(`Organization has ${members.length} members`)
```

---

## POST /api/organizations/[orgId]/members

Add a member to the organization.

### Request

**URL Parameters:**
- `orgId` (uuid) - Organization ID

**Headers:**
```
Cookie: sb-access-token=<session-token>
Content-Type: application/json
```

**Body:**
```json
{
  "userId": "user-uuid",
  "role": "CONSULTANT"
}
```

### Authorization

User must have **ADMIN or OWNER role** in the organization.

### Request Fields

| Field | Type | Required | Description | Allowed Values |
|-------|------|----------|-------------|----------------|
| userId | uuid | Yes | User ID to add | Must be existing user |
| role | string | No | Role to assign | ADMIN, MANAGER, CONSULTANT, MEMBER (default: MEMBER) |

### Response (201 Created)

```json
{
  "data": {
    "userId": "user-uuid",
    "organizationId": "550e8400-e29b-41d4-a716-446655440000",
    "role": "CONSULTANT",
    "joinedAt": "2024-11-14T17:00:00Z"
  }
}
```

### Error Responses

**400 Bad Request**
```json
{
  "error": "User is already a member"
}
```

**401 Unauthorized**
```json
{
  "error": "Not authenticated"
}
```

**403 Forbidden**
```json
{
  "error": "Insufficient permissions"
}
```

**404 Not Found**
```json
{
  "error": "User not found"
}
```

### Side Effects

1. **User added** to `user_organizations`
2. **Notification sent** to added user
3. **Activity logged** (MEMBER_ADDED action)

### Example

```typescript
// Add member to organization
async function addMember(orgId: string, userId: string, role: string = 'MEMBER') {
  const response = await fetch(`/api/organizations/${orgId}/members`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, role }),
  })

  if (!response.ok) {
    const { error } = await response.json()
    throw new Error(error)
  }

  const { data } = await response.json()
  return data
}

// Usage
await addMember('550e8400-e29b-41d4-a716-446655440000', 'user-uuid', 'CONSULTANT')
```

---

## Common Patterns

### Error Handling

```typescript
async function apiCall() {
  try {
    const response = await fetch('/api/organizations', {
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

### With Loading & Error States

```typescript
function OrganizationList() {
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/organizations', { credentials: 'include' })
      .then(res => res.json())
      .then(({ data }) => {
        setOrganizations(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <ul>
      {organizations.map(org => (
        <li key={org.id}>{org.name}</li>
      ))}
    </ul>
  )
}
```

### With Server Actions (Next.js)

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createOrganization(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const description = formData.get('description') as string

  const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/organizations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, description }),
  })

  if (!response.ok) {
    const { error } = await response.json()
    return { error }
  }

  revalidatePath('/organizations')
  return { success: true }
}
```

---

## Rate Limit Headers

Responses include rate limit information in headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1699977600
```

**Example handling:**
```typescript
const response = await fetch('/api/organizations')
const remaining = response.headers.get('X-RateLimit-Remaining')
const reset = response.headers.get('X-RateLimit-Reset')

console.log(`${remaining} requests remaining`)
console.log(`Resets at ${new Date(parseInt(reset) * 1000)}`)
```

---

## Webhooks (Planned)

Future support for webhooks on organization events:

**Events:**
- `organization.created`
- `organization.updated`
- `organization.deleted`
- `organization.member.added`
- `organization.member.removed`

**Webhook Payload:**
```json
{
  "event": "organization.created",
  "timestamp": "2024-11-14T17:30:00Z",
  "data": {
    "organizationId": "uuid",
    "name": "New Organization",
    "slug": "new-org"
  }
}
```

---

**See Also:**
- [Authentication API](./01-authentication.md)
- [Projects API](./03-projects.md)
- [Multi-Tenancy](../core-concepts/02-multi-tenancy.md)
- [Database Schema](../core-concepts/03-database-schema.md)
