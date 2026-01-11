-- ==============================================================================
-- SEMBRADO DE CATEGORÍAS (Para Negocios Existentes)
-- Ejecutar en Supabase -> SQL Editor
-- ==============================================================================

-- Insertar categorías básicas en TODOS los negocios que no tengan ninguna.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id, name FROM public.businesses LOOP
    
    -- Insertar 'General' si no existe ninguna categoría
    INSERT INTO public.categories (business_id, name)
    SELECT r.id, 'General'
    WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE business_id = r.id AND name = 'General');

    -- Insertar otras
    INSERT INTO public.categories (business_id, name)
    SELECT r.id, 'Ropa'
    WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE business_id = r.id AND name = 'Ropa');

    INSERT INTO public.categories (business_id, name)
    SELECT r.id, 'Electrónica'
    WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE business_id = r.id AND name = 'Electrónica');

    INSERT INTO public.categories (business_id, name)
    SELECT r.id, 'Hogar'
    WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE business_id = r.id AND name = 'Hogar');

  END LOOP;
END $$;
