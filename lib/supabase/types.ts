export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          description: string | null
          resource_type: string | null
          resource_id: string | null
          metadata: Json | null
          created_at: string | null
          organization_id: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          description?: string | null
          resource_type?: string | null
          resource_id?: string | null
          metadata?: Json | null
          created_at?: string | null
          organization_id: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          description?: string | null
          resource_type?: string | null
          resource_id?: string | null
          metadata?: Json | null
          created_at?: string | null
          organization_id?: string
        }
      }
      affectation: {
        Row: {
          id: string
          projet_id: string
          consultant_id: string
          date_debut: string
          date_fin_prevue: string | null
          charge_allouee_pct: number
          created_at: string | null
          updated_at: string | null
          organization_id: string
        }
        Insert: {
          id?: string
          projet_id: string
          consultant_id: string
          date_debut: string
          date_fin_prevue?: string | null
          charge_allouee_pct: number
          created_at?: string | null
          updated_at?: string | null
          organization_id: string
        }
        Update: {
          id?: string
          projet_id?: string
          consultant_id?: string
          date_debut?: string
          date_fin_prevue?: string | null
          charge_allouee_pct?: number
          created_at?: string | null
          updated_at?: string | null
          organization_id?: string
        }
      }
      budget_projet: {
        Row: {
          id: string
          projet_id: string
          montant_total_vente: number
          cout_estime_total: number
          marge_cible_pct: number
          created_at: string | null
          updated_at: string | null
          organization_id: string
        }
        Insert: {
          id?: string
          projet_id: string
          montant_total_vente: number
          cout_estime_total: number
          marge_cible_pct: number
          created_at?: string | null
          updated_at?: string | null
          organization_id: string
        }
        Update: {
          id?: string
          projet_id?: string
          montant_total_vente?: number
          cout_estime_total?: number
          marge_cible_pct?: number
          created_at?: string | null
          updated_at?: string | null
          organization_id?: string
        }
      }
      channel_messages: {
        Row: {
          id: string
          channel_id: string
          channel_type: string
          sender_id: string
          content: string
          edited_at: string | null
          created_at: string | null
          updated_at: string | null
          organization_id: string
        }
        Insert: {
          id?: string
          channel_id: string
          channel_type: string
          sender_id: string
          content: string
          edited_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          organization_id: string
        }
        Update: {
          id?: string
          channel_id?: string
          channel_type?: string
          sender_id?: string
          content?: string
          edited_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          organization_id?: string
        }
      }
      client: {
        Row: {
          id: string
          nom: string
          contact_principal: string | null
          secteur: string | null
          created_at: string | null
          updated_at: string | null
          contact_user_id: string | null
          organization_id: string
        }
        Insert: {
          id?: string
          nom: string
          contact_principal?: string | null
          secteur?: string | null
          created_at?: string | null
          updated_at?: string | null
          contact_user_id?: string | null
          organization_id: string
        }
        Update: {
          id?: string
          nom?: string
          contact_principal?: string | null
          secteur?: string | null
          created_at?: string | null
          updated_at?: string | null
          contact_user_id?: string | null
          organization_id?: string
        }
      }
      competence: {
        Row: {
          id: string
          nom: string
          description: string | null
          created_at: string | null
          updated_at: string | null
          organization_id: string
        }
        Insert: {
          id?: string
          nom: string
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
          organization_id: string
        }
        Update: {
          id?: string
          nom?: string
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
          organization_id?: string
        }
      }
      consultant: {
        Row: {
          id: string
          manager_id: string | null
          nom: string
          prenom: string
          email: string
          date_embauche: string
          taux_journalier_cout: number
          taux_journalier_vente: number | null
          role: string | null
          statut: string | null
          created_at: string | null
          updated_at: string | null
          user_id: string | null
          organization_id: string
        }
        Insert: {
          id?: string
          manager_id?: string | null
          nom: string
          prenom: string
          email: string
          date_embauche: string
          taux_journalier_cout: number
          taux_journalier_vente?: number | null
          role?: string | null
          statut?: string | null
          created_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          organization_id: string
        }
        Update: {
          id?: string
          manager_id?: string | null
          nom?: string
          prenom?: string
          email?: string
          date_embauche?: string
          taux_journalier_cout?: number
          taux_journalier_vente?: number | null
          role?: string | null
          statut?: string | null
          created_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          organization_id?: string
        }
      }
      consultant_competence: {
        Row: {
          consultant_id: string
          competence_id: string
          niveau: number | null
          date_evaluation: string | null
          created_at: string | null
          updated_at: string | null
          organization_id: string
        }
        Insert: {
          consultant_id: string
          competence_id: string
          niveau?: number | null
          date_evaluation?: string | null
          created_at?: string | null
          updated_at?: string | null
          organization_id: string
        }
        Update: {
          consultant_id?: string
          competence_id?: string
          niveau?: number | null
          date_evaluation?: string | null
          created_at?: string | null
          updated_at?: string | null
          organization_id?: string
        }
      }
      detection_derive: {
        Row: {
          id: string
          projet_id: string
          consultant_id: string | null
          date_detection: string | null
          type_derive: string
          gravite: string
          created_at: string | null
          updated_at: string | null
          organization_id: string
          description: string | null
          metriques: Json | null
        }
        Insert: {
          id?: string
          projet_id: string
          consultant_id?: string | null
          date_detection?: string | null
          type_derive: string
          gravite: string
          created_at?: string | null
          updated_at?: string | null
          organization_id: string
          description?: string | null
          metriques?: Json | null
        }
        Update: {
          id?: string
          projet_id?: string
          consultant_id?: string | null
          date_detection?: string | null
          type_derive?: string
          gravite?: string
          created_at?: string | null
          updated_at?: string | null
          organization_id?: string
          description?: string | null
          metriques?: Json | null
        }
      }
      facture: {
        Row: {
          id: string
          projet_id: string
          montant: number
          montant_total: number
          date_emission: string
          date_facturation: string
          statut_paiement: string | null
          created_at: string | null
          updated_at: string | null
          organization_id: string
        }
        Insert: {
          id?: string
          projet_id: string
          montant: number
          montant_total: number
          date_emission: string
          date_facturation: string
          statut_paiement?: string | null
          created_at?: string | null
          updated_at?: string | null
          organization_id: string
        }
        Update: {
          id?: string
          projet_id?: string
          montant?: number
          montant_total?: number
          date_emission?: string
          date_facturation?: string
          statut_paiement?: string | null
          created_at?: string | null
          updated_at?: string | null
          organization_id?: string
        }
      }
      incident: {
        Row: {
          id: string
          projet_id: string
          consultant_assigne_id: string | null
          titre: string
          severite: string | null
          statut: string | null
          date_ouverture: string
          date_resolution: string | null
          created_at: string | null
          updated_at: string | null
          organization_id: string
        }
        Insert: {
          id?: string
          projet_id: string
          consultant_assigne_id?: string | null
          titre: string
          severite?: string | null
          statut?: string | null
          date_ouverture: string
          date_resolution?: string | null
          created_at?: string | null
          updated_at?: string | null
          organization_id: string
        }
        Update: {
          id?: string
          projet_id?: string
          consultant_assigne_id?: string | null
          titre?: string
          severite?: string | null
          statut?: string | null
          date_ouverture?: string
          date_resolution?: string | null
          created_at?: string | null
          updated_at?: string | null
          organization_id?: string
        }
      }
      livrable: {
        Row: {
          id: string
          projet_id: string
          nom: string
          description: string | null
          date_cible: string | null
          date_livraison_reelle: string | null
          statut_avancement: string | null
          created_at: string | null
          updated_at: string | null
          organization_id: string
        }
        Insert: {
          id?: string
          projet_id: string
          nom: string
          description?: string | null
          date_cible?: string | null
          date_livraison_reelle?: string | null
          statut_avancement?: string | null
          created_at?: string | null
          updated_at?: string | null
          organization_id: string
        }
        Update: {
          id?: string
          projet_id?: string
          nom?: string
          description?: string | null
          date_cible?: string | null
          date_livraison_reelle?: string | null
          statut_avancement?: string | null
          created_at?: string | null
          updated_at?: string | null
          organization_id?: string
        }
      }
      organization_channels: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          created_by: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          created_by: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          created_by?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          image: string | null
          website: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          logo_url?: string | null
          image?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          logo_url?: string | null
          image?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      prediction_risque: {
        Row: {
          id: string
          projet_id: string
          consultant_id: string | null
          date_prediction: string | null
          horizon_jours: number
          type_risque: string
          probabilite_pct: number | null
          created_at: string | null
          updated_at: string | null
          organization_id: string
          justification: string | null
          confidence: number | null
          metriques_source: Json | null
          workflow_execution_id: string | null
          modele_ia_utilise: string | null
          realise: boolean | null
          date_evaluation: string | null
        }
        Insert: {
          id?: string
          projet_id: string
          consultant_id?: string | null
          date_prediction?: string | null
          horizon_jours: number
          type_risque: string
          probabilite_pct?: number | null
          created_at?: string | null
          updated_at?: string | null
          organization_id: string
          justification?: string | null
          confidence?: number | null
          metriques_source?: Json | null
          workflow_execution_id?: string | null
          modele_ia_utilise?: string | null
          realise?: boolean | null
          date_evaluation?: string | null
        }
        Update: {
          id?: string
          projet_id?: string
          consultant_id?: string | null
          date_prediction?: string | null
          horizon_jours?: number
          type_risque?: string
          probabilite_pct?: number | null
          created_at?: string | null
          updated_at?: string | null
          organization_id?: string
          justification?: string | null
          confidence?: number | null
          metriques_source?: Json | null
          workflow_execution_id?: string | null
          modele_ia_utilise?: string | null
          realise?: boolean | null
          date_evaluation?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          nom: string
          prenom: string
          role: 'ADMIN' | 'MANAGER' | 'CONSULTANT' | 'CLIENT'
          avatar_url: string | null
          phone: string | null
          created_at: string
          updated_at: string
          organization_id: string | null
          status: 'online' | 'offline' | 'away' | null
          last_seen: string | null
        }
        Insert: {
          id: string
          email: string
          nom: string
          prenom: string
          role?: 'ADMIN' | 'MANAGER' | 'CONSULTANT' | 'CLIENT'
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
          organization_id?: string | null
          status?: 'online' | 'offline' | 'away' | null
          last_seen?: string | null
        }
        Update: {
          id?: string
          email?: string
          nom?: string
          prenom?: string
          role?: 'ADMIN' | 'MANAGER' | 'CONSULTANT' | 'CLIENT'
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
          organization_id?: string | null
          status?: 'online' | 'offline' | 'away' | null
          last_seen?: string | null
        }
      }
      projet: {
        Row: {
          id: string
          client_id: string
          chef_projet_id: string | null
          nom: string
          description: string | null
          date_debut: string
          date_fin_prevue: string | null
          statut: string
          created_at: string | null
          updated_at: string | null
          organization_id: string
        }
        Insert: {
          id?: string
          client_id: string
          chef_projet_id?: string | null
          nom: string
          description?: string | null
          date_debut: string
          date_fin_prevue?: string | null
          statut?: string
          created_at?: string | null
          updated_at?: string | null
          organization_id: string
        }
        Update: {
          id?: string
          client_id?: string
          chef_projet_id?: string | null
          nom?: string
          description?: string | null
          date_debut?: string
          date_fin_prevue?: string | null
          statut?: string
          created_at?: string | null
          updated_at?: string | null
          organization_id?: string
        }
      }
      recommandation_action: {
        Row: {
          id: string
          projet_id: string
          prediction_id: string | null
          date_recommandation: string | null
          statut: string | null
          created_at: string | null
          updated_at: string | null
          organization_id: string
          recommandations: Json | null
        }
        Insert: {
          id?: string
          projet_id: string
          prediction_id?: string | null
          date_recommandation?: string | null
          statut?: string | null
          created_at?: string | null
          updated_at?: string | null
          organization_id: string
          recommandations?: Json | null
        }
        Update: {
          id?: string
          projet_id?: string
          prediction_id?: string | null
          date_recommandation?: string | null
          statut?: string | null
          created_at?: string | null
          updated_at?: string | null
          organization_id?: string
          recommandations?: Json | null
        }
      }
      score_sante_projet: {
        Row: {
          id: string
          projet_id: string
          date_analyse: string
          score_global: number | null
          couleur_risque: string
          raisonnement_ia: string | null
          created_at: string | null
          updated_at: string | null
          organization_id: string
        }
        Insert: {
          id?: string
          projet_id: string
          date_analyse: string
          score_global?: number | null
          couleur_risque: string
          raisonnement_ia?: string | null
          created_at?: string | null
          updated_at?: string | null
          organization_id: string
        }
        Update: {
          id?: string
          projet_id?: string
          date_analyse?: string
          score_global?: number | null
          couleur_risque?: string
          raisonnement_ia?: string | null
          created_at?: string | null
          updated_at?: string | null
          organization_id?: string
        }
      }
      tache: {
        Row: {
          id: string
          projet_id: string
          livrable_id: string | null
          consultant_responsable_id: string | null
          nom: string
          description: string | null
          charge_estimee_jh: number | null
          date_fin_cible: string | null
          statut: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED'
          created_at: string | null
          updated_at: string | null
          organization_id: string
          position: number | null
          color: string | null
          tags: string[] | null
        }
        Insert: {
          id?: string
          projet_id: string
          livrable_id?: string | null
          consultant_responsable_id?: string | null
          nom: string
          description?: string | null
          charge_estimee_jh?: number | null
          date_fin_cible?: string | null
          statut?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED'
          created_at?: string | null
          updated_at?: string | null
          organization_id: string
          position?: number | null
          color?: string | null
          tags?: string[] | null
        }
        Update: {
          id?: string
          projet_id?: string
          livrable_id?: string | null
          consultant_responsable_id?: string | null
          nom?: string
          description?: string | null
          charge_estimee_jh?: number | null
          date_fin_cible?: string | null
          statut?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED'
          created_at?: string | null
          updated_at?: string | null
          organization_id?: string
          position?: number | null
          color?: string | null
          tags?: string[] | null
        }
      }
      temps_passe: {
        Row: {
          id: string
          projet_id: string
          consultant_id: string
          tache_id: string | null
          date: string
          heures_travaillees: number
          source_outil: string | null
          validation_statut: string | null
          created_at: string | null
          updated_at: string | null
          organization_id: string
        }
        Insert: {
          id?: string
          projet_id: string
          consultant_id: string
          tache_id?: string | null
          date: string
          heures_travaillees: number
          source_outil?: string | null
          validation_statut?: string | null
          created_at?: string | null
          updated_at?: string | null
          organization_id: string
        }
        Update: {
          id?: string
          projet_id?: string
          consultant_id?: string
          tache_id?: string | null
          date?: string
          heures_travaillees?: number
          source_outil?: string | null
          validation_statut?: string | null
          created_at?: string | null
          updated_at?: string | null
          organization_id?: string
        }
      }
      user_organizations: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      statut_tache: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED'
      user_role: 'ADMIN' | 'MANAGER' | 'CONSULTANT' | 'CLIENT'
      user_status: 'online' | 'offline' | 'away'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
