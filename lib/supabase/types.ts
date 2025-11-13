/**
 * Database type definitions generated from Supabase
 *
 * @fileoverview This file contains comprehensive TypeScript type definitions for all
 * database tables, views, functions, and enums in the Supabase schema. These types
 * provide end-to-end type safety for database operations.
 *
 * @remarks
 * - Auto-generated types - DO NOT manually edit this file
 * - Regenerate using: `npx supabase gen types typescript --project-id=<project-id>`
 * - All tables include Row (SELECT), Insert, and Update type variants
 * - Foreign key relationships are defined in the Relationships arrays
 *
 * @see {@link https://supabase.com/docs/guides/api/rest/generating-types|Supabase Type Generation}
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      affectation: {
        Row: {
          charge_allouee_pct: number
          consultant_id: string
          created_at: string | null
          date_debut: string
          date_fin_prevue: string | null
          id: string
          organization_id: string
          projet_id: string
          updated_at: string | null
        }
        Insert: {
          charge_allouee_pct: number
          consultant_id: string
          created_at?: string | null
          date_debut: string
          date_fin_prevue?: string | null
          id?: string
          organization_id: string
          projet_id: string
          updated_at?: string | null
        }
        Update: {
          charge_allouee_pct?: number
          consultant_id?: string
          created_at?: string | null
          date_debut?: string
          date_fin_prevue?: string | null
          id?: string
          organization_id?: string
          projet_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affectation_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affectation_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affectation_projet_id_fkey"
            columns: ["projet_id"]
            isOneToOne: false
            referencedRelation: "projet"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_projet: {
        Row: {
          cout_estime_total: number
          created_at: string | null
          id: string
          marge_cible_pct: number
          montant_total_vente: number
          organization_id: string
          projet_id: string
          updated_at: string | null
        }
        Insert: {
          cout_estime_total: number
          created_at?: string | null
          id?: string
          marge_cible_pct: number
          montant_total_vente: number
          organization_id: string
          projet_id: string
          updated_at?: string | null
        }
        Update: {
          cout_estime_total?: number
          created_at?: string | null
          id?: string
          marge_cible_pct?: number
          montant_total_vente?: number
          organization_id?: string
          projet_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_projet_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_projet_projet_id_fkey"
            columns: ["projet_id"]
            isOneToOne: true
            referencedRelation: "projet"
            referencedColumns: ["id"]
          },
        ]
      }
      client: {
        Row: {
          contact_principal: string | null
          contact_user_id: string | null
          created_at: string | null
          id: string
          nom: string
          organization_id: string
          secteur: string | null
          updated_at: string | null
        }
        Insert: {
          contact_principal?: string | null
          contact_user_id?: string | null
          created_at?: string | null
          id?: string
          nom: string
          organization_id: string
          secteur?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_principal?: string | null
          contact_user_id?: string | null
          created_at?: string | null
          id?: string
          nom?: string
          organization_id?: string
          secteur?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_contact_user_id_fkey"
            columns: ["contact_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      competence: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          nom: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          nom: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          nom?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competence_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      consultant: {
        Row: {
          created_at: string | null
          date_embauche: string
          email: string
          id: string
          manager_id: string | null
          nom: string
          organization_id: string
          prenom: string
          role: string | null
          statut: string | null
          taux_journalier_cout: number
          taux_journalier_vente: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date_embauche: string
          email: string
          id?: string
          manager_id?: string | null
          nom: string
          organization_id: string
          prenom: string
          role?: string | null
          statut?: string | null
          taux_journalier_cout: number
          taux_journalier_vente?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date_embauche?: string
          email?: string
          id?: string
          manager_id?: string | null
          nom?: string
          organization_id?: string
          prenom?: string
          role?: string | null
          statut?: string | null
          taux_journalier_cout?: number
          taux_journalier_vente?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultant_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "consultant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultant_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultant_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consultant_competence: {
        Row: {
          competence_id: string
          consultant_id: string
          created_at: string | null
          date_evaluation: string | null
          niveau: number | null
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          competence_id: string
          consultant_id: string
          created_at?: string | null
          date_evaluation?: string | null
          niveau?: number | null
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          competence_id?: string
          consultant_id?: string
          created_at?: string | null
          date_evaluation?: string | null
          niveau?: number | null
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultant_competence_competence_id_fkey"
            columns: ["competence_id"]
            isOneToOne: false
            referencedRelation: "competence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultant_competence_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultant_competence_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      detection_derive: {
        Row: {
          consultant_id: string | null
          created_at: string | null
          date_detection: string | null
          gravite: string
          id: string
          organization_id: string
          projet_id: string
          type_derive: string
          updated_at: string | null
        }
        Insert: {
          consultant_id?: string | null
          created_at?: string | null
          date_detection?: string | null
          gravite: string
          id?: string
          organization_id: string
          projet_id: string
          type_derive: string
          updated_at?: string | null
        }
        Update: {
          consultant_id?: string | null
          created_at?: string | null
          date_detection?: string | null
          gravite?: string
          id?: string
          organization_id?: string
          projet_id?: string
          type_derive?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "detection_derive_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detection_derive_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detection_derive_projet_id_fkey"
            columns: ["projet_id"]
            isOneToOne: false
            referencedRelation: "projet"
            referencedColumns: ["id"]
          },
        ]
      }
      facture: {
        Row: {
          created_at: string | null
          date_facturation: string
          id: string
          montant: number
          organization_id: string
          projet_id: string
          statut_paiement: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_facturation: string
          id?: string
          montant: number
          organization_id: string
          projet_id: string
          statut_paiement?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_facturation?: string
          id?: string
          montant?: number
          organization_id?: string
          projet_id?: string
          statut_paiement?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facture_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facture_projet_id_fkey"
            columns: ["projet_id"]
            isOneToOne: false
            referencedRelation: "projet"
            referencedColumns: ["id"]
          },
        ]
      }
      incident: {
        Row: {
          consultant_assigne_id: string | null
          created_at: string | null
          date_ouverture: string
          date_resolution: string | null
          id: string
          organization_id: string
          projet_id: string
          severite: string | null
          statut: string | null
          titre: string
          updated_at: string | null
        }
        Insert: {
          consultant_assigne_id?: string | null
          created_at?: string | null
          date_ouverture: string
          date_resolution?: string | null
          id?: string
          organization_id: string
          projet_id: string
          severite?: string | null
          statut?: string | null
          titre: string
          updated_at?: string | null
        }
        Update: {
          consultant_assigne_id?: string | null
          created_at?: string | null
          date_ouverture?: string
          date_resolution?: string | null
          id?: string
          organization_id?: string
          projet_id?: string
          severite?: string | null
          statut?: string | null
          titre?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_consultant_assigne_id_fkey"
            columns: ["consultant_assigne_id"]
            isOneToOne: false
            referencedRelation: "consultant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_projet_id_fkey"
            columns: ["projet_id"]
            isOneToOne: false
            referencedRelation: "projet"
            referencedColumns: ["id"]
          },
        ]
      }
      livrable: {
        Row: {
          created_at: string | null
          date_cible: string | null
          date_livraison_reelle: string | null
          description: string | null
          id: string
          nom: string
          organization_id: string
          projet_id: string
          statut_avancement: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_cible?: string | null
          date_livraison_reelle?: string | null
          description?: string | null
          id?: string
          nom: string
          organization_id: string
          projet_id: string
          statut_avancement?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_cible?: string | null
          date_livraison_reelle?: string | null
          description?: string | null
          id?: string
          nom?: string
          organization_id?: string
          projet_id?: string
          statut_avancement?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "livrable_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "livrable_projet_id_fkey"
            columns: ["projet_id"]
            isOneToOne: false
            referencedRelation: "projet"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      prediction_risque: {
        Row: {
          consultant_id: string | null
          created_at: string | null
          date_prediction: string | null
          horizon_jours: number
          id: string
          organization_id: string
          probabilite_pct: number | null
          projet_id: string
          type_risque: string
          updated_at: string | null
        }
        Insert: {
          consultant_id?: string | null
          created_at?: string | null
          date_prediction?: string | null
          horizon_jours: number
          id?: string
          organization_id: string
          probabilite_pct?: number | null
          projet_id: string
          type_risque: string
          updated_at?: string | null
        }
        Update: {
          consultant_id?: string | null
          created_at?: string | null
          date_prediction?: string | null
          horizon_jours?: number
          id?: string
          organization_id?: string
          probabilite_pct?: number | null
          projet_id?: string
          type_risque?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prediction_risque_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prediction_risque_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prediction_risque_projet_id_fkey"
            columns: ["projet_id"]
            isOneToOne: false
            referencedRelation: "projet"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          nom: string
          organization_id: string | null
          phone: string | null
          prenom: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          nom: string
          organization_id?: string | null
          phone?: string | null
          prenom: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          nom?: string
          organization_id?: string | null
          phone?: string | null
          prenom?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      projet: {
        Row: {
          chef_projet_id: string | null
          client_id: string
          created_at: string | null
          date_debut: string
          date_fin_prevue: string | null
          description: string | null
          id: string
          nom: string
          organization_id: string
          statut: string
          updated_at: string | null
        }
        Insert: {
          chef_projet_id?: string | null
          client_id: string
          created_at?: string | null
          date_debut: string
          date_fin_prevue?: string | null
          description?: string | null
          id?: string
          nom: string
          organization_id: string
          statut?: string
          updated_at?: string | null
        }
        Update: {
          chef_projet_id?: string | null
          client_id?: string
          created_at?: string | null
          date_debut?: string
          date_fin_prevue?: string | null
          description?: string | null
          id?: string
          nom?: string
          organization_id?: string
          statut?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projet_chef_projet_id_fkey"
            columns: ["chef_projet_id"]
            isOneToOne: false
            referencedRelation: "consultant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projet_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projet_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      recommandation_action: {
        Row: {
          created_at: string | null
          date_recommandation: string | null
          description_action: string
          id: string
          organization_id: string
          prediction_id: string | null
          projet_id: string
          statut: string | null
          type_action: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_recommandation?: string | null
          description_action: string
          id?: string
          organization_id: string
          prediction_id?: string | null
          projet_id: string
          statut?: string | null
          type_action: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_recommandation?: string | null
          description_action?: string
          id?: string
          organization_id?: string
          prediction_id?: string | null
          projet_id?: string
          statut?: string | null
          type_action?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommandation_action_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommandation_action_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "prediction_risque"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommandation_action_projet_id_fkey"
            columns: ["projet_id"]
            isOneToOne: false
            referencedRelation: "projet"
            referencedColumns: ["id"]
          },
        ]
      }
      score_sante_projet: {
        Row: {
          couleur_risque: string
          created_at: string | null
          date_analyse: string
          id: string
          organization_id: string
          projet_id: string
          raisonnement_ia: string | null
          score_global: number | null
          updated_at: string | null
        }
        Insert: {
          couleur_risque: string
          created_at?: string | null
          date_analyse: string
          id?: string
          organization_id: string
          projet_id: string
          raisonnement_ia?: string | null
          score_global?: number | null
          updated_at?: string | null
        }
        Update: {
          couleur_risque?: string
          created_at?: string | null
          date_analyse?: string
          id?: string
          organization_id?: string
          projet_id?: string
          raisonnement_ia?: string | null
          score_global?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "score_sante_projet_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_sante_projet_projet_id_fkey"
            columns: ["projet_id"]
            isOneToOne: false
            referencedRelation: "projet"
            referencedColumns: ["id"]
          },
        ]
      }
      tache: {
        Row: {
          charge_estimee_jh: number | null
          consultant_responsable_id: string | null
          created_at: string | null
          date_fin_cible: string | null
          description: string | null
          id: string
          livrable_id: string | null
          nom: string
          organization_id: string
          projet_id: string
          statut: string | null
          updated_at: string | null
        }
        Insert: {
          charge_estimee_jh?: number | null
          consultant_responsable_id?: string | null
          created_at?: string | null
          date_fin_cible?: string | null
          description?: string | null
          id?: string
          livrable_id?: string | null
          nom: string
          organization_id: string
          projet_id: string
          statut?: string | null
          updated_at?: string | null
        }
        Update: {
          charge_estimee_jh?: number | null
          consultant_responsable_id?: string | null
          created_at?: string | null
          date_fin_cible?: string | null
          description?: string | null
          id?: string
          livrable_id?: string | null
          nom?: string
          organization_id?: string
          projet_id?: string
          statut?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tache_consultant_responsable_id_fkey"
            columns: ["consultant_responsable_id"]
            isOneToOne: false
            referencedRelation: "consultant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tache_livrable_id_fkey"
            columns: ["livrable_id"]
            isOneToOne: false
            referencedRelation: "livrable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tache_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tache_projet_id_fkey"
            columns: ["projet_id"]
            isOneToOne: false
            referencedRelation: "projet"
            referencedColumns: ["id"]
          },
        ]
      }
      temps_passe: {
        Row: {
          consultant_id: string
          created_at: string | null
          date: string
          heures_travaillees: number
          id: string
          organization_id: string
          projet_id: string
          source_outil: string | null
          tache_id: string | null
          updated_at: string | null
          validation_statut: string | null
        }
        Insert: {
          consultant_id: string
          created_at?: string | null
          date: string
          heures_travaillees: number
          id?: string
          organization_id: string
          projet_id: string
          source_outil?: string | null
          tache_id?: string | null
          updated_at?: string | null
          validation_statut?: string | null
        }
        Update: {
          consultant_id?: string
          created_at?: string | null
          date?: string
          heures_travaillees?: number
          id?: string
          organization_id?: string
          projet_id?: string
          source_outil?: string | null
          tache_id?: string | null
          updated_at?: string | null
          validation_statut?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "temps_passe_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "temps_passe_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "temps_passe_projet_id_fkey"
            columns: ["projet_id"]
            isOneToOne: false
            referencedRelation: "projet"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "temps_passe_tache_id_fkey"
            columns: ["tache_id"]
            isOneToOne: false
            referencedRelation: "tache"
            referencedColumns: ["id"]
          },
        ]
      }
      user_organizations: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_ca_consomme: {
        Row: {
          ca_reel: number | null
          consultant_id: string | null
          date: string | null
          projet_id: string | null
          temps_passe_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "temps_passe_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "temps_passe_projet_id_fkey"
            columns: ["projet_id"]
            isOneToOne: false
            referencedRelation: "projet"
            referencedColumns: ["id"]
          },
        ]
      }
      v_cout_consomme: {
        Row: {
          consultant_id: string | null
          cout_reel: number | null
          date: string | null
          projet_id: string | null
          temps_passe_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "temps_passe_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "consultant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "temps_passe_projet_id_fkey"
            columns: ["projet_id"]
            isOneToOne: false
            referencedRelation: "projet"
            referencedColumns: ["id"]
          },
        ]
      }
      v_marge_journaliere: {
        Row: {
          ca_total_jour: number | null
          cout_total_jour: number | null
          date: string | null
          marge_nette_jour: number | null
          projet_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "temps_passe_projet_id_fkey"
            columns: ["projet_id"]
            isOneToOne: false
            referencedRelation: "projet"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_org_role: {
        Args: { org_id: string; required_role: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_manager_or_admin: { Args: never; Returns: boolean }
      is_org_member: { Args: { org_id: string }; Returns: boolean }
    }
    Enums: {
      user_role: "ADMIN" | "MANAGER" | "CONSULTANT" | "CLIENT"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

/**
 * Helper type to extract a table's Row type
 *
 * @example
 * ```typescript
 * type Profile = Tables<'profiles'>
 * type Project = Tables<'projet'>
 * ```
 */
