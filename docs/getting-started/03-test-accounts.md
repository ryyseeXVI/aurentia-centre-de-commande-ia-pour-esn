# Test Accounts

## Overview

For development and testing purposes, Aurentia AI Command Center provides pre-configured test accounts with different roles. These accounts allow you to test the full functionality of the platform across different permission levels.

## Available Test Accounts

### 🔑 Owner Account (Super Admin)

**Purpose:** Full unrestricted access across all organizations

```
Email:    elliot.estrade@gmail.com
Password: elliot12345
Role:     OWNER
```

**Capabilities:**
- ✅ Access ALL organizations (unrestricted)
- ✅ Create, read, update, delete ANY resource
- ✅ Manage users in any organization
- ✅ Access admin backoffice
- ✅ View all analytics and reports
- ✅ Modify organization settings
- ✅ Manage invitations and join codes
- ✅ Access all projects, tasks, and consultants
- ✅ No permission restrictions

**Use Cases:**
- System administration
- Cross-organization operations
- Platform-wide monitoring
- User management across organizations
- Testing highest-level permissions

---

### 👤 Admin Account

**Purpose:** Full access within a specific organization

```
Email:    bousquet.matthieu0@gmail.com
Password: matt13005
Role:     ADMIN
```

**Capabilities:**
- ✅ Full access WITHIN their organization(s)
- ✅ Create, read, update, delete organization resources
- ✅ Manage users in their organization
- ✅ Access admin backoffice (organization-scoped)
- ✅ View analytics for their organization
- ✅ Modify organization settings
- ✅ Manage invitations and join codes
- ✅ Access all projects, tasks, consultants in their org
- ❌ Cannot access other organizations (unless also a member)

**Use Cases:**
- Organization management
- Team administration
- Project oversight
- User permission management
- Testing organization-level permissions

---

