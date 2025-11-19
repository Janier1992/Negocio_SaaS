# Auditoría de errores persistentes en consola: CSP y RPC 404

## 1) Advertencia CSP: `frame-ancestors` ignorado en `<meta>`

- Tipo: Advertencia de configuración de seguridad (no de sintaxis JS).
- Origen/Línea: `vite.config.ts` (plugin `inject-csp-meta`).
- Contexto: Se inyectaba `Content-Security-Policy` vía meta con la directiva `frame-ancestors 'none'`. Los navegadores ignoran `frame-ancestors` cuando se envía por `<meta>`; debe ir en cabecera HTTP.

### Corrección aplicada

- Se removió `frame-ancestors` de las cadenas CSP inyectadas por meta en `vite.config.ts`.
- Se dejó comentario indicando configurar `frame-ancestors` a nivel de servidor (cabeceras) en producción.

### Impacto y verificación

- La advertencia desaparece en consola.
- El resto de la CSP permanece activa via meta; para máxima seguridad, configurar cabecera HTTP en despliegue.

## 2) Error RPC 404: `seed_acl_permissions_for_empresa`

- Tipo: Error de red/API (endpoint no encontrado o sin permisos).
- Origen/Línea: `src/services/users.ts` (`ensureAdminAccessForEmail` llamaba `supabase.rpc("seed_acl_permissions_for_empresa")`).
- Contexto: La función existe en migraciones (`supabase/migrations/20251109_130_acl_roles_permissions_expansion.sql`), pero puede no estar disponible/ejecutable en todos los entornos, produciendo `404` (PostgREST oculta funciones sin permiso).

### Corrección aplicada

- Se condicionó la llamada RPC a la variable de entorno `VITE_ENABLE_ACL_SEED_RPC`. Por defecto no se invoca, evitando el `404` en consola.
- Se añadió logging controlado si se habilita y falla.

### Impacto y verificación

- El error 404 desaparece en consola en entornos donde la función no está disponible.
- El seeding de permisos permanece garantizado por migraciones; si se requiere seeding ad-hoc, habilitar `VITE_ENABLE_ACL_SEED_RPC=true` y asegurar `GRANT EXECUTE` a `authenticated`.

## Recomendaciones

- Configurar CSP completa (incluyendo `frame-ancestors`) via cabeceras HTTP del servidor.
- Añadir migración que otorgue `GRANT EXECUTE ON FUNCTION public.seed_acl_permissions_for_empresa(uuid) TO authenticated;` si se necesitará la RPC en producción.
- Evitar invocaciones RPC automáticas en arranque; preferir migraciones para operaciones de seeding.
