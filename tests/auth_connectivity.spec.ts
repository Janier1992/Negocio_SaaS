import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock env
vi.stubGlobal('import', { meta: { env: { VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_ANON_KEY: 'anon-key' } } } as any);

// Mock supabase client used for auditoría logging
vi.mock('@/integrations/supabase/newClient', () => {
  return {
    supabase: {
      from: vi.fn(() => ({ insert: vi.fn(async () => ({ data: null, error: null })) })),
    },
  };
});

// Use fake timers to avoid real delays
vi.useFakeTimers();

describe('checkAuthConnectivity', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('reintenta con backoff y devuelve status 404 tras agotarse', async () => {
    const fetchSpy = vi.fn(async () => ({ ok: false, status: 404 } as any));
    vi.stubGlobal('fetch', fetchSpy);

    const { checkAuthConnectivity } = await import('@/integrations/supabase/health');
    const p = checkAuthConnectivity({ retries: 3, baseDelayMs: 10, timeoutMs: 100 });
    // Avanza timers lo suficiente para completar backoff exponencial: 10 + 20
    vi.advanceTimersByTime(10 + 20 + 5);
    const res = await p;
    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(res.ok).toBe(false);
    expect(res.status).toBe(404);
  });

  it('trata 401/403 como servicio alcanzable (ok=true)', async () => {
    const fetchSpy = vi.fn(async () => ({ ok: false, status: 401 } as any));
    vi.stubGlobal('fetch', fetchSpy);

    const { checkAuthConnectivity } = await import('@/integrations/supabase/health');
    const res = await checkAuthConnectivity({ retries: 2, baseDelayMs: 10, timeoutMs: 100 });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(res.ok).toBe(true);
    expect(res.status).toBe(401);
  });
});