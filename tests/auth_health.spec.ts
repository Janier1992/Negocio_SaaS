import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock env by injecting values via import.meta.env
vi.stubGlobal('import', { meta: { env: { VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_ANON_KEY: 'anon-key' } } } as any);

// Mock global fetch
const fetchSpy = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
  return {
    ok: true,
    status: 200,
    json: async () => ({}),
  } as any;
});

vi.stubGlobal('fetch', fetchSpy);

import { pingAuthInfo } from '@/integrations/supabase/health';

beforeEach(() => {
  fetchSpy.mockClear();
});

describe('pingAuthInfo', () => {
  it('incluye header apikey al consultar /auth/v1/settings', async () => {
    const res = await pingAuthInfo(1000);
    expect(res.ok).toBe(true);
    const args = fetchSpy.mock.calls[0];
    expect(String(args[0])).toMatch('/auth/v1/settings');
    const init = (args[1] || {}) as RequestInit;
    expect((init.headers as any)?.apikey).toBe('anon-key');
  });
});