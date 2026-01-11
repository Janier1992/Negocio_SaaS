-- ==============================================================================
-- 09 STANDARD CATEGORIES SETUP (UPDATED V2)
-- ==============================================================================
-- This script:
-- 1. Updates handle_new_user() specifically to seed STANDARD SIMPLIFIED categories.
-- 2. Inserts these categories into ALL existing businesses.

-- 1. UPDATE TRIGGER FUNCTION (For Future Users)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_biz_id UUID;
  v_cat_list TEXT[] := ARRAY[
    'Papelería',
    'Verduras',
    'Legumbres',
    'Carnicería',
    'Lácteos',
    'Panadería',
    'Bebidas',
    'Dulces',
    'Alimentos',
    'Limpieza',
    'Higiene',
    'Farmacia',
    'Hogar',
    'Ferretería',
    'Electrónica',
    'Accesorios',
    'Ropa',
    'Calzado'
  ];
  v_cat TEXT;
BEGIN
  -- 1. Create Profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;

  -- 2. Create Default Business
  INSERT INTO public.businesses (name, slug)
  VALUES (
    COALESCE(new.raw_user_meta_data->>'business_name', 'Mi Primer Negocio'), 
    'biz_' || substr(new.id::text, 1, 8)
  )
  RETURNING id INTO v_biz_id;

  -- 3. Link User to Business
  INSERT INTO public.business_members (business_id, user_id, role)
  VALUES (v_biz_id, new.id, 'admin');

  -- 4. Seed Standard Categories
  FOREACH v_cat IN ARRAY v_cat_list
  LOOP
    INSERT INTO public.categories (business_id, name) VALUES (v_biz_id, v_cat);
  END LOOP;

  -- 5. Seed Example Data
  INSERT INTO public.suppliers (business_id, name, contact_name) 
  VALUES (v_biz_id, 'Proveedor General', 'Administrador');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. SEED EXISTING BUSINESSES (For Current Users)
-- ==============================================================================
DO $$
DECLARE
  r_biz RECORD;
  v_cat_list TEXT[] := ARRAY[
    'Papelería',
    'Verduras',
    'Legumbres',
    'Carnicería',
    'Lácteos',
    'Panadería',
    'Bebidas',
    'Dulces',
    'Alimentos',
    'Limpieza',
    'Higiene',
    'Farmacia',
    'Hogar',
    'Ferretería',
    'Electrónica',
    'Accesorios',
    'Ropa',
    'Calzado'
  ];
  v_cat TEXT;
BEGIN
  -- For every business in the system
  FOR r_biz IN SELECT id FROM public.businesses
  LOOP
    -- Insert each category if it doesn't already exist for that business
    FOREACH v_cat IN ARRAY v_cat_list
    LOOP
      IF NOT EXISTS (SELECT 1 FROM public.categories WHERE business_id = r_biz.id AND name = v_cat) THEN
        INSERT INTO public.categories (business_id, name) VALUES (r_biz.id, v_cat);
      END IF;
    END LOOP;
  END LOOP;
END $$;
