type Level = "info" | "warn" | "error";

const basePrefix = "[Inventario]";

function emit(level: Level, scope: string, msg: string, data?: unknown) {
  try {
    const line = `${basePrefix}${scope ? ":" + scope : ""} ${msg}`;
    if (level === "info") console.info(line, data ?? "");
    else if (level === "warn") console.warn(line, data ?? "");
    else console.error(line, data ?? "");
  } catch {
    // noop
  }
}

export const logger = {
  info: (msg: string, data?: unknown) => emit("info", "", msg, data),
  warn: (msg: string, data?: unknown) => emit("warn", "", msg, data),
  error: (msg: string, data?: unknown) => emit("error", "", msg, data),
};

// Crea un logger con prefijo de módulo y control de nivel y frecuencia
export function createLogger(
  scope: string,
  options?: { level?: Level | "silent"; rateMs?: number },
) {
  const level: Level | "silent" = options?.level ?? (import.meta.env?.DEV ? "info" : "warn");
  const rateMs = options?.rateMs ?? 400;
  const last: Record<Level, number> = { info: 0, warn: 0, error: 0 };

  const should = (lvl: Level) => {
    if (level === "silent") return false;
    if (level === "error") return lvl === "error";
    if (level === "warn") return lvl !== "info";
    return true; // 'info'
  };

  const emitScoped = (lvl: Level, msg: string, data?: unknown) => {
    if (!should(lvl)) return;
    const now = Date.now();
    if (rateMs > 0 && now - last[lvl] < rateMs) return;
    last[lvl] = now;
    emit(lvl, scope, msg, data);
  };

  return {
    info: (msg: string, data?: unknown) => emitScoped("info", msg, data),
    warn: (msg: string, data?: unknown) => emitScoped("warn", msg, data),
    error: (msg: string, data?: unknown) => emitScoped("error", msg, data),
  };
}
