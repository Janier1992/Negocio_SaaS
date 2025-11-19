# Auditoría de errores 400 en módulo de Alertas

Este documento resume la causa raíz y las correcciones aplicadas para los errores `400 Bad Request` observados en la consola del navegador al cargar el Dashboard y el módulo de Alertas.

## Síntomas

- Múltiples solicitudes a `/rest/v1/alertas` devolvían `400 Bad Request`.
- Los errores se repetían en pantallas que cargan alertas: `Dashboard`, `Alertas` y `NotificationsProvider`.

## Causa raíz

- Las consultas a Supabase incluían la columna opcional `leida` tanto en `select(...)` como en filtros `.eq("leida", ...)`.
- En algunas instancias/entornos la columna `leida` no existe en la tabla `alertas`, lo que provoca que PostgREST (capa REST de Supabase) responda con `400` ante selecciones o filtros de columnas inexistentes.

## Solución aplicada

- Se actualizaron los servicios `src/services/alerts.ts` para:
  - Usar `.select("*")` en lugar de listar columnas explícitas, evitando fallos si faltan columnas.
  - Eliminar el filtro server-side por `leida` y aplicar el filtrado en cliente cuando se solicite (`Boolean(r.leida) === leida`).
  - Ajustar el conteo en `fetchAlertsPaged` tras el filtrado local para mantener consistencia visual.

## Impacto y verificación

- Se ejecutó la suite de tests (`npm run test`) con resultado exitoso.
- Se inició el servidor de desarrollo y se verificó en el navegador (`http://localhost:8081/`) sin errores visibles en consola.

## Recomendaciones

- Evitar filtros por columnas que puedan ser opcionales o ausentes en algunos despliegues; en su lugar, filtrar en cliente cuando el volumen lo permita.
- Documentar la definición esperada de la tabla `alertas` en migraciones y aplicar validaciones de esquema al provisionar nuevas instancias.
