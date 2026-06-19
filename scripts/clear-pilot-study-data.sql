-- Clear Pilot study data only (study = 'pilot').
-- Keeps phase1 rows and table structure. Run in Supabase SQL Editor. Cannot be undone.

DELETE FROM survey_responses
WHERE participant_id IN (
  SELECT id FROM participants WHERE study = 'pilot'
);

DELETE FROM conversations
WHERE participant_id IN (
  SELECT id FROM participants WHERE study = 'pilot'
);

DELETE FROM participants
WHERE study = 'pilot';
