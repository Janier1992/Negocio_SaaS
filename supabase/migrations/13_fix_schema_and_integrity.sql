-- ==============================================================================
-- MIGRATION 13: FIX SCHEMA INTEGRITY & SEED CATEGORIES (CORRECTED)
-- ==============================================================================

-- 1. Ensure Categories Table Exists (using 'name' not 'nombre')
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure Unique Constraint for ON CONFLICT
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_business_id_name_key') THEN
        ALTER TABLE public.categories ADD CONSTRAINT categories_business_id_name_key UNIQUE (business_id, name);
    END IF;
END $$;

-- 3. Add category_id to Products if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'category_id') THEN
        ALTER TABLE public.products ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
    END IF;
    
    -- Ensure supplier_id exists too
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'supplier_id') THEN
        ALTER TABLE public.products ADD COLUMN supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Fix RLS Policies (Idempotent)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth Users All Access" ON public.categories;
CREATE POLICY "Auth Users All Access" ON public.categories FOR ALL USING (auth.uid() IS NOT NULL);

-- 5. Seed Categories for ALL existing businesses
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.businesses LOOP
        INSERT INTO public.categories (business_id, name, description)
        VALUES 
            (r.id, 'General', 'Categoría general'),
            (r.id, 'Electrónica', 'Dispositivos y accesorios'),
            (r.id, 'Ropa', 'Prendas de vestir'),
            (r.id, 'Hogar', 'Artículos para el hogar'),
            (r.id, 'Alimentos', 'Comida y bebidas')
        ON CONFLICT (business_id, name) DO NOTHING;
    END LOOP;
END $$;

-- 6. Trigger to Auto-Seed Categories for NEW businesses
CREATE OR REPLACE FUNCTION public.seed_categories_for_new_business()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.categories (business_id, name, description)
    VALUES 
        (NEW.id, 'General', 'Categoría general'),
        (NEW.id, 'Electrónica', 'Dispositivos y accesorios'),
        (NEW.id, 'Ropa', 'Prendas de vestir'),
        (NEW.id, 'Hogar', 'Artículos para el hogar'),
        (NEW.id, 'Alimentos', 'Comida y bebidas')
    ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_seed_categories ON public.businesses;
CREATE TRIGGER tr_seed_categories
AFTER INSERT ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.seed_categories_for_new_business();

-- 7. Verify Update
SELECT 
    b.name as business_name, 
    count(c.id) as category_count 
FROM public.businesses b 
LEFT JOIN public.categories c ON b.id = c.business_id 
GROUP BY b.name;
