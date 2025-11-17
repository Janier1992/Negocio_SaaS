# Manual de Usuario PWA

Este manual explica cómo instalar y usar la versión PWA del sistema ERP en distintos dispositivos, sus características offline y cómo resolver problemas comunes.

## Instalación

- Android (Chrome):
  - Abrir `https://janier1992.github.io/MiNegocioPymes/`.
  - Menú ⋮ → "Añadir a la pantalla principal" → Confirmar.
- iOS (Safari):
  - Abrir la URL del sistema.
  - Compartir → "Añadir a pantalla de inicio" → Confirmar.
- Desktop (Chrome/Edge):
  - Barra de direcciones → Icono de instalación → "Instalar".

## Uso Offline

- Navegación básica: La aplicación funciona offline para navegación entre vistas gracias al Service Worker.
- Assets estáticos: CSS/JS/iconos se sirven desde caché.
- Datos en tiempo real: Las operaciones que requieran conexión (Supabase/API) no funcionan offline. Al reconectarse, la app se actualiza automáticamente.

## Actualizaciones

- El Service Worker verifica actualizaciones en segundo plano.
- Al detectarse una nueva versión, se activa y la pestaña se recarga automáticamente.

## Solución de Problemas

- Pantalla en blanco tras actualización:
  - Forzar recarga: `Ctrl + F5`.
  - Borrar caché de la app: Ajustes → Aplicaciones → Almacenamiento.
- No se instala el icono PWA:
  - Verificar conexión HTTPS.
  - Asegurarse de que `manifest.json` y `sw.js` se entregan correctamente.
- Offline limitado:
  - Confirmar que la primera carga se hizo online.
  - Reintentar cuando haya conexión; el SW aplica fallback y cache-first.

## Limitaciones

- Las transacciones y sincronización requieren conexión.
- En iOS, la caché PWA puede ser más restrictiva; se recomienda conexión periódica.

## Contacto

Si necesitas asistencia, reporta el problema con capturas y el navegador/dispositivo utilizado.