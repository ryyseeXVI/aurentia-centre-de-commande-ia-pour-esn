## 🔌 **`/api`** — Create API Route

Create a production-ready API endpoint following the boilerplate's 8-step standard pattern with authentication, rate limiting, validation, RLS filtering, activity logging, and **snake_case ↔ camelCase transformation**.

### Your Task

When the user requests an API route:

1. **Understand Requirements**:
   - HTTP method: GET, POST, PUT, PATCH, DELETE
   - Resource being managed
   - Required authentication and authorization
   - Multi-tenancy: Is this workspace-scoped?
   - Input validation requirements
   - Rate limiting needs

2. **Follow the 8-Step Standard Pattern**:

   This is **THE MOST IMPORTANT PATTERN** in this boilerplate. Every API route MUST follow these 8 steps:

   ```typescript
   import { NextResponse } from 'next/server'
   import { z } from 'zod'
   import { createServerSupabaseClient } from '@/utils/supabase/server'
   import { withUserRateLimit } from '@/utils/with-rate-limit'
   import { generalRateLimiter, createResourceRateLimiter } from '@/utils/rate-limit'
   import { toCamelCase } from '@/utils/task-transformers'

   // Step 4: Define Zod validation schema
   const resourceSchema = z.object({
     name: z.string().min(1).max(100),
     description: z.string().max(500).optional(),
     status: z.enum(['active', 'inactive']).default('active'),
   })

   async function handlePost(request: Request) {
     try {
       // Step 1: Create Supabase client
       const supabase = await createServerSupabaseClient()

       // Step 2: Authenticate user
       const {
         data: { user },
         error: authError,
       } = await supabase.auth.getUser()

       if (authError || !user) {
         return NextResponse.json(
           { error: 'Not authenticated' },
           { status: 401 }
         )
       }

       // Step 3: Rate limiting already handled by wrapper

       // Step 4: Validate input with Zod
       const body = await request.json()
       const validatedData = resourceSchema.parse(body)

       // Get workspaceId from URL if workspace-scoped
       const { searchParams } = new URL(request.url)
       const workspaceId = searchParams.get('workspaceId')

       if (!workspaceId) {
         return NextResponse.json(
           { error: 'Workspace ID required' },
           { status: 400 }
         )
       }

       // Verify user belongs to organization
       const { data: membership, error: membershipError } = await supabase
         .from('user_organizations')
         .select('role')
         .eq('user_id', user.id)
         .eq('organization_id', workspaceId)
         .single()

       if (membershipError || !membership) {
         return NextResponse.json(
           { error: 'Not a member of this organization' },
           { status: 403 }
         )
       }

       // Check role if needed (for privileged operations)
       if (!['OWNER', 'ADMIN'].includes(membership.role)) {
         return NextResponse.json(
           { error: 'Insufficient permissions' },
           { status: 403 }
         )
       }

       // Step 5: Query database (snake_case columns!)
       const { data, error } = await supabase
         .from('resources')
         .insert({
           organization_id: workspaceId, // snake_case!
           created_by: user.id,
           name: validatedData.name,
           description: validatedData.description,
           status: validatedData.status,
         })
         .select()
         .single()

       if (error) {
         console.error('Database error:', error)
         return NextResponse.json(
           { error: 'Failed to create resource' },
           { status: 500 }
         )
       }

       // Step 6: Log activity
       await supabase.from('activity_logs').insert({
         user_id: user.id,
         organization_id: workspaceId,
         action: 'RESOURCE_CREATED',
         description: `Created resource: ${validatedData.name}`,
         metadata: { resource_id: data.id },
       })

       // Step 7: Transform response to camelCase (CRITICAL!)
       const transformedData = toCamelCase(data)

       // Step 8: Return response
       return NextResponse.json({ data: transformedData }, { status: 201 })
     } catch (error) {
       if (error instanceof z.ZodError) {
         return NextResponse.json(
           { error: 'Validation failed', details: error.errors },
           { status: 400 }
         )
       }

       console.error('Unexpected error:', error)
       return NextResponse.json(
         { error: 'Internal server error' },
         { status: 500 }
       )
     }
   }

   // Export with rate limiting wrapper
   // Use createResourceRateLimiter for mutations, generalRateLimiter for queries
   export const POST = withUserRateLimit(
     handlePost,
     createResourceRateLimiter,
     true // requireAuth
   )
   ```

