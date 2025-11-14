// Zod validators for messaging API requests
import { z } from "zod";

// Channel types
export const channelTypeSchema = z.enum(["organization", "project"]);
export const messageTypeSchema = z.enum(["channel", "direct"]);

// ============================================================================
// ORGANIZATION CHANNELS
// ============================================================================

export const createOrganizationChannelSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID"),
  name: z
    .string()
    .min(1, "Channel name is required")
    .max(100, "Channel name is too long"),
  description: z
    .string()
    .max(500, "Description is too long")
    .nullable()
    .optional(),
});

export const updateOrganizationChannelSchema = z.object({
  name: z
    .string()
    .min(1, "Channel name is required")
    .max(100, "Channel name is too long")
    .optional(),
  description: z
    .string()
    .max(500, "Description is too long")
    .nullable()
    .optional(),
});

// ============================================================================
// CHANNEL MESSAGES
// ============================================================================

export const createChannelMessageSchema = z.object({
  channelId: z.string().uuid("Invalid channel ID"),
  channelType: channelTypeSchema,
  content: z
    .string()
    .min(1, "Message content is required")
    .max(5000, "Message is too long"),
  organizationId: z.string().uuid("Invalid organization ID"),
});

export function validateCreateChannelMessage(data: unknown) {
  const result = createChannelMessageSchema.safeParse(data);
  return {
    success: result.success,
    data: result.success ? result.data : null,
    error: result.success ? null : result.error.format(),
  };
}

export const updateChannelMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message content is required")
    .max(5000, "Message is too long"),
});

export const listChannelMessagesSchema = z.object({
  channelId: z.string().uuid("Invalid channel ID"),
  channelType: channelTypeSchema,
  before: z.string().uuid("Invalid message ID").optional(), // For pagination
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// ============================================================================
// DIRECT MESSAGES
// ============================================================================

export const createDirectMessageSchema = z.object({
  recipientId: z.string().uuid("Invalid recipient ID"),
  content: z
    .string()
    .min(1, "Message content is required")
    .max(5000, "Message is too long"),
  organizationId: z.string().uuid("Invalid organization ID"),
});

export const updateDirectMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message content is required")
    .max(5000, "Message is too long"),
});

export const listDirectMessagesSchema = z.object({
  recipientId: z.string().uuid("Invalid recipient ID"),
  before: z.string().uuid("Invalid message ID").optional(), // For pagination
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const markDirectMessagesAsReadSchema = z.object({
  messageIds: z.array(z.string().uuid("Invalid message ID")).min(1).max(100),
});

// ============================================================================
// MESSAGE REACTIONS
// ============================================================================

export const addReactionSchema = z.object({
  messageId: z.string().uuid("Invalid message ID"),
  messageType: messageTypeSchema,
  emoji: z.string().min(1, "Emoji is required").max(10, "Emoji is too long"),
  organizationId: z.string().uuid("Invalid organization ID"),
});

export const removeReactionSchema = z.object({
  reactionId: z.string().uuid("Invalid reaction ID"),
});

// ============================================================================
// TYPING INDICATORS
// ============================================================================

export const setTypingIndicatorSchema = z.object({
  channelId: z.string().uuid("Invalid channel ID"),
  channelType: z.union([channelTypeSchema, z.literal("direct")]),
  organizationId: z.string().uuid("Invalid organization ID"),
});

export const removeTypingIndicatorSchema = z.object({
  channelId: z.string().uuid("Invalid channel ID"),
  channelType: z.union([channelTypeSchema, z.literal("direct")]),
});

// Export types
export type CreateOrganizationChannelInput = z.infer<
  typeof createOrganizationChannelSchema
>;
export type UpdateOrganizationChannelInput = z.infer<
  typeof updateOrganizationChannelSchema
>;
export type CreateChannelMessageInput = z.infer<
  typeof createChannelMessageSchema
>;
export type UpdateChannelMessageInput = z.infer<
  typeof updateChannelMessageSchema
>;
export type ListChannelMessagesQuery = z.infer<
  typeof listChannelMessagesSchema
>;
export type CreateDirectMessageInput = z.infer<
  typeof createDirectMessageSchema
>;
export type UpdateDirectMessageInput = z.infer<
  typeof updateDirectMessageSchema
>;
export type ListDirectMessagesQuery = z.infer<typeof listDirectMessagesSchema>;
export type MarkDirectMessagesAsReadInput = z.infer<
  typeof markDirectMessagesAsReadSchema
>;
export type AddReactionInput = z.infer<typeof addReactionSchema>;
export type RemoveReactionInput = z.infer<typeof removeReactionSchema>;
export type SetTypingIndicatorInput = z.infer<typeof setTypingIndicatorSchema>;
export type RemoveTypingIndicatorInput = z.infer<
  typeof removeTypingIndicatorSchema
>;
