-- Ejecutar en Supabase SQL Editor
-- https://supabase.com/dashboard/project/aedbqwnsskuznmbywyav/sql/new
-- Elimina el CHECK constraint en notifications.type si existe,
-- para permitir el nuevo tipo "new_comment"
-- Si no existe el constraint, este comando no hace nada (IF EXISTS)

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
