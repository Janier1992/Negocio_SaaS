# Auditoría y corrección de precios en Inventario

## Causa raíz
- La carga masiva original solo insertaba productos nuevos y no actualizaba los existentes, dejando `precio = 0` para registros que ya estaban en la base de datos.
- En la visualización, algunos listados no especificaban explícitamente el campo `precio` en la selección de columnas, y el render no manejaba valores nulos o no numéricos de forma consistente.

## Correcciones aplicadas
- `src/hooks/useExcelUpload.ts`: ahora actualiza productos existentes por `codigo`, aplicando parseo robusto para `precio`, `stock` y `stock_minimo` (acepta formatos con `$`, puntos de miles y comas decimales).
- `src/pages/Inventario.tsx`: la consulta a Supabase especifica explícitamente `precio` y el render de la columna aplica `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' })` con manejo de nulos.

## Validaciones y pruebas
- Prueba unitaria `tests/inventario_upload.spec.ts`:
  - Mockea Supabase y XLSX.
  - Verifica que `uploadProductos` parsea `"$ 1.200"`, `"$ 2.500"`, `"$ 8.500"` y actualiza los precios como números `1200`, `2500`, `8500`.
  - Confirma inserción de productos nuevos y actualización de existentes.

## Pasos de verificación manual
1. Subir el Excel con los precios reales.
2. Abrir Inventario y comprobar que la columna Precio muestra valores correctos (COP) y no `0,00`.
3. Si algún precio permanece en `0`, revisar que el Excel tenga valores válidos y que el `codigo` del producto coincida exactamente con el existente en BD.

## Siguientes mejoras sugeridas
- Ajustar mensajes del diálogo de carga para indicar "actualizados" en lugar de "duplicados".
- Centralizar utilidades de formateo de moneda si se necesita reutilización en más pantallas.