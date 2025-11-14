// @ts-nocheck
// Transformers for common entities (profiles, consultants, notifications, etc.)

import type {
  ActivityLog,
  Affectation,
  Client,
  Consultant,
  JoinCode,
  Notification,
  Organization,
  OrganizationInvitation,
  Profile,
} from "../../types/api";
import type {
  DbActivityLog,
  DbAffectation,
  DbClient,
  DbConsultant,
  DbJoinCode,
  DbNotification,
  DbOrganization,
  DbOrganizationInvitation,
  DbProfile,
} from "../../types/database";

// ============================================================================
// ORGANIZATION
// ============================================================================

export function dbOrganizationToApi(dbOrg: DbOrganization): Organization {
  return {
    id: dbOrg.id,
    name: dbOrg.name,
    slug: dbOrg.slug,
    description: dbOrg.description,
    logoUrl: dbOrg.logo_url,
    createdAt: dbOrg.created_at,
    updatedAt: dbOrg.updated_at,
  };
}

export function dbOrganizationsToApi(dbOrgs: DbOrganization[]): Organization[] {
  return dbOrgs.map(dbOrganizationToApi);
}

// ============================================================================
// PROFILE
// ============================================================================

export function dbProfileToApi(dbProfile: DbProfile): Profile {
  return {
    id: dbProfile.id,
    email: dbProfile.email,
    nom: dbProfile.nom,
    prenom: dbProfile.prenom,
    role: dbProfile.role,
    avatarUrl: dbProfile.avatar_url,
    phone: dbProfile.phone,
    createdAt: dbProfile.created_at,
    updatedAt: dbProfile.updated_at,
    organizationId: dbProfile.organization_id,
    status: dbProfile.status,
    lastSeen: dbProfile.last_seen,
  };
}

export function dbProfilesToApi(dbProfiles: DbProfile[]): Profile[] {
  return dbProfiles.map(dbProfileToApi);
}

// ============================================================================
// CONSULTANT
// ============================================================================

export function dbConsultantToApi(dbConsultant: DbConsultant): Consultant {
  return {
    id: dbConsultant.id,
    managerId: dbConsultant.manager_id,
    nom: dbConsultant.nom,
    prenom: dbConsultant.prenom,
    email: dbConsultant.email,
    dateEmbauche: dbConsultant.date_embauche,
    tauxJournalierCout: dbConsultant.taux_journalier_cout,
    tauxJournalierVente: dbConsultant.taux_journalier_vente,
    role: dbConsultant.role,
    statut: dbConsultant.statut,
    createdAt: dbConsultant.created_at,
    updatedAt: dbConsultant.updated_at,
    userId: dbConsultant.user_id,
    organizationId: dbConsultant.organization_id,
  };
}

export function dbConsultantsToApi(
  dbConsultants: DbConsultant[],
): Consultant[] {
  return dbConsultants.map(dbConsultantToApi);
}

// ============================================================================
// CLIENT
// ============================================================================

export function dbClientToApi(dbClient: DbClient): Client {
  return {
    id: dbClient.id,
    nom: dbClient.nom,
    contactPrincipal: dbClient.contact_principal,
    secteur: dbClient.secteur,
    createdAt: dbClient.created_at,
    updatedAt: dbClient.updated_at,
    contactUserId: dbClient.contact_user_id,
    organizationId: dbClient.organization_id,
  };
}

export function dbClientsToApi(dbClients: DbClient[]): Client[] {
  return dbClients.map(dbClientToApi);
}

// ============================================================================
// AFFECTATION
// ============================================================================

export function dbAffectationToApi(dbAffectation: DbAffectation): Affectation {
  return {
    id: dbAffectation.id,
    projetId: dbAffectation.projet_id,
    consultantId: dbAffectation.consultant_id,
    dateDebut: dbAffectation.date_debut,
    dateFinPrevue: dbAffectation.date_fin_prevue,
    chargeAlloueePct: dbAffectation.charge_allouee_pct,
    createdAt: dbAffectation.created_at,
    updatedAt: dbAffectation.updated_at,
    organizationId: dbAffectation.organization_id,
  };
}

export function dbAffectationsToApi(
  dbAffectations: DbAffectation[],
): Affectation[] {
  return dbAffectations.map(dbAffectationToApi);
}

// ============================================================================
// NOTIFICATION
// ============================================================================

export function dbNotificationToApi(
  dbNotification: DbNotification,
): Notification {
  return {
    id: dbNotification.id,
    userId: dbNotification.user_id,
    type: dbNotification.type,
    title: dbNotification.title,
    message: dbNotification.message,
    link: dbNotification.link,
    readAt: dbNotification.read_at,
    createdAt: dbNotification.created_at,
    organizationId: dbNotification.organization_id,
    metadata: dbNotification.metadata,
  };
}

export function dbNotificationsToApi(
  dbNotifications: DbNotification[],
): Notification[] {
  return dbNotifications.map(dbNotificationToApi);
}

// ============================================================================
// ACTIVITY LOG
// ============================================================================

export function dbActivityLogToApi(dbLog: DbActivityLog): ActivityLog {
  return {
    id: dbLog.id,
    userId: dbLog.user_id,
    action: dbLog.action,
    description: dbLog.description,
    resourceType: dbLog.resource_type,
    resourceId: dbLog.resource_id,
    metadata: dbLog.metadata,
    createdAt: dbLog.created_at,
    organizationId: dbLog.organization_id,
  };
}

export function dbActivityLogsToApi(dbLogs: DbActivityLog[]): ActivityLog[] {
  return dbLogs.map(dbActivityLogToApi);
}

// ============================================================================
// ORGANIZATION INVITATION
// ============================================================================

export function dbOrganizationInvitationToApi(
  dbInvitation: DbOrganizationInvitation,
): OrganizationInvitation {
  return {
    id: dbInvitation.id,
    organizationId: dbInvitation.organization_id,
    email: dbInvitation.email,
    role: dbInvitation.role,
    invitedBy: dbInvitation.invited_by,
    acceptedAt: dbInvitation.accepted_at,
    expiresAt: dbInvitation.expires_at,
    createdAt: dbInvitation.created_at,
  };
}

export function dbOrganizationInvitationsToApi(
  dbInvitations: DbOrganizationInvitation[],
): OrganizationInvitation[] {
  return dbInvitations.map(dbOrganizationInvitationToApi);
}

// ============================================================================
// JOIN CODE
// ============================================================================

export function dbJoinCodeToApi(dbJoinCode: DbJoinCode): JoinCode {
  return {
    id: dbJoinCode.id,
    organizationId: dbJoinCode.organization_id,
    code: dbJoinCode.code,
    role: dbJoinCode.role,
    createdBy: dbJoinCode.created_by,
    expiresAt: dbJoinCode.expires_at,
    maxUses: dbJoinCode.max_uses,
    uses: dbJoinCode.uses,
    createdAt: dbJoinCode.created_at,
  };
}

export function dbJoinCodesToApi(dbJoinCodes: DbJoinCode[]): JoinCode[] {
  return dbJoinCodes.map(dbJoinCodeToApi);
}
