-- Ejecutar en Supabase SQL Editor
-- https://supabase.com/dashboard/project/aedbqwnsskuznmbywyav/sql/new
-- Hace challenged_post_id nullable (se rellena cuando el desafiado responde)

ALTER TABLE duels ALTER COLUMN challenged_post_id DROP NOT NULL;
