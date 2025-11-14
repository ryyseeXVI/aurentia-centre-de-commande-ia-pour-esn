import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, authenticateUser } from '@/lib/api-helpers'
import { NextRequest } from 'next/server'

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

    let query = supabase
      .from('consultant')
      .select(`
        *,
        manager:consultant!consultant_manager_id_fkey(id, nom, prenom, email),
        consultant_competence(
          competence(id, nom, description)
        )
      `)
      .order('nom', { ascending: true })

    // Filter by status if provided
    if (status) {
      query = query.eq('statut', status)
    }

    // Search by name or email if provided
    if (search) {
      query = query.or(`nom.ilike.%${search}%,prenom.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: consultants, error } = await query

    if (error) {
      console.error('Error fetching consultants:', error)
      return errorResponse('Failed to fetch consultants')
    }

    return successResponse({ consultants })
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

    if (profile?.role !== 'ADMIN') {
      return errorResponse('Forbidden: Admin access required', 403)
    }

    const body = await request.json()
    const {
      nom,
      prenom,
      email,
      date_embauche,
      taux_journalier_cout,
      taux_journalier_vente,
      role,
      statut = 'ACTIF',
      manager_id,
      organization_id,
    } = body

    // Validate required fields
    if (!nom || !prenom || !email || !date_embauche || !taux_journalier_cout || !organization_id) {
      return errorResponse('Missing required fields', 400)
    }

    // Insert new consultant
    const { data: consultant, error } = await supabase
      .from('consultant')
      .insert({
        nom,
        prenom,
        email,
        date_embauche,
        taux_journalier_cout,
        taux_journalier_vente,
        role,
        statut,
        manager_id,
        organization_id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating consultant:', error)
      if (error.code === '23505') {
        return errorResponse('Email already exists', 409)
      }
      return errorResponse('Failed to create consultant')
    }

    return successResponse({ consultant }, 201)
  } catch (error) {
    console.error('Unexpected error in consultants POST:', error)
    return errorResponse('Internal server error')
  }
}
