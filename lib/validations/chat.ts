// @ts-nocheck
import { z } from "zod";

/**
 * Chat Validation Schemas
 * Zod schemas for validating chat-related input
 */

// Send message to channel (organization/project)
export const sendChannelMessageSchema = z.object({
  channelId: z.string().uuid("Invalid channel ID"),
  channelType: z.enum(["organization", "project"], {
    errorMap: () => ({ message: "Channel type must be 'organization' or 'project'" }),
  }),
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(5000, "Message too long (max 5000 characters)")
    .trim(),
});

// Send direct message
export const sendDirectMessageSchema = z.object({
  receiverId: z.string().uuid("Invalid receiver ID"),
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(5000, "Message too long (max 5000 characters)")
    .trim(),
});

// Send group message
export const sendGroupMessageSchema = z.object({
  groupId: z.string().uuid("Invalid group ID"),
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(5000, "Message too long (max 5000 characters)")
    .trim(),
});

// Create organization channel
export const createChannelSchema = z.object({
  name: z
    .string()
    .min(1, "Channel name is required")
    .max(100, "Channel name too long (max 100 characters)")
    .regex(/^[a-z0-9-]+$/, "Channel name must be lowercase alphanumeric with hyphens")
    .trim(),
  description: z
    .string()
    .max(500, "Description too long (max 500 characters)")
    .trim()
    .optional()
    .or(z.literal("")),
});

// Create group chat
export const createGroupSchema = z.object({
  name: z
    .string()
    .min(1, "Group name is required")
    .max(100, "Group name too long (max 100 characters)")
    .trim(),
  description: z
    .string()
    .max(500, "Description too long (max 500 characters)")
    .trim()
    .optional()
    .or(z.literal("")),
  memberIds: z
    .array(z.string().uuid("Invalid member ID"))
    .min(1, "At least one member is required")
    .max(50, "Maximum 50 members allowed"),
});

// Typing indicator
export const typingIndicatorSchema = z.object({
  chatType: z.enum(["organization", "project", "direct", "group"]),
  chatId: z.string().uuid("Invalid chat ID"),
  isTyping: z.boolean(),
});

// Update message
export const updateMessageSchema = z.object({
  messageId: z.string().uuid("Invalid message ID"),
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(5000, "Message too long (max 5000 characters)")
    .trim(),
});

// Add message reaction
export const addReactionSchema = z.object({
  messageId: z.string().uuid("Invalid message ID"),
  messageType: z.enum(["channel", "direct"]),
  emoji: z
    .string()
    .min(1, "Emoji is required")
    .max(10, "Emoji too long")
    .trim(),
});

// Type exports
export type SendChannelMessageInput = z.infer<typeof sendChannelMessageSchema>;
export type SendDirectMessageInput = z.infer<typeof sendDirectMessageSchema>;
export type SendGroupMessageInput = z.infer<typeof sendGroupMessageSchema>;
export type CreateChannelInput = z.infer<typeof createChannelSchema>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type TypingIndicatorInput = z.infer<typeof typingIndicatorSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
export type AddReactionInput = z.infer<typeof addReactionSchema>;
