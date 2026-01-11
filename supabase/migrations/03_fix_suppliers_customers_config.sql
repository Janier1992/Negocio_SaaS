-- ==============================================================================
-- 03 FIX SUPPLIERS, CUSTOMERS & CONFIGURATION
-- ==============================================================================
-- This script adds missing fields and tables to enable real data persistence
-- for Suppliers stats, Customers stats, and Configuration module.

-- 1. ADD STATUS FIELD TO SUPPLIERS
-- Allows tracking active/inactive suppliers
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- 2. CREATE PURCHASE ORDERS TABLE
-- Tracks pending orders from suppliers
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  order_number TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'cancelled')),
  total_amount DECIMAL(10,2),
  expected_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- RLS for purchase_orders
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth Users All Access" ON public.purchase_orders;
CREATE POLICY "Auth Users All Access" ON public.purchase_orders FOR ALL USING (auth.uid() IS NOT NULL);

-- 3. CREATE USER PREFERENCES TABLE
-- Stores user notification and app preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_alerts BOOLEAN DEFAULT true,
  stock_alerts BOOLEAN DEFAULT true,
  summary_reports BOOLEAN DEFAULT false,
  language TEXT DEFAULT 'es',
  theme TEXT DEFAULT 'light',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- RLS for user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own preferences" ON public.user_preferences;
CREATE POLICY "Users can manage own preferences" ON public.user_preferences 
FOR ALL USING (auth.uid() = user_id);

-- 4. ADD MISSING FIELDS TO BUSINESSES TABLE (if not exist)
-- These fields are needed for Configuration module
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT;

-- 5. SEED DEFAULT USER PREFERENCES FOR EXISTING USERS
-- Create preferences for users who don't have them yet
DO $$
DECLARE
  v_user RECORD;
BEGIN
  FOR v_user IN SELECT id FROM auth.users LOOP
    INSERT INTO public.user_preferences (user_id)
    VALUES (v_user.id)
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END $$;

-- 6. CREATE FUNCTION TO AUTO-CREATE USER PREFERENCES ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created_preferences ON auth.users;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_preferences();

-- 7. UPDATE DEMO BUSINESS WITH SAMPLE DATA
DO $$
DECLARE
  v_biz_id UUID;
BEGIN
  SELECT id INTO v_biz_id FROM businesses WHERE slug = 'demo' LIMIT 1;

  IF v_biz_id IS NOT NULL THEN
    UPDATE public.businesses
    SET 
      address = 'Av. Principal 123, Bogotá',
      phone = '+57 300 123 4567',
      email = 'contacto@minegocio.com',
      tax_id = '900.123.456-7'
    WHERE id = v_biz_id;
  END IF;
END $$;
