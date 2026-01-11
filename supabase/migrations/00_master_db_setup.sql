-- ==============================================================================
-- MASTER SETUP SCRIPT (COMPLETE V5 - IDEMPOTENT)
-- ==============================================================================
-- Ejecutar en el Editor SQL de Supabase.
-- Este script configura TODA la base de datos desde cero.
-- VERSION CORREGIDA: Incluye DROP POLICY IF EXISTS para evitar errores al re-ejecutar.

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLAS PRINCIPALES
-- ==============================================================================

-- 2.1 Perfiles de Usuario
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- 2.2 Negocios
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- 2.3 Miembros del Negocio
CREATE TABLE IF NOT EXISTS public.business_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, 
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);

-- 2.4 Productos
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 Variantes
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  sku TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  stock_level INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.6 Clientes
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.7 Proveedores
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.8 Ventas
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES auth.users(id),
  client_id UUID REFERENCES public.customers(id),
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.9 Items de Venta
CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL
);

-- 2.10 Gastos
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  category TEXT,
  date DATE DEFAULT CURRENT_DATE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.11 Alertas
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STORAGE
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;


-- 4. SEGURIDAD (RLS) - IDEMPOTENTE
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Borrar políticas previas antes de crearlas
DROP POLICY IF EXISTS "Auth Users All Access" ON profiles;
CREATE POLICY "Auth Users All Access" ON profiles FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Auth Users All Access" ON businesses;
CREATE POLICY "Auth Users All Access" ON businesses FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth Users All Access" ON business_members;
CREATE POLICY "Auth Users All Access" ON business_members FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth Users All Access" ON products;
CREATE POLICY "Auth Users All Access" ON products FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth Users All Access" ON product_variants;
CREATE POLICY "Auth Users All Access" ON product_variants FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth Users All Access" ON sales;
CREATE POLICY "Auth Users All Access" ON sales FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth Users All Access" ON sale_items;
CREATE POLICY "Auth Users All Access" ON sale_items FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth Users All Access" ON customers;
CREATE POLICY "Auth Users All Access" ON customers FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth Users All Access" ON suppliers;
CREATE POLICY "Auth Users All Access" ON suppliers FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth Users All Access" ON expenses;
CREATE POLICY "Auth Users All Access" ON expenses FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Auth Users All Access" ON alerts;
CREATE POLICY "Auth Users All Access" ON alerts FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas de Storage
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'products' );

DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'products' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Auth Update" ON storage.objects;
CREATE POLICY "Auth Update" ON storage.objects FOR UPDATE USING ( bucket_id = 'products' AND auth.role() = 'authenticated' );


-- 5. AUTOMATIZACIÓN (TRIGGERS)
-- ==============================================================================

-- 5.1 Manejo de Nuevos Usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING; -- Evitar error si ya existe
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5.2 Disminuir Stock
CREATE OR REPLACE FUNCTION decrease_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE product_variants
  SET stock_level = stock_level - NEW.quantity
  WHERE id = NEW.variant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_decrease_stock_on_sale ON sale_items;
CREATE TRIGGER tr_decrease_stock_on_sale
AFTER INSERT ON sale_items
FOR EACH ROW
EXECUTE FUNCTION decrease_stock_on_sale();


-- 5.3 Alerta
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
DECLARE
    min_stock INTEGER := 5;
    prod_name TEXT;
    v_business_id UUID;
BEGIN
    IF NEW.stock_level <= min_stock THEN
        SELECT name, business_id INTO prod_name, v_business_id FROM products WHERE id = NEW.product_id;
        IF v_business_id IS NOT NULL THEN
            INSERT INTO alerts (business_id, type, message, link)
            VALUES (v_business_id, 'low_stock', 'Stock bajo: ' || COALESCE(prod_name, 'Producto'), '/inventario');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_low_stock ON product_variants;
CREATE TRIGGER tr_check_low_stock
AFTER UPDATE OF stock_level ON product_variants
FOR EACH ROW
WHEN (NEW.stock_level <= 5)
EXECUTE FUNCTION check_low_stock();


-- 6. DATOS DE INICIO (SEED) Y VINCULACIÓN
-- ==============================================================================
DO $$
DECLARE
  v_biz_id UUID;
BEGIN
  -- 1. Crear Negocio 'Demo' si no existe
  IF NOT EXISTS (SELECT 1 FROM businesses WHERE slug = 'demo') THEN
      INSERT INTO businesses (name, slug) VALUES ('Mi Negocio Demo', 'demo') RETURNING id INTO v_biz_id;
  ELSE
      SELECT id INTO v_biz_id FROM businesses WHERE slug = 'demo';
  END IF;

  -- 2. Vincular AL CREADOR (Usuario actual)
  INSERT INTO business_members (business_id, user_id, role)
  SELECT v_biz_id, id, 'admin'
  FROM auth.users
  WHERE NOT EXISTS (
    SELECT 1 FROM business_members WHERE business_id = v_biz_id AND user_id = auth.users.id
  );

  -- 3. Insertar Datos de Ejemplo (si el negocio es nuevo)
  IF v_biz_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM products WHERE business_id = v_biz_id) THEN
      INSERT INTO customers (business_id, full_name, email, address) VALUES (v_biz_id, 'Juan Perez', 'juan@demo.com', 'Calle 123');
      INSERT INTO suppliers (business_id, name, contact_name, phone) VALUES (v_biz_id, 'Proveedor Demo', 'Carlos', '555-1234');
  END IF;
  
END $$;