3. **GET Endpoint Pattern**:

   ```typescript
   async function handleGet(request: Request) {
     try {
       // Step 1: Create Supabase client
       const supabase = await createServerSupabaseClient()

       // Step 2: Authenticate user
       const {
         data: { user },
         error: authError,
       } = await supabase.auth.getUser()

       if (authError || !user) {
         return NextResponse.json(
           { error: 'Not authenticated' },
           { status: 401 }
         )
       }

       // Step 3: Rate limiting already handled by wrapper

       // Step 4: Parse query parameters
       const { searchParams } = new URL(request.url)
       const workspaceId = searchParams.get('workspaceId')
       const page = parseInt(searchParams.get('page') || '1')
       const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
       const status = searchParams.get('status')

       if (!workspaceId) {
         return NextResponse.json(
           { error: 'Workspace ID required' },
           { status: 400 }
         )
       }

       // Verify membership
       const { data: membership } = await supabase
         .from('user_organizations')
         .select('role')
         .eq('user_id', user.id)
         .eq('organization_id', workspaceId)
         .single()

       if (!membership) {
         return NextResponse.json(
           { error: 'Not a member of this organization' },
           { status: 403 }
         )
       }

       // Step 5: Query database (snake_case + organization_id filter!)
       let query = supabase
         .from('resources')
         .select('*', { count: 'exact' })
         .eq('organization_id', workspaceId) // CRITICAL: Always filter by org!
         .order('created_at', { ascending: false })
         .range((page - 1) * limit, page * limit - 1)

       if (status) {
         query = query.eq('status', status)
       }

       const { data, error, count } = await query

       if (error) {
         console.error('Database error:', error)
         return NextResponse.json(
           { error: 'Failed to fetch resources' },
           { status: 500 }
         )
       }

       // Step 6: No activity logging for reads (optional)

       // Step 7: Transform response to camelCase (CRITICAL!)
       const transformedData = data.map(item => toCamelCase(item))

       // Step 8: Return response with pagination
       return NextResponse.json({
         data: transformedData,
         pagination: {
           page,
           limit,
           total: count || 0,
           totalPages: Math.ceil((count || 0) / limit),
         },
       })
     } catch (error) {
       console.error('Unexpected error:', error)
       return NextResponse.json(
         { error: 'Internal server error' },
         { status: 500 }
       )
     }
   }

   export const GET = withUserRateLimit(
     handleGet,
     generalRateLimiter,
     true
   )
   ```

4. **DELETE Endpoint Pattern**:

   ```typescript
   async function handleDelete(request: Request) {
     try {
       const supabase = await createServerSupabaseClient()

       const {
         data: { user },
         error: authError,
       } = await supabase.auth.getUser()

       if (authError || !user) {
         return NextResponse.json(
           { error: 'Not authenticated' },
           { status: 401 }
         )
       }

       const { searchParams } = new URL(request.url)
       const workspaceId = searchParams.get('workspaceId')
       const resourceId = searchParams.get('id')

       if (!workspaceId || !resourceId) {
         return NextResponse.json(
           { error: 'Workspace ID and Resource ID required' },
           { status: 400 }
         )
       }

       // Verify membership and check permissions
       const { data: membership } = await supabase
         .from('user_organizations')
         .select('role')
         .eq('user_id', user.id)
         .eq('organization_id', workspaceId)
         .single()

       if (!membership) {
         return NextResponse.json(
           { error: 'Not a member of this organization' },
           { status: 403 }
         )
       }

       // Delete operations often require ADMIN or OWNER role
       if (!['OWNER', 'ADMIN'].includes(membership.role)) {
         return NextResponse.json(
           { error: 'Insufficient permissions' },
           { status: 403 }
         )
       }

       // Query database (RLS will also enforce organization_id filtering)
       const { error } = await supabase
         .from('resources')
         .delete()
         .eq('id', resourceId)
         .eq('organization_id', workspaceId)

       if (error) {
         console.error('Database error:', error)
         return NextResponse.json(
           { error: 'Failed to delete resource' },
           { status: 500 }
         )
       }

       // Log activity
       await supabase.from('activity_logs').insert({
         user_id: user.id,
         organization_id: workspaceId,
         action: 'RESOURCE_DELETED',
         description: `Deleted resource: ${resourceId}`,
         metadata: { resource_id: resourceId },
       })

       return NextResponse.json({ success: true }, { status: 200 })
     } catch (error) {
       console.error('Unexpected error:', error)
       return NextResponse.json(
         { error: 'Internal server error' },
         { status: 500 }
       )
     }
   }

   export const DELETE = withUserRateLimit(
     handleDelete,
     createResourceRateLimiter,
     true
   )
   ```

5. **File Location**:
   - Workspace-scoped: `app/api/[resource]/route.ts`
   - Resource-specific: `app/api/[resource]/[id]/route.ts`
   - Global (non-workspace): `app/api/[resource]/route.ts`

