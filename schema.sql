-- =============================================================================
-- CHI'27 Experiment Platform — Supabase setup (run entire file once)
-- Paste this whole file into: Supabase Dashboard → SQL Editor → Run
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_code TEXT,
  latin_square_row INTEGER,
  scenario_order JSONB,
  condition_order JSONB,
  age TEXT,
  gender TEXT,
  prior_ai_use TEXT,
  ss_1 INTEGER, ss_2 INTEGER, ss_3 INTEGER,
  ai_1 INTEGER, ai_2 INTEGER, ai_3 INTEGER,
  dc_1 INTEGER, dc_2 INTEGER, dc_3 INTEGER,
  current_scenario_index INTEGER DEFAULT 0,
  stage TEXT DEFAULT 'landing',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id),
  scenario_index INTEGER,
  scenario_type TEXT,
  condition TEXT,
  turn_index INTEGER,
  role TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scenario_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id),
  scenario_index INTEGER,
  scenario_type TEXT,
  condition TEXT,
  dg_1 INTEGER, dg_2 INTEGER, dg_3 INTEGER, dg_4 INTEGER,
  bi_follow INTEGER, bi_retry INTEGER, bi_switch INTEGER, bi_alone INTEGER,
  med_understanding INTEGER, med_agency INTEGER, med_refusal INTEGER,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- The Streamlit app uses the Supabase anon API key. Without these policies,
-- inserts fail with: "new row violates row-level security policy" (code 42501).
-- -----------------------------------------------------------------------------

ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_participants" ON participants;
DROP POLICY IF EXISTS "anon_select_participants" ON participants;
DROP POLICY IF EXISTS "anon_update_participants" ON participants;
DROP POLICY IF EXISTS "anon_insert_conversations" ON conversations;
DROP POLICY IF EXISTS "anon_select_conversations" ON conversations;
DROP POLICY IF EXISTS "anon_insert_scenario_responses" ON scenario_responses;
DROP POLICY IF EXISTS "anon_select_scenario_responses" ON scenario_responses;

CREATE POLICY "anon_insert_participants"
  ON participants FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_select_participants"
  ON participants FOR SELECT TO anon USING (true);

CREATE POLICY "anon_update_participants"
  ON participants FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_insert_conversations"
  ON conversations FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_select_conversations"
  ON conversations FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_scenario_responses"
  ON scenario_responses FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_select_scenario_responses"
  ON scenario_responses FOR SELECT TO anon USING (true);
