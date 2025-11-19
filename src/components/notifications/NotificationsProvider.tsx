import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/newClient";
import { toast } from "@/components/ui/sonner";
import { createLogger } from "@/lib/logger";
import { fetchAlerts, subscribeAlerts } from "@/services/alerts";
import {
  NotificationsContext,
  NotificationItem,
  NotificationsContextType,
} from "./NotificationsContext";

// Tipos y contexto movidos a NotificationsContext.ts

export const NotificationsProvider: React.FC<
  React.PropsWithChildren<{ empresaId?: string | null }>
> = ({ children, empresaId }) => {
  const log = createLogger("Notifications");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const channelProductsRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  // Acumulador para agrupar toasts de stock y evitar spam cuando hay múltiples eventos simultáneos
  const batchRef = useRef<{ low: string[]; critical: string[]; timer: any }>({
    low: [],
    critical: [],
    timer: null,
  });

  const buildProductStockNotifications = async (empresaId: string) => {
    const mapped: NotificationItem[] = [];
    const { data, error } = await supabase
      .from("productos")
      .select("id, nombre, stock, stock_minimo")
      .eq("empresa_id", empresaId);
    if (!error && Array.isArray(data)) {
      for (const p of data) {
        const stock = Number(p.stock || 0);
        const min = Number(p.stock_minimo || 0);
        if (min > 0) {
          if (stock <= Math.floor(min / 2)) {
            mapped.push({
              id: `${p.id}-crit`,
              message: `Stock crítico en ${p.nombre || p.id}`,
              type: "stock_critico",
              createdAt: Date.now(),
              read: false,
            });
          } else if (stock <= min) {
            mapped.push({
              id: `${p.id}-low`,
              message: `Stock bajo en ${p.nombre || p.id}`,
              type: "stock_bajo",
              createdAt: Date.now(),
              read: false,
            });
          }
        }
      }
    }
    return mapped;
  };

  const addNotification: NotificationsContextType["addNotification"] = (n) => {
    const item: NotificationItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      message: n.message,
      type: n.type,
      createdAt: Date.now(),
      read: false,
    };
    setNotifications((prev) => [item, ...prev].slice(0, 200));
  };

  const markAllRead = async () => {
    // Actualiza estado local y persistencia en DB
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      if (empresaId) {
        await supabase
          .from("alertas")
          .update({ leida: true })
          .eq("empresa_id", empresaId)
          .eq("leida", false);
      }
    } catch (err) {
      log.warn("Error marcando alertas como leídas", err);
    }
  };

  const markRead: NotificationsContextType["markRead"] = async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      // Si el id parece ser de la tabla (UUID), persistimos; si es sintético, no
      const isUuid = /^[0-9a-fA-F-]{36}$/.test(id);
      if (isUuid) {
        await supabase.from("alertas").update({ leida: true }).eq("id", id);
      }
    } catch (err) {
      log.warn("Error marcando lectura de alerta", err);
    }
  };

  const removeNotification: NotificationsContextType["removeNotification"] = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearNotifications: NotificationsContextType["clearNotifications"] = () => {
    setNotifications([]);
  };

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  // Cargar alertas iniciales desde la tabla canonical "alertas"
  useEffect(() => {
    const loadInitial = async () => {
      try {
        if (!empresaId) return;
        const rows = await fetchAlerts({
          empresaId,
          orderBy: "created_at",
          orderAsc: false,
          limit: 50,
        });
        let mapped = rows.map((r: any) => ({
          id: String(r.id),
          message: String(r.titulo || r.mensaje || "Alerta"),
          type: String(r.tipo || "info"),
          createdAt: Date.parse(String(r.created_at)),
          read: Boolean(r.leida),
        })) as NotificationItem[];
        // Fallback si aún no hay filas en alertas: calcula desde productos
        if (mapped.length === 0) {
          mapped = await buildProductStockNotifications(empresaId);
        }
        setNotifications(mapped);
      } catch (err) {
        log.warn("Error cargando alertas", err);
        // Fallback ante error de red o API: calcular desde productos
        try {
          if (empresaId) {
            const mapped = await buildProductStockNotifications(empresaId);
            setNotifications(mapped);
          }
        } catch (e) {
          log.warn("Fallback desde productos también falló", e);
        }
      }
    };
    loadInitial();
  }, [empresaId]);

  // Suscripción en tiempo real a cambios en la tabla "alertas"
  useEffect(() => {
    if (!empresaId) return;
    try {
      const channel = subscribeAlerts(empresaId, async () => {
        try {
          const rows = await fetchAlerts({
            empresaId,
            orderBy: "created_at",
            orderAsc: false,
            limit: 50,
          });
          const mapped = rows.map((r: any) => ({
            id: String(r.id),
            message: String(r.titulo || r.mensaje || "Alerta"),
            type: String(r.tipo || "info"),
            createdAt: Date.parse(String(r.created_at)),
            read: Boolean(r.leida),
          })) as NotificationItem[];
          setNotifications(mapped);
        } catch (err) {
          log.warn("Error sincronizando alertas", err);
          // Si falla la sync, intenta reconstruir desde productos
          try {
            const mapped = await buildProductStockNotifications(empresaId);
            setNotifications(mapped);
          } catch (e) {
            log.warn("No se pudo reconstruir notificaciones desde productos", e);
          }
        }
      });
      channelRef.current = channel as any;
      return () => {
        try {
          supabase.removeChannel(channel as any);
        } catch {
          /* noop */
        }
        channelRef.current = null;
      };
    } catch (err) {
      log.warn("No se pudo suscribir a cambios de alertas", err);
    }
  }, [empresaId]);

  // Suscripción en tiempo real a cambios en la tabla "productos" para recalcular notificaciones de stock
  useEffect(() => {
    if (!empresaId) return;
    try {
      const channel = supabase
        .channel(`productos-alertas-${empresaId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "productos" },
          async (payload) => {
            try {
              // Filtra por empresa si el registro pertenece a otra empresa
              const newRecord = (payload as any).new || {};
              const oldRecord = (payload as any).old || {};
              const recordEmpresaId = String(newRecord.empresa_id || oldRecord.empresa_id || "");
              if (recordEmpresaId && recordEmpresaId !== String(empresaId)) return;

              // Recalcula notificaciones sintéticas y combina con las de la tabla alertas
              const synthetic = await buildProductStockNotifications(empresaId);
              try {
                const rows = await fetchAlerts({
                  empresaId,
                  orderBy: "created_at",
                  orderAsc: false,
                  limit: 50,
                });
                const dbAlerts = rows.map((r: any) => ({
                  id: String(r.id),
                  message: String(r.titulo || r.mensaje || "Alerta"),
                  type: String(r.tipo || "info"),
                  createdAt: Date.parse(String(r.created_at)),
                  read: Boolean(r.leida),
                })) as NotificationItem[];
                setNotifications([...dbAlerts, ...synthetic]);
              } catch {
                // Si falla la carga de alertas, al menos muestra las sintéticas
                setNotifications(synthetic);
              }
            } catch (err) {
              log.warn("Error recalculando notificaciones desde productos", err);
            }
          },
        )
        .subscribe();
      channelProductsRef.current = channel as any;
      return () => {
        try {
          supabase.removeChannel(channel as any);
        } catch {
          /* noop */
        }
        channelProductsRef.current = null;
      };
    } catch (err) {
      log.warn("No se pudo suscribir a cambios de productos", err);
    }
  }, [empresaId]);

  // Suscripción adicional a cambios en productos para resiliencia (si el trigger no está activo)
  useEffect(() => {
    if (!empresaId) return;
    try {
      const ch = supabase
        .channel(`notificaciones-productos-${empresaId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "productos",
            filter: `empresa_id=eq.${empresaId}`,
          },
          async (payload) => {
            const row = (payload.new || payload.old || {}) as any;
            const nombre = row.nombre || row.id;
            const stock = Number(row.stock || 0);
            const min = Number(row.stock_minimo || 0);
            if (min > 0) {
              if (stock <= Math.floor(min / 2)) {
                addNotification({ type: "stock_critico", message: `Stock crítico en ${nombre}` });
                batchRef.current.critical.push(String(nombre));
              } else if (stock <= min) {
                addNotification({ type: "stock_bajo", message: `Stock bajo en ${nombre}` });
                batchRef.current.low.push(String(nombre));
              }
              // Disparar toasts agrupados con un pequeño debounce para evitar múltiples toasts seguidos
              if (!batchRef.current.timer) {
                batchRef.current.timer = setTimeout(() => {
                  try {
                    const critCount = batchRef.current.critical.length;
                    const lowCount = batchRef.current.low.length;
                    if (critCount > 0) {
                      toast.error(`Stock crítico: ${critCount} producto(s) afectados`);
                    }
                    if (lowCount > 0) {
                      toast.warning(`Stock bajo: ${lowCount} producto(s) afectados`);
                    }
                  } finally {
                    batchRef.current = { low: [], critical: [], timer: null };
                  }
                }, 400);
              }
            }
          },
        )
        .subscribe();
      return () => {
        try {
          supabase.removeChannel(ch);
        } catch {}
      };
    } catch (err) {
      console.warn("[Notifications] No se pudo suscribir a cambios de productos:", err);
    }
  }, [empresaId]);

  const value: NotificationsContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAllRead,
    markRead,
    removeNotification,
    clearNotifications,
  };

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};
