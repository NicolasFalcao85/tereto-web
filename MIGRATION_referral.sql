-- Ejecutar en Supabase SQL Editor
-- https://supabase.com/dashboard/project/aedbqwnsskuznmbywyav/sql/new
-- Sistema de referidos: código único por usuario + RPC para procesar

-- 1. Agregar columna referral_code a profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

-- 2. Generar código para usuarios existentes (primeros 8 chars del MD5 del ID)
UPDATE profiles SET referral_code = lower(substring(md5(id::text), 1, 8)) WHERE referral_code IS NULL;

-- 3. Trigger para generar código automáticamente en nuevos usuarios
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := lower(substring(md5(NEW.id::text), 1, 8));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_referral_code ON profiles;
CREATE TRIGGER set_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION generate_referral_code();

-- 4. RPC para procesar referido (da puntos a ambos)
CREATE OR REPLACE FUNCTION public.process_referral(p_referral_code text, p_new_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
BEGIN
  SELECT id INTO v_referrer_id FROM profiles WHERE referral_code = p_referral_code;
  IF v_referrer_id IS NULL THEN RETURN; END IF;
  IF v_referrer_id = p_new_user_id THEN RETURN; END IF;
  UPDATE profiles SET points = COALESCE(points, 0) + 100 WHERE id = v_referrer_id;
  UPDATE profiles SET points = COALESCE(points, 0) + 50 WHERE id = p_new_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_referral TO authenticated;
