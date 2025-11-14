import { describe, it, expect, vi, beforeEach } from 'vitest';

// Estado hoisted para que esté disponible dentro del factory de vi.mock
const hoisted = vi.hoisted(() => ({
  recordedUpdates: [] as Array<{ payload: any; where: Record<string, any> }>,
  recordedInserts: [] as any[],
  sheetRows: [] as any[],
}));

vi.mock('@/integrations/supabase/newClient', () => {
  // Query builder mínimo para productos
  const builder: any = {
    select: vi.fn(() => builder),
    eq: vi.fn((_col: string, _val: any) => Promise.resolve({ data: existingProductos, error: null })),
    insert: vi.fn((rows: any[]) => {
      hoisted.recordedInserts.push(...(rows || []));
      return Promise.resolve({ data: null, error: null });
    }),
    update: vi.fn((payload: any) => ({
      eq: vi.fn((col: string, val: any) => {
        const where: Record<string, any> = { [col]: val };
        return {
          eq: vi.fn((col2: string, val2: any) => {
            where[col2] = val2;
            hoisted.recordedUpdates.push({ payload, where });
            return Promise.resolve({ data: null, error: null });
          })
        };
      })
    })),
  };
  const mockFrom = vi.fn((_table: string) => builder);

  return {
    supabase: {
      from: mockFrom,
      auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } } })) },
    },
  };
});

vi.mock('@/hooks/useUserProfile', () => {
  return {
    useUserProfile: () => ({ empresaId: 'empresa-1' }),
  };
});

// Mock XLSX para devolver json del Excel
vi.mock('xlsx', () => {
  return {
    read: vi.fn(() => ({ Sheets: { Hoja1: {} }, SheetNames: ['Hoja1'] })),
    utils: { sheet_to_json: vi.fn(() => hoisted.sheetRows), json_to_sheet: vi.fn(), book_new: vi.fn(), book_append_sheet: vi.fn(), writeFile: vi.fn() },
  };
});

// Import después de los mocks
import { uploadProductosCore } from '@/hooks/excelUploadCore';

// Productos existentes en BD por código
const existingProductos = [
  { id: 'p1', codigo: 'PROD001' },
  { id: 'p2', codigo: 'PROD002' },
  { id: 'p3', codigo: 'PROD003' },
];

beforeEach(() => {
  hoisted.recordedUpdates.length = 0;
  hoisted.recordedInserts.length = 0;
  hoisted.sheetRows = [];
});

describe('Carga masiva de productos: parseo y actualización de precio', () => {
  it('actualiza precios existentes con formatos de moneda locales', async () => {
    // Datos del Excel similares a las capturas
    hoisted.sheetRows = [
      { codigo: 'PROD001', nombre: 'Arepa', precio: '$ 1.200', stock: '150', stock_minimo: '30' },
      { codigo: 'PROD002', nombre: 'Panela', precio: '$ 2.500', stock: '200', stock_minimo: '25' },
      { codigo: 'PROD003', nombre: 'Café', precio: '$ 8.500', stock: '120', stock_minimo: '20' },
      { codigo: 'PROD999', nombre: 'Nuevo', precio: '$ 3.000', stock: '10', stock_minimo: '2' },
    ];

    const categorias: any[] = [];
    const proveedores: any[] = [];

    const res = await uploadProductosCore(hoisted.sheetRows, 'empresa-1' as any, (await import('@/integrations/supabase/newClient')).supabase as any, categorias, proveedores);

    // Debe intentar actualizar 3 existentes y 1 insert nuevo
    expect(hoisted.recordedUpdates.length).toBe(3);
    expect(hoisted.recordedInserts.length).toBe(1);

    const preciosActualizados = hoisted.recordedUpdates.map(u => u.payload.precio);
    expect(preciosActualizados).toEqual([1200, 2500, 8500]);

    expect(res.inserted).toBe(1);
    // El campo duplicates del hook se reutiliza para reportar actualizados
    expect(res.duplicates).toBe(3);
  });
});