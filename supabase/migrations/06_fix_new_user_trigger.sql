-- ==============================================================================
-- CORRECCIÓN CRÍTICA: CREACIÓN DE NUEVO INQUILINO (TENANT) + SEMILLAS
-- Ejecutar este script en el Editor SQL de Supabase para arreglar el registro.
-- ==============================================================================

-- 1. Actualizar función del Trigger para crear Negocio PROPIO + CATEGORÍAS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_business_id UUID;
  v_business_name TEXT;
  v_business_slug TEXT;
  v_full_name TEXT;
BEGIN
  -- A. Obtener nombre del usuario
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', 'Usuario Nuevo');

  -- B. Crear el Perfil
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, v_full_name)
  ON CONFLICT (id) DO NOTHING;

  -- C. Generar datos para el Nuevo Negocio
  v_business_name := 'Negocio de ' || split_part(v_full_name, ' ', 1);
  v_business_slug := 'biz-' || lower(substr(md5(random()::text), 0, 8));

  -- D. Crear el Negocio
  INSERT INTO public.businesses (name, slug)
  VALUES (v_business_name, v_business_slug)
  RETURNING id INTO v_business_id;

  -- E. Vincular Usuario como ADMIN
  INSERT INTO public.business_members (business_id, user_id, role)
  VALUES (v_business_id, new.id, 'admin');

  -- F. INSERTAR DATOS POR DEFECTO (Categorías y Proveedores)
  -- 1. Categorías
  INSERT INTO public.categories (business_id, name) VALUES
  (v_business_id, 'General'),
  (v_business_id, 'Ropa'),
  (v_business_id, 'Electrónica'),
  (v_business_id, 'Hogar'),
  (v_business_id, 'Alimentos');

  -- 2. Clientes y Proveedores de Ejemplo
  INSERT INTO public.customers (business_id, full_name, email, address)
  VALUES (v_business_id, 'Cliente Mostrador', 'cliente@ejemplo.com', 'Local');

  INSERT INTO public.suppliers (business_id, name, contact_name, phone)
  VALUES (v_business_id, 'Proveedor General', 'Contacto', '555-0000');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Asegurarse de que el trigger esté activo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
