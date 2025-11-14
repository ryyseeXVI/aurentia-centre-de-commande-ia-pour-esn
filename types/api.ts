// API types (camelCase) - for use in TypeScript/React code and API responses
// These types represent the transformed data as consumed by the frontend

import type {
  ChannelType,
  MessageType,
  StatutProjet,
  StatutTache,
  UserRole,
  UserStatus,
} from "./database";

// Re-export types from database for convenience
export type {
  StatutTache,
  StatutProjet,
  UserStatus,
  UserRole,
  ChannelType,
  MessageType,
};

// ============================================================================
// ORGANIZATIONS & USERS
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserOrganization {
  id: string;
  userId: string;
  organizationId: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  avatarUrl: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  organizationId: string | null;
  status: UserStatus;
  lastSeen: string;
}

export interface Consultant {
  id: string;
  managerId: string | null;
  nom: string;
  prenom: string;
  email: string;
  dateEmbauche: string;
  tauxJournalierCout: number;
  tauxJournalierVente: number | null;
  role: string | null;
  statut: string;
  createdAt: string;
  updatedAt: string;
  userId: string | null;
  organizationId: string;
}

export interface Client {
  id: string;
  nom: string;
  contactPrincipal: string | null;
  secteur: string | null;
  createdAt: string;
  updatedAt: string;
  contactUserId: string | null;
  organizationId: string;
}

// ============================================================================
// PROJECTS & TASKS
// ============================================================================

export interface Projet {
  id: string;
  clientId: string;
  chefProjetId: string | null;
  nom: string;
  description: string | null;
  dateDebut: string;
  dateFinPrevue: string | null;
  statut: StatutProjet;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
}

export interface ProjetWithDetails extends Projet {
  client?: Client;
  chefProjet?: Consultant;
  affectations?: Affectation[];
  taches?: Tache[];
}

export interface Tache {
  id: string;
  projetId: string;
  livrableId: string | null;
  consultantResponsableId: string | null;
  nom: string;
  description: string | null;
  chargeEstimeeJh: number | null;
  dateFinCible: string | null;
  statut: StatutTache;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  position: number;
  color: string | null;
  tags: string[];
}

export interface TacheWithDetails extends Tache {
  consultantResponsable?: Consultant;
  livrable?: Livrable;
  projet?: Projet;
}

export interface Affectation {
  id: string;
  projetId: string;
  consultantId: string;
  dateDebut: string;
  dateFinPrevue: string | null;
  chargeAlloueePct: number;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
}

export interface AffectationWithDetails extends Affectation {
  consultant?: Consultant;
  projet?: Projet;
}

export interface Livrable {
  id: string;
  projetId: string;
  nom: string;
  description: string | null;
  dateCible: string | null;
  dateLivraisonReelle: string | null;
  statutAvancement: string | null;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
}

export interface TempsPasse {
  id: string;
  projetId: string;
  consultantId: string;
  tacheId: string | null;
  date: string;
  heuresTravaillees: number;
  sourceOutil: string | null;
  validationStatut: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
}

export interface Competence {
  id: string;
  nom: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
}

export interface ConsultantCompetence {
  consultantId: string;
  competenceId: string;
  niveau: number;
  dateEvaluation: string | null;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
}

export interface ConsultantCompetenceWithDetails extends ConsultantCompetence {
  competence?: Competence;
}

// ============================================================================
// MESSAGING
// ============================================================================

export interface OrganizationChannel {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectChannel {
  id: string;
  projetId: string;
  organizationId: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  channelType: ChannelType;
  senderId: string;
  content: string;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
}

export interface ChannelMessageWithDetails extends ChannelMessage {
  sender?: Profile;
  reactions?: MessageReaction[];
}

export interface DirectMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  readAt: string | null;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
}

export interface DirectMessageWithDetails extends DirectMessage {
  sender?: Profile;
  recipient?: Profile;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  id: string;
  messageId: string;
  messageType: MessageType;
  userId: string;
  emoji: string;
  createdAt: string;
  organizationId: string;
}

