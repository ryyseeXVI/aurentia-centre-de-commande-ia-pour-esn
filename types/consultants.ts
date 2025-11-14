/**
 * Consultant Types - Profiles-based Architecture
 *
 * Consultants are profiles with role="CONSULTANT" + consultant_details
 */

import { Database } from '@/lib/supabase/types'

// Re-export user role enum for consistency
export enum ConsultantRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  CONSULTANT = "CONSULTANT",
  CLIENT = "CLIENT",
}

// Type aliases from database
type ProfileRow = Database['public']['Tables']['profiles']['Row']
type ConsultantDetailsRow = Database['public']['Tables']['consultant_details']['Row']
type ProfileCompetenceRow = Database['public']['Tables']['profile_competences']['Row']

// Full consultant with details
export interface Consultant {
  // From profiles table
  id: string
  email: string
  nom: string
  prenom: string
  role: ConsultantRole
  avatarUrl: string | null
  phone: string | null
  organizationId: string | null
  managerId: string | null
  status: 'online' | 'offline' | 'away' | null
  lastSeen: string | null
  createdAt: string
  updatedAt: string

  // From consultant_details (joined)
  details?: {
    dateEmbauche: string
    tauxJournalierCout: number
    tauxJournalierVente: number | null
    statut: string | null
    jobTitle: string | null
  } | null

  // Manager info (joined)
  manager?: {
    id: string
    nom: string
    prenom: string
    email: string
  } | null
}

// Database version (snake_case) - for internal use
export interface ConsultantDb {
  // profiles columns
  id: string
  email: string
  nom: string
  prenom: string
  role: string
  avatar_url: string | null
  phone: string | null
  organization_id: string | null
  manager_id: string | null
  status: string | null
  last_seen: string | null
  created_at: string
  updated_at: string

  // consultant_details columns (when joined)
  details?: {
    date_embauche: string
    taux_journalier_cout: number
    taux_journalier_vente: number | null
    statut: string | null
    job_title: string | null
  } | null

  // manager profile (when joined)
  manager?: {
    id: string
    nom: string
    prenom: string
    email: string
  } | null
}

// API Request types
export interface CreateConsultantRequest {
  email: string
  nom: string
  prenom: string
  phone?: string
  role?: ConsultantRole
  managerId?: string
  // Consultant-specific details
  dateEmbauche: string
  tauxJournalierCout: number
  tauxJournalierVente?: number
  jobTitle?: string
  statut?: string
}

export interface UpdateConsultantRequest {
  nom?: string
  prenom?: string
  email?: string
  phone?: string
  role?: ConsultantRole
  managerId?: string
  avatarUrl?: string
  // Consultant details
  dateEmbauche?: string
  tauxJournalierCout?: number
  tauxJournalierVente?: number
  jobTitle?: string
  statut?: string
}

export interface UpdateConsultantRoleRequest {
  role: ConsultantRole
}

// API Response types
export interface ConsultantListResponse {
  consultants: Consultant[]
  total: number
}

export interface ConsultantResponse {
  consultant: Consultant
}

// Filters for listing consultants
export interface ConsultantFilters {
  role?: ConsultantRole
  search?: string
  managerId?: string
  statut?: string
}

// Consultant competence types
export interface ConsultantCompetence {
  profileId: string
  competenceId: string
  niveau: number | null
  dateEvaluation: string | null
  competence?: {
    id: string
    nom: string
    description: string | null
  }
}
