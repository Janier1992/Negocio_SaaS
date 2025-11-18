# Manual de PWA: Instalación, Verificación y Uso

Este manual describe cómo instalar la aplicación como PWA, verificar los criterios de instalación, probar en distintos navegadores y dispositivos, y entender su funcionamiento offline y actualizaciones.

## Requisitos de instalación

- Sitio servido por HTTPS (Producción: Vercel).
- `manifest.json` válido con íconos ≥ 192×192.
- Service Worker (`sw.js`) registrado.
- El navegador debe detectar "instalabilidad" (Chrome/Edge muestran `beforeinstallprompt`).

## Instalación y botón de instalación

- Banner automático (Chrome/Edge):
  - Abre `https://mi-negocioerp-87lo3c52o-janiers-projects-358a34e4.vercel.app/`.
  - Cuando el navegador dispare `beforeinstallprompt`, el banner aparece y también el botón interno de la app.
- Botón en la app (manual):
  - En la interfaz verás un botón "Instalar" (componente `InstallPrompt`).
  - Al hacer clic, se mostrará el diálogo de instalación.
- Android (Chrome):
  - Menú ⋮ → "Añadir a la pantalla principal" → Confirmar.
- iOS (Safari):
  - Safari no soporta `beforeinstallprompt`. Usa: Compartir → "Añadir a pantalla de inicio".
- Desktop (Chrome/Edge):
  - Barra de direcciones → icono de instalación → "Instalar".

## Verificación con DevTools y Lighthouse

- DevTools → Application → Manifest:
  - Verifica `name`, `short_name`, `start_url` (`/auth`), `display: standalone`, e íconos 192×192 y 512×512 con `data:image/png;base64,...`.
  - En Service Workers, revisa que `sw.js` esté "activated and is running".
- Lighthouse → PWA:
  - Ejecuta auditoría PWA y confirma puntuación ≥ 90.
  - Si baja la puntuación, revisa: íconos válidos, manifiesto accesible, SW activo y que `start_url` cargue offline.

## Uso Offline

- Navegación SPA: offline mediante fallback a `index.html` si la red falla.
- Recursos estáticos: cache-first con revalidación en segundo plano para `assets/` y `favicon.svg`.
- Datos en tiempo real (Supabase/API): requieren conexión; al reconectar se reanuda el funcionamiento.

## Actualizaciones y caché

- La app verifica actualizaciones periódicamente y al volver a la pestaña.
- Cuando hay nueva versión del Service Worker:
  - Se envía `SKIP_WAITING` al SW nuevo.
  - El navegador hace `controllerchange` y la pestaña se recarga.
- Limpieza de cachés:
  - En `activate`, se borran cachés antiguos si cambia `CACHE_NAME`.
  - Para forzar actualización, incrementa `CACHE_NAME` (p. ej., `mnp-cache-v5`).

## Pruebas en dispositivos

- Android (Chrome):
  - Instala desde banner o menú; abre sin barra del navegador; verifica offline.
- iOS (Safari):
  - Añade a pantalla de inicio; comprueba que abre full-screen y sin barra; limita test de offline según soporte del sistema.
- Desktop (Chrome/Edge):
  - Instala desde el icono; abre la ventana PWA; verifica que `Application → Manifest` y `Service Workers` están OK.

## Solución de problemas

- No aparece el banner de instalación:
  - Asegura conexión HTTPS en producción.
  - Verifica que `manifest.json` y `sw.js` se cargan sin 404.
  - Cierra y reabre la pestaña; borra datos de sitio si persiste.
- Pantalla en blanco tras actualización:
  - Forzar recarga (`Ctrl+F5`) o borrar datos de la app.
- Offline limitado:
  - La primera carga debe hacerse online para precachear el shell.

## Contacto

Si necesitas asistencia, reporta el problema con capturas, navegador y dispositivo.