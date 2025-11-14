import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/newClient";
import { useUserProfile } from "./useUserProfile";
import { sanitizeCell, parseDecimal, parseInteger, uploadProductosCore } from "./excelUploadCore";

export const useExcelUpload = () => {
  const [loading, setLoading] = useState(false);
  const { empresaId } = useUserProfile();

  // sanitizeCell/parseDecimal/parseInteger ahora provienen de excelUploadCore para permitir testeo aislado

  const uploadProveedores = async (file: File) => {
    if (!empresaId) throw new Error("No se encontró empresa asociada");
    
    setLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) throw new Error("El archivo está vacío");

      // Validar columnas requeridas
      const firstRow: any = jsonData[0];
      if (!firstRow.nombre) {
        throw new Error("La columna 'nombre' es obligatoria");
      }

      // Obtener proveedores existentes para evitar duplicados
      const { data: existingProveedores } = await supabase
        .from("proveedores")
        .select("nombre")
        .eq("empresa_id", empresaId);

      const existingNames = new Set(existingProveedores?.map(p => p.nombre.toLowerCase()) || []);

      const newProveedores = jsonData
        .map((row: any) => ({
          nombre: sanitizeCell(row.nombre || ""),
          contacto: row.contacto ? sanitizeCell(row.contacto) : null,
          email: row.email ? sanitizeCell(row.email) : null,
          telefono: row.telefono ? sanitizeCell(row.telefono) : null,
          direccion: row.direccion ? sanitizeCell(row.direccion) : null,
          empresa_id: empresaId,
        }))
        .filter(p => p.nombre && !existingNames.has(p.nombre.toLowerCase()));

      if (newProveedores.length === 0) {
        throw new Error("Todos los proveedores ya existen");
      }

      const { error } = await supabase.from("proveedores").insert(newProveedores);
      if (error) throw error;

      return {
        inserted: newProveedores.length,
        duplicates: jsonData.length - newProveedores.length,
      };
    } finally {
      setLoading(false);
    }
  };

  const uploadProductos = async (file: File, categorias: any[], proveedores: any[]) => {
    if (!empresaId) throw new Error("No se encontró empresa asociada");
    
    setLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) throw new Error("El archivo está vacío");

      // Delegar en función pura para facilitar testeo y evitar hooks
      return await uploadProductosCore(jsonData as any[], empresaId, supabase, categorias, proveedores);
    } finally {
      setLoading(false);
    }
  };

  const uploadVentas = async (file: File) => {
    if (!empresaId) throw new Error("No se encontró empresa asociada");
    
    setLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) throw new Error("El archivo está vacío");

      // Validar columnas
      const firstRow: any = jsonData[0];
      if (!firstRow.producto_codigo || !firstRow.cantidad || !firstRow.precio_unitario || !firstRow.metodo_pago) {
        throw new Error("Faltan columnas obligatorias");
      }

      // Obtener productos
      const { data: productos } = await supabase
        .from("productos")
        .select("id, codigo, stock")
        .eq("empresa_id", empresaId);

      const productoMap = new Map(productos?.map(p => [p.codigo.toLowerCase(), p]) || []);

      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Agrupar ventas por fecha y cliente
      const ventasAgrupadas = new Map<string, any[]>();
      
      for (const row of jsonData) {
        const rowData = row as any;
        const codigo = sanitizeCell(rowData.producto_codigo).toLowerCase();
        const producto = productoMap.get(codigo);
        
        if (!producto) {
          console.warn(`Producto ${rowData.producto_codigo} no encontrado, omitiendo`);
          continue;
        }

        const cantidad = parseInt(String(rowData.cantidad));
        if (cantidad > producto.stock) {
          throw new Error(`Stock insuficiente para ${rowData.producto_codigo}. Disponible: ${producto.stock}`);
        }

        const key = `${sanitizeCell(rowData.fecha || new Date().toISOString().split('T')[0])}_${sanitizeCell(rowData.cliente || 'General')}`;
        if (!ventasAgrupadas.has(key)) {
          ventasAgrupadas.set(key, []);
        }

        ventasAgrupadas.get(key)!.push({
          producto_id: producto.id,
          cantidad,
          precio_unitario: Number(rowData.precio_unitario),
          subtotal: cantidad * Number(rowData.precio_unitario),
          fecha: sanitizeCell(rowData.fecha),
          cliente: sanitizeCell(rowData.cliente),
          metodo_pago: rowData.metodo_pago,
        });
      }

      let totalVentasInsertadas = 0;

      // Insertar ventas agrupadas
      for (const [key, items] of ventasAgrupadas) {
        const total = items.reduce((sum, item) => sum + item.subtotal, 0);
        
        // Insertar venta
        const { data: venta, error: ventaError } = await supabase
          .from("ventas")
          .insert({
            cliente: sanitizeCell(items[0].cliente) || null,
            metodo_pago: items[0].metodo_pago,
            total,
            empresa_id: empresaId,
            user_id: user.id,
            created_at: items[0].fecha ? new Date(items[0].fecha).toISOString() : undefined,
          })
          .select()
          .single();

        if (ventaError) throw ventaError;

        // Insertar detalles
        const detalles = items.map(item => ({
          venta_id: venta.id,
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: item.subtotal,
        }));

        const { error: detalleError } = await supabase
          .from("ventas_detalle")
          .insert(detalles);

        if (detalleError) throw detalleError;

        // Actualizar stock
        for (const item of items) {
          const producto = productoMap.get(
            productos?.find(p => p.id === item.producto_id)?.codigo.toLowerCase() || ""
          );
          if (producto) {
            await supabase
              .from("productos")
              .update({ stock: producto.stock - item.cantidad })
              .eq("id", item.producto_id);
          }
        }

        // Upsert automático del cliente en módulo Clientes
        try {
          const nombreCliente = sanitizeCell(items[0].cliente || "");
          if (nombreCliente) {
            const nowIso = venta.created_at ? new Date(venta.created_at).toISOString() : (items[0].fecha ? new Date(items[0].fecha).toISOString() : new Date().toISOString());
            const { data: existing } = await supabase
              .from("clientes")
              .select("id, total_comprado, compras_count, fecha_primera_compra")
              .eq("empresa_id", empresaId)
              .eq("nombre", nombreCliente)
              .maybeSingle();

            if (!existing) {
              await supabase
                .from("clientes")
                .insert({
                  empresa_id: empresaId,
                  nombre: nombreCliente,
                  fecha_primera_compra: nowIso,
                  fecha_ultima_compra: nowIso,
                  total_comprado: Number(total || 0),
                  compras_count: 1,
                });
            } else {
              await supabase
                .from("clientes")
                .update({
                  fecha_ultima_compra: nowIso,
                  total_comprado: Number(existing.total_comprado || 0) + Number(total || 0),
                  compras_count: Number(existing.compras_count || 0) + 1,
                })
                .eq("id", existing.id);
            }
          }
        } catch (clErr) {
          console.warn("[Clientes] No se pudo upsert el cliente tras venta (Excel)", clErr);
        }

        totalVentasInsertadas++;
      }

      return {
        inserted: totalVentasInsertadas,
        duplicates: 0,
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    uploadProveedores,
    uploadProductos,
    uploadVentas,
    loading,
  };
};
