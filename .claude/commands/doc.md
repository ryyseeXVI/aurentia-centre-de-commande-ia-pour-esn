## 📚 **`/doc`** — Generate Comprehensive Documentation

Generate or update documentation for features, APIs, components, database schemas, or development patterns in the `docs/` directory following the repository's documentation structure.

### Your Task

When the user requests documentation:

1. **Determine Documentation Type**:
   - **Feature**: Complete feature documentation (user guide + architecture)
   - **API Endpoint**: API reference with request/response examples
   - **Component**: UI component documentation with props and usage
   - **Hook**: Custom React hook documentation
   - **Database Schema**: Table structure, relationships, and RLS policies
   - **Development Pattern**: Code patterns and best practices
   - **Service**: Business logic layer documentation

2. **Locate in docs/ Structure**:
   ```
   docs/
   ├── getting-started/       # Installation, setup, first run
   ├── architecture/          # System overview, tech stack
   ├── core-concepts/         # Auth, multi-tenancy, database, API conventions
   ├── features/             # Feature-specific documentation
   ├── api-reference/        # API endpoint documentation
   ├── development/          # Dev workflow, patterns, components
   └── deployment/           # Production checklist, monitoring
   ```

3. **Gather Complete Information**:
   - Read relevant source code thoroughly
   - Understand data flow and dependencies
   - Identify all props/parameters/configurations
   - Note error handling and edge cases
   - Check existing related documentation
   - Identify security considerations
   - Note performance considerations

4. **Feature Documentation** (docs/features/[feature-name].md):

   ```markdown
   # Feature Name

   Brief description of what this feature does and why it exists.

   ## Overview

   Detailed explanation of the feature's purpose and capabilities.

   ## User Guide

   ### How to Use

   Step-by-step instructions for end users:
   1. First step
   2. Second step
   3. Third step

   ### Key Features

   - Feature 1: Description
   - Feature 2: Description
   - Feature 3: Description

   ## Architecture

   ### Data Model

   **Tables Used:**
   - `table_name` - Purpose and key columns
   - `related_table` - Purpose and relationships

   **Relationships:**
   - Describe foreign key relationships
   - Note cascading deletes

   ### Components

   - `ComponentName` - Location and purpose
   - `AnotherComponent` - Location and purpose

   ### API Endpoints

   - `GET /api/resource` - Description
   - `POST /api/resource` - Description
   - See [API Reference](../api-reference/resource.md) for details

   ### State Management

   - Context: `ContextNameProvider` (location)
   - Local state: Where component state is managed
   - Server state: React Query hooks used

   ## Multi-Tenancy

   How this feature handles organization-based isolation:
   - organization_id filtering in queries
   - RLS policies enforced
   - Role-based access control (OWNER/ADMIN/MEMBER)

   ## Security

   - Authentication requirements
   - Authorization checks
   - Data validation
   - Rate limiting

   ## Performance Considerations

   - Caching strategy
   - Pagination approach
   - Optimization techniques used

   ## Development

   ### File Structure

   ```
   components/[feature]/
   ├── feature-component.tsx
   ├── feature-list.tsx
   └── feature-form.tsx

   app/api/[feature]/
   ├── route.ts
   └── [id]/route.ts

   types/feature.ts
   ```

   ### Adding New [Feature Item]

   Code examples for common development tasks

   ### Testing

   How to test this feature

   ## Troubleshooting

   Common issues and solutions

   ## Related Documentation

   - [Related Feature](./related-feature.md)
   - [API Reference](../api-reference/feature.md)
   ```

