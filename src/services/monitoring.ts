import { createLogger } from "@/lib/logger";

const log = createLogger("Monitoring", { level: import.meta.env.DEV ? "info" : "warn" });

export type MonitorEvent = {
  scope: string;
  message: string;
  error?: unknown;
  extra?: Record<string, unknown>;
};

// Reporta errores de forma ligera; en el futuro puede enviar a Supabase/Edge
export function reportError(evt: MonitorEvent) {
  try {
    const payload = {
      scope: evt.scope,
      message: evt.message,
      extra: evt.extra ?? {},
    };
    log.error(evt.message, { ...payload, error: evt.error });
  } catch {
    // noop
  }
}

export function reportInfo(evt: MonitorEvent) {
  try {
    log.info(evt.message, { scope: evt.scope, extra: evt.extra ?? {} });
  } catch {
    // noop
  }
}