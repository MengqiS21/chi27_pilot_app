-- Clear ALL study data for pilot + phase1 (keeps table structure, RLS, and policies).
-- Run in Supabase SQL Editor. This cannot be undone.
--
-- Both apps share one database; participants are distinguished by study:
--   'pilot'   — chi27_pilot_app
--   'phase1'  — chi27_phase1_app
--
-- This script wipes EVERY row in the active tables (both studies).
-- To clear only one study, use:
--   clear-phase1-study-data.sql
--   clear-pilot-study-data.sql
--
-- Active tables: participants, survey_responses, conversations

TRUNCATE TABLE
  conversations,
  survey_responses,
  participants
CASCADE;
