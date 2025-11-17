// Parseo tolerante para números monetarios con comas/puntos y símbolos
export function parseMoney(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  let s = String(value).trim();
  // Elimina símbolos y cualquier carácter no numérico, coma o punto
  s = s.replace(/[^0-9,\.\-]/g, "");
  if (!s) return fallback;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma !== -1 && lastDot !== -1) {
    const lastSep = Math.max(lastComma, lastDot);
    const decimalIsComma = lastSep === lastComma;
    s = s.replace(decimalIsComma ? /\./g : /,/g, "");
    s = s.replace(/,/g, ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : fallback;
  }
  if (lastComma !== -1 && lastDot === -1) {
    const digitsAfter = s.length - lastComma - 1;
    if (digitsAfter === 2 || digitsAfter === 1) s = s.replace(/,/g, ".");
    else s = s.replace(/,/g, "");
    const n = Number(s);
    return Number.isFinite(n) ? n : fallback;
  }
  if (lastDot !== -1 && lastComma === -1) {
    const digitsAfter = s.length - lastDot - 1;
    if (digitsAfter > 2) s = s.replace(/\./g, "");
    const n = Number(s);
    return Number.isFinite(n) ? n : fallback;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
}

export function formatCurrencyCOP(value: unknown): string {
  const num = parseMoney(value, NaN);
  if (!Number.isFinite(num)) return '—';
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `$${num.toFixed(2)}`;
  }
}