/**
 * Project Server Actions
 *
 * @fileoverview Server-side actions for project management including creation,
 * updates, and deletion. These functions run exclusively on the server.
 *
 * @module app/projects/actions
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  createProjectSchema,
  updateProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
} from '@/lib/validations/project'

/**
 * Server action for project creation
 *
 * Creates a new project in the database with proper validation and
 * organization context.
 *
 * @param data - Project creation information
 * @returns Object containing error message if creation fails, or success with project ID
 *
 * @example
 * ```typescript
 * const result = await createProject({
 *   nom: 'AI Command Center',
 *   description: 'ESN management platform',
 *   client_id: '2ae5048c-8b31-4628-aa2c-99275c66f58a',
 *   date_debut: '2025-01-15',
 *   statut: 'ACTIF'
 * })
 * ```
 */
export async function createProject(data: CreateProjectInput) {
  // Validate and sanitize input using Zod schema
  const validation = createProjectSchema.safeParse(data)

  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors
    const firstError = Object.values(errors)[0]?.[0]
    return { error: firstError || 'Invalid input data' }
  }

  const validatedData = validation.data

  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Get user's organization
    const { data: userOrg, error: orgError } = await supabase
      .from('user_organizations')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single()

    if (orgError || !userOrg) {
      return { error: 'No organization found for user' }
    }

    // Check permissions - only ADMIN and MANAGER can create projects
    if (userOrg.role !== 'ADMIN' && userOrg.role !== 'MANAGER') {
      return { error: 'Insufficient permissions to create projects' }
    }

    // Verify client exists and belongs to the same organization
    const { data: client, error: clientError } = await supabase
      .from('client')
      .select('id, organization_id')
      .eq('id', validatedData.client_id)
      .single()

    if (clientError || !client) {
      return { error: 'Client not found' }
    }

    if (client.organization_id !== userOrg.organization_id) {
      return { error: 'Client does not belong to your organization' }
    }

    // If chef_projet_id is provided, verify it's a valid user in the organization
    if (validatedData.chef_projet_id) {
      const { data: manager, error: managerError } = await supabase
        .from('user_organizations')
        .select('user_id, role')
        .eq('user_id', validatedData.chef_projet_id)
        .eq('organization_id', userOrg.organization_id)
        .single()

      if (managerError || !manager) {
        return { error: 'Project manager not found in organization' }
      }

      // Verify project manager has appropriate role
      if (
        manager.role !== 'ADMIN' &&
        manager.role !== 'MANAGER' &&
        manager.role !== 'CONSULTANT'
      ) {
        return { error: 'Selected user cannot be a project manager' }
      }
    }

    // Create the project
    const { data: project, error: createError } = await supabase
      .from('projet')
      .insert({
        nom: validatedData.nom,
        description: validatedData.description,
        client_id: validatedData.client_id,
        chef_projet_id: validatedData.chef_projet_id,
        date_debut: validatedData.date_debut,
        date_fin_prevue: validatedData.date_fin_prevue,
        statut: validatedData.statut,
        organization_id: userOrg.organization_id,
      })
      .select('id, nom')
      .single()

    if (createError) {
      console.error('Project creation error:', createError)
      return { error: 'Failed to create project. Please try again.' }
    }

    // Log the activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'PROJECT_CREATED',
      description: `Created project: ${project.nom}`,
      resource_type: 'projet',
      resource_id: project.id,
      organization_id: userOrg.organization_id,
      metadata: {
        project_name: project.nom,
        client_id: validatedData.client_id,
        statut: validatedData.statut,
      },
    })

    // Revalidate the projects list page
    revalidatePath('/app/projects')

    return { success: true, projectId: project.id }
  } catch (error) {
    console.error('Unexpected error during project creation:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Server action for project updates
 *
 * Updates an existing project with validated data.
 *
 * @param projectId - UUID of the project to update
 * @param data - Partial project data to update
 * @returns Object containing error message if update fails
 */
export async function updateProject(projectId: string, data: UpdateProjectInput) {
  const validation = updateProjectSchema.safeParse(data)

  if (!validation.success) {
    const errors = validation.error.flatten().fieldErrors
    const firstError = Object.values(errors)[0]?.[0]
    return { error: firstError || 'Invalid input data' }
  }

  const validatedData = validation.data

  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Get user's organization
    const { data: userOrg, error: orgError } = await supabase
      .from('user_organizations')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single()

    if (orgError || !userOrg) {
      return { error: 'No organization found for user' }
    }

    // Verify project exists and belongs to organization
    const { data: existingProject, error: projectError } = await supabase
      .from('projet')
      .select('id, nom, organization_id')
      .eq('id', projectId)
      .single()

    if (projectError || !existingProject) {
      return { error: 'Project not found' }
    }

    if (existingProject.organization_id !== userOrg.organization_id) {
      return { error: 'Project does not belong to your organization' }
    }

    // Update the project
    const { data: updatedProject, error: updateError } = await supabase
      .from('projet')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .select('nom')
      .single()

    if (updateError) {
      console.error('Project update error:', updateError)
      return { error: 'Failed to update project. Please try again.' }
    }

    // Log the activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'PROJECT_UPDATED',
      description: `Updated project: ${updatedProject.nom}`,
      resource_type: 'projet',
      resource_id: projectId,
      organization_id: userOrg.organization_id,
    })

    revalidatePath('/app/projects')
    revalidatePath(`/app/projects/${projectId}`)

    return { success: true }
  } catch (error) {
    console.error('Unexpected error during project update:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}
