-- ==============================================================================
-- 05 CRITICAL FIXES CONSOLIDATED
-- ==============================================================================
-- This script addresses:
-- 1. Storage Bucket and Policies (Fixes Image Uploads)
-- 2. Dashboard Metrics (Seeds meaningful data if empty)
-- 3. Schema Consistency (Ensures all columns exist)

-- 1. FIX STORAGE (IMAGES)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Force permissive policies for PRODUCTS bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'products' );

DROP POLICY IF EXISTS "Auth Uploads" ON storage.objects;
CREATE POLICY "Auth Uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'products' );

DROP POLICY IF EXISTS "Auth Updates" ON storage.objects;
CREATE POLICY "Auth Updates" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'products' );


-- 2. ENSURE ALL COLUMNS EXIST
-- ==============================================================================
-- Suppliers
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- Categories (Ensure table exists)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Auth Users All Access" ON public.categories;
CREATE POLICY "Auth Users All Access" ON public.categories FOR ALL USING (auth.uid() IS NOT NULL);


-- 3. SEED DATA FOR DASHBOARD (Only if empty)
-- ==============================================================================
DO $$
DECLARE
  v_biz_id UUID;
  v_prod_id UUID;
  v_variant_id UUID;
  v_cust_id UUID;
  v_sale_id UUID;
BEGIN
  -- Get Demo Business
  SELECT id INTO v_biz_id FROM businesses WHERE slug = 'demo' LIMIT 1;

  IF v_biz_id IS NOT NULL THEN
     
     -- Ensure at least one product with low stock for Alerts
     IF NOT EXISTS (SELECT 1 FROM products WHERE business_id = v_biz_id) THEN
        INSERT INTO products (business_id, name, description, price, stock) 
        VALUES (v_biz_id, 'Producto Demo', 'Descripción ejemplo', 100, 3) 
        RETURNING id INTO v_prod_id;
        
        -- Create variant for it (if schema v5 structure used)
        -- Note: simplified for standard products table if no variants table
     END IF;

     -- Ensure at least one sale for Revenue metrics
     IF NOT EXISTS (SELECT 1 FROM sales WHERE business_id = v_biz_id) THEN
        -- Get a customer
        SELECT id INTO v_cust_id FROM customers WHERE business_id = v_biz_id LIMIT 1;
        
        -- Create Sale
        INSERT INTO sales (business_id, client_id, total, status, payment_method)
        VALUES (v_biz_id, v_cust_id, 150.00, 'completed', 'cash');
     END IF;

     -- Ensure at least one expense
     IF NOT EXISTS (SELECT 1 FROM expenses WHERE business_id = v_biz_id) THEN
        INSERT INTO expenses (business_id, description, amount, category, date)
        VALUES (v_biz_id, 'Pago Servicios', 50.00, 'servicios', CURRENT_DATE);
     END IF;

  END IF;
END $$;
