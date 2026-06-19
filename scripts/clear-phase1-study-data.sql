-- Clear Phase 1 study data only (study = 'phase1').
-- Keeps pilot rows and table structure. Run in Supabase SQL Editor. Cannot be undone.
--
-- Order matters: survey_responses has no ON DELETE CASCADE from participants.

DELETE FROM survey_responses
WHERE participant_id IN (
  SELECT id FROM participants WHERE study = 'phase1'
);

DELETE FROM conversations
WHERE participant_id IN (
  SELECT id FROM participants WHERE study = 'phase1'
);

DELETE FROM participants
WHERE study = 'phase1';
