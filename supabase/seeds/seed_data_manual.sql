
-- Script SQL para insertar datos de prueba en Mi Negocio ERP
-- Ejecutar en el Editor SQL de Supabase (https://supabase.com/dashboard/project/escbtxtmvtqiutnhyhun/sql)

-- 1. Crear una Empresa de Demostración (si no existe)
-- Usamos ON CONFLICT o un bloque DO para evitar duplicados si la columna slug existiera, pero como no existe, insertamos directo y capturamos el ID.

DO $$
DECLARE
    v_empresa_id uuid;
    v_user_email text := 'admin@minegocio.com'; -- CAMBIAR POR TU EMAIL DE USUARIO
    v_user_id uuid;
BEGIN
    -- Intentar obtener el ID del usuario actual (opcional, si quieres vincularte automáticamente)
    -- SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email;

    -- Insertar Empresa
    INSERT INTO public.empresas (nombre)
    VALUES ('Mi Negocio Demo')
    RETURNING id INTO v_empresa_id;

    RAISE NOTICE 'Empresa creada con ID: %', v_empresa_id;

    -- Vincular al usuario (si encontraste el ID)
    -- IF v_user_id IS NOT NULL THEN
    --     UPDATE public.profiles SET empresa_id = v_empresa_id WHERE id = v_user_id;
    -- END IF;

    -- 2. Insertar Productos de Prueba
    INSERT INTO public.productos (empresa_id, nombre, descripcion, precio, stock, stock_minimo, codigo, categoria_id)
    VALUES
    (v_empresa_id, 'Café Premium 500g', 'Café de altura, tostado medio', 25000, 50, 10, 'CAF-001', NULL),
    (v_empresa_id, 'Leche Almendra 1L', 'Leche vegetal sin azúcar', 12000, 20, 5, 'LAC-001', NULL),
    (v_empresa_id, 'Galletas Avena', 'Paquete de 12 unidades', 8500, 100, 15, 'GAL-001', NULL),
    (v_empresa_id, 'Mermelada Mora', 'Frasco de vidrio 300g', 9000, 30, 5, 'MER-001', NULL),
    (v_empresa_id, 'Pan Integral', 'Con semillas de chía', 6500, 15, 3, 'PAN-001', NULL),
    (v_empresa_id, 'Jugo Naranja 1L', 'Exprimido natural', 15000, 25, 8, 'BEB-001', NULL),
    (v_empresa_id, 'Yogurt Griego 1kg', 'Natural sin dulce', 18000, 12, 4, 'LAC-002', NULL),
    (v_empresa_id, 'Granola 500g', 'Con frutos secos', 22000, 40, 10, 'CER-001', NULL),
    (v_empresa_id, 'Aceite Oliva 500ml', 'Extra virgen importado', 35000, 10, 2, 'ACE-001', NULL),
    (v_empresa_id, 'Pasta Penne 500g', 'Semola de trigo duro', 4500, 60, 20, 'PAS-001', NULL),
    (v_empresa_id, 'Salsa Tomate', 'Estilo casero con albahaca', 7000, 35, 10, 'SAL-001', NULL),
    (v_empresa_id, 'Queso Mozzarella', 'Bloque de 500g', 16000, 18, 5, 'LAC-003', NULL),
    (v_empresa_id, 'Jamón Serrano', 'Loncheado 100g', 14000, 25, 5, 'CAR-001', NULL),
    (v_empresa_id, 'Vino Tinto', 'Cabernet Sauvignon', 45000, 30, 6, 'BEB-002', NULL),
    (v_empresa_id, 'Chocolate 70%', 'Tableta 100g', 11000, 50, 10, 'DUL-001', NULL),
    (v_empresa_id, 'Té Verde', 'Caja 20 bolsitas', 8000, 45, 12, 'BEB-003', NULL),
    (v_empresa_id, 'Miel Orgánica', 'Frasco 250g', 19000, 20, 5, 'DUL-002', NULL),
    (v_empresa_id, 'Arroz Integral 1kg', 'Grano largo', 5500, 40, 10, 'GRA-001', NULL),
    (v_empresa_id, 'Lentejas 500g', 'Seleccionadas', 4200, 35, 8, 'GRA-002', NULL),
    (v_empresa_id, 'Esponja Cocina', 'Pack x3', 3000, 100, 20, 'LIM-001', NULL);

END $$;
