// Zod validators for invitation and organization management API requests
import { z } from "zod";

// User roles (must match database enum)
// OWNER has unrestricted access to all data across all organizations
export const userRoleSchema = z.enum(["ADMIN", "MANAGER", "CONSULTANT", "CLIENT", "OWNER"]);

// ============================================================================
// ORGANIZATION SETTINGS
// ============================================================================

export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, "Organization name is required")
    .max(100, "Organization name is too long")
    .optional(),
  description: z
    .string()
    .max(500, "Description is too long")
    .nullable()
    .optional(),
  logoUrl: z
    .string()
    .url("Invalid logo URL")
    .max(500, "Logo URL is too long")
    .nullable()
    .optional(),
});

// ============================================================================
// ORGANIZATION INVITATIONS
// ============================================================================

export const createInvitationSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID"),
  email: z.string().email("Invalid email address"),
  role: userRoleSchema,
});

export const acceptInvitationSchema = z.object({
  invitationId: z.string().uuid("Invalid invitation ID"),
});

export const revokeInvitationSchema = z.object({
  invitationId: z.string().uuid("Invalid invitation ID"),
});

export const listInvitationsSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID"),
  status: z.enum(["pending", "accepted", "all"]).default("pending"),
});

// ============================================================================
// JOIN CODES
// ============================================================================

export const createJoinCodeSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID"),
  role: z.enum(["CONSULTANT", "MANAGER"]), // Only CONSULTANT and MANAGER for join codes
  expiresAt: z
    .string()
    .datetime("Invalid expiration date")
    .nullable()
    .optional(),
  maxUses: z
    .number()
    .int()
    .min(1, "Max uses must be at least 1")
    .max(1000, "Max uses is too high")
    .nullable()
    .optional(),
});

export const useJoinCodeSchema = z.object({
  code: z.string().min(8, "Invalid join code").max(8, "Invalid join code"),
});

export const deleteJoinCodeSchema = z.object({
  codeId: z.string().uuid("Invalid code ID"),
});

export const listJoinCodesSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID"),
  includeExpired: z.coerce.boolean().default(false),
});

// ============================================================================
// MEMBER MANAGEMENT
// ============================================================================

export const updateMemberRoleSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  role: userRoleSchema,
});

export const removeMemberSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
});

export const listMembersSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID"),
  role: userRoleSchema.optional(),
  search: z.string().max(100).optional(), // Search by name or email
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// Export types
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type RevokeInvitationInput = z.infer<typeof revokeInvitationSchema>;
export type ListInvitationsQuery = z.infer<typeof listInvitationsSchema>;
export type CreateJoinCodeInput = z.infer<typeof createJoinCodeSchema>;
export type UseJoinCodeInput = z.infer<typeof useJoinCodeSchema>;
export type DeleteJoinCodeInput = z.infer<typeof deleteJoinCodeSchema>;
export type ListJoinCodesQuery = z.infer<typeof listJoinCodesSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
export type ListMembersQuery = z.infer<typeof listMembersSchema>;