5. **API Endpoint Documentation** (docs/api-reference/[resource].md):

   ```markdown
   # Resource API

   API endpoints for managing [resource].

   ## Endpoints

   ### GET /api/resource

   Retrieve all resources for the current organization.

   **Authentication:** Required

   **Rate Limiting:** 100 requests/minute per user

   **Query Parameters:**

   | Parameter | Type | Required | Description |
   |-----------|------|----------|-------------|
   | page | number | No | Page number (default: 1) |
   | limit | number | No | Items per page (default: 20, max: 100) |
   | status | string | No | Filter by status |

   **Response (200 OK):**

   ```json
   {
     "data": [
       {
         "id": "uuid",
         "organizationId": "uuid",
         "name": "Example",
         "status": "active",
         "createdAt": "2024-01-01T00:00:00Z",
         "updatedAt": "2024-01-01T00:00:00Z"
       }
     ],
     "pagination": {
       "page": 1,
       "limit": 20,
       "total": 100,
       "totalPages": 5
     }
   }
   ```

   **Note:** Response is in camelCase (transformed from snake_case database columns).

   **Error Responses:**

   - `401 Unauthorized` - Not authenticated
   - `403 Forbidden` - Not a member of the organization
   - `429 Too Many Requests` - Rate limit exceeded
   - `500 Internal Server Error` - Server error

   **Example Request:**

   ```typescript
   const response = await fetch('/api/resource?status=active', {
     headers: {
       'Content-Type': 'application/json',
     },
   })
   const data = await response.json()
   ```

   ### POST /api/resource

   Create a new resource.

   **Authentication:** Required

   **Rate Limiting:** 20 requests/minute per user

   **Authorization:** ADMIN or OWNER role required

   **Request Body:**

   ```json
   {
     "name": "string",
     "description": "string",
     "status": "active" | "inactive"
   }
   ```

   **Validation:**

   - `name`: Required, 1-100 characters
   - `description`: Optional, max 500 characters
   - `status`: Optional, defaults to "active"

   **Response (201 Created):**

   ```json
   {
     "data": {
       "id": "uuid",
       "organizationId": "uuid",
       "name": "Example",
       "description": "Description",
       "status": "active",
       "createdAt": "2024-01-01T00:00:00Z",
       "updatedAt": "2024-01-01T00:00:00Z"
     }
   }
   ```

   **Error Responses:**

   - `400 Bad Request` - Validation error
   - `401 Unauthorized` - Not authenticated
   - `403 Forbidden` - Insufficient permissions
   - `429 Too Many Requests` - Rate limit exceeded
   - `500 Internal Server Error` - Server error

   **Example Request:**

   ```typescript
   const response = await fetch('/api/resource', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       name: 'New Resource',
       description: 'Description',
       status: 'active',
     }),
   })
   const data = await response.json()
   ```

   ## Implementation Notes

   - All endpoints filter by `organization_id` (multi-tenancy)
   - Rate limiting bypassed in development mode
   - Activity logged for all mutations
   - Database uses snake_case, API returns camelCase
   - RLS policies enforced at database level

   ## Related Documentation

   - [Feature Guide](../features/resource.md)
   - [Database Schema](../core-concepts/03-database-schema.md#resource-table)
   ```

6. **Component Documentation** (docs/development/components/[component-name].md):

   ```markdown
   # ComponentName

   Brief description of component purpose.

   ## Import

   ```typescript
   import { ComponentName } from '@/components/ui/component-name'
   ```

   ## Usage

   ### Basic Example

   ```tsx
   <ComponentName>
     Content here
   </ComponentName>
   ```

   ### With Variants

   ```tsx
   <ComponentName variant="secondary" size="lg">
     Content here
   </ComponentName>
   ```

   ### Advanced Usage

   ```tsx
   <ComponentName
     variant="default"
     size="default"
     disabled={false}
     loading={isLoading}
     onAction={handleAction}
   >
     Content here
   </ComponentName>
   ```

   ## Props

   | Prop | Type | Default | Description |
   |------|------|---------|-------------|
   | variant | `"default" \| "secondary" \| "destructive"` | `"default"` | Visual style variant |
   | size | `"sm" \| "default" \| "lg"` | `"default"` | Size variant |
   | disabled | `boolean` | `false` | Disables interaction |
   | loading | `boolean` | `false` | Shows loading state |
   | onAction | `() => void` | - | Callback when action occurs |

   ## Accessibility

   - Semantic HTML: Uses proper element types
   - Keyboard Navigation: Tab, Enter, Escape supported
   - ARIA Attributes: Proper labels and roles
   - Focus Management: Visible focus indicators
   - Screen Reader: Announces state changes

   ## Design System

   - **Design System:** shadcn/ui
   - **Variants:** Managed with class-variance-authority (CVA)
   - **Dark Mode:** Fully supported
   - **Responsive:** Mobile-first design

   ## Integration

   ### With Forms

   ```tsx
   <form>
     <ComponentName name="fieldName" />
   </form>
   ```

   ### With react-hook-form

   ```tsx
   const { register } = useForm()

   <ComponentName {...register('fieldName')} />
   ```

   ## Related Components

   - [RelatedComponent](./related-component.md)
   - [AnotherComponent](./another-component.md)
   ```

