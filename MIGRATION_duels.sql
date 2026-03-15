-- Ejecutar en Supabase SQL Editor
-- https://supabase.com/dashboard/project/aedbqwnsskuznmbywyav/sql/new
-- Sistema de duelos 1v1: un usuario desafía a otro con su propio reto

CREATE TABLE IF NOT EXISTS duels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  challenged_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  challenger_post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  challenged_post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE duels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "duels_select" ON duels FOR SELECT
  USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

CREATE POLICY "duels_insert" ON duels FOR INSERT
  WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "duels_update" ON duels FOR UPDATE
  USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

-- Agregar duel_id a notifications para poder joinear
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS duel_id uuid REFERENCES duels(id) ON DELETE SET NULL;
