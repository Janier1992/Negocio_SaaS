import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/newClient";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { fetchAlertsPaged, subscribeAlerts, markAlertRead, AlertRow } from "@/services/alerts";

type Alerta = AlertRow & { producto_id?: string | null };

const Alertas = () => {
  const { empresaId, loading: profileLoading } = useUserProfile();
  const [loading, setLoading] = useState(true);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [productosMap, setProductosMap] = useState<
    Map<string, { nombre?: string; codigo?: string; stock?: number }>
  >(new Map());
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState<"todas" | "activas" | "leidas">("todas");
  const [tipo, setTipo] = useState<"todos" | "stock_bajo" | "stock_critico">("todos");
  const [supportsLeida, setSupportsLeida] = useState(true);
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<"fecha" | "prioridad" | "tipo">("fecha");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [totalActivas, setTotalActivas] = useState<number>(0);
  const [params] = useSearchParams();
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchAlertas = async () => {
    if (!empresaId) return;
    setLoading(true);
    try {
      const desde = dateFrom ? new Date(dateFrom).toISOString() : undefined;
      const hasta = dateTo ? new Date(dateTo).toISOString() : undefined;
      const orderBy =
        sortKey === "fecha" ? "created_at" : sortKey === "tipo" ? "tipo" : "created_at";
      try {
        const leidaFilter = supportsLeida
          ? estado === "activas"
            ? false
            : estado === "leidas"
              ? true
              : undefined
          : undefined;
        const tipoFilter = tipo === "todos" ? undefined : tipo;
        const { rows, count } = await fetchAlertsPaged({
          empresaId,
          desde,
          hasta,
          tipo: tipoFilter,
          leida: leidaFilter,
          search,
          orderBy,
          orderAsc: sortAsc,
          page,
          pageSize,
        });
        const dbRows = rows as Alerta[];
        setSupportsLeida(true);
        const ids = Array.from(new Set(dbRows.map((r) => String(r.producto_id)).filter(Boolean)));
        if (ids.length > 0) {
          const { data: prodRows, error: prodErr } = await supabase
            .from("productos")
            .select("id, nombre, codigo, stock")
            .in("id", ids);
          if (!prodErr) {
            const map = new Map<string, { nombre?: string; codigo?: string; stock?: number }>();
            for (const p of prodRows || []) {
              map.set(String(p.id), { nombre: p.nombre, codigo: p.codigo, stock: p.stock });
            }
            setProductosMap(map);
          }
        } else {
          setProductosMap(new Map());
        }
        // Genera SIEMPRE alertas sintéticas desde productos y combina con las reales
        const { data: prods, error: prodsErr } = await supabase
          .from("productos")
          .select("id, nombre, codigo, stock, stock_minimo")
          .eq("empresa_id", empresaId);
        let synthetic: Alerta[] = [];
        if (!prodsErr && Array.isArray(prods)) {
          for (const p of prods) {
            const stock = Number(p.stock || 0);
            const min = Number(p.stock_minimo || 0);
            if (min > 0) {
              const nombre = p.nombre || String(p.id);
              const crit = stock <= Math.floor(min / 2);
              const bajo = !crit && stock <= min;
              if (crit || bajo) {
                const tipoVal = crit ? "stock_critico" : "stock_bajo";
                // Filtros actuales aplicados a sintéticas
                if (tipoFilter && tipoFilter !== tipoVal) continue;
                if (leidaFilter === true) continue; // sintéticas no son leídas
                const titulo = crit ? `Stock crítico en ${nombre}` : `Stock bajo en ${nombre}`;
                const mensaje = crit
                  ? `Stock (${stock}) por debajo de la mitad del mínimo (${min}).`
                  : `Stock (${stock}) por debajo del mínimo (${min}).`;
                const searchLow = (search || "").trim().toLowerCase();
                if (searchLow) {
                  const hay =
                    titulo.toLowerCase().includes(searchLow) ||
                    mensaje.toLowerCase().includes(searchLow);
                  if (!hay) continue;
                }
                const nowIso = new Date().toISOString();
                if (desde && nowIso < desde) continue;
                if (hasta && nowIso > hasta) continue;
                synthetic.push({
                  id: `synthetic:${p.id}:${crit ? "critico" : "bajo"}`,
                  tipo: tipoVal,
                  titulo,
                  mensaje,
                  created_at: nowIso,
                  leida: false,
                  producto_id: String(p.id),
                });
              }
            }
          }
        }
        const combined = [...dbRows, ...synthetic];
        setAlertas(combined);
        setTotalCount((count || 0) + synthetic.length);
      } catch (error: any) {
        const msg = String(error?.message || "").toLowerCase();
        if (msg.includes("column") && msg.includes("leida")) {
          console.warn(
            "[Alertas] Faltan columnas leida en la instancia. Fallback a columnas básicas.",
          );
          setSupportsLeida(false);
          const retry = await supabase
            .from("alertas")
            .select("id, tipo, titulo, mensaje, created_at")
            .eq("empresa_id", empresaId)
            .order("created_at", { ascending: sortAsc });
          if (retry.error) throw retry.error;
          const dbBasic = (retry.data || []) as Alerta[];
          // Combina con sintéticas también en modo básico
          const { data: prods, error: prodsErr } = await supabase
            .from("productos")
            .select("id, nombre, codigo, stock, stock_minimo")
            .eq("empresa_id", empresaId);
          let syntheticBasic: Alerta[] = [];
          if (!prodsErr && Array.isArray(prods)) {
            for (const p of prods) {
              const stock = Number(p.stock || 0);
              const min = Number(p.stock_minimo || 0);
              if (min > 0) {
                const nombre = p.nombre || String(p.id);
                const crit = stock <= Math.floor(min / 2);
                const bajo = !crit && stock <= min;
                if (crit || bajo) {
                  const tipoVal = crit ? "stock_critico" : "stock_bajo";
                  syntheticBasic.push({
                    id: `synthetic:${p.id}:${crit ? "critico" : "bajo"}`,
                    tipo: tipoVal,
                    titulo: crit ? `Stock crítico en ${nombre}` : `Stock bajo en ${nombre}`,
                    mensaje: crit
                      ? `Stock (${stock}) por debajo de la mitad del mínimo (${min}).`
                      : `Stock (${stock}) por debajo del mínimo (${min}).`,
                    created_at: new Date().toISOString(),
                    leida: false,
                    producto_id: String(p.id),
                  });
                }
              }
            }
          }
          setAlertas([...dbBasic, ...syntheticBasic]);
          setTotalCount((dbBasic.length || 0) + (syntheticBasic.length || 0));
        } else {
          throw error;
        }
      }
    } catch (err: any) {
      const low = String(err?.message || "").toLowerCase();
      const isAbort = low.includes("abort") || /err_aborted/i.test(low);
      const isNetwork = /failed to fetch|network/i.test(low);
      if (isAbort) {
        // Navegación abortada o cancelaciones internas: no mostrar error
      } else if (isNetwork) {
        toast.error("Sin conexión con el servidor. Reintenta en unos segundos…");
        // Fallback de red: intenta construir alertas sintéticas desde productos
        try {
          const { data: prods, error: prodsErr } = await supabase
            .from("productos")
            .select("id, nombre, codigo, stock, stock_minimo")
            .eq("empresa_id", empresaId);
          if (!prodsErr && Array.isArray(prods)) {
            const synthetic: Alerta[] = [];
            const map = new Map<string, { nombre?: string; codigo?: string; stock?: number }>();
            for (const p of prods) {
              const stock = Number(p.stock || 0);
              const min = Number(p.stock_minimo || 0);
              if (min > 0) {
                const nombre = p.nombre || String(p.id);
                if (stock <= Math.floor(min / 2)) {
                  synthetic.push({
                    id: `synthetic:${p.id}:critico`,
                    tipo: "stock_critico",
                    titulo: `Stock crítico en ${nombre}`,
                    mensaje: `Stock (${stock}) por debajo de la mitad del mínimo (${min}).`,
                    created_at: new Date().toISOString(),
                    leida: false,
                    producto_id: String(p.id),
                  });
                } else if (stock <= min) {
                  synthetic.push({
                    id: `synthetic:${p.id}:bajo`,
                    tipo: "stock_bajo",
                    titulo: `Stock bajo en ${nombre}`,
                    mensaje: `Stock (${stock}) por debajo del mínimo (${min}).`,
                    created_at: new Date().toISOString(),
                    leida: false,
                    producto_id: String(p.id),
                  });
                }
                map.set(String(p.id), { nombre: p.nombre, codigo: p.codigo, stock: p.stock });
              }
            }
            setAlertas(synthetic);
            setProductosMap(map);
            setSupportsLeida(false);
            setTotalCount(synthetic.length);
          }
        } catch (fallbackErr) {
          console.warn("[Alertas] Fallback de red desde productos falló:", fallbackErr);
        }
      } else {
        toast.error("Error al cargar alertas");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!empresaId) return;
    // Inicializa filtros desde query params (sincronizado con Dashboard)
    const qpDesde = params.get("desde");
    const qpHasta = params.get("hasta");
    if (qpDesde) setDateFrom(qpDesde);
    if (qpHasta) setDateTo(qpHasta);
    fetchAlertas();
    const chAlertas = subscribeAlerts(empresaId, () => fetchAlertas());
    // Suscripción adicional a productos para actualizar el fallback
    const chProductos = supabase
      .channel(`alertas-productos-${empresaId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "productos", filter: `empresa_id=eq.${empresaId}` },
        () => fetchAlertas(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(chAlertas);
      supabase.removeChannel(chProductos);
    };
  }, [empresaId]);

  const marcarLeida = async (id: string) => {
    const isUuid = /^[0-9a-fA-F-]{36}$/.test(id);
    try {
      // Persistir sólo si es alerta real y hay soporte de columna 'leida'
      if (isUuid && supportsLeida) {
        await markAlertRead(id, true);
      }
      // Siempre reflejar en UI
      setAlertas((prev) => prev.map((a) => (a.id === id ? { ...a, leida: true } : a)));
      toast.success("Alerta marcada como leída");
    } catch (err: any) {
      toast.error("No se pudo marcar la alerta");
      console.error(err);
    }
  };

  const marcarTodasLeidas = async () => {
    try {
      const ids = filteredAlertas.map((a) => a.id);
      if (ids.length === 0) return;
      // Persistir sólo ids reales (UUID) cuando hay soporte; el resto se marca localmente
      const uuidRegex = /^[0-9a-fA-F-]{36}$/;
      const realIds = supportsLeida ? ids.filter((id) => uuidRegex.test(id)) : [];
      if (realIds.length > 0) {
        const { error } = await supabase.from("alertas").update({ leida: true }).in("id", realIds);
        if (error) throw error;
      }
      setAlertas((prev) => prev.map((a) => ({ ...a, leida: true })));
      toast.success("Todas las alertas visibles marcadas como leídas");
    } catch (err: any) {
      toast.error("No se pudieron marcar las alertas");
      console.error(err);
    }
  };

  const filteredAlertas = useMemo(() => {
    // El orden y filtros principales se aplican server-side; aquí sólo devolvemos la página actual
    return alertas;
  }, [alertas]);

  useEffect(() => {
    setTotalActivas(alertas.filter((a) => !a.leida).length);
  }, [alertas]);

  const getTipoBadge = (t: string) => {
    switch (t) {
      case "stock_critico":
        return <Badge variant="destructive">Stock Crítico</Badge>;
      case "stock_bajo":
        return <Badge className="bg-warning text-warning-foreground">Stock Bajo</Badge>;
      default:
        return <Badge>Alerta</Badge>;
    }
  };

  if (profileLoading || loading) {
    return <div className="flex items-center justify-center h-96">Cargando...</div>;
  }

  if (!empresaId) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        No hay empresa asociada a tu usuario. Completa el registro y vuelve a intentar.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Alertas</h2>
          <p className="text-muted-foreground mt-1">Gestión de alertas del sistema</p>
          <div className="text-sm mt-1">
            Activas: <span className="font-semibold">{totalActivas}</span>
          </div>
        </div>
        {/* Se eliminan botones secundarios del header para simplificar el módulo */}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Listado de Alertas</CardTitle>
            <Button variant="default" onClick={marcarTodasLeidas}>
              Marcar todas como leídas
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 mt-4">
            <div className="flex gap-2">
              <Button
                variant={tipo === "todos" ? "default" : "outline"}
                onClick={() => setTipo("todos")}
              >
                Todos
              </Button>
              <Button
                variant={tipo === "stock_bajo" ? "default" : "outline"}
                onClick={() => setTipo("stock_bajo")}
              >
                Stock Bajo
              </Button>
              <Button
                variant={tipo === "stock_critico" ? "default" : "outline"}
                onClick={() => setTipo("stock_critico")}
              >
                Stock Crítico
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setTipo("todos");
                  setSearch("");
                  setDateFrom(null);
                  setDateTo(null);
                  setSortKey("fecha");
                  setSortAsc(false);
                  setPage(1);
                  fetchAlertas();
                }}
              >
                Limpiar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAlertas.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No hay alertas para los filtros seleccionados.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlertas.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border border-border"
                >
                  <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{a.titulo}</p>
                      {getTipoBadge(a.tipo)}
                      {a.leida && <Badge variant="outline">Leída</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{a.mensaje}</p>
                    {a.producto_id && productosMap.get(String(a.producto_id)) && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium">
                          {productosMap.get(String(a.producto_id))?.nombre}
                        </span>
                        {productosMap.get(String(a.producto_id))?.codigo && (
                          <span className="ml-2">
                            Código: {productosMap.get(String(a.producto_id))?.codigo}
                          </span>
                        )}
                        <span className="ml-2">
                          Stock: {productosMap.get(String(a.producto_id))?.stock ?? "-"}
                        </span>
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(a.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {!a.leida && (
                      <Button variant="outline" size="sm" onClick={() => marcarLeida(a.id)}>
                        Marcar como leída
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <Separator className="my-4" />
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              Mostrando <span className="font-semibold">{filteredAlertas.length}</span> de{" "}
              <span className="font-semibold">{totalCount}</span> alertas
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1));
                  fetchAlertas();
                }}
                disabled={page <= 1}
              >
                Anterior
              </Button>
              <span className="text-sm">
                Página {page} de {Math.max(1, Math.ceil(totalCount / pageSize))}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
                  setPage((p) => Math.min(totalPages, p + 1));
                  fetchAlertas();
                }}
                disabled={page >= Math.max(1, Math.ceil(totalCount / pageSize))}
              >
                Siguiente
              </Button>
              <select
                className="text-sm border rounded px-2 py-1 bg-background"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                  fetchAlertas();
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Las alertas se generan automáticamente según el stock y otros eventos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Alertas;
