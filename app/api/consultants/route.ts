// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, authenticateUser } from '@/lib/api-helpers'
import { NextRequest } from 'next/server'
import {
  consultantFromDb,
  consultantForProfileInsert,
  consultantForDetailsInsert,
} from '@/utils/consultant-transformers'
import type { CreateConsultantRequest } from '@/types/consultants'

/**
 * GET /api/consultants
 * List all consultants (with optional filters)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { user, error: authError } = await authenticateUser(supabase)

    if (authError) {
      return errorResponse('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Query profiles with role='CONSULTANT' and join with consultant_details
    let query = supabase
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
          competence:competence_id (
            id,
            nom,
            description
          )
        )
      `)
      .eq('role', 'CONSULTANT')
      .order('nom', { ascending: true })

    // Filter by status if provided (status is in consultant_details)
    // Note: This requires a different approach since we're joining
    // For now, we'll fetch all and filter in memory or use a more complex query

    // Search by name or email if provided
    if (search) {
      query = query.or(`nom.ilike.%${search}%,prenom.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: consultants, error } = await query

    if (error) {
      console.error('Error fetching consultants:', error)
      return errorResponse('Failed to fetch consultants')
    }

    // Filter by status in memory if needed
    let filteredConsultants = consultants || []
    if (status && filteredConsultants.length > 0) {
      filteredConsultants = filteredConsultants.filter((c: any) =>
        c.consultant_details?.statut === status
      )
    }

    // Transform to camelCase
    const transformed = filteredConsultants.map((c: any) => consultantFromDb(c))

    return successResponse({ consultants: transformed })
  } catch (error) {
    console.error('Unexpected error in consultants GET:', error)
    return errorResponse('Internal server error')
  }
}

/**
 * POST /api/consultants
 * Create a new consultant (ADMIN only)
 */
export async function POST(request: NextRequest) {
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

    const body: CreateConsultantRequest = await request.json()
    const {
      nom,
      prenom,
      email,
      phone,
      role = 'CONSULTANT',
      managerId,
      dateEmbauche,
      tauxJournalierCout,
      tauxJournalierVente,
      jobTitle,
      statut = 'AVAILABLE'
    } = body

    // Validate required fields
    if (!nom || !prenom || !email || !dateEmbauche || !tauxJournalierCout) {
      return errorResponse('Missing required fields: nom, prenom, email, dateEmbauche, tauxJournalierCout', 400)
    }

    // Get user's organization (use first organization they belong to)
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!userOrg) {
      return errorResponse('User not associated with any organization', 400)
    }

    const organizationId = (userOrg as any).organization_id

    // Check if profile already exists with this email
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .eq('organization_id', organizationId)
      .single()

    let profileId: string

    if (existingProfile) {
      // Update existing profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role, manager_id: managerId || null })
        .eq('id', (existingProfile as any).id)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        return errorResponse('Failed to update profile')
      }

      profileId = (existingProfile as any).id
    } else {
      // Create new profile
      const profileData = consultantForProfileInsert(body, organizationId)

      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single()

      if (profileError) {
        console.error('Error creating profile:', profileError)
        if (profileError.code === '23505') {
          return errorResponse('Email already exists', 409)
        }
        return errorResponse('Failed to create profile')
      }

      profileId = (newProfile as any).id
    }

    // Create consultant_details
    const detailsData = consultantForDetailsInsert(body, profileId, organizationId)

    const { error: detailsError } = await supabase
      .from('consultant_details')
      .insert(detailsData)

    if (detailsError) {
      console.error('Error creating consultant details:', detailsError)
      return errorResponse('Failed to create consultant details')
    }

    // Fetch complete consultant data
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
      .eq('id', profileId)
      .single()

    if (fetchError) {
      console.error('Error fetching created consultant:', fetchError)
      return errorResponse('Consultant created but failed to fetch')
    }

    // Transform response
    const transformed = consultantFromDb(consultant)

    return successResponse({ consultant: transformed }, 201)
  } catch (error) {
    console.error('Unexpected error in consultants POST:', error)
    return errorResponse('Internal server error')
  }
}