7. **Database Schema Documentation** (docs/core-concepts/03-database-schema.md):

   Add to existing database schema documentation:

   ```markdown
   ### table_name Table

   Stores [description of what this table stores].

   **Columns:**

   | Column | Type | Nullable | Default | Description |
   |--------|------|----------|---------|-------------|
   | id | uuid | No | gen_random_uuid() | Primary key |
   | organization_id | uuid | No | - | Organization (FK to organizations) |
   | name | varchar(100) | No | - | Name of the resource |
   | status | varchar(20) | No | 'active' | Status (active, inactive) |
   | created_at | timestamptz | No | now() | Creation timestamp |
   | updated_at | timestamptz | No | now() | Last update timestamp |

   **Indexes:**
   - PRIMARY KEY on `id`
   - INDEX on `organization_id` (for tenant isolation)
   - INDEX on `status` (frequently queried)
   - COMPOSITE INDEX on `(organization_id, status)` (common filter)

   **Foreign Keys:**
   - `organization_id` → `organizations(id)` ON DELETE CASCADE

   **RLS Policies:**
   - **SELECT:** Users can view records from their organizations
   - **INSERT:** Users can create records in their organizations
   - **UPDATE:** Users can update records in their organizations (ADMIN/OWNER only)
   - **DELETE:** Users can delete records in their organizations (OWNER only)

   **Triggers:**
   - `updated_at` automatically updated on row modification

   **Relationships:**
   - Belongs to: `organizations` (via organization_id)
   - Has many: `related_table` (via foreign key)
   ```

8. **Best Practices for Documentation**:

   - **Show, don't just tell**: Include code examples
   - **Be specific**: Use actual code, not pseudocode
   - **Cover edge cases**: Document error handling and edge cases
   - **Link liberally**: Cross-reference related documentation
   - **Keep it current**: Update when code changes
   - **Focus on WHY**: Explain reasoning, not just what code does
   - **Include diagrams**: Use ASCII art or mermaid for flows
   - **Real examples**: Use realistic data in examples
   - **Security notes**: Highlight auth, RLS, validation
   - **Multi-tenancy**: Always mention organization_id filtering

9. **Critical Patterns to Document**:

   - **snake_case ↔ camelCase**: Always mention transformation in API docs
   - **RLS Policies**: Include in database schema docs
   - **Rate Limiting**: Document limits for each endpoint
   - **organization_id**: Mention filtering in all feature docs
   - **Role-Based Access**: Document required roles
   - **Activity Logging**: Mention what actions are logged
   - **Error Handling**: Document all error responses

### Output

After generating documentation, provide:

1. **Documentation Created/Updated**:
   - File path: `docs/category/filename.md`
   - Documentation type: Feature/API/Component/Database
   - Key sections included

2. **Content Summary**:
   - What was documented
   - Code examples included
   - Diagrams or tables added
   - Cross-references created

3. **Related Documentation**:
   - List of related docs that should be reviewed
   - Suggest additional documentation needed

4. **Maintenance Notes**:
   - When this documentation should be updated
   - What triggers should prompt updates
   - Related code files to keep in sync

### Related Commands

- After creating feature: Use `/feature` then `/doc` to document it
- After creating API: Use `/api` then `/doc` to add to API reference
- After database changes: Use `/db` then `/doc` to update schema docs
- Before deploying: Use `/doc` to ensure everything is documented
- For code review: Use `/review` to check if documentation exists

### Documentation Checklist

- [ ] Clear description of purpose
- [ ] Code examples that work (tested)
- [ ] All parameters/props documented
- [ ] Error cases covered
- [ ] Security considerations noted
- [ ] Multi-tenancy approach explained
- [ ] Cross-references to related docs
- [ ] Diagrams for complex flows
- [ ] Real-world usage examples
- [ ] Troubleshooting section
- [ ] Updated table of contents (if applicable)
- [ ] Consistent formatting with existing docs
- [ ] No outdated information removed
