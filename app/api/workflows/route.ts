import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  authenticateUser,
  successResponse,
  errorResponse,
  unauthorizedResponse
} from '@/lib/api-helpers'
import {
  WorkflowDocumentationCreateSchema,
  WorkflowDocumentationUpdateSchema,
  WorkflowFilterSchema
} from '@/lib/validations/workflow-documentation'

// ============================================================================
// GET /api/workflows
// List all workflows for the user's organization
// ============================================================================

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { user, error: authError } = await authenticateUser(supabase)

  if (authError || !user) return unauthorizedResponse()

  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const phase = searchParams.get('phase')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')

    // Validate filters
    const filterValidation = WorkflowFilterSchema.safeParse({
      status,
      phase,
      priority,
      search
    })

    if (!filterValidation.success) {
      return errorResponse('Invalid filter parameters', 400)
    }

    // Get user's organization
    const { data: userOrg, error: orgError } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (orgError || !userOrg) {
      return errorResponse('Organization not found', 404)
    }

    const orgId = (userOrg as unknown as { organization_id: string }).organization_id

    // Build query
    let query = supabase
      .from('workflow_documentation')
      .select('*')
      .eq('organization_id', orgId)

    // Apply filters
    if (status) query = query.eq('status', status)
    if (phase) query = query.eq('phase', phase)
    if (priority) query = query.eq('priority', priority)
    if (search) {
      query = query.or(
        `workflow_name.ilike.%${search}%,workflow_code.ilike.%${search}%,objective.ilike.%${search}%`
      )
    }

    // Execute query
    const { data: workflows, error } = await query.order('workflow_code', {
      ascending: true
    })

    if (error) {
      console.error('[API] Error fetching workflows:', error)
      return errorResponse('Failed to fetch workflows', 500)
    }

    return successResponse(workflows)
  } catch (error) {
    console.error('[API] Unexpected error in GET /api/workflows:', error)
    return errorResponse('Internal server error', 500)
  }
}

// ============================================================================
// POST /api/workflows
// Create a new workflow
// ============================================================================

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { user, error: authError } = await authenticateUser(supabase)

  if (authError || !user) return unauthorizedResponse()

  try {
    // Get user's organization and check role
    const { data: userOrg, error: orgError } = await supabase
      .from('user_organizations')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single()

    if (orgError || !userOrg) {
      return errorResponse('Organization not found', 404)
    }

    const typedUserOrg = userOrg as unknown as { organization_id: string; role: string }

    // Check if user has permission (ADMIN or MANAGER)
    if (!['ADMIN', 'MANAGER'].includes(typedUserOrg.role)) {
      return errorResponse('Insufficient permissions', 403)
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = WorkflowDocumentationCreateSchema.safeParse(body)

    if (!validation.success) {
      return errorResponse(
        'Validation error: ' + JSON.stringify(validation.error.flatten().fieldErrors),
        400
      )
    }

    const validatedData = validation.data

    // Check if workflow code already exists for this organization
    const { data: existing } = await supabase
      .from('workflow_documentation')
      .select('id')
      .eq('organization_id', typedUserOrg.organization_id)
      .eq('workflow_code', validatedData.workflow_code)
      .single()

    if (existing) {
      return errorResponse(
        'Workflow code already exists for this organization',
        409
      )
    }

    // Create workflow
    const { data: workflow, error } = await supabase
      .from('workflow_documentation')
      .insert({
        ...validatedData,
        organization_id: typedUserOrg.organization_id,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('[API] Error creating workflow:', error)
      return errorResponse('Failed to create workflow', 500)
    }

    return successResponse(workflow, 201)
  } catch (error) {
    console.error('[API] Unexpected error in POST /api/workflows:', error)
    return errorResponse('Internal server error', 500)
  }
}
