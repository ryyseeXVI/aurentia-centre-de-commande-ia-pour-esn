/**
 * Consultant Transformers
 *
 * Handle snake_case ↔ camelCase transformations for consultant data
 * Consultants are now profiles with role="CONSULTANT" + consultant_details
 */

import type {
  Consultant,
  ConsultantDb,
  CreateConsultantRequest,
  UpdateConsultantRequest,
} from "@/types/consultants";

/**
 * Transform consultant from database format to API format
 * Expects profile joined with consultant_details
 */
export function consultantFromDb(data: any): Consultant {
  return {
    // Profile fields
    id: data.id,
    email: data.email,
    nom: data.nom,
    prenom: data.prenom,
    role: data.role,
    avatarUrl: data.avatar_url,
    phone: data.phone,
    organizationId: data.organization_id,
    managerId: data.manager_id,
    status: data.status,
    lastSeen: data.last_seen,
    createdAt: data.created_at,
    updatedAt: data.updated_at,

    // Consultant details (from joined consultant_details table)
    details: data.consultant_details
      ? {
          dateEmbauche: data.consultant_details.date_embauche,
          tauxJournalierCout: parseFloat(data.consultant_details.taux_journalier_cout),
          tauxJournalierVente: data.consultant_details.taux_journalier_vente
            ? parseFloat(data.consultant_details.taux_journalier_vente)
            : null,
          statut: data.consultant_details.statut,
          jobTitle: data.consultant_details.job_title,
        }
      : null,

    // Manager info (from joined manager profile)
    manager: data.manager
      ? {
          id: data.manager.id,
          nom: data.manager.nom,
          prenom: data.manager.prenom,
          email: data.manager.email,
        }
      : null,
  };
}

/**
 * Transform consultant data for profile insert
 */
export function consultantForProfileInsert(
  data: CreateConsultantRequest,
  organizationId: string
): any {
  return {
    email: data.email,
    nom: data.nom,
    prenom: data.prenom,
    phone: data.phone || null,
    role: data.role || "CONSULTANT",
    organization_id: organizationId,
    manager_id: data.managerId || null,
  };
}

/**
 * Transform consultant data for consultant_details insert
 */
export function consultantForDetailsInsert(
  data: CreateConsultantRequest,
  profileId: string,
  organizationId: string
): any {
  return {
    profile_id: profileId,
    date_embauche: data.dateEmbauche,
    taux_journalier_cout: data.tauxJournalierCout,
    taux_journalier_vente: data.tauxJournalierVente || null,
    statut: data.statut || 'AVAILABLE',
    job_title: data.jobTitle || null,
    organization_id: organizationId,
  };
}

/**
 * Transform consultant data for profile update
 */
export function consultantForProfileUpdate(data: UpdateConsultantRequest): any {
  const update: any = {};

  if (data.nom !== undefined) update.nom = data.nom;
  if (data.prenom !== undefined) update.prenom = data.prenom;
  if (data.email !== undefined) update.email = data.email;
  if (data.phone !== undefined) update.phone = data.phone;
  if (data.role !== undefined) update.role = data.role;
  if (data.managerId !== undefined) update.manager_id = data.managerId;
  if (data.avatarUrl !== undefined) update.avatar_url = data.avatarUrl;

  return update;
}

/**
 * Transform consultant data for consultant_details update
 */
export function consultantForDetailsUpdate(data: UpdateConsultantRequest): any {
  const update: any = {};

  if (data.dateEmbauche !== undefined) update.date_embauche = data.dateEmbauche;
  if (data.tauxJournalierCout !== undefined) update.taux_journalier_cout = data.tauxJournalierCout;
  if (data.tauxJournalierVente !== undefined) update.taux_journalier_vente = data.tauxJournalierVente;
  if (data.statut !== undefined) update.statut = data.statut;
  if (data.jobTitle !== undefined) update.job_title = data.jobTitle;

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
    case "CLIENT":
      return "Client";
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
    case "CLIENT":
      return "#f59e0b"; // orange
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

/**
 * Get consultant status label
 */
export function getStatusLabel(status: string | null): string {
  if (!status) return "Inconnu";

  switch (status.toUpperCase()) {
    case "AVAILABLE":
    case "ACTIF":
      return "Disponible";
    case "ON_MISSION":
      return "En mission";
    case "ON_LEAVE":
      return "En congé";
    case "UNAVAILABLE":
      return "Indisponible";
    default:
      return status;
  }
}

/**
 * Get consultant status color
 */
export function getStatusColor(status: string | null): string {
  if (!status) return "#94a3b8";

  switch (status.toUpperCase()) {
    case "AVAILABLE":
    case "ACTIF":
      return "#10b981"; // green
    case "ON_MISSION":
      return "#3b82f6"; // blue
    case "ON_LEAVE":
      return "#f59e0b"; // orange
    case "UNAVAILABLE":
      return "#ef4444"; // red
    default:
      return "#94a3b8"; // gray
  }
}
