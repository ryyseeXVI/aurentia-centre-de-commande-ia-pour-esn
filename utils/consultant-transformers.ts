/**
 * Consultant Transformers
 *
 * Handle snake_case ↔ camelCase transformations for consultant data
 */

import type {
  Consultant,
  ConsultantDb,
  CreateConsultantRequest,
  UpdateConsultantRequest,
} from "@/types/consultants";

/**
 * Transform consultant from database format to API format
 */
export function consultantFromDb(consultant: ConsultantDb & { profile?: any }): Consultant {
  return {
    id: consultant.id,
    organizationId: consultant.organization_id,
    userId: consultant.user_id,
    nom: consultant.nom,
    prenom: consultant.prenom,
    email: consultant.email,
    role: consultant.role,
    createdAt: consultant.created_at,
    updatedAt: consultant.updated_at,
    profile: consultant.profile
      ? {
          id: consultant.profile.id,
          nom: consultant.profile.nom,
          prenom: consultant.profile.prenom,
          email: consultant.profile.email,
          avatarUrl: consultant.profile.avatar_url,
        }
      : null,
  };
}

/**
 * Transform consultant data for database insert
 */
export function consultantForInsert(
  data: CreateConsultantRequest,
  organizationId: string,
  userId: string
): any {
  return {
    organization_id: organizationId,
    user_id: userId,
    nom: data.nom,
    prenom: data.prenom,
    email: data.email,
    role: data.role || "CONSULTANT",
  };
}

/**
 * Transform consultant data for database update
 */
export function consultantForUpdate(data: UpdateConsultantRequest): any {
  const update: any = {};

  if (data.nom !== undefined) update.nom = data.nom;
  if (data.prenom !== undefined) update.prenom = data.prenom;
  if (data.email !== undefined) update.email = data.email;
  if (data.role !== undefined) update.role = data.role;

  return update;
}

/**
 * Get role label for display
 */
export function getRoleLabel(role: string): string {
  switch (role) {
    case "ADMIN":
      return "Administrateur";
    case "MANAGER":
      return "Manager";
    case "CONSULTANT":
      return "Consultant";
    default:
      return role;
  }
}

/**
 * Get role color for badges
 */
export function getRoleColor(role: string): string {
  switch (role) {
    case "ADMIN":
      return "#ef4444"; // red
    case "MANAGER":
      return "#3b82f6"; // blue
    case "CONSULTANT":
      return "#10b981"; // green
    default:
      return "#94a3b8"; // gray
  }
}

/**
 * Get consultant display name
 */
export function getConsultantDisplayName(consultant: Consultant): string {
  return `${consultant.prenom} ${consultant.nom}`;
}

/**
 * Get consultant initials
 */
export function getConsultantInitials(consultant: Consultant): string {
  return `${consultant.prenom.charAt(0)}${consultant.nom.charAt(0)}`.toUpperCase();
}
