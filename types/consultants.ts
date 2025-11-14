/**
 * Consultant Types - Team/Role Management
 *
 * Matches consultant table schema with profiles table join
 */

// Consultant role enum
export enum ConsultantRole {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  CONSULTANT = "CONSULTANT",
}

// Base consultant interface (matches consultant table)
export interface Consultant {
  id: string;
  organizationId: string;
  userId: string;
  nom: string;
  prenom: string;
  email: string;
  role: ConsultantRole;
  createdAt: string;
  updatedAt: string;

  // Joined from profiles table
  profile?: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
}

// Database version (snake_case)
export interface ConsultantDb {
  id: string;
  organization_id: string;
  user_id: string;
  nom: string;
  prenom: string;
  email: string;
  role: ConsultantRole;
  created_at: string;
  updated_at: string;
}

// API Request types
export interface CreateConsultantRequest {
  email: string;
  nom: string;
  prenom: string;
  role?: ConsultantRole;
}

export interface UpdateConsultantRequest {
  nom?: string;
  prenom?: string;
  email?: string;
  role?: ConsultantRole;
}

export interface UpdateConsultantRoleRequest {
  role: ConsultantRole;
}

// API Response types
export interface ConsultantListResponse {
  consultants: Consultant[];
  total: number;
}

export interface ConsultantResponse {
  consultant: Consultant;
}

// Filters for listing consultants
export interface ConsultantFilters {
  role?: ConsultantRole;
  search?: string;
}
