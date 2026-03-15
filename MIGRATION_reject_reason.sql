-- Ejecutar en Supabase SQL Editor
-- https://supabase.com/dashboard/project/aedbqwnsskuznmbywyav/sql/new
-- Agrega el motivo de rechazo al unlock

ALTER TABLE unlocks ADD COLUMN IF NOT EXISTS reject_reason text;
