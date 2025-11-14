import { SupabaseClient } from '@supabase/supabase-js';

export const sanitizeCell = (val: any) => {
  if (val == null) return "";
  let s = String(val);
  s = s.replace(/^([=\-\+@])+/, "");
  s = s.replace(/[\u0000-\u001F\u007F]/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s.slice(0, 512);
};

export const parseDecimal = (val: any, fallback = 0) => {
  if (val == null || val === "") return fallback;
  if (typeof val === "number") {
    return isFinite(val) ? val : fallback;
  }
  let s = String(val).trim();
  s = s.replace(/[^0-9,\.\-]/g, "");
  if (!s) return fallback;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma !== -1 && lastDot !== -1) {
    const lastSep = Math.max(lastComma, lastDot);
    const decimalIsComma = lastSep === lastComma;
    s = s.replace(decimalIsComma ? /\./g : /,/g, "");
    s = s.replace(/,/g, ".");
    const n = Number(s);
    return isFinite(n) ? n : fallback;
  }
  if (lastComma !== -1 && lastDot === -1) {
    const digitsAfter = s.length - lastComma - 1;
    if (digitsAfter === 2 || digitsAfter === 1) {
      s = s.replace(/,/g, ".");
    } else {
      s = s.replace(/,/g, "");
    }
    const n = Number(s);
    return isFinite(n) ? n : fallback;
  }
  if (lastDot !== -1 && lastComma === -1) {
    const digitsAfter = s.length - lastDot - 1;
    if (digitsAfter > 2) {
      s = s.replace(/\./g, "");
    }
    const n = Number(s);
    return isFinite(n) ? n : fallback;
  }
  const n = Number(s);
  return isFinite(n) ? n : fallback;
};

export const parseInteger = (val: any, fallback = 0) => {
  const n = parseDecimal(val, fallback);
  if (!isFinite(n)) return fallback;
  return Math.trunc(n);
};

export async function uploadProductosCore(
  jsonData: any[],
  empresaId: string,
  supabase: SupabaseClient,
  categorias: any[],
  proveedores: any[],
) {
  if (!empresaId) throw new Error("No se encontró empresa asociada");
  if (!jsonData || jsonData.length === 0) throw new Error("El archivo está vacío");

  const firstRow: any = jsonData[0];
  if (!firstRow.codigo || !firstRow.nombre) {
    throw new Error("Las columnas 'codigo' y 'nombre' son obligatorias");
  }

  const { data: existingProductos } = await supabase
    .from("productos")
    .select("id, codigo")
    .eq("empresa_id", empresaId);

  const existingCodes = new Set(existingProductos?.map((p: any) => String(p.codigo).toLowerCase()) || []);
  const existingCodeToId = new Map<string, string>(
    (existingProductos || []).map((p: any) => [String(p.codigo).toLowerCase(), String(p.id)])
  );

  const normalize = (v: any) => sanitizeCell(v || "").toLowerCase();
  const existingCategoriaMap = new Map<string, string>(categorias.map((c: any) => [normalize(c.nombre), c.id]));
  const existingProveedorMap = new Map<string, string>(proveedores.map((p: any) => [normalize(p.nombre), p.id]));

  const excelCategorias = Array.from(new Set((jsonData as any[])
    .map(r => normalize((r as any).categoria))
    .filter(n => !!n)));
  const excelProveedores = Array.from(new Set((jsonData as any[])
    .map(r => normalize((r as any).proveedor))
    .filter(n => !!n)));

  const missingCats = excelCategorias.filter(n => !existingCategoriaMap.has(n));
  const missingProvs = excelProveedores.filter(n => !existingProveedorMap.has(n));

  if (missingCats.length > 0) {
    const toInsert = missingCats.map(nombre => ({ nombre, empresa_id: empresaId }));
    const { data: insertedCats, error: insCatErr } = await supabase
      .from("categorias")
      .insert(toInsert)
      .select("id, nombre");
    if (insCatErr) {
      const { data: refreshed } = await supabase
        .from("categorias")
        .select("id, nombre")
        .eq("empresa_id", empresaId);
      for (const c of (refreshed || [])) existingCategoriaMap.set(normalize(c.nombre), c.id);
    } else {
      for (const c of (insertedCats || [])) existingCategoriaMap.set(normalize(c.nombre), c.id);
    }
  }

  if (missingProvs.length > 0) {
    const toInsert = missingProvs.map(nombre => ({ nombre, empresa_id: empresaId }));
    const { data: insertedProvs, error: insProvErr } = await supabase
      .from("proveedores")
      .insert(toInsert)
      .select("id, nombre");
    if (insProvErr) {
      const { data: refreshed } = await supabase
        .from("proveedores")
        .select("id, nombre")
        .eq("empresa_id", empresaId);
      for (const p of (refreshed || [])) existingProveedorMap.set(normalize(p.nombre), p.id);
    } else {
      for (const p of (insertedProvs || [])) existingProveedorMap.set(normalize(p.nombre), p.id);
    }
  }

  const categoriaMap = existingCategoriaMap;
  const proveedorMap = existingProveedorMap;

  const newProductos = jsonData
    .map((row: any) => {
      const codigo = sanitizeCell(row.codigo || "");
      if (!codigo || existingCodes.has(codigo.toLowerCase())) return null;

      return {
        codigo,
        nombre: sanitizeCell(row.nombre || ""),
        descripcion: row.descripcion ? sanitizeCell(row.descripcion) : null,
        categoria_id: row.categoria ? categoriaMap.get(normalize(row.categoria)) || null : null,
        proveedor_id: row.proveedor ? proveedorMap.get(normalize(row.proveedor)) || null : null,
        precio: parseDecimal(row.precio, 0),
        stock: parseInteger(row.stock, 0),
        stock_minimo: parseInteger(row.stock_minimo, 0),
        empresa_id: empresaId,
      };
    })
    .filter(p => p !== null);

  const updates = (jsonData as any[])
    .map((row: any) => {
      const codigo = sanitizeCell(row.codigo || "");
      if (!codigo) return null;
      const codeLower = codigo.toLowerCase();
      const id = existingCodeToId.get(codeLower);
      if (!id) return null;
      return {
        id,
        payload: {
          nombre: sanitizeCell(row.nombre || ""),
          descripcion: row.descripcion ? sanitizeCell(row.descripcion) : null,
          categoria_id: row.categoria ? categoriaMap.get(normalize(row.categoria)) || null : null,
          proveedor_id: row.proveedor ? proveedorMap.get(normalize(row.proveedor)) || null : null,
          precio: parseDecimal(row.precio, 0),
          stock: parseInteger(row.stock, 0),
          stock_minimo: parseInteger(row.stock_minimo, 0),
        },
      };
    })
    .filter(Boolean) as { id: string; payload: any }[];

  if (newProductos.length > 0) {
    const { error } = await supabase.from("productos").insert(newProductos);
    if (error) throw error;
  }

  let updatedCount = 0;
  for (const u of updates) {
    const { error: updErr } = await supabase
      .from("productos")
      .update(u.payload)
      .eq("id", u.id)
      .eq("empresa_id", empresaId);
    if (!updErr) updatedCount += 1;
  }

  if (newProductos.length === 0 && updatedCount === 0) {
    throw new Error("Todos los productos tienen códigos inválidos o no se pudo actualizar");
  }

  return {
    inserted: newProductos.length,
    duplicates: updates.length,
  };
}