## Role Hierarchy

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  OWNER (Highest Authority)                       │
│  └─> Unrestricted access to ALL organizations   │
│                                                  │
│  ADMIN                                           │
│  └─> Full access WITHIN their organization(s)   │
│                                                  │
│  MANAGER                                         │
│  └─> Can manage projects and consultants        │
│      └─> Cannot change organization settings    │
│                                                  │
│  CONSULTANT                                      │
│  └─> Standard user access                       │
│      └─> Can view and update assigned tasks     │
│                                                  │
│  CLIENT (Lowest)                                 │
│  └─> Read-only external user                    │
│      └─> Limited to project visibility          │
│                                                  │
└──────────────────────────────────────────────────┘
```

## Permission Matrix

| Action | OWNER | ADMIN | MANAGER | CONSULTANT | CLIENT |
|--------|-------|-------|---------|------------|--------|
| **Organizations** |
| View all organizations | ✅ | ❌ | ❌ | ❌ | ❌ |
| View own organizations | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create organization | ✅ | ✅ | ❌ | ❌ | ❌ |
| Update organization | ✅ | ✅ (own) | ❌ | ❌ | ❌ |
| Delete organization | ✅ | ✅ (own) | ❌ | ❌ | ❌ |
| **Users & Members** |
| View users (org) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Add members | ✅ | ✅ | ❌ | ❌ | ❌ |
| Remove members | ✅ | ✅ | ❌ | ❌ | ❌ |
| Change roles | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Projects** |
| View projects (org) | ✅ | ✅ | ✅ | ✅ | ✅ (assigned) |
| Create project | ✅ | ✅ | ✅ | ❌ | ❌ |
| Update project | ✅ | ✅ | ✅ (managed) | ❌ | ❌ |
| Delete project | ✅ | ✅ | ✅ (managed) | ❌ | ❌ |
| **Tasks** |
| View tasks (project) | ✅ | ✅ | ✅ | ✅ (assigned) | ✅ (assigned) |
| Create task | ✅ | ✅ | ✅ | ✅ | ❌ |
| Update task | ✅ | ✅ | ✅ | ✅ (assigned) | ❌ |
| Delete task | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Consultants** |
| View consultants (org) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Create consultant | ✅ | ✅ | ✅ | ❌ | ❌ |
| Update consultant | ✅ | ✅ | ✅ (managed) | ❌ | ❌ |
| Delete consultant | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Analytics** |
| View analytics (org) | ✅ | ✅ | ✅ | ✅ | ❌ |
| View financial data | ✅ | ✅ | ✅ | ❌ | ❌ |
| Export reports | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Admin Backoffice** |
| Access admin panel | ✅ | ✅ | ❌ | ❌ | ❌ |
| View activity logs | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage notifications | ✅ | ✅ | ❌ | ❌ | ❌ |

## Testing Scenarios

### Scenario 1: Organization Administration (Use ADMIN account)

**Goal:** Test organization management features

**Steps:**
1. Log in as `bousquet.matthieu0@gmail.com`
2. Navigate to Organizations page
3. Create a new organization
4. Add members to the organization
5. Create projects within the organization
6. Verify you can only see your organization's data

**Expected Results:**
- ✅ Can create and manage organization
- ✅ Can add/remove members
- ✅ Can create projects and tasks
- ❌ Cannot see other organizations' data

---

### Scenario 2: Cross-Organization Access (Use OWNER account)

**Goal:** Test super-admin capabilities

**Steps:**
1. Log in as `elliot.estrade@gmail.com`
2. Navigate to Admin → Organizations
3. View all organizations in the system
4. Access projects from different organizations
5. Manage users across organizations

**Expected Results:**
- ✅ Can see ALL organizations
- ✅ Can access any project
- ✅ Can manage any user
- ✅ No restrictions on data access

---

### Scenario 3: Project Management (Use MANAGER role)

**Goal:** Test project manager permissions

**Steps:**
1. Create a test user with MANAGER role
2. Log in as the manager
3. Create a project
4. Assign consultants to the project
5. Create and assign tasks
6. Try to modify organization settings (should fail)

**Expected Results:**
- ✅ Can create and manage projects
- ✅ Can assign consultants and create tasks
- ❌ Cannot modify organization settings
- ❌ Cannot add/remove organization members

---

### Scenario 4: Task Assignment (Use CONSULTANT role)

**Goal:** Test consultant permissions

**Steps:**
1. Create a test user with CONSULTANT role
2. Assign a task to this consultant
3. Log in as the consultant
4. View assigned tasks
5. Update task status
6. Try to delete the task (should fail)

**Expected Results:**
- ✅ Can view assigned tasks
- ✅ Can update task status and details
- ❌ Cannot delete tasks
- ❌ Cannot create projects

---

## Creating Additional Test Users

### Via UI (Admin/Owner only)

1. Navigate to **Admin → Users**
2. Click **"Add User"**
3. Fill in user details:
   - Email
   - Name
   - Role (CONSULTANT, MANAGER, ADMIN, OWNER)
4. Click **"Create User"**
5. User receives invitation email

### Via API

```bash
# Using the authentication API
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "nom": "Doe",
    "prenom": "John",
    "role": "CONSULTANT"
  }'
