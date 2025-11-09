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
  const { empresaId, desde, hasta, tipo, leida, search, orderBy = "created_at", orderAsc = false, limit, page, pageSize } = params;
  let q = supabase
    .from("alertas")
    .select("id, tipo, titulo, mensaje, created_at, leida, producto_id")
    .eq("empresa_id", empresaId);
  if (desde) q = q.gte("created_at", desde);
  if (hasta) q = q.lte("created_at", hasta);
  if (tipo) q = q.eq("tipo", tipo);
  if (typeof leida === "boolean") q = q.eq("leida", leida);
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
  return res.data || [];
}

export async function fetchAlertsPaged(params: Omit<FetchAlertsParams, 'limit'> & { page: number; pageSize: number }) {
  const { empresaId, desde, hasta, tipo, leida, search, orderBy = "created_at", orderAsc = false, page, pageSize } = params;
  let q = supabase
    .from("alertas")
    .select("id, tipo, titulo, mensaje, created_at, leida, producto_id", { count: 'exact' })
    .eq("empresa_id", empresaId);
  if (desde) q = q.gte("created_at", desde);
  if (hasta) q = q.lte("created_at", hasta);
  if (tipo) q = q.eq("tipo", tipo);
  if (typeof leida === "boolean") q = q.eq("leida", leida);
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
  return { rows: res.data || [], count: res.count || 0 };
}

export function subscribeAlerts(empresaId: string, onChange: () => void) {
  const channel = supabase
    .channel("alertas-sync")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "alertas", filter: `empresa_id=eq.${empresaId}` },
      () => onChange()
    )
    .subscribe();
  return channel;
}

export async function markAlertRead(id: string, leida: boolean) {
  const res = await supabase
    .from("alertas")
    .update({ leida })
    .eq("id", id);
  if (res.error) throw res.error;
}