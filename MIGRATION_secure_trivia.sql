-- Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/aedbqwnsskuznmbywyav/sql/new
-- This prevents the correct answer from being exposed in the API response

-- Step 1: Revoke direct read access to correct_answer column
REVOKE SELECT (correct_answer) ON public.posts FROM authenticated;
REVOKE SELECT (correct_answer) ON public.posts FROM anon;

-- Step 2: Create a server-side function to validate answers
-- SECURITY DEFINER means it runs with elevated privileges (can read correct_answer)
CREATE OR REPLACE FUNCTION public.validate_trivia_answer(p_post_id uuid, p_answer text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_answer text;
  v_type text;
BEGIN
  SELECT correct_answer, challenge_type INTO v_answer, v_type
  FROM posts WHERE id = p_post_id;

  IF v_type != 'trivia' OR v_answer IS NULL THEN
    RETURN false;
  END IF;

  RETURN lower(trim(p_answer)) = lower(trim(v_answer));
END;
$$;

-- Step 3: Allow authenticated users to call the function
GRANT EXECUTE ON FUNCTION public.validate_trivia_answer TO authenticated;
