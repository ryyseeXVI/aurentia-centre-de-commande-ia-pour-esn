// Transformers for messaging entities

import type {
  ChannelMessage,
  CreateChannelMessageInput,
  CreateDirectMessageInput,
  DirectMessage,
  MessageReaction,
  OrganizationChannel,
  ProjectChannel,
} from "../../types/api";
import type {
  DbChannelMessage,
  DbChannelMessageInsert,
  DbDirectMessage,
  DbDirectMessageInsert,
  DbMessageReaction,
  DbOrganizationChannel,
  DbProjectChannel,
} from "../../types/database";

// ============================================================================
// ORGANIZATION CHANNELS
// ============================================================================

export function dbOrganizationChannelToApi(
  dbChannel: DbOrganizationChannel,
): OrganizationChannel {
  return {
    id: dbChannel.id,
    organizationId: dbChannel.organization_id,
    name: dbChannel.name,
    description: dbChannel.description,
    createdBy: dbChannel.created_by,
    createdAt: dbChannel.created_at,
    updatedAt: dbChannel.updated_at,
  };
}

export function dbOrganizationChannelsToApi(
  dbChannels: DbOrganizationChannel[],
): OrganizationChannel[] {
  return dbChannels.map(dbOrganizationChannelToApi);
}

// ============================================================================
// PROJECT CHANNELS
// ============================================================================

export function dbProjectChannelToApi(
  dbChannel: DbProjectChannel,
): ProjectChannel {
  return {
    id: dbChannel.id,
    projetId: dbChannel.projet_id,
    organizationId: dbChannel.organization_id,
    name: dbChannel.name,
    createdAt: dbChannel.created_at,
    updatedAt: dbChannel.updated_at,
  };
}

export function dbProjectChannelsToApi(
  dbChannels: DbProjectChannel[],
): ProjectChannel[] {
  return dbChannels.map(dbProjectChannelToApi);
}

// ============================================================================
// CHANNEL MESSAGES
// ============================================================================

export function dbChannelMessageToApi(
  dbMessage: DbChannelMessage,
): ChannelMessage {
  return {
    id: dbMessage.id,
    channelId: dbMessage.channel_id,
    channelType: dbMessage.channel_type,
    senderId: dbMessage.sender_id,
    content: dbMessage.content,
    editedAt: dbMessage.edited_at,
    createdAt: dbMessage.created_at,
    updatedAt: dbMessage.updated_at,
    organizationId: dbMessage.organization_id,
  };
}

export function apiChannelMessageToDbInsert(
  apiMessage: CreateChannelMessageInput,
  senderId: string,
): DbChannelMessageInsert {
  return {
    channel_id: apiMessage.channelId,
    channel_type: apiMessage.channelType,
    sender_id: senderId,
    content: apiMessage.content,
    organization_id: apiMessage.organizationId,
  };
}

export function dbChannelMessagesToApi(
  dbMessages: DbChannelMessage[],
): ChannelMessage[] {
  return dbMessages.map(dbChannelMessageToApi);
}

// ============================================================================
// DIRECT MESSAGES
// ============================================================================

export function dbDirectMessageToApi(
  dbMessage: DbDirectMessage,
): DirectMessage {
  return {
    id: dbMessage.id,
    senderId: dbMessage.sender_id,
    recipientId: dbMessage.recipient_id,
    content: dbMessage.content,
    readAt: dbMessage.read_at,
    editedAt: dbMessage.edited_at,
    createdAt: dbMessage.created_at,
    updatedAt: dbMessage.updated_at,
    organizationId: dbMessage.organization_id,
  };
}

export function apiDirectMessageToDbInsert(
  apiMessage: CreateDirectMessageInput,
  senderId: string,
): DbDirectMessageInsert {
  return {
    sender_id: senderId,
    recipient_id: apiMessage.recipientId,
    content: apiMessage.content,
    organization_id: apiMessage.organizationId,
  };
}

export function dbDirectMessagesToApi(
  dbMessages: DbDirectMessage[],
): DirectMessage[] {
  return dbMessages.map(dbDirectMessageToApi);
}

// ============================================================================
// MESSAGE REACTIONS
// ============================================================================

export function dbMessageReactionToApi(
  dbReaction: DbMessageReaction,
): MessageReaction {
  return {
    id: dbReaction.id,
    messageId: dbReaction.message_id,
    messageType: dbReaction.message_type,
    userId: dbReaction.user_id,
    emoji: dbReaction.emoji,
    createdAt: dbReaction.created_at,
    organizationId: dbReaction.organization_id,
  };
}

export function dbMessageReactionsToApi(
  dbReactions: DbMessageReaction[],
): MessageReaction[] {
  return dbReactions.map(dbMessageReactionToApi);
}
