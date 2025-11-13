-- Enable Realtime Subscriptions for Command Center Tables
-- Migration: 20251113191450_enable_realtime_subscriptions
-- Purpose: Enable Supabase Realtime on tables that require live updates for dashboard and collaboration

-- ============================================================================
-- REALTIME STRATEGY FOR COMMAND CENTER
-- ============================================================================
--
-- This migration enables realtime on 9 critical tables based on:
-- 1. Dashboard display requirements (health scores, metrics, alerts)
-- 2. Collaboration features (tasks, time tracking, assignments)
-- 3. Real-time notifications (incidents, risks, recommendations)
-- 4. User experience (instant updates without page refresh)
--
-- PERFORMANCE CONSIDERATIONS:
-- - Each realtime subscription has overhead (~1-2ms per change broadcast)
-- - RLS policies are evaluated on every realtime event
-- - Limit subscriptions to necessary tables only
-- - Use filters in frontend subscriptions to reduce payload
-- - Monitor connection count in Supabase dashboard

-- ============================================================================
-- TIER 1: CRITICAL ALERTS & NOTIFICATIONS (Highest Priority)
-- ============================================================================

-- Enable realtime for incident table
-- Use case: Real-time incident alerts, critical issue notifications
-- Update frequency: High when issues occur
-- Frontend: Subscribe for live incident feed, toast notifications
ALTER PUBLICATION supabase_realtime ADD TABLE incident;

-- Enable realtime for detection_derive table
-- Use case: AI-generated drift detection alerts
-- Update frequency: Periodic (when AI runs analysis)
-- Frontend: Dashboard alerts panel, notification badges
ALTER PUBLICATION supabase_realtime ADD TABLE detection_derive;

-- Enable realtime for prediction_risque table
-- Use case: Risk prediction updates for project dashboard
-- Update frequency: Periodic (when AI generates predictions)
-- Frontend: Risk dashboard, project health widgets
ALTER PUBLICATION supabase_realtime ADD TABLE prediction_risque;

-- Enable realtime for recommandation_action table
-- Use case: Action recommendations from AI analysis
-- Update frequency: Periodic (when new recommendations generated)
-- Frontend: Action items panel, recommendation queue
ALTER PUBLICATION supabase_realtime ADD TABLE recommandation_action;

-- ============================================================================
-- TIER 2: DASHBOARD METRICS (High Priority)
-- ============================================================================

-- Enable realtime for score_sante_projet table
-- Use case: Live project health score updates
-- Update frequency: Periodic (daily or on-demand analysis)
-- Frontend: Project health dashboard, status indicators
ALTER PUBLICATION supabase_realtime ADD TABLE score_sante_projet;

-- ============================================================================
-- TIER 3: COLLABORATION & TASK MANAGEMENT (High Priority)
-- ============================================================================

-- Enable realtime for tache table
-- Use case: Task board collaboration, status updates
-- Update frequency: Very high (consultants update tasks constantly)
-- Frontend: Kanban board, task lists, project timeline
ALTER PUBLICATION supabase_realtime ADD TABLE tache;

-- Enable realtime for temps_passe table
-- Use case: Live time tracking, consultant activity monitoring
-- Update frequency: Very high (consultants log time throughout day)
-- Frontend: Time tracking dashboard, consultant activity feed
ALTER PUBLICATION supabase_realtime ADD TABLE temps_passe;

-- Enable realtime for affectation table
-- Use case: Resource allocation changes, team composition updates
-- Update frequency: Medium (when assignments change)
-- Frontend: Resource planning board, team roster
ALTER PUBLICATION supabase_realtime ADD TABLE affectation;

-- ============================================================================
-- TIER 4: PROJECT MANAGEMENT (Medium Priority)
-- ============================================================================

-- Enable realtime for projet table
-- Use case: Project status changes, project creation/updates
-- Update frequency: Medium (status updates, milestone changes)
-- Frontend: Project list, project cards, status indicators
ALTER PUBLICATION supabase_realtime ADD TABLE projet;

-- Enable realtime for livrable table
-- Use case: Deliverable status updates, completion tracking
-- Update frequency: Medium (deliverable progress updates)
-- Frontend: Deliverable timeline, milestone tracker
ALTER PUBLICATION supabase_realtime ADD TABLE livrable;

