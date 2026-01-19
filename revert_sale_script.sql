-- SCRIPT DE MIGRACIÓN: REVERTIR VENTAS (ACTUALIZADO V2)
-- Ejecuta esto de nuevo para incluir el borrado automático de clientes 'huérfanos'.

CREATE OR REPLACE FUNCTION revert_sale(p_sale_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_client_id UUID;
BEGIN
    -- Obtener el ID del cliente antes de borrar la venta
    SELECT client_id INTO v_client_id FROM sales WHERE id = p_sale_id;

    -- 1. Restaurar Stock
    FOR v_item IN 
        SELECT variant_id, quantity 
        FROM sale_items 
        WHERE sale_id = p_sale_id
    LOOP
        IF v_item.variant_id IS NOT NULL THEN
            UPDATE product_variants
            SET stock_level = stock_level + v_item.quantity
            WHERE id = v_item.variant_id;
        END IF;
    END LOOP;

    -- 2. Eliminar Venta
    DELETE FROM sales WHERE id = p_sale_id;

    -- 3. Eliminar Cliente si NO tiene más ventas (Limpieza de clientes huérfanos)
    -- Esto evita borrar clientes recurrentes que tienen otras compras.
    IF v_client_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM sales WHERE client_id = v_client_id) THEN
            DELETE FROM customers WHERE id = v_client_id;
        END IF;
    END IF;
END;
$$;
