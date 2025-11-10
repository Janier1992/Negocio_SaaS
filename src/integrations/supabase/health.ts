const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_NEW_SUPABASE_URL) as string | undefined;
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_NEW_SUPABASE_PUBLISHABLE_KEY) as string | undefined;

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
    const res = await fetch(`${SUPABASE_URL}/auth/v1/info`, { signal: controller.signal });
    clearTimeout(id);
    return { ok: res.ok, url: SUPABASE_URL, anonKeyPresent: !!SUPABASE_ANON_KEY, reachable: true, status: res.status, error: null };
  } catch (e) {
    clearTimeout(id);
    return { ok: false, url: SUPABASE_URL, anonKeyPresent: !!SUPABASE_ANON_KEY, reachable: false, status: null, error: toError(e) };
  }
}

export async function checkAuthConnectivity(): Promise<AuthHealth> {
  // Primero validar env y reachability del endpoint público de Auth
  const info = await pingAuthInfo();
  // Algunos proyectos pueden responder 401/403 en `/auth/v1/info`,
  // pero el servicio está alcanzable. Para la UX, tratamos esto como OK.
  if (info.reachable && (info.status === 401 || info.status === 403)) {
    return { ...info, ok: true };
  }
  return info;
}