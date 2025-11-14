-- Migration: Add OWNER role to user_role enum
-- Description: Adds the OWNER role which has unrestricted access to all data across all organizations
-- Created: 2025-11-14

-- Add OWNER to the user_role enum
-- Note: PostgreSQL doesn't support ALTER TYPE ... ADD VALUE in a transaction block if the type is used in a table
-- This is a safe operation as long as no concurrent transactions are using the enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'OWNER';

-- Add comment to document the OWNER role
COMMENT ON TYPE user_role IS 'User roles in the system. OWNER has unrestricted access to all data across all organizations, ADMIN has full access within their organization, MANAGER can manage projects and consultants, CONSULTANT is a regular user, CLIENT is a read-only external user.';
