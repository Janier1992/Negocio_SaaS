-- ==============================================================================
-- FIX: AUTOMATIC BUSINESS LINKING & TRIGGER UPDATE
-- Run this script in Supabase SQL Editor to fix "Cannot create product/supplier" errors.
-- ==============================================================================

-- 1. Actualizar el Trigger para que SIEMPRE vincule al usuario nuevo con "Mi Negocio Demo"
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_business_id UUID;
BEGIN
  -- A. Crear Perfil
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;

  -- B. Buscar o Crear Negocio Demo
  SELECT id INTO v_business_id FROM public.businesses WHERE slug = 'demo' LIMIT 1;
  
  IF v_business_id IS NULL THEN
     INSERT INTO public.businesses (name, slug) VALUES ('Mi Negocio Demo', 'demo') RETURNING id INTO v_business_id;
  END IF;

  -- C. Vincular Usuario al Negocio (Admin)
  INSERT INTO public.business_members (business_id, user_id, role)
  VALUES (v_business_id, new.id, 'admin')
  ON CONFLICT DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ejecutar vinculación para USUARIOS YA EXISTENTES (Tu caso actual)
DO $$
DECLARE
  v_biz_id UUID;
BEGIN
  -- Buscar ID del Demo
  SELECT id INTO v_biz_id FROM businesses WHERE slug = 'demo';

  -- Si no existe, crearlo
  IF v_biz_id IS NULL THEN
      INSERT INTO businesses (name, slug) VALUES ('Mi Negocio Demo', 'demo') RETURNING id INTO v_biz_id;
  END IF;

  -- Vincular a TODOS los usuarios huerfanos
  INSERT INTO business_members (business_id, user_id, role)
  SELECT v_biz_id, id, 'admin'
  FROM auth.users
  WHERE NOT EXISTS (
    SELECT 1 FROM business_members WHERE business_id = v_biz_id AND user_id = auth.users.id
  );
  
END $$;
