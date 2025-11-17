import { describe, it, expect } from 'vitest';
import { formatCurrencyCOP } from '@/lib/format';

describe('formatCurrencyCOP', () => {
  it('formatea números positivos en COP', () => {
    const res = formatCurrencyCOP(12345.67);
    // Debe contener el símbolo de COP y separadores locales
    expect(res).toMatch(/\$\s?12\.?345,67|\$12,345\.67/);
  });

  it('acepta cadenas numéricas', () => {
    const res = formatCurrencyCOP('2500');
    expect(res).toMatch(/\$\s?2\.?500,00|\$2,500\.00/);
  });

  it('devuelve guion para nulos, indefinidos y NaN', () => {
    expect(formatCurrencyCOP(null as any)).toBe('—');
    expect(formatCurrencyCOP(undefined as any)).toBe('—');
    expect(formatCurrencyCOP('not-a-number')).toBe('—');
  });

  it('tolera valores extremos', () => {
    const res = formatCurrencyCOP(0);
    expect(res).toMatch(/\$\s?0[,\.]00/);
  });
});