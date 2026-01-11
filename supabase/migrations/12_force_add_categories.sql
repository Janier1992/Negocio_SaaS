-- ==============================================================================
-- 12 FORCE ADD CATEGORIES
-- ==============================================================================
-- Run this script in the Supabase SQL Editor.
-- It forces insertion of categories for the current user's business

BEGIN;

DO $$
DECLARE
    v_user_id UUID := auth.uid();
    v_business_id UUID;
    v_new_cat_id UUID;
BEGIN
    -- 1. Identify User's Business
    SELECT business_id INTO v_business_id FROM public.business_members WHERE user_id = v_user_id LIMIT 1;

    IF v_business_id IS NOT NULL THEN
        RAISE NOTICE 'Found Business ID: %', v_business_id;

        -- 2. Force Insert Categories (No Count Check)
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
        
        RAISE NOTICE 'Categories inserted/ensured.';
        
    ELSE
        RAISE NOTICE 'Error: No business found for user. Please create a business first.';
    END IF;
END $$;

-- 3. Verify Output
SELECT * FROM public.categories WHERE business_id = (SELECT business_id FROM public.business_members WHERE user_id = auth.uid() LIMIT 1);

COMMIT;
