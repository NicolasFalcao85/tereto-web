-- Agregar columnas de racha a profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_count int DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_unlock_date date;

-- Actualizar award_unlock_points para manejar rachas
CREATE OR REPLACE FUNCTION public.award_unlock_points(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_date date;
BEGIN
  SELECT last_unlock_date INTO v_last_date FROM profiles WHERE id = p_user_id;

  IF v_last_date = CURRENT_DATE THEN
    -- Ya desbloqueó hoy, solo sumar puntos
    UPDATE profiles SET points = COALESCE(points, 0) + 150 WHERE id = p_user_id;
  ELSIF v_last_date = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Día consecutivo, incrementar racha
    UPDATE profiles SET
      points = COALESCE(points, 0) + 150,
      streak_count = COALESCE(streak_count, 0) + 1,
      last_unlock_date = CURRENT_DATE
    WHERE id = p_user_id;
  ELSE
    -- Racha cortada o primera vez
    UPDATE profiles SET
      points = COALESCE(points, 0) + 150,
      streak_count = 1,
      last_unlock_date = CURRENT_DATE
    WHERE id = p_user_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_unlock_points TO authenticated;
