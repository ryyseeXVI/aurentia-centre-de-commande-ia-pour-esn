// Database types (snake_case) - matches the actual database schema
// These types represent the raw data structure as stored in PostgreSQL

export type StatutTache =
  | "TODO"
  | "IN_PROGRESS"
  | "REVIEW"
  | "DONE"
  | "BLOCKED";
export type StatutProjet = "ACTIF" | "EN_PAUSE" | "TERMINE" | "ANNULE";
export type UserStatus = "online" | "offline" | "away";
export type UserRole = "ADMIN" | "MANAGER" | "CONSULTANT" | "CLIENT";
export type ChannelType = "organization" | "project";
export type MessageType = "channel" | "direct";

// ============================================================================
// EXISTING TABLES (from your schema)
// ============================================================================

export interface DbOrganization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbUserOrganization {
  id: string;
  user_id: string;
  organization_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface DbProfile {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string; // user_role type from your schema
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  organization_id: string | null;
  status: UserStatus; // Added in migration 009
  last_seen: string; // Added in migration 009
}

export interface DbConsultant {
  id: string;
  manager_id: string | null;
  nom: string;
  prenom: string;
  email: string;
  date_embauche: string;
  taux_journalier_cout: number;
  taux_journalier_vente: number | null;
  role: string | null;
  statut: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  organization_id: string;
}

export interface DbClient {
  id: string;
  nom: string;
  contact_principal: string | null;
  secteur: string | null;
  created_at: string;
  updated_at: string;
  contact_user_id: string | null;
  organization_id: string;
}

export interface DbProjet {
  id: string;
  client_id: string;
  chef_projet_id: string | null;
  nom: string;
  description: string | null;
  date_debut: string;
  date_fin_prevue: string | null;
  statut: StatutProjet;
  created_at: string;
  updated_at: string;
  organization_id: string;
}

export interface DbTache {
  id: string;
  projet_id: string;
  livrable_id: string | null;
  consultant_responsable_id: string | null;
  nom: string;
  description: string | null;
  charge_estimee_jh: number | null;
  date_fin_cible: string | null;
  statut: StatutTache; // Changed to ENUM in migration 008
  created_at: string;
  updated_at: string;
  organization_id: string;
  position: number; // Added in migration 008
  color: string | null; // Added in migration 008
  tags: string[]; // Added in migration 008
}

export interface DbAffectation {
  id: string;
  projet_id: string;
  consultant_id: string;
  date_debut: string;
  date_fin_prevue: string | null;
  charge_allouee_pct: number;
  created_at: string;
  updated_at: string;
  organization_id: string;
}

export interface DbLivrable {
  id: string;
  projet_id: string;
  nom: string;
  description: string | null;
  date_cible: string | null;
  date_livraison_reelle: string | null;
  statut_avancement: string | null;
  created_at: string;
  updated_at: string;
  organization_id: string;
}

export interface DbTempsPasse {
  id: string;
  projet_id: string;
  consultant_id: string;
  tache_id: string | null;
  date: string;
  heures_travaillees: number;
  source_outil: string | null;
  validation_statut: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
}

export interface DbCompetence {
  id: string;
  nom: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  organization_id: string;
}

export interface DbConsultantCompetence {
  consultant_id: string;
  competence_id: string;
  niveau: number;
  date_evaluation: string | null;
  created_at: string;
  updated_at: string;
  organization_id: string;
}

// ============================================================================
// NEW TABLES (from migrations)
// ============================================================================

export interface DbOrganizationChannel {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DbProjectChannel {
  id: string;
  projet_id: string;
  organization_id: string;
  name: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbChannelMessage {
  id: string;
  channel_id: string;
  channel_type: ChannelType;
  sender_id: string;
  content: string;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
  organization_id: string;
}

export interface DbDirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read_at: string | null;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
  organization_id: string;
}

export interface DbMessageReaction {
  id: string;
  message_id: string;
  message_type: MessageType;
  user_id: string;
  emoji: string;
  created_at: string;
  organization_id: string;
}

export interface DbTypingIndicator {
  id: string;
  channel_id: string;
  channel_type: ChannelType | "direct";
  user_id: string;
  created_at: string;
  organization_id: string;
}

export interface DbNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
  organization_id: string;
  metadata: Record<string, any>;
}

export interface DbActivityLog {
  id: string;
  user_id: string;
  action: string;
  description: string | null;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  organization_id: string;
}

export interface DbOrganizationInvitation {
  id: string;
  organization_id: string;
  email: string;
  role: UserRole;
  invited_by: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
}

export interface DbJoinCode {
  id: string;
  organization_id: string;
  code: string;
  role: "CONSULTANT" | "MANAGER";
  created_by: string;
  expires_at: string | null;
  max_uses: number | null;
  uses: number;
  created_at: string;
}

// ============================================================================
// INPUT TYPES (for inserts/updates)
// ============================================================================

export type DbProjetInsert = Omit<DbProjet, "id" | "created_at" | "updated_at">;
export type DbProjetUpdate = Partial<
  Omit<DbProjet, "id" | "created_at" | "updated_at" | "organization_id">
>;

export type DbTacheInsert = Omit<
  DbTache,
  "id" | "created_at" | "updated_at" | "position"
>;
export type DbTacheUpdate = Partial<
  Omit<DbTache, "id" | "created_at" | "updated_at" | "organization_id">
>;

export type DbAffectationInsert = Omit<
  DbAffectation,
  "id" | "created_at" | "updated_at"
>;
export type DbAffectationUpdate = Partial<
  Omit<
    DbAffectation,
    | "id"
    | "created_at"
    | "updated_at"
    | "organization_id"
    | "projet_id"
    | "consultant_id"
  >
>;

export type DbChannelMessageInsert = Omit<
  DbChannelMessage,
  "id" | "created_at" | "updated_at" | "edited_at"
>;
export type DbDirectMessageInsert = Omit<
  DbDirectMessage,
  "id" | "created_at" | "updated_at" | "read_at" | "edited_at"
>;

export type DbNotificationInsert = Omit<
  DbNotification,
  "id" | "created_at" | "read_at"
>;
export type DbActivityLogInsert = Omit<DbActivityLog, "id" | "created_at">;
