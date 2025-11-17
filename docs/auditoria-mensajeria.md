# Auditoría y Corrección de Mensajería (Toasts y Advertencias)

Fecha: 2025-11-15

## Objetivo
Garantizar que los mensajes de usuario sean claros y precisos, que las advertencias reflejen situaciones reales, y eliminar inconsistencias o comportamientos inesperados en la mensajería del sistema.

## Hallazgos

- Duplicidad de toasts de cierre de sesión: AppLayout y AppSidebar implementaban lógica propia, generando mensajes repetidos y flujos no uniformes.
- Falsos positivos en Dashboard: en la primera carga se mostraban toasts de “Nuevas alertas” aunque eran conteos iniciales, no incrementos reales.
- Spam de toasts en notificaciones de stock: la suscripción de resiliencia a productos generaba un toast por producto, saturando al usuario cuando ocurrían varios cambios simultáneos.

## Correcciones Implementadas

1) Centralización de logout
- Nuevo servicio `src/services/auth.ts` con `performLogout()` que encapsula el cierre de sesión y devuelve `{ ok, message }`.
- Refactor en `AppLayout.tsx` y `AppSidebar.tsx` para usar el servicio y emitir un único toast consistente.

2) Dashboard: supresión de toasts en primera carga
- `src/pages/Dashboard.tsx`: se añadió `firstLoadRef` para evitar toasts de “Nuevas alertas” durante la carga inicial; solo se muestran ante incrementos posteriores.

3) NotificationsProvider: agrupación de toasts
- `src/components/notifications/NotificationsProvider.tsx`: se agregó un acumulador con debounce (400ms) para emitir toasts agregados por tipo (bajo/ crítico), evitando un toast por producto.

## Razonamiento de las correcciones
- Uniformidad de UX: un único punto de gestión de logout evita duplicidad y asegura mensajes coherentes.
- Veracidad de advertencias: suprimir la primera notificación de incrementos evita confundir el baseline con novedades reales.
- Reducción de ruido: agrupar toasts protege la atención del usuario y mejora la relevancia de los avisos.

## Impacto
- UX más limpia y coherente en cierre de sesión.
- Menos ruido en panel de control y notificaciones; los toasts reportan cambios significativos.
- Mantiene la visibilidad de alertas en el panel de notificaciones sin saturar la UI.

## Pruebas realizadas
- Logout desde AppLayout y AppSidebar: un único toast de éxito y redirección estable a `/auth`.
- Dashboard en primera carga: no aparecen toasts de “Nuevas alertas”; al cambiar el periodo o llegar nuevas alertas, se muestran incrementos.
- Cambios simultáneos en productos: toasts agregados por lote (bajo/ crítico) en lugar de uno por producto.

## Próximos pasos recomendados
- Estandarizar textos de toasts en un diccionario central si se amplía la mensajería.
- Considerar límites de frecuencia (rate limit) para eventos extremadamente ruidosos.
- Añadir tests de integración para validar la agregación y la supresión de toasts en primera carga.