6. **Critical Patterns Checklist**:

   - [ ] Step 1: Creates Supabase client with `createServerSupabaseClient()`
   - [ ] Step 2: Authenticates user with `getUser()`, returns 401 if not authenticated
   - [ ] Step 3: Uses `withUserRateLimit()` wrapper for rate limiting
   - [ ] Step 4: Validates input with Zod schema, returns 400 on validation error
   - [ ] Step 5: Queries database with **snake_case** column names
   - [ ] Filters by `organization_id` for workspace-scoped resources
   - [ ] Checks user's organization membership
   - [ ] Checks user's role for privileged operations (OWNER/ADMIN/MEMBER)
   - [ ] Step 6: Logs important actions to `activity_logs` table
   - [ ] Step 7: **Transforms response to camelCase** with `toCamelCase()`
   - [ ] Step 8: Returns proper HTTP status codes (200, 201, 400, 401, 403, 429, 500)
   - [ ] Handles errors with try-catch
   - [ ] No exposed secrets or sensitive data
   - [ ] Uses parameterized queries (Supabase handles this)

7. **Common Zod Validation Patterns**:

   ```typescript
   // String validation
   name: z.string().min(1, 'Name is required').max(100),

   // Optional fields
   description: z.string().max(500).optional(),

   // Enums
   status: z.enum(['active', 'inactive', 'archived']),

   // Email
   email: z.string().email(),

   // URL
   url: z.string().url(),

   // Number
   quantity: z.number().int().min(1).max(100),

   // Boolean
   isActive: z.boolean(),

   // Date
   dueDate: z.string().datetime(),

   // Array
   tags: z.array(z.string()).max(10),

   // Nested object
   metadata: z.object({
     key: z.string(),
     value: z.string(),
   }),

   // Transform
   priority: z.string().transform(val => parseInt(val)),

   // Default value
   status: z.enum(['active', 'inactive']).default('active'),
   ```

8. **Rate Limiting Strategy**:

   ```typescript
   // General queries (GET) - 100 requests/minute
   export const GET = withUserRateLimit(handleGet, generalRateLimiter, true)

   // Create/update/delete - 20 requests/minute
   export const POST = withUserRateLimit(handlePost, createResourceRateLimiter, true)
   export const PUT = withUserRateLimit(handlePut, createResourceRateLimiter, true)
   export const DELETE = withUserRateLimit(handleDelete, createResourceRateLimiter, true)

   // Public endpoints (no auth) - Use public rate limiter
   import { publicRateLimiter } from '@/utils/rate-limit'
   export const GET = withUserRateLimit(handleGet, publicRateLimiter, false)
   ```

9. **Security Checklist**:

   - [ ] No SQL injection (Supabase uses parameterized queries)
   - [ ] No XSS (validate and sanitize input)
   - [ ] No exposed secrets (use env vars)
   - [ ] Authentication required (unless public endpoint)
   - [ ] Authorization checked (membership and role)
   - [ ] Rate limiting enabled
   - [ ] Input validation with Zod
   - [ ] CSRF protection (Next.js handles this)
   - [ ] RLS policies enforced at database level

### Output

After creating the API route, provide:

1. **Route Created**:
   - File path: `app/api/[resource]/route.ts`
   - HTTP methods: GET, POST, PUT, DELETE
   - Authentication: Required/Optional
   - Rate limiting: Configured

2. **Validation Schema**:
   - Zod schema with all fields
   - Validation rules applied

3. **Multi-Tenancy**:
   - organization_id filtering: Yes/No
   - Membership verification: Yes/No
   - Role-based access: OWNER/ADMIN/MEMBER

4. **Activity Logging**:
   - Actions logged: CREATE, UPDATE, DELETE

5. **Response Format**:
   - Transformed to camelCase: ✅
   - Pagination: Yes/No
   - Error responses: Documented

6. **Testing Steps**:
   ```bash
   # Test GET
   curl http://localhost:3000/api/resource?workspaceId=uuid

   # Test POST
   curl -X POST http://localhost:3000/api/resource \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","workspaceId":"uuid"}'
   ```

7. **Documentation**:
   - Use `/doc` to add to API reference: `docs/api-reference/[resource].md`

### Related Commands

- After creating API: Use `/doc` to document in API reference
- Create complete feature: Use `/feature` instead (includes API + UI + database)
- Verify patterns: Use `/check` to verify all 8 steps followed
- Before deploying: Use `/deploy` to ensure production-ready

### Common Pitfalls

1. **Forgetting camelCase transformation** ⚠️ MOST COMMON BUG!
   - Always use `toCamelCase()` before returning data
   - Database columns are snake_case, API responses are camelCase

2. **Missing organization_id filtering**:
   - Always filter by `organization_id` for workspace-scoped resources
   - Verify user belongs to organization

3. **Missing rate limiting**:
   - Always wrap with `withUserRateLimit()`
   - Choose appropriate rate limiter

4. **Missing input validation**:
   - Always validate with Zod
   - Return 400 on validation error

5. **Not checking permissions**:
   - Verify membership for all workspace routes
   - Check role for privileged operations

6. **Missing error handling**:
   - Wrap in try-catch
   - Return user-friendly error messages
   - Log errors for debugging

7. **Exposing sensitive data**:
   - Don't return passwords or tokens
   - Don't expose internal error details to users
