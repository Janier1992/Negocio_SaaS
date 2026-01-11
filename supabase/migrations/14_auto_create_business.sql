-- ==============================================================================
-- MIGRATION 14: AUTO-ONBOARDING & ORPHAN FIX
-- ==============================================================================
-- Automatically creates a business for new users and fixes existing users without one.

-- 1. Update the 'handle_new_user' Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_business_id UUID;
    user_name TEXT;
BEGIN
    -- 1. Create Profile
    user_name := COALESCE(new.raw_user_meta_data->>'full_name', new.email);
    
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (new.id, new.email, user_name)
    ON CONFLICT (id) DO NOTHING;

    -- 2. Create Business Application (Auto-generated name)
    INSERT INTO public.businesses (name, slug)
    VALUES (
        'Mi Negocio', 
        'negocio-' || substr(md5(random()::text), 0, 8) -- random slug
    )
    RETURNING id INTO new_business_id;

    -- 3. Link User as Admin
    INSERT INTO public.business_members (business_id, user_id, role)
    VALUES (new_business_id, new.id, 'admin');

    -- Note: migration 13 trigger 'tr_seed_categories' will automatically fire 
    -- and add categories for this new business.
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure Trigger is Valid
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 3. FIX EXISTING ORPHANS (Run Once)
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

        -- Create Business
        INSERT INTO public.businesses (name, slug)
        VALUES ('Mi Negocio', 'negocio-' || substr(md5(random()::text), 0, 8))
        RETURNING id INTO new_biz_id;

        -- Assign Member
        INSERT INTO public.business_members (business_id, user_id, role)
        VALUES (new_biz_id, orphan_user.id, 'admin');
        
        -- Categories will be auto-seeded by the trigger from migration 13
    END LOOP;
END $$;
