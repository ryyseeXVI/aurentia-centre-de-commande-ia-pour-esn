import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  authenticateUser,
  successResponse,
  errorResponse,
  unauthorizedResponse
} from '@/lib/api-helpers'
import { WorkflowDocumentationUpdateSchema } from '@/lib/validations/workflow-documentation'

// ============================================================================
// GET /api/workflows/[workflowId]
// Get a specific workflow with all relations
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  const supabase = await createClient()
  const { user, error: authError } = await authenticateUser(supabase)

  if (authError || !user) return unauthorizedResponse()

  try {
    const { workflowId } = await params

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

    // Fetch workflow with all relations in parallel
    const [
      { data: workflow, error: workflowError },
      { data: stickyNotes, error: notesError },
      { data: dataFlows, error: flowsError },
      { data: dependencies, error: depsError },
      { data: steps, error: stepsError }
    ] = await Promise.all([
      supabase
        .from('workflow_documentation')
        .select('*')
        .eq('id', workflowId)
        .eq('organization_id', orgId)
        .single(),
      supabase
        .from('workflow_sticky_note')
        .select('*')
        .eq('workflow_id', workflowId)
        .eq('is_archived', false)
        .order('display_order', { ascending: true }),
      supabase
        .from('workflow_data_flow')
        .select('*')
        .eq('workflow_id', workflowId),
      supabase
        .from('workflow_dependency')
        .select('*, depends_on:workflow_documentation!depends_on_workflow_id(workflow_code, workflow_name)')
        .eq('workflow_id', workflowId),
      supabase
        .from('workflow_step')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('step_number', { ascending: true })
    ])

    if (workflowError || !workflow) {
      if (workflowError?.code === 'PGRST116') {
        return errorResponse('Workflow not found', 404)
      }
      console.error('[API] Error fetching workflow:', workflowError)
      return errorResponse('Failed to fetch workflow', 500)
    }

    // Combine all data
    const workflowWithRelations = {
      ...(workflow as unknown as Record<string, unknown>),
      sticky_notes: stickyNotes || [],
      data_flows: dataFlows || [],
      dependencies: dependencies || [],
      steps: steps || []
    }

    return successResponse(workflowWithRelations)
  } catch (error) {
    console.error('[API] Unexpected error in GET /api/workflows/[workflowId]:', error)
    return errorResponse('Internal server error', 500)
  }
}

// ============================================================================
// PUT /api/workflows/[workflowId]
// Update a workflow
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  const supabase = await createClient()
  const { user, error: authError } = await authenticateUser(supabase)

  if (authError || !user) return unauthorizedResponse()

  try {
    const { workflowId } = await params

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

    // Check if user has permission
    if (!['ADMIN', 'MANAGER'].includes(typedUserOrg.role)) {
      return errorResponse('Insufficient permissions', 403)
    }

    // Verify workflow belongs to user's organization
    const { data: existing, error: existError } = await supabase
      .from('workflow_documentation')
      .select('id')
      .eq('id', workflowId)
      .eq('organization_id', typedUserOrg.organization_id)
      .single()

    if (existError || !existing) {
      return errorResponse('Workflow not found', 404)
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = WorkflowDocumentationUpdateSchema.safeParse(body)

    if (!validation.success) {
      return errorResponse(
        'Validation error: ' + JSON.stringify(validation.error.flatten().fieldErrors),
        400
      )
    }

    const validatedData = validation.data

    // Update workflow
    const { data: workflow, error } = await supabase
      .from('workflow_documentation')
      .update({
        ...validatedData,
        updated_by: user.id
      })
      .eq('id', workflowId)
      .select()
      .single()

    if (error) {
      console.error('[API] Error updating workflow:', error)
      return errorResponse('Failed to update workflow', 500)
    }

    return successResponse(workflow)
  } catch (error) {
    console.error('[API] Unexpected error in PUT /api/workflows/[workflowId]:', error)
    return errorResponse('Internal server error', 500)
  }
}

// ============================================================================
// DELETE /api/workflows/[workflowId]
// Delete a workflow (and all related data via CASCADE)
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  const supabase = await createClient()
  const { user, error: authError } = await authenticateUser(supabase)

  if (authError || !user) return unauthorizedResponse()

  try {
    const { workflowId } = await params

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

    // Check if user has permission (ADMIN only)
    if (typedUserOrg.role !== 'ADMIN') {
      return errorResponse('Only administrators can delete workflows', 403)
    }

    // Verify workflow belongs to user's organization
    const { data: existing, error: existError } = await supabase
      .from('workflow_documentation')
      .select('id, workflow_code, workflow_name')
      .eq('id', workflowId)
      .eq('organization_id', typedUserOrg.organization_id)
      .single()

    if (existError || !existing) {
      return errorResponse('Workflow not found', 404)
    }

    const typedExisting = existing as unknown as { id: string; workflow_code: string; workflow_name: string }

    // Delete workflow (CASCADE will delete related records)
    const { error } = await supabase
      .from('workflow_documentation')
      .delete()
      .eq('id', workflowId)

    if (error) {
      console.error('[API] Error deleting workflow:', error)
      return errorResponse('Failed to delete workflow', 500)
    }

    return successResponse({
      message: `Workflow ${typedExisting.workflow_code} deleted successfully`
    })
  } catch (error) {
    console.error('[API] Unexpected error in DELETE /api/workflows/[workflowId]:', error)
    return errorResponse('Internal server error', 500)
  }
}
