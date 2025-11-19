// Nuevo cliente de Supabase para conectar a una base distinta
import { createClient } from "@supabase/supabase-js";

// Usa variables estándar VITE_SUPABASE_*, con fallback a VITE_NEW_* si existen
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_NEW_SUPABASE_URL) as string;
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_NEW_SUPABASE_PUBLISHABLE_KEY) as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("[Supabase] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
