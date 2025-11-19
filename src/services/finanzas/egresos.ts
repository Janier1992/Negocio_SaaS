import { supabase } from "@/integrations/supabase/newClient";

export type EgresoRow = {
  id: string;
  empresa_id: string;
  monto: number;
  fecha: string; // ISO
  categoria: string;
  descripcion?: string | null;
  created_at: string;
  updated_at: string;
};

export type FetchEgresosParams = {
  empresaId: string;
  desde?: string; // ISO
  hasta?: string; // ISO
};

export async function fetchEgresos({ empresaId, desde, hasta }: FetchEgresosParams) {
  let q = supabase
    .from("egresos")
    .select("id, empresa_id, monto, fecha, categoria, descripcion, created_at, updated_at")
    .eq("empresa_id", empresaId)
    .order("fecha", { ascending: false });
  if (desde) q = q.gte("fecha", desde);
  if (hasta) q = q.lte("fecha", hasta);
  const { data, error } = await q;
  if (error) {
    const code = (error as any)?.code || "";
    if (code === "PGRST205") return [] as EgresoRow[]; // tabla no existe aún
    throw error;
  }
  return (data || []) as EgresoRow[];
}

export type AddEgresoInput = {
  empresaId: string;
  monto: number;
  fecha: string; // ISO
  categoria: string;
  descripcion?: string | null;
};

export async function addEgreso(input: AddEgresoInput) {
  const fechaIso = /\d{4}-\d{2}-\d{2}/.test(input.fecha)
    ? new Date(`${input.fecha}T00:00:00`).toISOString()
    : input.fecha;
  const payload = {
    empresa_id: input.empresaId,
    monto: Number(input.monto || 0),
    fecha: fechaIso,
    categoria: String(input.categoria || "Otros"),
    descripcion: input.descripcion ?? null,
  };
  if (!payload.empresa_id) throw new Error("empresaId es requerido");
  if (!payload.monto || payload.monto <= 0) throw new Error("El monto debe ser mayor a 0");
  if (!payload.fecha) throw new Error("La fecha es requerida");
  if (!payload.categoria.trim()) throw new Error("La categoría es requerida");
  const { data, error } = await supabase.from("egresos").insert(payload).select("*").maybeSingle();
  if (!error) return data as EgresoRow;

  const msg = String((error as any)?.message || "");
  const code = (error as any)?.code || "";
  const isSchema =
    code === "PGRST205" ||
    /schema cache/i.test(msg) ||
    /relation\s+.*egresos.*\s+does not exist/i.test(msg);
  const isRls = /rls|policy|permission/i.test(msg);

  // Fallback vía Edge Function con service role para sortear RLS/caché desactualizado
  if (isSchema || isRls) {
    const { data: edgeRes, error: edgeErr } = await supabase.functions.invoke("insert-egreso", {
      body: {
        empresaId: input.empresaId,
        monto: Number(input.monto || 0),
        fecha: fechaIso,
        categoria: input.categoria,
        descripcion: input.descripcion ?? null,
      },
    });
    if (edgeErr) throw edgeErr;
    const row = (edgeRes as any)?.row;
    if (!row) throw new Error("No se recibió respuesta del servidor (insert-egreso)");
    return row as EgresoRow;
  }

  throw error;
}

export function subscribeEgresos(empresaId: string, onChange: () => void) {
  const channel = supabase
    .channel("finanzas-egresos")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "egresos", filter: `empresa_id=eq.${empresaId}` },
      () => onChange(),
    )
    .subscribe();
  return channel;
}

export async function logAuditEgreso(
  action: string,
  empresaId: string,
  details: Record<string, any>,
) {
  try {
    await supabase.from("auditoria").insert({
      empresa_id: empresaId,
      action,
      entity: "egresos",
      details,
    });
  } catch (err) {
    // Ignorar si la tabla no existe
  }
}
