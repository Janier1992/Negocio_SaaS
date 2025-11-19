import { supabase } from "@/integrations/supabase/newClient";

export type LogoutResult = { ok: boolean; message: string };

// Centraliza el cierre de sesión para evitar duplicidad de toasts y asegurar mensajes consistentes.
export async function performLogout(): Promise<LogoutResult> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    // Si no hay sesión, consideramos logout exitoso para evitar 401 innecesarios
    if (!session) {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {}
      return { ok: true, message: "Sesión cerrada exitosamente" };
    }

    const res = await supabase.auth.signOut({ scope: "global" });
    const error: any = (res as any)?.error;
    if (error) {
      const msg = String(error?.message || "").toLowerCase();
      const status = (error?.status as number) || null;
      const isAbort = msg.includes("abort") || /err_aborted/i.test(msg);
      const isUnauthorized = status === 401 || /401|unauthorized|invalid/i.test(msg);
      // Tratar abortos de red y 401 como logout exitoso
      if (isAbort || isUnauthorized) {
        return { ok: true, message: "Sesión cerrada exitosamente" };
      }
      return { ok: false, message: "Error al cerrar sesión" };
    }

    return { ok: true, message: "Sesión cerrada exitosamente" };
  } catch (err: any) {
    const msg = String(err?.message || "").toLowerCase();
    const isAbort = msg.includes("abort") || /err_aborted/i.test(msg);
    const isUnauthorized = /401|unauthorized|invalid/i.test(msg);
    if (isAbort || isUnauthorized) {
      return { ok: true, message: "Sesión cerrada exitosamente" };
    }
    return { ok: false, message: "Error al cerrar sesión" };
  }
}
