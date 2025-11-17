import { describe, it, expect } from 'vitest';

import { formatAuthErrorMessage, type AuthHealth } from '@/integrations/supabase/health';

describe('formatAuthErrorMessage', () => {
  it('devuelve el formato exacto para 404', () => {
    const health: AuthHealth = { ok: false, anonKeyPresent: true, reachable: true, status: 404, error: null };
    const msg = formatAuthErrorMessage(health);
    expect(msg).toBe('Error 404: No se pudo conectar al servicio de autenticación (status=404)');
  });

  it('devuelve mensaje genérico con status cuando no sea 404', () => {
    const health: AuthHealth = { ok: false, anonKeyPresent: true, reachable: true, status: 503, error: null };
    const msg = formatAuthErrorMessage(health);
    expect(msg).toBe('No se pudo conectar al servicio de autenticación (status=503)');
  });
});