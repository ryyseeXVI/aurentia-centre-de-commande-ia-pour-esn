-- Convert VARCHAR columns to TEXT type
-- Migration: 20251113191449_convert_varchar_to_text
-- Purpose: Convert all VARCHAR columns to TEXT for better flexibility and PostgreSQL best practices

-- ============================================================================
-- WHY CONVERT VARCHAR TO TEXT?
-- ============================================================================
--
-- In PostgreSQL (and Supabase):
-- 1. TEXT and VARCHAR have identical performance characteristics
-- 2. TEXT is more flexible (no arbitrary length limits)
-- 3. VARCHAR length constraints are enforced at application level anyway
-- 4. PostgreSQL documentation recommends TEXT for variable-length strings
-- 5. No storage overhead difference between TEXT and VARCHAR
--
-- SAFETY: This migration is safe and will not affect existing data or performance

-- ============================================================================
-- PROFILES TABLE - Convert VARCHAR to TEXT
-- ============================================================================

-- Convert email from VARCHAR(255) to TEXT
ALTER TABLE profiles
  ALTER COLUMN email TYPE TEXT;

-- Convert nom (last name) from VARCHAR(100) to TEXT
ALTER TABLE profiles
  ALTER COLUMN nom TYPE TEXT;

-- Convert prenom (first name) from VARCHAR(100) to TEXT
ALTER TABLE profiles
  ALTER COLUMN prenom TYPE TEXT;

-- Convert phone from VARCHAR(20) to TEXT
ALTER TABLE profiles
  ALTER COLUMN phone TYPE TEXT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- All other tables already use TEXT for string columns ✓
-- Tables checked: client, consultant, projet, competence, tache, livrable,
--                 affectation, temps_passe, incident, facture, etc.

-- Add column comments
COMMENT ON COLUMN profiles.email IS 'User email address';
COMMENT ON COLUMN profiles.nom IS 'User last name';
COMMENT ON COLUMN profiles.prenom IS 'User first name';
COMMENT ON COLUMN profiles.phone IS 'User phone number';
