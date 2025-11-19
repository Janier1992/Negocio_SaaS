// Edge Function: insert-egreso
// Inserta un egreso operativo usando service role, evitando bloqueos de RLS accidentales.
// Requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno de funciones.

import { createClient } from "@supabase/supabase-js";

const json = (body: any, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  try {
    const url = process.env.SUPABASE_URL as string;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!url || !key) {
      return json(
        {
          error: "missing_env",
          message: "SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configurados",
        },
        500,
      );
    }

    const supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt)
      return json({ error: "unauthenticated", message: "Falta token de autorización" }, 401);

    const userRes = await supabaseAdmin.auth.getUser(jwt);
    if (userRes.error || !userRes.data.user) {
      return json(
        { error: "unauthenticated", message: "Token inválido o usuario no encontrado" },
        401,
      );
    }
    const user = userRes.data.user;

    const body = await req.json().catch(() => ({}));
    const monto = Number(body?.monto || 0);
    const fechaInput: string = String(body?.fecha || "");
    const categoria: string = String(body?.categoria || "");
    const descripcion: string | null = body?.descripcion ?? null;

    if (!Number.isFinite(monto) || monto <= 0) {
      return json({ error: "validation", message: "El monto debe ser mayor a 0" }, 400);
    }
    if (!fechaInput) {
      return json({ error: "validation", message: "La fecha es requerida" }, 400);
    }
    if (!categoria.trim()) {
      return json({ error: "validation", message: "La categoría es requerida" }, 400);
    }

    // Normalizar fecha: si viene como YYYY-MM-DD, convertir a ISO a medianoche
    const fechaIso = /\d{4}-\d{2}-\d{2}/.test(fechaInput)
      ? new Date(`${fechaInput}T00:00:00`).toISOString()
      : new Date(fechaInput).toISOString();

    // Recuperar empresa_id desde el perfil del usuario
    const { data: profile, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("id, empresa_id")
      .eq("id", user.id)
      .maybeSingle();
    if (profErr) return json({ error: "profile_error", message: profErr.message }, 500);
    const empresaId = profile?.empresa_id as string | null;
    if (!empresaId)
      return json({ error: "no_empresa", message: "Tu perfil no tiene una empresa asociada" }, 400);

    const payload = {
      empresa_id: empresaId,
      monto,
      fecha: fechaIso,
      categoria: categoria.trim(),
      descripcion,
    };

    const { data, error } = await supabaseAdmin
      .from("egresos")
      .insert(payload)
      .select("*")
      .single();
    if (error) return json({ error: "db_error", message: error.message }, 500);

    try {
      await supabaseAdmin.from("auditoria").insert({
        empresa_id: empresaId,
        action: "insert_egreso_service",
        entity: "egresos",
        details: payload,
        actor_id: user.id,
      });
    } catch (_) {
      // Ignorar auditoría si no existe
    }

    return json({ ok: true, row: data }, 200);
  } catch (err: any) {
    return json({ error: "internal_error", message: String(err?.message || "") }, 500);
  }
}
