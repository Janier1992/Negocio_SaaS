# Auditoría y corrección de precios en Inventario

## Causa raíz

- La carga masiva original solo insertaba productos nuevos y no actualizaba los existentes, dejando `precio = 0` para registros que ya estaban en la base de datos.
- En la visualización, algunos listados no especificaban explícitamente el campo `precio` en la selección de columnas, y el render no manejaba valores nulos o no numéricos de forma consistente.

## Correcciones aplicadas

- `src/hooks/useExcelUpload.ts`: ahora actualiza productos existentes por `codigo`, aplicando parseo robusto para `precio`, `stock` y `stock_minimo` (acepta formatos con `$`, puntos de miles y comas decimales).
- `src/pages/Inventario.tsx`: la consulta a Supabase especifica explícitamente `precio` y se agregó logging de integridad de datos (conteo de precios nulos/invalidos y en cero). El render de la columna usa `formatCurrencyCOP` para formateo consistente y manejo de nulos.
- `src/lib/format.ts`: util centralizado `formatCurrencyCOP(value)` con `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' })` y fallback.
- `src/lib/logger.ts`: util de logging simple para registrar eventos, advertencias y errores del módulo Inventario.

## Validaciones y pruebas

- Pruebas unitarias:
  - `tests/inventario_upload.spec.ts`: mock de Supabase/XLSX. Verifica parseo y actualización de precios.
  - `tests/format_price.spec.ts`: valida visualización/format de precios (números, cadenas, nulos y extremos).
  - Mockea Supabase y XLSX.
  - Verifica que `uploadProductos` parsea `"$ 1.200"`, `"$ 2.500"`, `"$ 8.500"` y actualiza los precios como números `1200`, `2500`, `8500`.
  - Confirma inserción de productos nuevos y actualización de existentes.

## Pasos de verificación manual

1. Subir el Excel con los precios reales.
2. Abrir Inventario y comprobar que la columna Precio muestra valores correctos (COP) y no `0,00`.
3. Si algún precio permanece en `0`, revisar que el Excel tenga valores válidos y que el `codigo` del producto coincida exactamente con el existente en BD.
4. Revisar la consola del navegador: se registran totales de productos cargados y conteos de precios nulos/invalidos y en cero para diagnóstico rápido.

## Siguientes mejoras sugeridas

- Ajustar mensajes del diálogo de carga para indicar "actualizados" en lugar de "duplicados".
- Reutilizar `formatCurrencyCOP` en Ventas y Finanzas para consistencia.