export interface MessageReactionWithUser extends MessageReaction {
  user?: Profile;
}

export interface TypingIndicator {
  id: string;
  channelId: string;
  channelType: ChannelType | "direct";
  userId: string;
  createdAt: string;
  organizationId: string;
}

export interface TypingIndicatorWithUser extends TypingIndicator {
  user?: Profile;
}

// ============================================================================
// NOTIFICATIONS & ACTIVITY
// ============================================================================

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
  organizationId: string;
  metadata: Record<string, any>;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  description: string | null;
  resourceType: string | null;
  resourceId: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  organizationId: string;
}

export interface ActivityLogWithUser extends ActivityLog {
  user?: Profile;
}

// ============================================================================
// INVITATIONS
// ============================================================================

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  acceptedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface OrganizationInvitationWithDetails
  extends OrganizationInvitation {
  organization?: Organization;
  inviter?: Profile;
}

export interface JoinCode {
  id: string;
  organizationId: string;
  code: string;
  role: "MEMBER" | "MANAGER";
  createdBy: string;
  expiresAt: string | null;
  maxUses: number | null;
  uses: number;
  createdAt: string;
}

export interface JoinCodeWithDetails extends JoinCode {
  organization?: Organization;
  creator?: Profile;
}

// ============================================================================
// INPUT/CREATE TYPES (for API requests)
// ============================================================================

export interface CreateProjetInput {
  clientId: string;
  chefProjetId?: string | null;
  nom: string;
  description?: string | null;
  dateDebut: string;
  dateFinPrevue?: string | null;
  statut: StatutProjet;
  organizationId: string;
}

export interface UpdateProjetInput {
  clientId?: string;
  chefProjetId?: string | null;
  nom?: string;
  description?: string | null;
  dateDebut?: string;
  dateFinPrevue?: string | null;
  statut?: StatutProjet;
}

export interface CreateTacheInput {
  projetId: string;
  livrableId?: string | null;
  consultantResponsableId?: string | null;
  nom: string;
  description?: string | null;
  chargeEstimeeJh?: number | null;
  dateFinCible?: string | null;
  statut?: StatutTache;
  organizationId: string;
  color?: string | null;
  tags?: string[];
}

export interface UpdateTacheInput {
  livrableId?: string | null;
  consultantResponsableId?: string | null;
  nom?: string;
  description?: string | null;
  chargeEstimeeJh?: number | null;
  dateFinCible?: string | null;
  statut?: StatutTache;
  position?: number;
  color?: string | null;
  tags?: string[];
}

export interface ReorderTacheInput {
  tacheId: string;
  newStatut: StatutTache;
  newPosition: number;
}

export interface CreateAffectationInput {
  projetId: string;
  consultantId: string;
  dateDebut: string;
  dateFinPrevue?: string | null;
  chargeAlloueePct?: number;
  organizationId: string;
}

export interface UpdateAffectationInput {
  dateDebut?: string;
  dateFinPrevue?: string | null;
  chargeAlloueePct?: number;
}

export interface CreateChannelMessageInput {
  channelId: string;
  channelType: ChannelType;
  content: string;
  organizationId?: string;
}

export interface CreateDirectMessageInput {
  recipientId: string;
  content: string;
  organizationId: string;
}

export interface CreateOrganizationInvitationInput {
  organizationId: string;
  email: string;
  role: UserRole;
}

export interface CreateJoinCodeInput {
  organizationId: string;
  role: "MEMBER" | "MANAGER";
  expiresAt?: string | null;
  maxUses?: number | null;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// ============================================================================
// KANBAN TYPES
// ============================================================================

export interface KanbanColumn {
  id: StatutTache;
  title: string;
  taches: Tache[];
}

export interface KanbanBoard {
  projetId: string;
  columns: KanbanColumn[];
}

// ============================================================================
// PROJECT CATEGORIZATION (for project switcher)
// ============================================================================

export interface CategorizedProjets {
  myProjets: Projet[]; // Projects where user is assigned
  managedProjets: Projet[]; // Projects where user is chef_projet
  otherProjets: Projet[]; // Other accessible projects
}
