-- ==============================================================================
-- 11 DEBUG AND FIX CATEGORIES & MEMBERSHIP
-- ==============================================================================
-- Run this script in the Supabase SQL Editor.
-- It attempts to fix common issues:
-- 1. User not in business_members table.
-- 2. Business having no categories.

BEGIN;

DO $$
DECLARE
    v_user_id UUID := auth.uid();
    v_business_id UUID;
    v_count INT;
BEGIN
    -- 1. Identify User's Business
    -- Attempt to find via membership (businesses table has no owner_id)
    SELECT business_id INTO v_business_id FROM public.business_members WHERE user_id = v_user_id LIMIT 1;

    IF v_business_id IS NULL THEN
        RAISE NOTICE 'No business found for user %', v_user_id;
    END IF;

    IF v_business_id IS NOT NULL THEN
        RAISE NOTICE 'Found Business ID: %', v_business_id;

        -- 2. Ensure Membership Exists (Critical for RLS)
        INSERT INTO public.business_members (business_id, user_id, role)
        VALUES (v_business_id, v_user_id, 'admin')
        ON CONFLICT (business_id, user_id) DO NOTHING;
        
        -- 3. Check and Insert Categories
        SELECT count(*) INTO v_count FROM public.categories WHERE business_id = v_business_id;
        RAISE NOTICE 'Current Category Count: %', v_count;

        IF v_count < 5 THEN
            INSERT INTO public.categories (business_id, name)
            VALUES 
                (v_business_id, 'General'),
                (v_business_id, 'Alimentos'),
                (v_business_id, 'Bebidas'),
                (v_business_id, 'Limpieza'),
                (v_business_id, 'Higiene'),
                (v_business_id, 'Ropa'),
                (v_business_id, 'Electrónica'),
                (v_business_id, 'Hogar'),
                (v_business_id, 'Juguetes'),
                (v_business_id, 'Ferretería'),
                (v_business_id, 'Farmacia'),
                (v_business_id, 'Papelería'),
                (v_business_id, 'Otros')
            ON CONFLICT DO NOTHING;
            RAISE NOTICE 'Categories inserted.';
        ELSE
            RAISE NOTICE 'Categories already exist.';
        END IF;

    ELSE
        RAISE NOTICE 'Warning: User has no linked business context.';
    END IF;
END $$;

COMMIT;
