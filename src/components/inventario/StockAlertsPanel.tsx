import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/newClient";
import { fetchAlerts, markAlertRead, AlertRow, subscribeAlerts } from "@/services/alerts";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";

type ProductoInfo = { id: string; codigo?: string; nombre?: string; stock?: number };

export default function StockAlertsPanel() {
  const { empresaId } = useUserProfile();
  const [loading, setLoading] = useState(true);
  const [alertas, setAlertas] = useState<AlertRow[]>([]);
  const [productosMap, setProductosMap] = useState<Map<string, ProductoInfo>>(new Map());

  const load = async () => {
    if (!empresaId) return;
    setLoading(true);
    try {
      const rows = await fetchAlerts({ empresaId, orderBy: "created_at", orderAsc: false });
      const stockRows = rows.filter((r) => r.tipo === "stock_bajo" || r.tipo === "stock_critico");
      setAlertas(stockRows);
      const ids = Array.from(new Set(stockRows.map((r) => String(r.producto_id)).filter(Boolean)));
      if (ids.length > 0) {
        const { data, error } = await supabase
          .from("productos")
          .select("id, codigo, nombre, stock")
          .in("id", ids);
        if (!error) {
          const map = new Map<string, ProductoInfo>();
          for (const p of (data || [])) {
            map.set(String(p.id), { id: String(p.id), codigo: p.codigo, nombre: p.nombre, stock: p.stock });
          }
          setProductosMap(map);
        }
      } else {
        setProductosMap(new Map());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (!empresaId) return;
    const ch = subscribeAlerts(empresaId, () => load());
    return () => {
      try { supabase.removeChannel(ch); } catch {}
    };
  }, [empresaId]);

  const getColorClasses = (tipo: string) =>
    tipo === "stock_critico"
      ? "border-red-300 bg-red-50"
      : "border-yellow-300 bg-yellow-50";

  const getBadge = (tipo: string) => (
    <Badge className={tipo === "stock_critico" ? "bg-red-600 text-white" : "bg-yellow-500 text-white"}>
      {tipo === "stock_critico" ? "Crítico" : "Bajo"}
    </Badge>
  );

  const unreadCount = useMemo(() => alertas.filter(a => !a.leida).length, [alertas]);

  const marcarLeida = async (id: string) => {
    await markAlertRead(id, true);
    setAlertas(prev => prev.map(a => a.id === id ? { ...a, leida: true } : a));
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TriangleAlert className="h-5 w-5 text-yellow-600" />
          Alertas de Stock
          {unreadCount > 0 && <Badge variant="secondary" className="ml-2">{unreadCount} nuevas</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Cargando alertas...</div>
        ) : alertas.length === 0 ? (
          <div className="text-sm text-muted-foreground">No hay alertas de stock por mostrar.</div>
        ) : (
          <div className="space-y-2">
            {alertas.map((a) => {
              const p = a.producto_id ? productosMap.get(String(a.producto_id)) : undefined;
              return (
                <div key={a.id} className={`p-3 rounded-md border ${getColorClasses(a.tipo)}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{a.titulo}</span>
                        {getBadge(a.tipo)}
                        {a.leida && <Badge variant="outline">Leída</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {p ? (
                          <>
                            <span className="font-medium">{p.nombre}</span>
                            {p.codigo && <span className="ml-2">Código: {p.codigo}</span>}
                            <span className="ml-2">Stock: {p.stock ?? '-'}</span>
                          </>
                        ) : (
                          <>{a.mensaje}</>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{new Date(a.created_at).toLocaleString()}</div>
                    </div>
                    {!a.leida && (
                      <Button variant="outline" size="sm" onClick={() => marcarLeida(a.id)}>Marcar leída</Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}