-- ==============================================================================
-- Migration: 01_setup_auth_and_profile
-- Description: Setup user_profile table, triggers, and auth RPC functions
-- ==============================================================================

-- 1. ADD EMAIL COLUMN TO user_profile TABLE
ALTER TABLE public.user_profile 
ADD COLUMN IF NOT EXISTS email TEXT;

-- (Optional) Add unique constraint for email in user_profile table
-- ALTER TABLE public.user_profile ADD CONSTRAINT user_profile_email_key UNIQUE (email);


-- ==============================================================================
-- 2. CREATE TRIGGER TO AUTO-SYNC DATA FROM auth.users TO user_profile
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
  -- Use the existing `uuid` column to store the Supabase ID
  -- The `id` (int8) column is not referenced here so the database auto-increments it
  INSERT INTO public.user_profile (uuid, email, name)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data ->> 'name' 
  );
  
  RETURN new;
END;
$;

-- Attach trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==============================================================================
-- 3. CREATE RPC FUNCTION TO CHECK IF EMAIL EXISTS (Used in Step 1 of Signup form)
-- ==============================================================================
CREATE OR REPLACE FUNCTION check_email_exists(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Allow frontend to call this function bypassing RLS
AS $
BEGIN
  -- Return TRUE if the email already exists in auth.users table
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE email = check_email
  );
END;
$;

CREATE OR REPLACE FUNCTION public.handle_user_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
  -- If email_confirmed_at was just updated (meaning user has successfully verified OTP)
  IF old.email_confirmed_at IS NULL AND new.email_confirmed_at IS NOT NULL THEN
    UPDATE public.user_profile
    SET 
      active = true,        -- Enable active status
      updated_at = now()    -- Update the modification timestamp
    WHERE uuid = new.id;
  END IF;
  
  RETURN new;
END;
$;

-- Attach this trigger to the UPDATE event of auth.users table
DROP TRIGGER IF EXISTS on_auth_user_verified ON auth.users;
CREATE TRIGGER on_auth_user_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_verification();
