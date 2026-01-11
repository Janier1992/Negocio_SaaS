import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_NEW_SUPABASE_URL) as string;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_NEW_SUPABASE_PUBLISHABLE_KEY) as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "[Supabase] Variables de entorno faltantes. Se requieren VITE_SUPABASE_URL (o VITE_NEW_SUPABASE_URL) y VITE_SUPABASE_ANON_KEY (o VITE_NEW_SUPABASE_PUBLISHABLE_KEY)",
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});