export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

/**
 * Helper type to extract a table's Insert type
 *
 * @example
 * ```typescript
 * type NewProfile = TablesInsert<'profiles'>
 * type NewProject = TablesInsert<'projet'>
 * ```
 */
export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

/**
 * Helper type to extract a table's Update type
 *
 * @example
 * ```typescript
 * type ProfileUpdate = TablesUpdate<'profiles'>
 * type ProjectUpdate = TablesUpdate<'projet'>
 * ```
 */
export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

/**
 * Helper type to extract enum values
 *
 * @example
 * ```typescript
 * type UserRole = Enums<'user_role'>
 * // Result: "ADMIN" | "MANAGER" | "CONSULTANT" | "CLIENT"
 * ```
 */
export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

/**
 * Helper type for composite types (currently none defined)
 *
 * @example
 * ```typescript
 * type CustomType = CompositeTypes<'custom_type'>
 * ```
 */
export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

/**
 * Constants for enums and other database constants
 *
 * @example
 * ```typescript
 * Constants.public.Enums.user_role // ["ADMIN", "MANAGER", "CONSULTANT", "CLIENT"]
 * ```
 */
export const Constants = {
  public: {
    Enums: {
      user_role: ["ADMIN", "MANAGER", "CONSULTANT", "CLIENT"],
    },
  },
} as const
