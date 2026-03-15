-- Ejecutar en Supabase SQL Editor
-- https://supabase.com/dashboard/project/aedbqwnsskuznmbywyav/sql/new
-- Agrega from_user_id a notifications para saber quién generó la notificación

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS from_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
