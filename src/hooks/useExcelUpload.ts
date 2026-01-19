import { useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "./useUserProfile";

// Helper to clean and format strings
const cleanStr = (val: any) => String(val || "").trim();

// Helper to clean price strings (handle $ 12.500 -> 12500)
const cleanPrice = (val: any): number => {
  if (!val) return 0;
  if (typeof val === 'number') return val;

  const str = String(val).trim();
  // Remove currency symbols and spaces
  let cleaned = str.replace(/[$\s]/g, '');

  // Handle formats like "12.500" (thousands dot) vs "12,500" (thousands comma or decimal comma)
  // Heuristic: If it has both dot and comma, the last one is decimal.
  // If it has only dot or only comma:
  // - If comma and followed by 1 or 2 digits -> likely decimal (10,5)
  // - If dot and followed by 3 digits -> likely thousands (10.000) -> remove dot

  if (cleaned.includes('.') && cleaned.includes(',')) {
    if (cleaned.indexOf('.') < cleaned.indexOf(',')) {
      // 12.500,00 -> remove dot, replace comma with dot
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // 12,500.00 -> remove comma
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes('.')) {
    // Check if it looks like thousands (e.g. 10.000 or 1.000.000)
    const parts = cleaned.split('.');
    const lastPart = parts[parts.length - 1];
    if (parts.length > 1 && lastPart.length === 3) {
      // Assume thousands separator
      cleaned = cleaned.replace(/\./g, '');
    }
  } else if (cleaned.includes(',')) {
    // Check if it looks like thousands (e.g. 10,000) or decimal (10,50)
    const parts = cleaned.split(',');
    const lastPart = parts[parts.length - 1];
    if (parts.length > 1 && lastPart.length === 3) {
      // Ambiguous: 10,000 could be 10k or 10.000
      // In param context (COP), typically comma is thousands or decimals.
      // Let's assume if it matches exactly 3 digits it might be thousands, unless it's small value.
      // SAFEST BET: Replace comma with dot ONLY if it looks like decimal.
      // actually for "12,500" user said it's 12500 pesos.
      // So remove comma.
      cleaned = cleaned.replace(/,/g, '');
    } else {
      // 10,50 -> 10.50
      cleaned = cleaned.replace(',', '.');
    }
  }

  return Number(cleaned) || 0;
};

export const useExcelUpload = () => {
  const [loading, setLoading] = useState(false);
  const { data: userProfile } = useUserProfile();
  const empresaId = userProfile?.business_id;

  const uploadProveedores = async (file: File) => {
    if (!empresaId) throw new Error("No se encontró empresa asociada");

    setLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

      if (jsonData.length === 0) throw new Error("El archivo está vacío");

      const firstRow: any = jsonData[0];
      if (!firstRow.nombre) {
        throw new Error("La columna 'nombre' es obligatoria");
      }

      const { data: existingProveedores } = await (supabase as any)
        .from("suppliers")
        .select("name")
        .eq("business_id", empresaId);

      const existingNames = new Set((existingProveedores as any[])?.map((p) => p.name.toLowerCase()) || []);

      const newProveedores = jsonData
        .map((row: any) => ({
          name: String(row.nombre || "").trim(),
          contact_name: row.contacto ? String(row.contacto).trim() : null,
          email: row.email ? String(row.email).trim() : null,
          phone: row.telefono ? String(row.telefono).trim() : null,
          address: row.direccion ? String(row.direccion).trim() : null,
          business_id: empresaId,
        }))
        .filter((p) => p.name && !existingNames.has(p.name.toLowerCase()));

      if (newProveedores.length === 0) {
        throw new Error("Todos los proveedores ya existen");
      }

      const { error } = await (supabase as any).from("suppliers").insert(newProveedores);
      if (error) throw error;

      return {
        inserted: newProveedores.length,
        duplicates: jsonData.length - newProveedores.length,
      };
    } finally {
      setLoading(false);
    }
  };


  // Helper to normalize keys (remove accents, lowercase, handle aliases)
  const normalizeHeaders = (data: any[]) => {
    if (!data || data.length === 0) return [];

    const firstRow = data[0];
    const keys = Object.keys(firstRow);

    const mapKey = (key: string) => {
      const k = key.toLowerCase().trim();
      if (k.includes("código") || k.includes("codigo") || k === "sku") return "codigo";
      if (k.includes("nombre") || k.includes("producto")) return "nombre";
      if (k.includes("descripción") || k.includes("descripcion")) return "descripcion";
      if (k.includes("categoría") || k.includes("categoria")) return "categoria";
      if (k.includes("proveedor")) return "proveedor";
      if (k.includes("precio") || k.includes("costo")) return "precio";
      if (k.includes("stock actual") || k === "stock" || k.includes("cantidad")) return "stock";
      if (k.includes("stock mínimo") || k.includes("stock minimo")) return "stock_minimo";
      return key.toLowerCase().replace(/\s+/g, "_");
    };

    return data.map(row => {
      const newRow: any = {};
      Object.keys(row).forEach(key => {
        newRow[mapKey(key)] = row[key];
      });
      return newRow;
    });
  };

  const uploadProductos = async (file: File, categorias: any[], proveedores: any[]) => {
    if (!empresaId) throw new Error("No se encontró empresa asociada");

    setLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

      if (rawData.length === 0) throw new Error("El archivo está vacío");

      // Normalize headers
      const jsonData = normalizeHeaders(rawData);

      const firstRow: any = jsonData[0];
      if (!firstRow.codigo || !firstRow.nombre) {
        console.error("Columnas encontradas:", Object.keys(firstRow));
        throw new Error(`Las columnas 'codigo' y 'nombre' son obligatorias. Se detectaron: ${Object.keys(firstRow).join(", ")}`);
      }

      const { data: existingVariants } = await (supabase as any)
        .from("product_variants")
        .select("sku")
        .eq("business_id", empresaId);

      const existingCodes = new Set((existingVariants as any[])?.map(v => v.sku?.toLowerCase()) || []);

      const categoriaMap = new Map(categorias.map(c => [c.nombre.toLowerCase(), c.id]));
      const proveedorMap = new Map(proveedores.map(p => [p.nombre.toLowerCase(), p.id]));

      const newProductos = jsonData
        .map((row: any) => {
          const codigo = String(row.codigo || "").trim();
          // Skip if no code or already exists
          if (!codigo || existingCodes.has(codigo.toLowerCase())) return null;

          return {
            codigo,
            nombre: String(row.nombre || "").trim(),
            descripcion: row.descripcion ? String(row.descripcion).trim() : null,
            categoria_id: row.categoria ? categoriaMap.get(String(row.categoria).toLowerCase()) : null,
            proveedor_id: row.proveedor ? proveedorMap.get(String(row.proveedor).toLowerCase()) : null,
            precio: cleanPrice(row.precio),
            stock: parseInt(String(row.stock || 0)),
            stock_minimo: parseInt(String(row.stock_minimo || 0)),
            empresa_id: empresaId,
          };
        })
        .filter(p => p !== null);

      if (newProductos.length === 0) {
        throw new Error("No hay productos nuevos válidos para importar");
      }

      // Insert Products
      const productsToInsert = newProductos.map(p => ({
        business_id: p.empresa_id,
        name: p.nombre,
        description: p.descripcion,
        category_id: p.categoria_id,
        supplier_id: p.proveedor_id
      }));

      // We need to insert one by one or in batches to get IDs back correctly
      // For simplicity/safety, we'll fetch all products after insertion or just insert individually if performance allows.
      // Batch insert returns all rows but order is NOT guaranteed to match perfectly if triggers exist, though usually it does.
      // Optimistic matching by name + business_id
      const { data: insertedProducts, error: prodError } = await (supabase as any)
        .from("products")
        .insert(productsToInsert)
        .select("id, name");

      if (prodError) throw prodError;
      if (!insertedProducts) throw new Error("Falló la inserción de productos");

      // Verify alignment (Map by Name)
      // Note: If multiple products have same name, this might be ambiguous. 
      // Ideally we would insert one by one inside a loop or transaction if backend supported it easily via API.
      // But for bulk script, name matching is acceptable risk if names are unique-ish.
      const initialMap = new Map((insertedProducts as any[]).map(p => [p.name, p.id]));

      // Prepare Variants
      const variantsToInsert = newProductos.map(p => {
        const prodId = initialMap.get(p.nombre);
        if (!prodId) return null;
        return {
          product_id: prodId,
          business_id: p.empresa_id,
          sku: p.codigo,
          price: p.precio,
          stock_level: p.stock
        };
      }).filter(v => v !== null);

      if (variantsToInsert.length > 0) {
        const { error: varError } = await (supabase as any)
          .from("product_variants")
          .insert(variantsToInsert);
        if (varError) throw varError;
      }

      return {
        inserted: newProductos.length,
        duplicates: rawData.length - newProductos.length,
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    uploadProveedores,
    uploadProductos,
    loading,
  };
};

