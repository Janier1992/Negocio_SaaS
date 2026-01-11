-- ==============================================================================
-- MIGRATION 15: EMERGENCY RLS FIX & AUTO-ONBOARDING UPDATE
-- ==============================================================================
-- Fixes the 500 Internal Server Error by removing recursive RLS policies.
-- Ensures 'business_members' is accessible.

-- 1. RESET RLS on 'business_members' (The cause of 500 Error)
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth Users All Access" ON public.business_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.business_members;
DROP POLICY IF EXISTS "Admins can view all memberships" ON public.business_members;

-- Simple, non-recursive policy: users can see rows where THEY are the user
CREATE POLICY "Users can view their own memberships" 
ON public.business_members 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow inserting self-membership (needed for triggers/auto-creation if run from client)
DROP POLICY IF EXISTS "Users can insert their own membership" ON public.business_members;
CREATE POLICY "Users can insert their own membership" 
ON public.business_members 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 2. ENSURE "handle_new_user" TRIGGER EXISTS (From Migration 14)
-- Re-apply this to be absolutely sure the Auto-Onboarding logic is present.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_business_id UUID;
    user_name TEXT;
BEGIN
    user_name := COALESCE(new.raw_user_meta_data->>'full_name', new.email);
    
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (new.id, new.email, user_name)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.businesses (name, slug)
    VALUES ('Mi Negocio', 'negocio-' || substr(md5(random()::text), 0, 8))
    RETURNING id INTO new_business_id;

    INSERT INTO public.business_members (business_id, user_id, role)
    VALUES (new_business_id, new.id, 'admin');
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. FIX ORPHAN USERS (Safe to run multiple times)
DO $$
DECLARE
    orphan_user RECORD;
    new_biz_id UUID;
BEGIN
    FOR orphan_user IN 
        SELECT u.id, u.email 
        FROM auth.users u
        LEFT JOIN public.business_members bm ON u.id = bm.user_id
        WHERE bm.business_id IS NULL
    LOOP
        RAISE NOTICE 'Fixing orphan user: %', orphan_user.email;
        INSERT INTO public.businesses (name, slug)
        VALUES ('Mi Negocio', 'negocio-' || substr(md5(random()::text), 0, 8))
        RETURNING id INTO new_biz_id;

        INSERT INTO public.business_members (business_id, user_id, role)
        VALUES (new_biz_id, orphan_user.id, 'admin');
    END LOOP;
END $$;
