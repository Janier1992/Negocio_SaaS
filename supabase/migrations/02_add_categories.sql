-- ==============================================================================
-- 02 ADD CATEGORIES TABLE & UPDATE PRODUCTS
-- ==============================================================================

-- 1. Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- 2. Add RLS to Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth Users All Access" ON public.categories;
CREATE POLICY "Auth Users All Access" ON public.categories FOR ALL USING (auth.uid() IS NOT NULL);

-- 3. Add category_id to Products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- 4. Seed Data: Create Default Categories for the Demo Business
DO $$
DECLARE
  v_biz_id UUID;
BEGIN
  -- Find Demo Business
  SELECT id INTO v_biz_id FROM businesses WHERE slug = 'demo' LIMIT 1;

  IF v_biz_id IS NOT NULL THEN
      -- Insert Categories if they don't exist
      INSERT INTO public.categories (business_id, name)
      VALUES 
        (v_biz_id, 'General'),
        (v_biz_id, 'Ropa'),
        (v_biz_id, 'Electrónica'),
        (v_biz_id, 'Hogar')
      ON CONFLICT DO NOTHING; -- No conflict constraint on name usually, but just safer to run once.
  END IF;
END $$;
