import { test, expect } from "@playwright/test";

// Prueba de campana de notificaciones con fallback desde productos.
// Ejecutar con: npx playwright test (requiere instalar playwright)

test.describe("Campana de notificaciones", () => {
  test("Muestra alertas de stock bajo/crítico (fallback productos) y acciones", async ({
    page,
  }) => {
    // Intercepta llamadas a Supabase REST para simular datos
    await page.route("**/rest/v1/alertas**", async (route) => {
      // Responder vacío para forzar fallback
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });
    await page.route("**/rest/v1/productos**", async (route) => {
      const body = JSON.stringify([
        { id: "p1", nombre: "Producto Bajo", stock: 5, stock_minimo: 10 },
        { id: "p2", nombre: "Producto Crítico", stock: 4, stock_minimo: 10 },
        { id: "p3", nombre: "Producto Normal", stock: 20, stock_minimo: 10 },
      ]);
      await route.fulfill({ status: 200, contentType: "application/json", body });
    });

    await page.goto("http://localhost:8094/");

    // Selecciona el botón de la campana (aria-label o data-testid)
    const bellButton = page
      .locator('button[aria-label="Notificaciones"], [data-testid="notification-bell"]')
      .first();
    await expect(bellButton).toBeVisible();

    // Abre el menú de la campana
    await bellButton.click();
    const menu = page.locator('[role="menu"]');
    await expect(menu).toBeVisible();

    // Verifica que existan entradas correspondientes a bajo/crítico
    const criticalBadge = page.getByText("Crítico");
    const lowBadge = page.getByText("Bajo");
    await expect(criticalBadge).toBeVisible();
    await expect(lowBadge).toBeVisible();

    // Verifica presencia de items y realiza acciones
    const items = page.locator('[data-testid="notification-item"]');
    await expect(items).toHaveCount(2);

    // Marca como leída el primer ítem
    const firstMarkRead = items.first().locator('[data-testid="notification-mark-read"]');
    await firstMarkRead.click();
    // El primer item debería reflejar estado leído
    await expect(items.first()).toHaveAttribute("data-read", "true");

    // Elimina el segundo ítem
    const secondDelete = items.nth(1).locator('[data-testid="notification-delete"]');
    await secondDelete.click();
    await expect(items).toHaveCount(1);

    // Limpia todas las notificaciones
    const clearAll = page.locator('[data-testid="notifications-clear-all"]');
    await clearAll.click();
    await expect(page.getByText("No hay notificaciones")).toBeVisible();
  });
});
