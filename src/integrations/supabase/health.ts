import { createLogger } from "@/lib/logger";
import { supabase } from "@/integrations/supabase/newClient";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_NEW_SUPABASE_URL) as string | undefined;
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_NEW_SUPABASE_PUBLISHABLE_KEY) as string | undefined;
const TECH_ALERT_WEBHOOK = (import.meta.env as any)?.VITE_TECH_ALERT_WEBHOOK as string | undefined;

const log = createLogger('AuthHealth');

export type AuthHealth = {
  ok: boolean;
  url?: string;
  anonKeyPresent: boolean;
  reachable?: boolean;
  status?: number | null;
  error?: string | null;
};

function toError(e: unknown) {
  const msg = String((e as any)?.message || e || "");
  return msg || null;
}

export function getSupabaseEnv() {
  return {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    isConfigured: !!(SUPABASE_URL && SUPABASE_ANON_KEY),
  };
}

export async function pingAuthInfo(timeoutMs = 6000): Promise<AuthHealth> {
  if (!SUPABASE_URL) {
    return { ok: false, url: undefined, anonKeyPresent: !!SUPABASE_ANON_KEY, reachable: false, status: null, error: "VITE_SUPABASE_URL no está definido" };
  }
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers: Record<string, string> = {};
    // Algunos proyectos requieren el header apikey para endpoints públicos
    if (SUPABASE_ANON_KEY) headers["apikey"] = SUPABASE_ANON_KEY;
    // Usa endpoint correcto de GoTrue para configuración pública
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, { signal: controller.signal, headers });
    clearTimeout(id);
    return { ok: res.ok, url: SUPABASE_URL, anonKeyPresent: !!SUPABASE_ANON_KEY, reachable: true, status: res.status, error: null };
  } catch (e) {
    clearTimeout(id);
    return { ok: false, url: SUPABASE_URL, anonKeyPresent: !!SUPABASE_ANON_KEY, reachable: false, status: null, error: toError(e) };
  }
}

async function notifyTechnicalTeam(status: number | null, error: string | null, attempts: number) {
  const payload = {
    type: 'auth_connectivity_error',
    status,
    error,
    attempts,
    url: SUPABASE_URL || null,
    ts: new Date().toISOString(),
  };
  // Best-effort: registrar en auditoría
  try {
    await supabase.from('auditoria').insert({
      empresa_id: null,
      action: 'auth_service_unavailable',
      entity: 'auth',
      details: payload,
    });
  } catch {}
  // Si existe webhook, enviar POST con detalles
  if (TECH_ALERT_WEBHOOK) {
    try { await fetch(TECH_ALERT_WEBHOOK, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }); } catch {}
  }
}

export async function checkAuthConnectivity(opts?: { retries?: number; baseDelayMs?: number; timeoutMs?: number }): Promise<AuthHealth> {
  const retries = Math.max(1, Math.min(5, opts?.retries ?? 3));
  const baseDelayMs = Math.max(100, Math.min(2000, opts?.baseDelayMs ?? 400));
  const timeoutMs = Math.max(500, Math.min(8000, opts?.timeoutMs ?? 3000));

  // Validación de entorno
  const envOk = getSupabaseEnv();
  if (!envOk.isConfigured) {
    log.error('Variables de entorno incompletas para Supabase Auth');
    return { ok: false, url: envOk.url, anonKeyPresent: !!envOk.anonKey, reachable: false, status: null, error: 'Entorno incompleto' };
  }

  let last: AuthHealth = { ok: false, url: SUPABASE_URL, anonKeyPresent: !!SUPABASE_ANON_KEY, reachable: false, status: null, error: null };
  for (let i = 0; i < retries; i++) {
    const attempt = i + 1;
    const res = await pingAuthInfo(timeoutMs);
    last = res;
    // 401/403 indican que el servicio está alcanzable, aunque protegido
    if (res.reachable && (res.status === 200 || res.status === 401 || res.status === 403)) {
      if (!res.ok) log.warn(`Auth reachable con status ${res.status} (protegido)`, { attempt });
      return { ...res, ok: true };
    }
    // Si 404, reintentar con backoff; si abort/network, también
    const isTemp = res.status === 404 || res.status === 503 || res.status === 0 || !res.reachable;
    log.warn(`Fallo de conectividad a Auth (status=${res.status ?? 'n/a'})`, { attempt, error: res.error });
    if (attempt < retries && isTemp) {
      const delay = baseDelayMs * Math.pow(2, i);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }
    break;
  }

  // Notificación y log detallado en caso de 404 persistente o inalcanzable
  if (last.status === 404 || !last.reachable) {
    log.error('Auth no disponible tras reintentos', { status: last.status, error: last.error });
    await notifyTechnicalTeam(last.status ?? null, last.error ?? null, retries);
  }
  return last;
}

export function formatAuthErrorMessage(health: AuthHealth): string {
  if (health.status === 404) {
    return "Error 404: No se pudo conectar al servicio de autenticación (status=404)";
  }
  const reason = health.error || `status=${health.status ?? 'n/a'}`;
  return `No se pudo conectar al servicio de autenticación (${reason})`;
}