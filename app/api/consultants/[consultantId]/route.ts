// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, authenticateUser } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'
import { NextRequest } from 'next/server'
import {
  consultantFromDb,
  consultantForProfileUpdate,
  consultantForDetailsUpdate,
} from '@/utils/consultant-transformers'
import type { UpdateConsultantRequest } from '@/types/consultants'

/**
 * GET /api/consultants/[consultantId]
 * Get consultant details with skills, assignments, and performance data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ consultantId: string }> }
) {
  try {
    const supabase = await createClient()
    const { user, error: authError } = await authenticateUser(supabase)

    if (authError) {
      return errorResponse('Unauthorized', 401)
    }

    const { consultantId } = await params

    // Fetch consultant (profile) with related data
    const { data: consultant, error } = await supabase
      .from('profiles')
      .select(`
        *,
        consultant_details (
          date_embauche,
          taux_journalier_cout,
          taux_journalier_vente,
          statut,
          job_title
        ),
        manager:manager_id (
          id,
          nom,
          prenom,
          email
        ),
        profile_competences (
          niveau,
          date_evaluation,
          competence:competence_id (
            id,
            nom,
            description
          )
        ),
        affectation!affectation_profile_id_fkey (
          id,
          date_debut,
          date_fin_prevue,
          charge_allouee_pct,
          projet (
            id,
            nom,
            statut,
            organisation_id,
            organisations (
              nom
            )
          )
        )
      `)
      .eq('id', consultantId)
      .single()

    if (error) {
      logger.error('Error fetching consultant', error, { consultantId })
      if (error.code === 'PGRST116') {
        return errorResponse('Consultant not found', 404)
      }
      return errorResponse('Failed to fetch consultant')
    }

    // Fetch time tracking stats
    const { data: timeStats } = await supabase
      .from('temps_passe')
      .select('heures_travaillees, date')
      .eq('profile_id', consultantId)
      .order('date', { ascending: false })
      .limit(100)

    const totalHours = timeStats?.reduce((sum: number, record: any) => {
      return sum + (parseFloat(record.heures_travaillees as string) || 0)
    }, 0) || 0

    // Transform consultant data
    const transformed = consultantFromDb(consultant)

    return successResponse({
      consultant: transformed,
      stats: {
        totalHours: Math.round(totalHours * 10) / 10,
        activeProjects: (consultant as any).affectation?.filter((a: any) =>
          !a.date_fin_prevue || new Date(a.date_fin_prevue) > new Date()
        ).length || 0,
      },
    })
  } catch (error) {
    console.error('Unexpected error in consultant GET:', error)
    return errorResponse('Internal server error')
  }
}

/**
 * PATCH /api/consultants/[consultantId]
 * Update consultant information (ADMIN or MANAGER only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ consultantId: string }> }
) {
  try {
    const supabase = await createClient()
    const { user, error: authError } = await authenticateUser(supabase)

    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // Check if user is ADMIN or MANAGER
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['ADMIN', 'MANAGER'].includes((profile as any).role)) {
      return errorResponse('Forbidden: Admin or Manager access required', 403)
    }

    const { consultantId } = await params
    const body: UpdateConsultantRequest = await request.json()

    // Prepare profile update data
    const profileUpdate = consultantForProfileUpdate(body)

    // Prepare consultant_details update data
    const detailsUpdate = consultantForDetailsUpdate(body)

    if (Object.keys(profileUpdate).length === 0 && Object.keys(detailsUpdate).length === 0) {
      return errorResponse('No fields to update', 400)
    }

    // Update profile if there are changes
    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', consultantId)

      if (profileError) {
        console.error('Error updating profile:', profileError)
        return errorResponse('Failed to update profile')
      }
    }

    // Update consultant_details if there are changes
    if (Object.keys(detailsUpdate).length > 0) {
      const { error: detailsError } = await supabase
        .from('consultant_details')
        .update(detailsUpdate)
        .eq('profile_id', consultantId)

      if (detailsError) {
        console.error('Error updating consultant details:', detailsError)
        return errorResponse('Failed to update consultant details')
      }
    }

    // Fetch updated consultant
    const { data: consultant, error: fetchError } = await supabase
      .from('profiles')
      .select(`
        *,
        consultant_details (
          date_embauche,
          taux_journalier_cout,
          taux_journalier_vente,
          statut,
          job_title
        ),
        manager:manager_id (
          id,
          nom,
          prenom,
          email
        )
      `)
      .eq('id', consultantId)
      .single()

    if (fetchError) {
      console.error('Error fetching updated consultant:', fetchError)
      if (fetchError.code === 'PGRST116') {
        return errorResponse('Consultant not found', 404)
      }
      return errorResponse('Failed to fetch updated consultant')
    }

    // Transform response
    const transformed = consultantFromDb(consultant)

    return successResponse({ consultant: transformed })
  } catch (error) {
    console.error('Unexpected error in consultant PATCH:', error)
    return errorResponse('Internal server error')
  }
}

/**
 * DELETE /api/consultants/[consultantId]
 * Delete/deactivate consultant (ADMIN only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ consultantId: string }> }
) {
  try {
    const supabase = await createClient()
    const { user, error: authError } = await authenticateUser(supabase)

    if (authError || !user) {
      return errorResponse('Unauthorized', 401)
    }

    // Check if user is ADMIN
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if ((profile as any)?.role !== 'ADMIN') {
      return errorResponse('Forbidden: Admin access required', 403)
    }

    const { consultantId } = await params

    // Soft delete by setting consultant_details status to UNAVAILABLE
    const { error } = await supabase
      .from('consultant_details')
      .update({
        statut: 'UNAVAILABLE',
      })
      .eq('profile_id', consultantId)

    if (error) {
      console.error('Error deactivating consultant:', error)
      return errorResponse('Failed to deactivate consultant')
    }

    return successResponse({ message: 'Consultant deactivated successfully' })
  } catch (error) {
    console.error('Unexpected error in consultant DELETE:', error)
    return errorResponse('Internal server error')
  }
}
