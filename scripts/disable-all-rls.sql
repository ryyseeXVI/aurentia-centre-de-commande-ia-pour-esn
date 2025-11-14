-- ============================================================================
-- DISABLE ALL ROW LEVEL SECURITY POLICIES
-- ============================================================================
-- WARNING: This script removes ALL security isolation between organizations
-- USE ONLY FOR: Local development, POC, demos
-- NEVER USE IN: Production with real client data
-- ============================================================================

-- Disable RLS on all tables with rls_enabled = true
-- This allows all authenticated users to see ALL data across ALL organizations

-- Core business tables
ALTER TABLE client DISABLE ROW LEVEL SECURITY;
ALTER TABLE projet DISABLE ROW LEVEL SECURITY;
ALTER TABLE livrable DISABLE ROW LEVEL SECURITY;
ALTER TABLE competence DISABLE ROW LEVEL SECURITY;
ALTER TABLE consultant_competence DISABLE ROW LEVEL SECURITY;
ALTER TABLE affectation DISABLE ROW LEVEL SECURITY;
ALTER TABLE tache DISABLE ROW LEVEL SECURITY;
ALTER TABLE temps_passe DISABLE ROW LEVEL SECURITY;
ALTER TABLE incident DISABLE ROW LEVEL SECURITY;
ALTER TABLE budget_projet DISABLE ROW LEVEL SECURITY;
ALTER TABLE facture DISABLE ROW LEVEL SECURITY;
ALTER TABLE score_sante_projet DISABLE ROW LEVEL SECURITY;
ALTER TABLE detection_derive DISABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_risque DISABLE ROW LEVEL SECURITY;
ALTER TABLE recommandation_action DISABLE ROW LEVEL SECURITY;

-- User and organization tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations DISABLE ROW LEVEL SECURITY;

-- Messaging tables
ALTER TABLE organization_channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE channel_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators DISABLE ROW LEVEL SECURITY;

-- Notification and activity tables
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;

-- Organization management tables
ALTER TABLE organization_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE join_codes DISABLE ROW LEVEL SECURITY;

-- Milestone tables
ALTER TABLE milestones DISABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_dependencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_assignments DISABLE ROW LEVEL SECURITY;

-- Profile competences
ALTER TABLE profile_competences DISABLE ROW LEVEL SECURITY;

-- Group chat tables
ALTER TABLE group_chat_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_chats DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify RLS is disabled on all tables:
/*
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
*/

-- Expected result: All tables should have rls_enabled = false