-- ============================================================================
-- TABLES NOT ENABLED FOR REALTIME (Rationale)
-- ============================================================================
--
-- The following tables are NOT enabled for realtime because they change infrequently
-- or don't require instant updates:
--
-- ❌ client - Client data is relatively static, batch updates acceptable
-- ❌ consultant - Consultant profiles change infrequently (enable if tracking live status)
-- ❌ competence - Skills list is static reference data
-- ❌ consultant_competence - Skill assignments change occasionally, batch updates OK
-- ❌ budget_projet - Budget changes are infrequent and deliberate
-- ❌ facture - Invoices are created/updated infrequently
-- ❌ profiles - User profile changes don't need instant propagation
--
-- TO ENABLE LATER (if needed):
-- ALTER PUBLICATION supabase_realtime ADD TABLE consultant;
-- ALTER PUBLICATION supabase_realtime ADD TABLE client;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Run this to verify which tables have realtime enabled:
/*
SELECT
  schemaname,
  tablename,
  CASE
    WHEN tablename = ANY(
      SELECT tablename
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
    ) THEN 'ENABLED ✓'
    ELSE 'DISABLED'
  END as realtime_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY
  CASE
    WHEN tablename = ANY(
      SELECT tablename
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
    ) THEN 0
    ELSE 1
  END,
  tablename;
*/

-- ============================================================================
-- FRONTEND SUBSCRIPTION EXAMPLES
-- ============================================================================

/*
// Example 1: Subscribe to incidents for real-time alerts
const { data, error } = await supabase
  .from('incident')
  .select('*')
  .eq('projet_id', projectId)
  .order('date_ouverture', { ascending: false })

const subscription = supabase
  .channel('incidents')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'incident', filter: `projet_id=eq.${projectId}` },
    (payload) => {
      console.log('Incident update:', payload)
      // Update UI, show toast notification
    }
  )
  .subscribe()

// Example 2: Subscribe to task updates for kanban board
const taskSubscription = supabase
  .channel('project-tasks')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'tache', filter: `projet_id=eq.${projectId}` },
    (payload) => {
      if (payload.eventType === 'INSERT') {
        // Add new task to board
      } else if (payload.eventType === 'UPDATE') {
        // Update existing task (status change, assignment, etc.)
      } else if (payload.eventType === 'DELETE') {
        // Remove task from board
      }
    }
  )
  .subscribe()

// Example 3: Subscribe to project health scores for dashboard
const healthSubscription = supabase
  .channel('project-health')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'score_sante_projet', filter: `projet_id=eq.${projectId}` },
    (payload) => {
      // Update health score widget
      updateHealthScore(payload.new)
    }
  )
  .subscribe()

// Example 4: Subscribe to time tracking for live activity feed
const timeSubscription = supabase
  .channel('time-tracking')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'temps_passe', filter: `projet_id=eq.${projectId}` },
    (payload) => {
      // Show "Consultant X just logged Y hours" notification
      showActivityNotification(payload.new)
    }
  )
  .subscribe()

// Example 5: Multiple table subscription on single channel
const dashboardChannel = supabase
  .channel('dashboard-updates')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'incident' },
    handleIncidentUpdate
  )
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'detection_derive' },
    handleDriftDetection
  )
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'prediction_risque' },
    handleRiskPrediction
  )
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'recommandation_action' },
    handleRecommendation
  )
  .subscribe()

// Don't forget to unsubscribe on component unmount!
// useEffect(() => {
//   return () => {
//     subscription.unsubscribe()
//   }
// }, [])
*/

-- ============================================================================
-- PERFORMANCE OPTIMIZATION TIPS
-- ============================================================================
--
-- 1. USE FILTERS: Always filter subscriptions by projet_id or consultant_id
--    ✓ GOOD: filter: `projet_id=eq.${projectId}`
--    ✗ BAD:  No filter (receives ALL table changes)
--
-- 2. LIMIT EVENTS: Subscribe only to needed events
--    ✓ GOOD: { event: 'INSERT' } or { event: 'UPDATE' }
--    ✗ BAD:  { event: '*' } when you only care about inserts
--
-- 3. BATCH UPDATES: Debounce rapid changes in frontend
--    Use React hooks like useDebouncedValue for high-frequency tables
--
-- 4. CLEANUP: Always unsubscribe when component unmounts
--    Prevents memory leaks and unnecessary connections
--
-- 5. MONITOR: Check Supabase dashboard for:
--    - Active realtime connections
--    - Messages per second
--    - Bandwidth usage
--
-- 6. RLS PERFORMANCE: Ensure RLS policies on realtime tables are optimized
--    - Use indexes on columns in RLS WHERE clauses
--    - Avoid complex subqueries in RLS policies if possible
