import { test, expect } from '@playwright/test';

test.describe('Módulo de Alertas', () => {
  test('Lista alertas con fallback desde productos y coincide con la campana', async ({ page }) => {
    // Forzar que la tabla alertas esté vacía
    await page.route('**/rest/v1/alertas**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    // Simular productos con bajo y crítico
    await page.route('**/rest/v1/productos**', async (route) => {
      const body = JSON.stringify([
        { id: 'p1', nombre: 'Producto Bajo', codigo: 'PB-1', stock: 5, stock_minimo: 10 },
        { id: 'p2', nombre: 'Producto Crítico', codigo: 'PC-2', stock: 4, stock_minimo: 10 },
        { id: 'p3', nombre: 'Producto Normal', codigo: 'PN-3', stock: 20, stock_minimo: 10 },
      ]);
      await route.fulfill({ status: 200, contentType: 'application/json', body });
    });

    // Abre la app y verifica la campana
    await page.goto('http://localhost:8094/');
    const bellButton = page.locator('button[aria-label="Notificaciones"], [data-testid="notification-bell"]').first();
    await expect(bellButton).toBeVisible();
    await bellButton.click();
    await expect(page.getByText('Crítico')).toBeVisible();
    await expect(page.getByText('Bajo')).toBeVisible();

    // Navega al módulo de Alertas
    await page.goto('http://localhost:8094/alertas');
    await expect(page.getByText('Listado de Alertas')).toBeVisible();

    // Debe listar dos alertas con detalles
    const rows = page.locator('div[role="article"], .space-y-3 > div');
    await expect(rows).toHaveCount(2);
    await expect(page.getByText('Stock bajo en')).toBeVisible();
    await expect(page.getByText('Stock crítico en')).toBeVisible();
    await expect(page.getByText('Código: PB-1')).toBeVisible();
    await expect(page.getByText('Código: PC-2')).toBeVisible();

    // “Marcar todas como leídas” siempre visible y habilitado
    const markAll = page.getByText('Marcar todas como leídas');
    await expect(markAll).toBeVisible();
    await expect(markAll).toBeEnabled();

    // Al hacer clic, todas deben quedar leídas (se oculta botón individual)
    await markAll.click();
    const perItemButtons = page.getByRole('button', { name: 'Marcar como leída' });
    await expect(perItemButtons).toHaveCount(0);

    // Cambia filtros y asegura que siguen listando
    await page.getByRole('button', { name: 'Stock Bajo' }).click();
    await expect(page.getByText('Stock bajo en')).toBeVisible();
    await page.getByRole('button', { name: 'Stock Crítico' }).click();
    await expect(page.getByText('Stock crítico en')).toBeVisible();
  });

  test('Combina alertas reales de DB con sintéticas de productos', async ({ page }) => {
    // Simular una alerta real desde DB y productos con stock bajo
    await page.route('**/rest/v1/alertas**', async (route) => {
      const body = JSON.stringify([
        {
          id: '11111111-1111-1111-1111-111111111111',
          tipo: 'stock_bajo',
          titulo: 'Alerta real manual',
          mensaje: 'Generada desde DB',
          created_at: new Date().toISOString(),
          leida: false,
          producto_id: 'p10',
        },
      ]);
      await route.fulfill({ status: 200, contentType: 'application/json', body });
    });
    await page.route('**/rest/v1/productos**', async (route) => {
      const body = JSON.stringify([
        { id: 'p10', nombre: 'Producto Manual', codigo: 'PM-10', stock: 20, stock_minimo: 30 }, // podría generar bajo
        { id: 'p2', nombre: 'Producto Bajo', codigo: 'PB-2', stock: 5, stock_minimo: 10 }, // sintética
      ]);
      await route.fulfill({ status: 200, contentType: 'application/json', body });
    });

    // Abre Alertas y verifica combinación
    await page.goto('http://localhost:8094/alertas');
    await expect(page.getByText('Listado de Alertas')).toBeVisible();
    // Debe mostrar al menos dos alertas (una real y una sintética)
    const rows = page.locator('div[role="article"], .space-y-3 > div');
    await expect(rows).toHaveCount(2);
    await expect(page.getByText('Alerta real manual')).toBeVisible();
    await expect(page.getByText('Stock bajo en')).toBeVisible();
    // La acción "Marcar todas" está habilitada siempre
    const markAll = page.getByText('Marcar todas como leídas');
    await expect(markAll).toBeVisible();
    await expect(markAll).toBeEnabled();
    await markAll.click();
    const perItemButtons = page.getByRole('button', { name: 'Marcar como leída' });
    await expect(perItemButtons).toHaveCount(0);
  });
});