/**
 * Chat Data Transformers
 * Convert between database snake_case and API camelCase
 */

export interface DbOrganizationChannel {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ApiOrganizationChannel {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbChannelMessage {
  id: string;
  channel_id: string;
  channel_type: string;
  sender_id: string;
  organization_id: string;
  content: string;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    prenom: string;
    nom: string;
    avatar_url: string | null;
  };
}

export interface ApiChannelMessage {
  id: string;
  channelId: string;
  channelType: string;
  senderId: string;
  organizationId: string;
  content: string;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    prenom: string;
    nom: string;
    avatarUrl: string | null;
  };
}

export interface DbGroupChat {
  id: string;
  name: string;
  description: string | null;
  organization_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ApiGroupChat {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Transform organization channel from DB to API format
export function dbChannelToApi(channel: DbOrganizationChannel): ApiOrganizationChannel {
  return {
    id: channel.id,
    organizationId: channel.organization_id,
    name: channel.name,
    description: channel.description,
    createdBy: channel.created_by,
    createdAt: channel.created_at,
    updatedAt: channel.updated_at,
  };
}

// Transform channel message from DB to API format
export function dbMessageToApi(message: DbChannelMessage): ApiChannelMessage {
  return {
    id: message.id,
    channelId: message.channel_id,
    channelType: message.channel_type,
    senderId: message.sender_id,
    organizationId: message.organization_id,
    content: message.content,
    editedAt: message.edited_at,
    createdAt: message.created_at,
    updatedAt: message.updated_at,
    sender: message.sender
      ? {
          id: message.sender.id,
          prenom: message.sender.prenom,
          nom: message.sender.nom,
          avatarUrl: message.sender.avatar_url,
        }
      : undefined,
  };
}

// Transform group chat from DB to API format
export function dbGroupToApi(group: DbGroupChat): ApiGroupChat {
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    organizationId: group.organization_id,
    createdBy: group.created_by,
    createdAt: group.created_at,
    updatedAt: group.updated_at,
  };
}