```

### Via Supabase Dashboard

1. Go to Supabase Dashboard → Authentication → Users
2. Click **"Add User"**
3. Enter email and password
4. User created in `auth.users`
5. Profile automatically created via trigger

## Password Reset

### For Test Accounts

If you forget the password for test accounts:

**Option 1: Use Supabase Dashboard**
1. Go to Supabase → Authentication → Users
2. Find the user
3. Click **"Send Password Reset Email"**

**Option 2: Use Forgot Password UI**
1. Navigate to login page
2. Click **"Forgot Password?"**
3. Enter email
4. Follow reset link in email

**Option 3: Update Directly (Dev Only)**
```sql
-- Update password via Supabase SQL Editor
-- WARNING: Only for development!
UPDATE auth.users
SET encrypted_password = crypt('newpassword123', gen_salt('bf'))
WHERE email = 'test@example.com';
```

## Best Practices for Testing

### 1. Use Appropriate Account for Task

| Testing Goal | Use Account |
|--------------|-------------|
| Organization management | ADMIN |
| Cross-org operations | OWNER |
| Project management | MANAGER |
| Task work | CONSULTANT |
| External client view | CLIENT |

### 2. Test Permission Boundaries

**Always test:**
- ✅ What the role CAN do
- ❌ What the role CANNOT do

**Example:**
```typescript
// Test that CONSULTANT cannot delete tasks
it('should prevent consultant from deleting tasks', async () => {
  // Login as consultant
  await loginAs('consultant@example.com')

  // Attempt to delete task
  const response = await fetch('/api/tasks/123', { method: 'DELETE' })

  // Should be forbidden
  expect(response.status).toBe(403)
})
```

### 3. Test Organization Isolation

**Verify:**
- Users only see data from their organizations
- Cross-organization data leaks prevented
- Proper filtering by `organization_id`

### 4. Test Multi-Tenancy

**Scenarios:**
1. User in multiple organizations
2. Switching between organizations
3. Default organization selection
4. Organization-specific permissions

## Security Considerations

### ⚠️ Production Warning

**NEVER use test accounts in production!**

- Test accounts have known passwords
- Test data should be separate from production
- Use environment-specific databases
- Implement proper password policies

### Password Requirements

**Current:** Minimum 8 characters (for development)

**Production Recommendations:**
- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Password complexity validation
- Password expiration policy (90 days)
- Two-factor authentication (2FA)

### Rate Limiting

Test accounts are subject to rate limiting:
- Login attempts: 5 per 15 minutes
- API requests: 60 per minute
- Organization creation: 3 per hour

**If rate limited:**
- Wait for the limit to reset
- Check for infinite loops in your code
- Review API usage patterns

## Troubleshooting

### Cannot Log In

**Check:**
1. Correct email (case-sensitive)
2. Correct password
3. Email verified (check spam folder)
4. Account not locked (too many failed attempts)
5. Supabase project is running

**Solution:**
```bash
# Check Supabase status
npx supabase status

# Restart local Supabase (if using local)
npx supabase stop
npx supabase start
```

### Permission Denied Errors

**Check:**
1. Correct role assigned
2. User is member of the organization
3. Organization-level permissions
4. Resource-specific permissions

**Solution:**
```sql
-- Verify user role
SELECT u.email, uo.role, o.name
FROM profiles u
JOIN user_organizations uo ON u.id = uo.user_id
JOIN organizations o ON uo.organization_id = o.id
WHERE u.email = 'test@example.com';
```

### Data Not Visible

**Check:**
1. Logged in as correct user
2. Selected correct organization
3. Data actually exists in database
4. Organization_id matches user's organization

**Solution:**
```sql
-- Verify data and organization association
SELECT * FROM projet
WHERE organization_id IN (
  SELECT organization_id FROM user_organizations
  WHERE user_id = (SELECT id FROM profiles WHERE email = 'test@example.com')
);
```

## Creating Your Own Test Data

### Sample Data Script

```typescript
// scripts/seed-test-data.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role for admin access
)

async function seedTestData() {
  // Create test organization
  const { data: org } = await supabase
    .from('organizations')
    .insert({
      name: 'Test Organization',
      slug: 'test-org',
      description: 'For testing purposes'
    })
    .select()
    .single()

  // Create test client
  const { data: client } = await supabase
    .from('client')
    .insert({
      organization_id: org.id,
      nom: 'Acme Corp',
      secteur: 'Technology'
    })
    .select()
    .single()

  // Create test project
  const { data: project } = await supabase
    .from('projet')
    .insert({
      organization_id: org.id,
      client_id: client.id,
      nom: 'Test Project',
      date_debut: new Date().toISOString(),
      statut: 'ACTIF'
    })
    .select()
    .single()

  console.log('Test data created:', { org, client, project })
}

seedTestData()
```

**Run:**
```bash
npx ts-node scripts/seed-test-data.ts
```

---

**See Also:**
- [Installation Guide](./01-installation.md)
- [Setup & Configuration](./02-setup.md)
- [Authentication](../core-concepts/01-authentication.md)
- [Multi-Tenancy](../core-concepts/02-multi-tenancy.md)
