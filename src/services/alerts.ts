import { supabase } from "@/integrations/supabase/newClient";

export type AlertRow = {
  id: string;
  tipo: string;
  titulo: string;
  mensaje?: string | null;
  created_at: string;
  leida?: boolean | null;
  producto_id?: string | null;
};

export type FetchAlertsParams = {
  empresaId: string;
  desde?: string; // ISO
  hasta?: string; // ISO
  tipo?: string | null;
  leida?: boolean | null;
  search?: string | null;
  orderBy?: "created_at" | "tipo";
  orderAsc?: boolean;
  limit?: number;
  page?: number;
  pageSize?: number;
};

export async function fetchAlerts(params: FetchAlertsParams) {
  const {
    empresaId,
    desde,
    hasta,
    tipo,
    leida,
    search,
    orderBy = "created_at",
    orderAsc = false,
    limit,
    page,
    pageSize,
  } = params;
  let q = supabase
    .from("alertas")
    // Usar '*' para evitar 400 cuando faltan columnas opcionales (p.ej. 'leida')
    .select("*")
    .eq("empresa_id", empresaId);
  if (desde) q = q.gte("created_at", desde);
  if (hasta) q = q.lte("created_at", hasta);
  if (tipo) q = q.eq("tipo", tipo);
  // No aplicar filtro server-side por 'leida' para evitar 400 si la columna no existe
  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`;
    q = q.or(`titulo.ilike.${term},mensaje.ilike.${term}`);
  }
  q = q.order(orderBy, { ascending: orderAsc });
  if (limit) q = q.limit(limit);
  // Paginación opcional
  if (page && pageSize) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    q = q.range(from, to);
  }
  const res = await q;
  const code = (res.error as any)?.code || "";
  if (res.error && code !== "PGRST205") throw res.error;
  const rows = (res.data || []) as any[];
  // Filtro client-side de 'leida' si el consumidor lo pidió
  const filtered =
    typeof leida === "boolean" ? rows.filter((r) => Boolean(r.leida) === leida) : rows;
  return filtered;
}

export async function fetchAlertsPaged(
  params: Omit<FetchAlertsParams, "limit"> & { page: number; pageSize: number },
) {
  const {
    empresaId,
    desde,
    hasta,
    tipo,
    leida,
    search,
    orderBy = "created_at",
    orderAsc = false,
    page,
    pageSize,
  } = params;
  let q = supabase.from("alertas").select("*", { count: "exact" }).eq("empresa_id", empresaId);
  if (desde) q = q.gte("created_at", desde);
  if (hasta) q = q.lte("created_at", hasta);
  if (tipo) q = q.eq("tipo", tipo);
  // Evitar filtro por 'leida' en servidor para prevenir 400 si la columna no existe
  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`;
    q = q.or(`titulo.ilike.${term},mensaje.ilike.${term}`);
  }
  q = q.order(orderBy, { ascending: orderAsc });
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  q = q.range(from, to);
  const res = await q;
  if (res.error) throw res.error;
  const rows = (res.data || []) as any[];
  const filtered =
    typeof leida === "boolean" ? rows.filter((r) => Boolean(r.leida) === leida) : rows;
  // Ajustar conteo al filtrado local para consistencia visual
  const count = typeof leida === "boolean" ? filtered.length : res.count || filtered.length;
  return { rows: filtered, count };
}

export function subscribeAlerts(empresaId: string, onChange: () => void) {
  const channel = supabase
    .channel("alertas-sync")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "alertas", filter: `empresa_id=eq.${empresaId}` },
      () => onChange(),
    )
    .subscribe();
  return channel;
}

export async function markAlertRead(id: string, leida: boolean) {
  const res = await supabase.from("alertas").update({ leida }).eq("id", id);
  if (res.error) throw res.error;
}

// Marca como leídas múltiples alertas de forma tolerante:
// - Actualiza en DB sólo las que tienen id UUID
// - Devuelve resumen de actualización sin lanzar error si hay ids sintéticos
export async function markAlertsReadFlexible(ids: string[], leida: boolean) {
  const uuidRegex = /^[0-9a-fA-F-]{36}$/;
  const realIds = ids.filter((id) => uuidRegex.test(id));
  let updated = 0;
  let attempted = realIds.length;
  if (realIds.length > 0) {
    const res = await supabase.from("alertas").update({ leida }).in("id", realIds);
    if (res.error) throw res.error;
    // PostgREST no siempre retorna el conteo actualizado; calculamos por longitud
    updated = realIds.length;
  }
  return { updated, attempted, skippedSynthetic: ids.length - realIds.length };
}
