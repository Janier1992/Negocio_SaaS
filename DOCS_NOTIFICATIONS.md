# Sistema de Notificaciones (Campana)

Este documento resume el comportamiento actual del sistema de notificaciones y los cambios recientes para garantizar su operatividad.

## Comportamiento y flujo
- Fuente primaria: tabla `alertas` en Supabase (filtrada por `empresa_id`).
- Actualización en tiempo real: suscripción a cambios en `alertas`.
- Fallback resiliente: si `alertas` retorna vacío o la consulta falla, se calculan alertas sintéticas desde `productos` usando `stock` y `stock_minimo`.

## Cálculo de stock bajo/crítico
- Crítico: `stock` <= `floor(stock_minimo / 2)`.
- Bajo: `stock` <= `stock_minimo`.

## Archivos clave
- `src/components/notifications/NotificationsProvider.tsx`: carga inicial, sincronización en tiempo real y fallback desde `productos`.
- `src/components/notifications/NotificationBell.tsx`: UI de la campana, acciones de marcar como leída, eliminar y limpiar.
- `src/services/alerts.ts`: obtención paginada y búsqueda de alertas.

## Pruebas
- `tests/notifications.spec.ts`: prueba E2E con Playwright que intercepta llamadas a Supabase para validar el fallback desde `productos` y la visualización en la campana.
- Ejecutar: `npx playwright test tests/notifications.spec.ts` (requiere Playwright instalado).

## Notas de implementación
- El fallback se aplica en la carga inicial y cuando la sincronización en tiempo real falla.
- Las notificaciones sintéticas usan IDs derivados del producto (`<productoId>-low` y `<productoId>-crit`).
- La UI marca como leída una notificación al navegar a la página de Alertas.