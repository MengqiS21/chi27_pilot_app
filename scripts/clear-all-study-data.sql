-- Clear all study data (keeps table structure, RLS, and policies).
-- Run in Supabase SQL Editor. This cannot be undone.
--
-- Active tables used by pilot + phase1 web apps:
--   participants, survey_responses, conversations
--
-- scenario_responses is legacy and not written by current apps; include only
-- if you also want to wipe old test rows there.

TRUNCATE TABLE
  conversations,
  survey_responses,
  participants
CASCADE;

-- Optional: legacy table (uncomment if needed)
-- TRUNCATE TABLE scenario_responses;
