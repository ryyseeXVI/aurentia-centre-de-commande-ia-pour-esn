-- ==================================================================
-- MESSAGING SYSTEM TABLES
-- Create tables for organization and project messaging
-- ==================================================================

-- ==================================================================
-- TABLE: organization_channels
-- Channels for organization-wide communication
-- ==================================================================
CREATE TABLE IF NOT EXISTS organization_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT organization_channels_name_org_unique UNIQUE (organization_id, name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organization_channels_org_id ON organization_channels(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_channels_created_at ON organization_channels(created_at);

-- ==================================================================
-- TABLE: project_channels
-- Channels for project-specific communication
-- ==================================================================
CREATE TABLE IF NOT EXISTS project_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projet(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT project_channels_name_project_unique UNIQUE (project_id, name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_channels_project_id ON project_channels(project_id);
CREATE INDEX IF NOT EXISTS idx_project_channels_org_id ON project_channels(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_channels_created_at ON project_channels(created_at);

-- ==================================================================
-- TABLE: channel_messages
-- Messages for both organization and project channels
-- ==================================================================
CREATE TABLE IF NOT EXISTS channel_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL,
  channel_type VARCHAR(20) NOT NULL CHECK (channel_type IN ('organization', 'project')),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT channel_messages_content_length CHECK (LENGTH(content) > 0 AND LENGTH(content) <= 5000)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_channel_messages_channel ON channel_messages(channel_id, channel_type);
CREATE INDEX IF NOT EXISTS idx_channel_messages_sender ON channel_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_channel_messages_org_id ON channel_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_channel_messages_created_at ON channel_messages(created_at DESC);

-- Composite index for efficient message fetching
CREATE INDEX IF NOT EXISTS idx_channel_messages_channel_created
  ON channel_messages(channel_id, channel_type, created_at DESC);

-- ==================================================================
-- TABLE: direct_messages
-- One-on-one messages between users
-- ==================================================================
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT direct_messages_content_length CHECK (LENGTH(content) > 0 AND LENGTH(content) <= 5000),
  CONSTRAINT direct_messages_different_users CHECK (sender_id != receiver_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver ON direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_org_id ON direct_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON direct_messages(created_at DESC);

-- Composite index for conversation fetching
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation
  ON direct_messages(sender_id, receiver_id, created_at DESC);

-- ==================================================================
-- TABLE: message_reactions
-- Reactions/emojis on messages
-- ==================================================================
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,
  message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('channel', 'direct')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints: One reaction per user per message
  CONSTRAINT message_reactions_unique UNIQUE (message_id, message_type, user_id, emoji)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id, message_type);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON message_reactions(user_id);

-- ==================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==================================================================

-- Enable RLS on all tables
ALTER TABLE organization_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- ==================================================================
-- RLS POLICIES: organization_channels
-- ==================================================================

-- Users can read channels in their organization
CREATE POLICY "Users can read organization channels"
ON organization_channels FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_organizations.user_id = auth.uid()
    AND user_organizations.organization_id = organization_channels.organization_id
  )
);

-- Admins can create channels
CREATE POLICY "Admins can create organization channels"
ON organization_channels FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_organizations.user_id = auth.uid()
    AND user_organizations.organization_id = organization_channels.organization_id
    AND user_organizations.role IN ('ADMIN')
  )
);

-- Admins can update channels
CREATE POLICY "Admins can update organization channels"
ON organization_channels FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_organizations.user_id = auth.uid()
    AND user_organizations.organization_id = organization_channels.organization_id
    AND user_organizations.role IN ('ADMIN')
  )
);

-- Admins can delete channels
CREATE POLICY "Admins can delete organization channels"
ON organization_channels FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_organizations.user_id = auth.uid()
    AND user_organizations.organization_id = organization_channels.organization_id
    AND user_organizations.role IN ('ADMIN')
  )
);

-- ==================================================================
-- RLS POLICIES: project_channels
-- ==================================================================

-- Users can read project channels they have access to
CREATE POLICY "Users can read project channels"
ON project_channels FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_organizations.user_id = auth.uid()
    AND user_organizations.organization_id = project_channels.organization_id
  )
);

-- Project managers and admins can create project channels
CREATE POLICY "Users can create project channels"
ON project_channels FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_organizations.user_id = auth.uid()
    AND user_organizations.organization_id = project_channels.organization_id
    AND user_organizations.role IN ('ADMIN', 'MANAGER')
  )
);

-- ==================================================================
-- RLS POLICIES: channel_messages
-- ==================================================================

-- Users can read messages from channels they have access to
CREATE POLICY "Users can read channel messages"
ON channel_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_organizations.user_id = auth.uid()
    AND user_organizations.organization_id = channel_messages.organization_id
  )
);

-- Users can send messages to channels they have access to
CREATE POLICY "Users can send channel messages"
ON channel_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_organizations.user_id = auth.uid()
    AND user_organizations.organization_id = channel_messages.organization_id
  )
);

-- Users can update their own messages
CREATE POLICY "Users can update own channel messages"
ON channel_messages FOR UPDATE
USING (auth.uid() = sender_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete own channel messages"
ON channel_messages FOR DELETE
USING (auth.uid() = sender_id);

-- ==================================================================
-- RLS POLICIES: direct_messages
-- ==================================================================

-- Users can read their own direct messages
CREATE POLICY "Users can read own direct messages"
ON direct_messages FOR SELECT
USING (
  auth.uid() = sender_id
  OR auth.uid() = receiver_id
);

-- Users can send direct messages
CREATE POLICY "Users can send direct messages"
ON direct_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM user_organizations uo1
    WHERE uo1.user_id = sender_id
    AND uo1.organization_id = direct_messages.organization_id
  )
  AND EXISTS (
    SELECT 1 FROM user_organizations uo2
    WHERE uo2.user_id = receiver_id
    AND uo2.organization_id = direct_messages.organization_id
  )
);

-- Users can update their own direct messages
CREATE POLICY "Users can update own direct messages"
ON direct_messages FOR UPDATE
USING (auth.uid() = sender_id);

-- Users can delete their own direct messages
CREATE POLICY "Users can delete own direct messages"
ON direct_messages FOR DELETE
USING (auth.uid() = sender_id);

-- ==================================================================
-- RLS POLICIES: message_reactions
-- ==================================================================

-- Users can read reactions
CREATE POLICY "Users can read message reactions"
ON message_reactions FOR SELECT
USING (true);

-- Users can add reactions
CREATE POLICY "Users can add message reactions"
ON message_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reactions
CREATE POLICY "Users can delete own message reactions"
ON message_reactions FOR DELETE
USING (auth.uid() = user_id);

-- ==================================================================
-- TRIGGERS: Update updated_at timestamp
-- ==================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all messaging tables
CREATE TRIGGER update_organization_channels_updated_at
  BEFORE UPDATE ON organization_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_channels_updated_at
  BEFORE UPDATE ON project_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channel_messages_updated_at
  BEFORE UPDATE ON channel_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_direct_messages_updated_at
  BEFORE UPDATE ON direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==================================================================
-- VERIFICATION
-- ==================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Messaging system tables created successfully';
  RAISE NOTICE '   - organization_channels';
  RAISE NOTICE '   - project_channels';
  RAISE NOTICE '   - channel_messages';
  RAISE NOTICE '   - direct_messages';
  RAISE NOTICE '   - message_reactions';
  RAISE NOTICE '✅ RLS policies enabled and configured';
  RAISE NOTICE '✅ Indexes created for performance';
  RAISE NOTICE '✅ Triggers created for updated_at';
END $$;
