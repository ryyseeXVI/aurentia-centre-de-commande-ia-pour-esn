-- ==================================================================
-- SEED DEFAULT ORGANIZATION CHANNELS
-- Creates default channels for all existing organizations
-- ==================================================================

-- ==================================================================
-- Create default channels for each organization
-- ==================================================================

DO $$
DECLARE
  org RECORD;
  admin_user_id UUID;
  channel_id UUID;
  channels_created INTEGER := 0;
BEGIN
  -- Loop through all organizations
  FOR org IN SELECT id, nom FROM organizations ORDER BY created_at
  LOOP
    RAISE NOTICE 'Processing organization: % (ID: %)', org.nom, org.id;

    -- Get an admin user from this organization (fallback to first member)
    SELECT user_id INTO admin_user_id
    FROM user_organizations
    WHERE organization_id = org.id
    AND role = 'ADMIN'
    LIMIT 1;

    -- If no admin, get first member
    IF admin_user_id IS NULL THEN
      SELECT user_id INTO admin_user_id
      FROM user_organizations
      WHERE organization_id = org.id
      LIMIT 1;
    END IF;

    -- Skip if no users in organization
    IF admin_user_id IS NULL THEN
      RAISE NOTICE '  ⚠️  No users found in organization, skipping';
      CONTINUE;
    END IF;

    -- Create "general" channel if it doesn't exist
    INSERT INTO organization_channels (organization_id, name, description, created_by)
    VALUES (
      org.id,
      'general',
      'General discussion channel for the organization',
      admin_user_id
    )
    ON CONFLICT (organization_id, name) DO NOTHING
    RETURNING id INTO channel_id;

    IF channel_id IS NOT NULL THEN
      channels_created := channels_created + 1;
      RAISE NOTICE '  ✅ Created "general" channel (ID: %)', channel_id;
    ELSE
      RAISE NOTICE '  ℹ️  "general" channel already exists';
    END IF;

    -- Create "announcements" channel if it doesn't exist
    INSERT INTO organization_channels (organization_id, name, description, created_by)
    VALUES (
      org.id,
      'announcements',
      'Important announcements and updates',
      admin_user_id
    )
    ON CONFLICT (organization_id, name) DO NOTHING
    RETURNING id INTO channel_id;

    IF channel_id IS NOT NULL THEN
      channels_created := channels_created + 1;
      RAISE NOTICE '  ✅ Created "announcements" channel (ID: %)', channel_id;
    END IF;

    -- Create "random" channel if it doesn't exist
    INSERT INTO organization_channels (organization_id, name, description, created_by)
    VALUES (
      org.id,
      'random',
      'Off-topic discussions and casual conversations',
      admin_user_id
    )
    ON CONFLICT (organization_id, name) DO NOTHING
    RETURNING id INTO channel_id;

    IF channel_id IS NOT NULL THEN
      channels_created := channels_created + 1;
      RAISE NOTICE '  ✅ Created "random" channel (ID: %)', channel_id;
    END IF;

  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Seeding completed!';
  RAISE NOTICE '📊 Total channels created: %', channels_created;
  RAISE NOTICE '========================================';

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error seeding channels: %', SQLERRM;
END $$;

-- ==================================================================
-- Add welcome messages to general channels
-- ==================================================================

DO $$
DECLARE
  channel RECORD;
  admin_user_id UUID;
  message_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Creating welcome messages...';
  RAISE NOTICE '========================================';

  FOR channel IN
    SELECT oc.id, oc.organization_id, oc.name, o.nom as org_name
    FROM organization_channels oc
    JOIN organizations o ON o.id = oc.organization_id
    WHERE oc.name = 'general'
    ORDER BY oc.created_at
  LOOP
    -- Get an admin or first user
    SELECT user_id INTO admin_user_id
    FROM user_organizations
    WHERE organization_id = channel.organization_id
    ORDER BY
      CASE WHEN role = 'ADMIN' THEN 1 ELSE 2 END,
      created_at
    LIMIT 1;

    IF admin_user_id IS NOT NULL THEN
      -- Check if welcome message already exists
      IF NOT EXISTS (
        SELECT 1 FROM channel_messages
        WHERE channel_id = channel.id
        AND channel_type = 'organization'
      ) THEN
        INSERT INTO channel_messages (
          channel_id,
          channel_type,
          sender_id,
          organization_id,
          content
        ) VALUES (
          channel.id,
          'organization',
          admin_user_id,
          channel.organization_id,
          'Welcome to the ' || channel.org_name || ' team chat! 👋

This is the #general channel where you can discuss anything related to our organization. Feel free to share updates, ask questions, or just say hi!

Check out other channels:
• #announcements - Important updates and news
• #random - Off-topic and casual conversations'
        );

        message_count := message_count + 1;
        RAISE NOTICE '  ✅ Created welcome message for % (#%)', channel.org_name, channel.name;
      END IF;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Welcome messages created: %', message_count;
  RAISE NOTICE '========================================';

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating welcome messages: %', SQLERRM;
END $$;

-- ==================================================================
-- Verification: Show created channels
-- ==================================================================

DO $$
DECLARE
  total_orgs INTEGER;
  total_channels INTEGER;
  total_messages INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_orgs FROM organizations;
  SELECT COUNT(*) INTO total_channels FROM organization_channels;
  SELECT COUNT(*) INTO total_messages FROM channel_messages;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FINAL STATISTICS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Organizations: %', total_orgs;
  RAISE NOTICE 'Channels: %', total_channels;
  RAISE NOTICE 'Messages: %', total_messages;
  RAISE NOTICE '========================================';
END $$;
