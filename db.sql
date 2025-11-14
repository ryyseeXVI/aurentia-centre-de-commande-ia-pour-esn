-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  description text,
  resource_type text,
  resource_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  organization_id uuid NOT NULL,
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT activity_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.affectation (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  projet_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  date_debut date NOT NULL,
  date_fin_prevue date,
  charge_allouee_pct numeric NOT NULL CHECK (charge_allouee_pct >= 0::numeric AND charge_allouee_pct <= 100::numeric),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  organization_id uuid NOT NULL,
  CONSTRAINT affectation_pkey PRIMARY KEY (id),
  CONSTRAINT affectation_projet_id_fkey FOREIGN KEY (projet_id) REFERENCES public.projet(id),
  CONSTRAINT affectation_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT affectation_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.budget_projet (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  projet_id uuid NOT NULL UNIQUE,
  montant_total_vente numeric NOT NULL,
  cout_estime_total numeric NOT NULL,
  marge_cible_pct numeric NOT NULL CHECK (marge_cible_pct >= 0::numeric AND marge_cible_pct <= 100::numeric),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  organization_id uuid NOT NULL,
  CONSTRAINT budget_projet_pkey PRIMARY KEY (id),
  CONSTRAINT budget_projet_projet_id_fkey FOREIGN KEY (projet_id) REFERENCES public.projet(id),
  CONSTRAINT budget_projet_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.channel_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL,
  channel_type text NOT NULL CHECK (channel_type = ANY (ARRAY['organization'::text, 'project'::text, 'direct'::text, 'group'::text])),
  sender_id uuid NOT NULL,
  content text NOT NULL,
  edited_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  organization_id uuid NOT NULL,
  CONSTRAINT channel_messages_pkey PRIMARY KEY (id),
  CONSTRAINT channel_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id),
  CONSTRAINT channel_messages_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.client (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  contact_principal text,
  secteur text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  contact_user_id uuid,
  organization_id uuid NOT NULL,
  CONSTRAINT client_pkey PRIMARY KEY (id),
  CONSTRAINT client_contact_user_id_fkey FOREIGN KEY (contact_user_id) REFERENCES public.profiles(id),
  CONSTRAINT client_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.competence (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nom text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  organization_id uuid NOT NULL,
  CONSTRAINT competence_pkey PRIMARY KEY (id),
  CONSTRAINT competence_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.consultant_competence (
  consultant_id uuid NOT NULL,
  competence_id uuid NOT NULL,
  niveau smallint CHECK (niveau >= 1 AND niveau <= 5),
  date_evaluation date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  organization_id uuid NOT NULL,
  CONSTRAINT consultant_competence_pkey PRIMARY KEY (consultant_id, competence_id),
  CONSTRAINT consultant_competence_competence_id_fkey FOREIGN KEY (competence_id) REFERENCES public.competence(id),
  CONSTRAINT consultant_competence_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.consultant_details (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE,
  date_embauche date NOT NULL,
  taux_journalier_cout numeric NOT NULL,
  taux_journalier_vente numeric,
  statut text DEFAULT 'AVAILABLE'::text,
  job_title text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  organization_id uuid NOT NULL,
  CONSTRAINT consultant_details_pkey PRIMARY KEY (id),
  CONSTRAINT consultant_details_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT consultant_details_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.detection_derive (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  projet_id uuid NOT NULL,
  profile_id uuid,
  date_detection timestamp with time zone DEFAULT now(),
  type_derive text NOT NULL,
  gravite text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  organization_id uuid NOT NULL,
  description text,
  metriques jsonb,
  CONSTRAINT detection_derive_pkey PRIMARY KEY (id),
  CONSTRAINT detection_derive_projet_id_fkey FOREIGN KEY (projet_id) REFERENCES public.projet(id),
  CONSTRAINT detection_derive_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT detection_derive_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.direct_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  content text NOT NULL,
  read_at timestamp with time zone,
  edited_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  organization_id uuid NOT NULL,
  CONSTRAINT direct_messages_pkey PRIMARY KEY (id),
  CONSTRAINT direct_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id),
  CONSTRAINT direct_messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(id),
  CONSTRAINT direct_messages_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.facture (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  projet_id uuid NOT NULL,
  montant numeric NOT NULL,
  date_facturation date NOT NULL,
  statut_paiement text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  organization_id uuid NOT NULL,
  CONSTRAINT facture_pkey PRIMARY KEY (id),
  CONSTRAINT facture_projet_id_fkey FOREIGN KEY (projet_id) REFERENCES public.projet(id),
  CONSTRAINT facture_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.group_chat_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  group_chat_id uuid NOT NULL,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT group_chat_members_pkey PRIMARY KEY (id),
  CONSTRAINT group_chat_members_group_chat_id_fkey FOREIGN KEY (group_chat_id) REFERENCES public.group_chats(id),
  CONSTRAINT group_chat_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.group_chats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  description text,
  organization_id uuid NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT group_chats_pkey PRIMARY KEY (id),
  CONSTRAINT group_chats_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT group_chats_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.incident (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  projet_id uuid NOT NULL,
  profile_assigne_id uuid,
  titre text NOT NULL,
  severite text,
  statut text,
  date_ouverture timestamp with time zone NOT NULL,
  date_resolution timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  organization_id uuid NOT NULL,
  CONSTRAINT incident_pkey PRIMARY KEY (id),
  CONSTRAINT incident_projet_id_fkey FOREIGN KEY (projet_id) REFERENCES public.projet(id),
  CONSTRAINT incident_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT incident_profile_assigne_id_fkey FOREIGN KEY (profile_assigne_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.join_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role = ANY (ARRAY['MEMBER'::text, 'MANAGER'::text])),
  created_by uuid NOT NULL,
  expires_at timestamp with time zone,
  max_uses integer,
  uses integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT join_codes_pkey PRIMARY KEY (id),
  CONSTRAINT join_codes_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT join_codes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.livrable (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  projet_id uuid NOT NULL,
  nom text NOT NULL,
  description text,
  date_cible date,
  date_livraison_reelle date,
  statut_avancement text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  organization_id uuid NOT NULL,
  CONSTRAINT livrable_pkey PRIMARY KEY (id),
  CONSTRAINT livrable_projet_id_fkey FOREIGN KEY (projet_id) REFERENCES public.projet(id),
  CONSTRAINT livrable_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.message_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  message_type text NOT NULL CHECK (message_type = ANY (ARRAY['channel'::text, 'direct'::text])),
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  organization_id uuid NOT NULL,
  CONSTRAINT message_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT message_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT message_reactions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.milestone_assignments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  milestone_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role character varying DEFAULT 'contributor'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT milestone_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT milestone_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT milestone_assignments_milestone_id_fkey FOREIGN KEY (milestone_id) REFERENCES public.milestones(id)
);
CREATE TABLE public.milestone_dependencies (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  milestone_id uuid NOT NULL,
  depends_on_milestone_id uuid NOT NULL,
  dependency_type character varying NOT NULL DEFAULT 'finish_to_start'::character varying,
  lag_days integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT milestone_dependencies_pkey PRIMARY KEY (id),
  CONSTRAINT milestone_dependencies_milestone_id_fkey FOREIGN KEY (milestone_id) REFERENCES public.milestones(id),
  CONSTRAINT milestone_dependencies_depends_on_milestone_id_fkey FOREIGN KEY (depends_on_milestone_id) REFERENCES public.milestones(id)
);
CREATE TABLE public.milestone_tasks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  milestone_id uuid NOT NULL,
  tache_id uuid NOT NULL,
  weight integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT milestone_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT milestone_tasks_milestone_id_fkey FOREIGN KEY (milestone_id) REFERENCES public.milestones(id),
  CONSTRAINT milestone_tasks_tache_id_fkey FOREIGN KEY (tache_id) REFERENCES public.tache(id)
);
CREATE TABLE public.milestones (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  name character varying NOT NULL,
  description text,
  start_date date NOT NULL,
  due_date date NOT NULL,
  status character varying NOT NULL DEFAULT 'not_started'::character varying,
  priority character varying DEFAULT 'medium'::character varying,
  color character varying,
  progress_mode character varying DEFAULT 'auto'::character varying,
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  projet_id uuid,
  CONSTRAINT milestones_pkey PRIMARY KEY (id),
  CONSTRAINT milestones_projet_id_fkey FOREIGN KEY (projet_id) REFERENCES public.projet(id),
  CONSTRAINT milestones_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT milestones_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  link text,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  organization_id uuid NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT notifications_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.organization_channels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT organization_channels_pkey PRIMARY KEY (id),
  CONSTRAINT organization_channels_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT organization_channels_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.organization_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['OWNER'::text, 'ADMIN'::text, 'MANAGER'::text, 'MEMBER'::text])),
  invited_by uuid NOT NULL,
  accepted_at timestamp with time zone,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT organization_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT organization_invitations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT organization_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'::text),
  description text,
  logo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  website text,
  image text,
  CONSTRAINT organizations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.prediction_risque (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  projet_id uuid NOT NULL,
  profile_id uuid,
  date_prediction timestamp with time zone DEFAULT now(),
  horizon_jours integer NOT NULL,
  type_risque text NOT NULL,
  probabilite_pct numeric CHECK (probabilite_pct >= 0::numeric AND probabilite_pct <= 100::numeric),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  organization_id uuid NOT NULL,
  justification text DEFAULT 'Prédiction générée automatiquement'::text,
  confidence numeric CHECK (confidence IS NULL OR confidence >= 0.0 AND confidence <= 1.0),
  metriques_source jsonb,
  workflow_execution_id character varying,
  modele_ia_utilise character varying,
  realise boolean,
  date_evaluation timestamp with time zone,
  CONSTRAINT prediction_risque_pkey PRIMARY KEY (id),
  CONSTRAINT prediction_risque_projet_id_fkey FOREIGN KEY (projet_id) REFERENCES public.projet(id),
  CONSTRAINT prediction_risque_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT prediction_risque_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profile_competences (
  profile_id uuid NOT NULL,
  competence_id uuid NOT NULL,
  niveau integer CHECK (niveau >= 1 AND niveau <= 5),
  date_evaluation date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  organization_id uuid NOT NULL,
  CONSTRAINT profile_competences_pkey PRIMARY KEY (profile_id, competence_id, organization_id),
  CONSTRAINT profile_competences_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT profile_competences_competence_id_fkey FOREIGN KEY (competence_id) REFERENCES public.competence(id),
  CONSTRAINT profile_competences_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  nom text NOT NULL,
  prenom text NOT NULL,
  role USER-DEFINED NOT NULL DEFAULT 'CONSULTANT'::user_role,
  avatar_url text,
  phone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  organization_id uuid,
  status USER-DEFINED DEFAULT 'offline'::user_status,
  last_seen timestamp with time zone DEFAULT now(),
  manager_id uuid,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT profiles_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.project_channels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  projet_id uuid NOT NULL UNIQUE,
  organization_id uuid NOT NULL,
  name text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_channels_pkey PRIMARY KEY (id),
  CONSTRAINT project_channels_projet_id_fkey FOREIGN KEY (projet_id) REFERENCES public.projet(id),
  CONSTRAINT project_channels_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.projet (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  chef_projet_id uuid,
  nom text NOT NULL UNIQUE,
  description text,
  date_debut date NOT NULL,
  date_fin_prevue date,
  statut text NOT NULL DEFAULT 'ACTIF'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  organization_id uuid NOT NULL,
  CONSTRAINT projet_pkey PRIMARY KEY (id),
  CONSTRAINT projet_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.client(id),
  CONSTRAINT projet_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT projet_chef_projet_id_fkey FOREIGN KEY (chef_projet_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.recommandation_action (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  projet_id uuid NOT NULL,
  prediction_id uuid,
  date_recommandation timestamp with time zone DEFAULT now(),
  statut text DEFAULT 'EN_ATTENTE'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  organization_id uuid NOT NULL,
  recommandations jsonb,
  CONSTRAINT recommandation_action_pkey PRIMARY KEY (id),
  CONSTRAINT recommandation_action_prediction_id_fkey FOREIGN KEY (prediction_id) REFERENCES public.prediction_risque(id),
  CONSTRAINT recommandation_action_projet_id_fkey FOREIGN KEY (projet_id) REFERENCES public.projet(id),
  CONSTRAINT recommandation_action_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.reporting_destinataires (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL,
  role character varying NOT NULL,
  actif boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT reporting_destinataires_pkey PRIMARY KEY (id)
);
CREATE TABLE public.score_sante_projet (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  projet_id uuid NOT NULL,
  date_analyse date NOT NULL,
  score_global numeric CHECK (score_global >= 0::numeric AND score_global <= 100::numeric),
  couleur_risque text NOT NULL,
  raisonnement_ia text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  organization_id uuid NOT NULL,
  CONSTRAINT score_sante_projet_pkey PRIMARY KEY (id),
  CONSTRAINT score_sante_projet_projet_id_fkey FOREIGN KEY (projet_id) REFERENCES public.projet(id),
  CONSTRAINT score_sante_projet_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.tache (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  projet_id uuid NOT NULL,
  livrable_id uuid,
  profile_responsable_id uuid,
  nom text NOT NULL,
  description text,
  charge_estimee_jh numeric,
  date_fin_cible date,
  statut USER-DEFINED NOT NULL DEFAULT 'TODO'::statut_tache,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  organization_id uuid NOT NULL,
  position integer DEFAULT 0,
  color text,
  tags ARRAY DEFAULT ARRAY[]::text[],
  priority text DEFAULT 'medium'::text CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])),
  CONSTRAINT tache_pkey PRIMARY KEY (id),
  CONSTRAINT tache_livrable_id_fkey FOREIGN KEY (livrable_id) REFERENCES public.livrable(id),
  CONSTRAINT tache_projet_id_fkey FOREIGN KEY (projet_id) REFERENCES public.projet(id),
  CONSTRAINT tache_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT tache_profile_responsable_id_fkey FOREIGN KEY (profile_responsable_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.temps_passe (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  projet_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  tache_id uuid,
  date date NOT NULL,
  heures_travaillees numeric NOT NULL CHECK (heures_travaillees >= 0::numeric),
  source_outil text,
  validation_statut text DEFAULT 'EN_ATTENTE'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  organization_id uuid NOT NULL,
  CONSTRAINT temps_passe_pkey PRIMARY KEY (id),
  CONSTRAINT temps_passe_projet_id_fkey FOREIGN KEY (projet_id) REFERENCES public.projet(id),
  CONSTRAINT temps_passe_tache_id_fkey FOREIGN KEY (tache_id) REFERENCES public.tache(id),
  CONSTRAINT temps_passe_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT temps_passe_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.typing_indicators (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL,
  channel_type text NOT NULL CHECK (channel_type = ANY (ARRAY['organization'::text, 'project'::text, 'direct'::text])),
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  organization_id uuid NOT NULL,
  CONSTRAINT typing_indicators_pkey PRIMARY KEY (id),
  CONSTRAINT typing_indicators_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT typing_indicators_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.user_organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'MEMBER'::text CHECK (role = ANY (ARRAY['ADMIN'::text, 'MANAGER'::text, 'CONSULTANT'::text, 'MEMBER'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_organizations_pkey PRIMARY KEY (id),
  CONSTRAINT user_organizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_organizations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);