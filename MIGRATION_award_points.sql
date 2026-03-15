-- Ejecutar en Supabase SQL Editor
-- https://supabase.com/dashboard/project/aedbqwnsskuznmbywyav/sql/new
-- Suma 150 puntos server-side al desbloquear un reto (trivia correcta)
-- Evita que el cliente pueda manipular los puntos

CREATE OR REPLACE FUNCTION public.award_unlock_points(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles SET points = COALESCE(points, 0) + 150 WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_unlock_points TO authenticated;
