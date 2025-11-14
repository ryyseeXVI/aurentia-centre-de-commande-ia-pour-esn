-- ============================================================================
-- RE-ENABLE ALL ROW LEVEL SECURITY POLICIES
-- ============================================================================
-- This script re-enables RLS on all tables that had it originally
-- Use this to restore security after POC/demo
-- ============================================================================

-- Core business tables
ALTER TABLE client ENABLE ROW LEVEL SECURITY;
ALTER TABLE projet ENABLE ROW LEVEL SECURITY;
ALTER TABLE livrable ENABLE ROW LEVEL SECURITY;
ALTER TABLE competence ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultant_competence ENABLE ROW LEVEL SECURITY;
ALTER TABLE affectation ENABLE ROW LEVEL SECURITY;
ALTER TABLE tache ENABLE ROW LEVEL SECURITY;
ALTER TABLE temps_passe ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_projet ENABLE ROW LEVEL SECURITY;
ALTER TABLE facture ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_sante_projet ENABLE ROW LEVEL SECURITY;
ALTER TABLE detection_derive ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_risque ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommandation_action ENABLE ROW LEVEL SECURITY;

-- User and organization tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- Messaging tables
ALTER TABLE organization_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Notification and activity tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Organization management tables
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_codes ENABLE ROW LEVEL SECURITY;

-- Milestone tables
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_assignments ENABLE ROW LEVEL SECURITY;

-- Profile competences
ALTER TABLE profile_competences ENABLE ROW LEVEL SECURITY;

-- Group chat tables
ALTER TABLE group_chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify RLS is re-enabled:
/*
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true
ORDER BY tablename;
*/

-- Expected result: 33 tables should have rls_enabled = true
