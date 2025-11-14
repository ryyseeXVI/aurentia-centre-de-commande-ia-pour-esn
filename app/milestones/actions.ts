// @ts-nocheck
// @ts-nocheck
/**
 * Milestone Server Actions
 *
 * @fileoverview Server-side actions for milestone management including creation,
 * updates, deletion, dependencies, and assignments.
 *
 * @module app/milestones/actions
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  createMilestoneSchema,
  updateMilestoneSchema,
  addDependencySchema,
  assignUserSchema,
  linkTasksSchema,
} from '@/lib/validations/milestone'
import { z } from 'zod'

// Type inference from Zod schemas
type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>
type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>
type AddDependencyInput = z.infer<typeof addDependencySchema>
type AssignUserInput = z.infer<typeof assignUserSchema>
type LinkTasksInput = z.infer<typeof linkTasksSchema>

/**
 * Server action for milestone creation
 *
 * Creates a new milestone with proper validation and organization context.
 *
 * @param data - Milestone creation information
 * @returns Object containing error message if creation fails, or success with milestone ID
 */
export async function createMilestone(data: unknown) {
  try {
    const supabase = await createClient()

    // Validate input
    const validation = createMilestoneSchema.safeParse(data)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return { error: Object.values(errors)[0]?.[0] || 'Invalid milestone data' }
    }

    const validatedData = validation.data

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from('user_organizations')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', validatedData.organizationId)
      .single()

    if (!membership) {
      return { error: 'Access denied to this organization' }
    }

    // Create milestone
    const { data: milestone, error: createError } = await supabase
      .from('milestones')
      .insert({
        organization_id: validatedData.organizationId,
        name: validatedData.name,
        description: validatedData.description,
        start_date: validatedData.startDate,
        due_date: validatedData.dueDate,
        status: validatedData.status,
        priority: validatedData.priority,
        color: validatedData.color,
        progress_mode: validatedData.progressMode,
        progress_percentage: validatedData.progressPercentage,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (createError) {
      console.error('Error creating milestone:', createError)
      return { error: 'Failed to create milestone' }
    }

    // Revalidate relevant paths
    revalidatePath(`/app/organizations/${validatedData.organizationId}`)

    return { success: true, milestoneId: milestone.id }
  } catch (error) {
    console.error('Unexpected error in createMilestone:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Server action for milestone update
 *
 * Updates an existing milestone with validation
 *
 * @param milestoneId - ID of the milestone to update
 * @param data - Milestone update information
 * @returns Object containing error message if update fails
 */
export async function updateMilestone(milestoneId: string, data: unknown) {
  try {
    const supabase = await createClient()

    // Validate input
    const validation = updateMilestoneSchema.safeParse(data)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return { error: Object.values(errors)[0]?.[0] || 'Invalid milestone data' }
    }

    const validatedData = validation.data

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Get milestone and verify access
    const { data: milestone, error: milestoneError } = await supabase
      .from('milestones')
      .select('id, organization_id')
      .eq('id', milestoneId)
      .single()

    if (milestoneError || !milestone) {
      return { error: 'Milestone not found' }
    }

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from('user_organizations')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', milestone.organization_id)
      .single()

    if (!membership) {
      return { error: 'Access denied' }
    }

    // Build update object
    const updateData: Record<string, any> = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.startDate !== undefined) updateData.start_date = validatedData.startDate
    if (validatedData.dueDate !== undefined) updateData.due_date = validatedData.dueDate
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority
    if (validatedData.color !== undefined) updateData.color = validatedData.color
    if (validatedData.progressMode !== undefined) updateData.progress_mode = validatedData.progressMode
    if (validatedData.progressPercentage !== undefined)
      updateData.progress_percentage = validatedData.progressPercentage

    // Update milestone
    const { error: updateError } = await supabase
      .from('milestones')
      .update(updateData)
      .eq('id', milestoneId)

    if (updateError) {
      console.error('Error updating milestone:', updateError)
      return { error: 'Failed to update milestone' }
    }

    // Revalidate paths
    revalidatePath(`/app/organizations/${milestone.organization_id}`)

    return { success: true }
  } catch (error) {
    console.error('Unexpected error in updateMilestone:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Server action for milestone deletion
 *
 * Deletes a milestone from the database
 *
 * @param milestoneId - ID of the milestone to delete
 * @returns Object containing error message if deletion fails
 */
export async function deleteMilestone(milestoneId: string) {
  try {
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Get milestone and verify access
    const { data: milestone, error: milestoneError } = await supabase
      .from('milestones')
      .select('id, organization_id')
      .eq('id', milestoneId)
      .single()

    if (milestoneError || !milestone) {
      return { error: 'Milestone not found' }
    }

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from('user_organizations')
      .select('id, role')
      .eq('user_id', user.id)
      .eq('organization_id', milestone.organization_id)
      .single()

    if (!membership || !['ADMIN', 'MANAGER'].includes(membership.role)) {
      return { error: 'Insufficient permissions' }
    }

    // Delete milestone (cascade will handle dependencies and assignments)
    const { error: deleteError } = await supabase.from('milestones').delete().eq('id', milestoneId)

    if (deleteError) {
      console.error('Error deleting milestone:', deleteError)
      return { error: 'Failed to delete milestone' }
    }

    // Revalidate paths
    revalidatePath(`/app/organizations/${milestone.organization_id}`)

    return { success: true }
  } catch (error) {
    console.error('Unexpected error in deleteMilestone:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Server action for adding a milestone dependency
 *
 * Creates a dependency relationship between milestones
 *
 * @param milestoneId - ID of the milestone
 * @param data - Dependency data
 * @returns Object containing error message if creation fails
 */
export async function addMilestoneDependency(milestoneId: string, data: unknown) {
  try {
    const supabase = await createClient()

    // Validate input
    const validation = addDependencySchema.safeParse(data)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return { error: Object.values(errors)[0]?.[0] || 'Invalid dependency data' }
    }

    const validatedData = validation.data

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Get milestone and verify access
    const { data: milestone, error: milestoneError } = await supabase
      .from('milestones')
      .select('id, organization_id')
      .eq('id', milestoneId)
      .single()

    if (milestoneError || !milestone) {
      return { error: 'Milestone not found' }
    }

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from('user_organizations')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', milestone.organization_id)
      .single()

    if (!membership) {
      return { error: 'Access denied' }
    }

    // Create dependency
    const { error: createError } = await supabase.from('milestone_dependencies').insert({
      milestone_id: milestoneId,
      depends_on_milestone_id: validatedData.dependsOnMilestoneId,
      dependency_type: validatedData.dependencyType,
      lag_days: validatedData.lagDays,
    })

    if (createError) {
      console.error('Error creating dependency:', createError)
      return { error: 'Failed to create dependency' }
    }

    // Revalidate paths
    revalidatePath(`/app/organizations/${milestone.organization_id}`)

    return { success: true }
  } catch (error) {
    console.error('Unexpected error in addMilestoneDependency:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Server action for assigning a user to a milestone
 *
 * Assigns a user with a specific role
 *
 * @param milestoneId - ID of the milestone
 * @param data - Assignment data
 * @returns Object containing error message if assignment fails
 */
export async function assignUserToMilestone(milestoneId: string, data: unknown) {
  try {
    const supabase = await createClient()

    // Validate input
    const validation = assignUserSchema.safeParse(data)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return { error: Object.values(errors)[0]?.[0] || 'Invalid assignment data' }
    }

    const validatedData = validation.data

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Get milestone and verify access
    const { data: milestone, error: milestoneError } = await supabase
      .from('milestones')
      .select('id, organization_id')
      .eq('id', milestoneId)
      .single()

    if (milestoneError || !milestone) {
      return { error: 'Milestone not found' }
    }

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from('user_organizations')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', milestone.organization_id)
      .single()

    if (!membership) {
      return { error: 'Access denied' }
    }

    // Create assignment
    const { error: createError } = await supabase.from('milestone_assignments').insert({
      milestone_id: milestoneId,
      user_id: validatedData.userId,
      role: validatedData.role,
    })

    if (createError) {
      console.error('Error creating assignment:', createError)
      return { error: 'Failed to assign user' }
    }

    // Revalidate paths
    revalidatePath(`/app/organizations/${milestone.organization_id}`)

    return { success: true }
  } catch (error) {
    console.error('Unexpected error in assignUserToMilestone:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Server action for linking tasks to a milestone
 *
 * Links multiple tasks with optional weights
 *
 * @param milestoneId - ID of the milestone
 * @param data - Task linking data
 * @returns Object containing error message if linking fails
 */
export async function linkTasksToMilestone(milestoneId: string, data: unknown) {
  try {
    const supabase = await createClient()

    // Validate input
    const validation = linkTasksSchema.safeParse(data)
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors
      return { error: Object.values(errors)[0]?.[0] || 'Invalid link data' }
    }

    const validatedData = validation.data

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Get milestone and verify access
    const { data: milestone, error: milestoneError } = await supabase
      .from('milestones')
      .select('id, organization_id')
      .eq('id', milestoneId)
      .single()

    if (milestoneError || !milestone) {
      return { error: 'Milestone not found' }
    }

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from('user_organizations')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', milestone.organization_id)
      .single()

    if (!membership) {
      return { error: 'Access denied' }
    }

    // Prepare task links
    const taskLinks = validatedData.taskCardIds.map((taskId, index) => ({
      milestone_id: milestoneId,
      task_card_id: taskId,
      weight: validatedData.weights?.[index] || 1,
    }))

    // Create task links
    const { error: createError } = await supabase.from('milestone_tasks').insert(taskLinks)

    if (createError) {
      console.error('Error linking tasks:', createError)
      return { error: 'Failed to link tasks' }
    }

    // Revalidate paths
    revalidatePath(`/app/organizations/${milestone.organization_id}`)

    return { success: true }
  } catch (error) {
    console.error('Unexpected error in linkTasksToMilestone:', error)
    return { error: 'An unexpected error occurred' }
  }
}
