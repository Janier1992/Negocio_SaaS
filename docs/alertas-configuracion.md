Objetivo

- Asegurar que los valores de alertas no permanezcan en 0 en la campana, el Dashboard y la página de Alertas.

Cambios realizados

- `src/components/notifications/NotificationsProvider.tsx`: carga inicial desde `alertas` y, si está vacío, fallback calculado desde `productos`. Suscripciones en tiempo real a `alertas` y `productos`. `markAllRead` persiste en DB cuando aplica.
- `src/pages/Dashboard.tsx`: si no hay filas en `alertas`, calcula `stock_bajo` y `stock_critico` desde `productos` (`stock <= min` y `stock <= floor(min/2)`), actualizando el KPI de “Alertas Activas”.
- `src/pages/Alertas.tsx`: al cargar, siempre se combinan las alertas reales de `alertas` con alertas sintéticas basadas en `productos` (`stock_bajo` y `stock_critico`). Las sintéticas respetan filtros activos (`tipo`, búsqueda y rango de fechas) y se identifican con `id` prefijado `synthetic:`. La marcación de lectura solo aplica a alertas reales (IDs UUID). Se mantiene suscripción a `productos` para refresco inmediato.

Requisitos de configuración

- Base de datos: tabla `public.alertas` con columnas `empresa_id`, `tipo`, `titulo`, `mensaje`, `leida`, `producto_id`, `created_at`. Ejecutar migraciones si faltan.
- Triggers: función y trigger de stock que insertan/actualizan alertas (`stock_bajo` y `stock_critico`) y marcan como leídas cuando el stock se normaliza.
- Realtime: habilitar `postgres_changes` para tablas `alertas` y `productos` en Supabase.

Lógica de sintéticas y combinación

- En cada carga, se computan alertas desde `productos` y se fusionan con las de `alertas`:
  - `stock_critico`: `stock <= floor(stock_minimo / 2)`
  - `stock_bajo`: `stock <= stock_minimo` y `stock > floor(stock_minimo / 2)`
  - Las sintéticas respetan filtros client-side (`tipo`, búsqueda, rango de fechas) y no permiten marcación de lectura.
  - El total mostrado se ajusta para reflejar la suma de reales + sintéticas.

Verificación

- Iniciar el servidor de desarrollo y verificar:
  - La campana muestra un contador > 0 si hay productos bajo mínimo.
  - El Dashboard refleja conteos de `stock_bajo`, `stock_critico` y total.
  - La página de Alertas lista alertas reales o sintéticas según disponibilidad o problemas de red.

Pruebas end-to-end

- `tests/notifications.spec.ts`: valida la campana, acciones de marcar leída, eliminar y limpiar todas, con fallback desde productos.
- `tests/alertas.spec.ts`: valida el listado y detalles del módulo de Alertas, tanto con fallback desde productos como combinando alertas reales de DB con sintéticas. Verifica consistencia con la campana.
- Ejecutar: `npx playwright test tests/notifications.spec.ts tests/alertas.spec.ts`

Notas

- La marcación de lectura solo aplica a alertas persistidas en la tabla `alertas`. Las alertas sintéticas sirven como visualización provisional mientras se activan las migraciones/triggers.