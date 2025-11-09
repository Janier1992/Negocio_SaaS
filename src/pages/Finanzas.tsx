import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/newClient";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "sonner";
import { startOfMonth, startOfDay, subDays, subMonths, format } from "date-fns";
import jsPDF from "jspdf";
// Eliminados: Badge, Table, Button (solo usados por CxP)
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { fetchEgresos, addEgreso, logAuditEgreso, type EgresoRow } from "@/services/finanzas/egresos";
import { RequirePermission } from "@/components/auth/RequirePermission";

export default function Finanzas() {
  const { empresaId, loading: profileLoading } = useUserProfile();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [period, setPeriod] = useState<"hoy" | "semana" | "mes">("hoy");
  const [resumen, setResumen] = useState<{ ingresos_mes: number; egresos_mes: number; balance_mes: number; cogs: number } | null>(null);
  const [prevResumen, setPrevResumen] = useState<{ ingresos_mes: number; egresos_mes: number; balance_mes: number; cogs: number } | null>(null);
  // Eliminado: netTrend para Flujo Neto del Periodo
  // const [netTrend, setNetTrend] = useState<Array<{ label: string; total: number }>>([]);
  // Eliminados: estados y hooks de CxP
  // Eliminado: efecto de carga y suscripción de CxP

  // Formulario de egresos
  const [monto, setMonto] = useState<string>("");
  const [fecha, setFecha] = useState<string>("");
  const [categoria, setCategoria] = useState<string>("");
  const [descripcion, setDescripcion] = useState<string>("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Métricas de egresos
  const [egresosRows, setEgresosRows] = useState<EgresoRow[]>([]);
  const [egresosTrend, setEgresosTrend] = useState<Array<{ label: string; total: number }>>([]);
  const [egresosByCategoria, setEgresosByCategoria] = useState<Array<{ categoria: string; total: number }>>([]);
  const [filtroDesde, setFiltroDesde] = useState<string>("");
  const [filtroHasta, setFiltroHasta] = useState<string>("");
  const [filtroCat, setFiltroCat] = useState<string>("");
  // Persistencia de filtros para consistencia tras recargas
  useEffect(() => {
    try {
      const saved = localStorage.getItem('finanzas_egresos_filters');
      if (saved) {
        const obj = JSON.parse(saved);
        if (obj && typeof obj === 'object') {
          if (typeof obj.filtroDesde === 'string') setFiltroDesde(obj.filtroDesde);
          if (typeof obj.filtroHasta === 'string') setFiltroHasta(obj.filtroHasta);
          if (typeof obj.filtroCat === 'string') setFiltroCat(obj.filtroCat);
        }
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('finanzas_egresos_filters', JSON.stringify({ filtroDesde, filtroHasta, filtroCat }));
    } catch {}
  }, [filtroDesde, filtroHasta, filtroCat]);
  const filteredEgresos = useMemo(() => {
    return egresosRows.filter((r) => {
      const d = new Date(r.fecha);
      if (filtroDesde) {
        const fd = new Date(filtroDesde);
        if (d < fd) return false;
      }
      if (filtroHasta) {
        const fh = new Date(filtroHasta);
        fh.setHours(23,59,59,999);
        if (d > fh) return false;
      }
      if (filtroCat && filtroCat.trim()) {
        const cat = (r.categoria || "").toLowerCase();
        const q = filtroCat.trim().toLowerCase();
        if (!cat.includes(q)) return false;
      }
      return true;
    });
  }, [egresosRows, filtroDesde, filtroHasta, filtroCat]);

  // Estado del formulario como panel deslizable (persistente en sesión)
  const [formOpen, setFormOpen] = useState(false);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('finanzas_form_open');
      if (saved) setFormOpen(saved === '1');
    } catch {}
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem('finanzas_form_open', formOpen ? '1' : '0');
    } catch {}
  }, [formOpen]);

  useEffect(() => {
    const getRange = () => {
      const now = new Date();
      if (period === 'hoy') {
        const desde = startOfDay(now);
        const hasta = new Date();
        return { desde: desde.toISOString(), hasta: hasta.toISOString() };
      }
      if (period === 'semana') {
        const hasta = startOfDay(now);
        const desde = subDays(hasta, 7);
        return { desde: desde.toISOString(), hasta: new Date().toISOString() };
      }
      const desde = startOfMonth(now);
      const hasta = new Date();
      return { desde: desde.toISOString(), hasta: hasta.toISOString() };
    };
    const getPrevRange = () => {
      const now = new Date();
      if (period === 'hoy') {
        const hasta = startOfDay(now);
        const desde = subDays(hasta, 1);
        return { desde: desde.toISOString(), hasta: hasta.toISOString() };
      }
      if (period === 'semana') {
        const hasta = subDays(startOfDay(now), 7);
        const desde = subDays(hasta, 7);
        return { desde: desde.toISOString(), hasta: hasta.toISOString() };
      }
      const hasta = startOfMonth(now);
      const desde = startOfMonth(subMonths(now, 1));
      return { desde: desde.toISOString(), hasta: hasta.toISOString() };
    };

    const fetchResumen = async (background: boolean) => {
      if (!empresaId) return;
      if (background) setUpdating(true); else setLoading(true);
      try {
        const { desde, hasta } = getRange();
        const prev = getPrevRange();

        // INGRESOS: ventas del periodo
        const ventasRes = await supabase
          .from('ventas')
          .select('total, created_at')
          .eq('empresa_id', empresaId)
          .gte('created_at', desde);
        let ingresos = 0;
        if (ventasRes.error) {
          const code = (ventasRes.error as any)?.code || '';
          if (code !== 'PGRST205') throw ventasRes.error;
        } else {
          ingresos = (ventasRes.data || []).reduce((sum: number, v: any) => sum + Number(v.total || 0), 0);
        }
        // Ventas periodo previo
        const ventasPrevRes = await supabase
          .from('ventas')
          .select('total, created_at')
          .eq('empresa_id', empresaId)
          .gte('created_at', prev.desde)
          .lt('created_at', prev.hasta);
        let prevIngresos = 0;
        if (ventasPrevRes.error) {
          const codePrev = (ventasPrevRes.error as any)?.code || '';
          if (codePrev !== 'PGRST205') throw ventasPrevRes.error;
        } else {
          prevIngresos = (ventasPrevRes.data || []).reduce((sum: number, v: any) => sum + Number(v.total || 0), 0);
        }

        // EGRESOS/COGS: compras recibidas en el periodo
        const comprasRecRes = await supabase
          .from('compras')
          .select('id, estado, total, created_at')
          .eq('empresa_id', empresaId)
          .gte('created_at', desde)
          .eq('estado', 'recibida');
        let comprasRecRows: any[] = [];
        if (comprasRecRes.error) {
          const code = (comprasRecRes.error as any)?.code || '';
          if (code === 'PGRST205') {
            comprasRecRows = [];
          } else {
            throw comprasRecRes.error;
          }
        } else {
          comprasRecRows = comprasRecRes.data || [];
        }
        // COGS aproximado
        const cogs = comprasRecRows.reduce((sum: number, c: any) => sum + Number(c.total || 0), 0);
        // Compras periodo previo (COGS previo)
        const comprasPrevRes = await supabase
          .from('compras')
          .select('id, estado, total, created_at')
          .eq('empresa_id', empresaId)
          .gte('created_at', prev.desde)
          .lt('created_at', prev.hasta)
          .eq('estado', 'recibida');
        let comprasPrevRows: any[] = [];
        if (comprasPrevRes.error) {
          const codePrevC = (comprasPrevRes.error as any)?.code || '';
          if (codePrevC === 'PGRST205') {
            comprasPrevRows = [];
          } else {
            throw comprasPrevRes.error;
          }
        } else {
          comprasPrevRows = comprasPrevRes.data || [];
        }
        const prevCogs = comprasPrevRows.reduce((sum: number, c: any) => sum + Number(c.total || 0), 0);

        // Egresos operacionales manuales
        const egresosManual = await fetchEgresos({ empresaId, desde, hasta });
        setEgresosRows(egresosManual);
        const egresosManualSum = egresosManual.reduce((s, r) => s + Number(r.monto || 0), 0);
        // Egresos manuales previos
        const egresosManualPrev = await fetchEgresos({ empresaId, desde: prev.desde, hasta: prev.hasta });
        const egresosManualPrevSum = egresosManualPrev.reduce((s, r) => s + Number(r.monto || 0), 0);

        // Egresos totales del periodo
        const egresos = cogs + egresosManualSum;

        setResumen({
          ingresos_mes: ingresos,
          egresos_mes: egresos,
          balance_mes: ingresos - egresos,
          cogs,
        });
        setPrevResumen({
          ingresos_mes: prevIngresos,
          egresos_mes: prevCogs + egresosManualPrevSum,
          balance_mes: prevIngresos - (prevCogs + egresosManualPrevSum),
          cogs: prevCogs,
        });

        // Tendencia neta por día/horas
        const dailyMap = new Map<string, { ingresos: number; egresos: number }>();
        for (const v of (ventasRes.data || [])) {
          const label = format(new Date(v.created_at), period === 'hoy' ? 'HH:mm' : 'dd MMM');
          const cur = dailyMap.get(label) || { ingresos: 0, egresos: 0 };
          cur.ingresos += Number(v.total || 0);
          dailyMap.set(label, cur);
        }
        for (const c of comprasRecRows) {
          const label = format(new Date(c.created_at), period === 'hoy' ? 'HH:mm' : 'dd MMM');
          const cur = dailyMap.get(label) || { ingresos: 0, egresos: 0 };
          cur.egresos += Number(c.total || 0);
          dailyMap.set(label, cur);
        }
        // Agregar egresos manuales a la tendencia
        for (const e of egresosManual) {
          const label = format(new Date(e.fecha), period === 'hoy' ? 'HH:mm' : 'dd MMM');
          const cur = dailyMap.get(label) || { ingresos: 0, egresos: 0 };
          cur.egresos += Number(e.monto || 0);
          dailyMap.set(label, cur);
        }
        // Construir tendencia y categorías de egresos
        const egTrend = Array.from(dailyMap.entries()).map(([label, v]) => ({ label, total: v.egresos }));
        setEgresosTrend(egTrend);
        const catMap = new Map<string, number>();
        for (const e of egresosManual) {
          const key = (e.categoria || 'Otros').trim();
          catMap.set(key, (catMap.get(key) || 0) + Number(e.monto || 0));
        }
        const catArr = Array.from(catMap.entries()).map(([categoria, total]) => ({ categoria, total }));
        catArr.sort((a, b) => b.total - a.total);
        setEgresosByCategoria(catArr.slice(0, 5));
        // Eliminado: cálculo de tendencia neta
      } catch (err: any) {
        toast.error('Error al cargar finanzas');
        console.error(err);
      } finally {
        if (background) setUpdating(false); else setLoading(false);
      }
    };
    if (empresaId) fetchResumen(false);
    else if (!profileLoading) setLoading(false);
    
    // Polling y suscripciones realtime para ventas/compras
    if (!empresaId) return;
    const interval = setInterval(() => fetchResumen(true), 5000);
    const channel = supabase
      .channel('finanzas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas', filter: `empresa_id=eq.${empresaId}` }, () => fetchResumen(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas_detalle' }, () => fetchResumen(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'compras', filter: `empresa_id=eq.${empresaId}` }, () => fetchResumen(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'compras_detalle' }, () => fetchResumen(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'egresos', filter: `empresa_id=eq.${empresaId}` }, () => fetchResumen(true))
      // Eliminada suscripción realtime a cuentas_por_pagar
      .subscribe();

    return () => {
      clearInterval(interval);
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [empresaId, profileLoading, period]);

  const currencyFormatter = useMemo(() => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }), []);
  const numberValid = (val: string) => /^\d+(\.\d{1,2})?$/.test(val.trim());
  const submitEgreso = async () => {
    if (!empresaId) return;
    const errs: Record<string, string> = {};
    if (!numberValid(monto) || Number(monto) <= 0) errs.monto = "Monto inválido";
    if (!fecha) errs.fecha = "Fecha requerida";
    if (!categoria.trim()) errs.categoria = "Categoría requerida";
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    try {
      const row = await addEgreso({ empresaId, monto: Number(monto), fecha, categoria, descripcion });
      await logAuditEgreso('create', empresaId, { id: row.id, monto: row.monto, fecha: row.fecha, categoria: row.categoria });
      toast.success('Egreso registrado');
      // Actualización inmediata de la lista
      setEgresosRows((prev) => [row, ...prev]);
      // Actualización inmediata de la tarjeta de Egresos y Balance
      setResumen((prev) => {
        if (!prev) return prev;
        const added = Number(row.monto || 0);
        return {
          ...prev,
          egresos_mes: Number(prev.egresos_mes || 0) + added,
          balance_mes: Number(prev.balance_mes || 0) - added,
        };
      });
      // Actualización de tendencia y categorías principales
      try {
        const label = format(new Date(row.fecha), period === 'hoy' ? 'HH:mm' : 'dd MMM');
        setEgresosTrend((prev) => {
          const idx = prev.findIndex((t) => t.label === label);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { label, total: next[idx].total + Number(row.monto || 0) };
            return next;
          }
          return [...prev, { label, total: Number(row.monto || 0) }];
        });
        const nextRows = [row, ...egresosRows];
        const catMap = new Map<string, number>();
        for (const e of nextRows) {
          const key = (e.categoria || 'Otros').trim();
          catMap.set(key, (catMap.get(key) || 0) + Number(e.monto || 0));
        }
        const catArr = Array.from(catMap.entries()).map(([categoria, total]) => ({ categoria, total }));
        catArr.sort((a, b) => b.total - a.total);
        setEgresosByCategoria(catArr.slice(0, 5));
      } catch {}
      // Limpiar formulario
      setMonto(""); setFecha(""); setCategoria(""); setDescripcion("");
    } catch (err: any) {
      const msg = String(err?.message || "");
      const code = (err as any)?.code || "";
      const friendly = /Failed to fetch|network|fetch/i.test(msg)
        ? 'Sin conexión con el servidor'
        : /rls|policy|permission/i.test(msg)
        ? 'Sin permisos o perfil sin empresa asignada'
        : code === 'PGRST205' || /schema cache/i.test(msg) || /relation\s+.*egresos.*\s+does not exist/i.test(msg)
        ? 'El esquema aún no está sincronizado. Refresca y reintenta en unos segundos'
        : 'No se pudo registrar el egreso';
      toast.error(friendly);
      console.error(err);
    }
  };

  const exportEgresosCSV = () => {
    try {
      const headers = ['id','fecha','categoria','monto','descripcion'];
      const rows = egresosRows.map(r => [r.id, r.fecha, (r.categoria || '').replace(/\n|\r/g,''), String(r.monto), (r.descripcion || '').replace(/\n|\r/g,'')]);
      const csv = [headers.join(','), ...rows.map(cols => cols.map(v => /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g,'""')}"` : String(v)).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `egresos_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error('No se pudo exportar CSV');
    }
  };
  const exportEgresosPDF = (rows: EgresoRow[]) => {
    try {
      const doc = new jsPDF({ unit: 'pt' });
      const title = `Egresos (${period === 'hoy' ? 'Hoy' : period === 'semana' ? 'Semana' : 'Mes'})`;
      doc.setFontSize(14);
      doc.text(title, 40, 40);
      doc.setFontSize(10);
      doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 40, 60);
      // Cabeceras
      const startY = 90;
      doc.setFont(undefined, 'bold');
      doc.text('Fecha', 40, startY);
      doc.text('Categoría', 140, startY);
      doc.text('Descripción', 260, startY);
      doc.text('Monto', 480, startY, { align: 'right' });
      doc.setFont(undefined, 'normal');
      // Filas
      let y = startY + 16;
      const pageHeight = doc.internal.pageSize.getHeight();
      const lineHeight = 14;
      rows.forEach((r) => {
        if (y > pageHeight - 40) {
          doc.addPage();
          y = 40;
        }
        doc.text(format(new Date(r.fecha), 'dd/MM/yyyy'), 40, y);
        doc.text(String(r.categoria || '').slice(0, 20), 140, y);
        doc.text(String(r.descripcion || '').slice(0, 40), 260, y);
        doc.text(currencyFormatter.format(Number(r.monto || 0)), 480, y, { align: 'right' });
        y += lineHeight;
      });
      // Totales por categoría
      const catMap = new Map<string, number>();
      rows.forEach((r) => {
        const key = (r.categoria || 'Otros').trim();
        catMap.set(key, (catMap.get(key) || 0) + Number(r.monto || 0));
      });
      const total = rows.reduce((s, r) => s + Number(r.monto || 0), 0);
      if (y > pageHeight - 120) {
        doc.addPage();
        y = 40;
      }
      doc.setFont(undefined, 'bold');
      doc.text('Desglose por categorías', 40, y + 10);
      doc.setFont(undefined, 'normal');
      y += 30;
      Array.from(catMap.entries()).sort((a,b) => b[1] - a[1]).forEach(([cat, sum]) => {
        if (y > pageHeight - 40) {
          doc.addPage();
          y = 40;
        }
        doc.text(`${cat}`, 40, y);
        doc.text(currencyFormatter.format(sum), 480, y, { align: 'right' });
        y += lineHeight;
      });
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 40;
      }
      doc.setFont(undefined, 'bold');
      doc.text('Total', 40, y + 10);
      doc.text(currencyFormatter.format(total), 480, y + 10, { align: 'right' });

      doc.save(`egresos_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err) {
      console.error(err);
      toast.error('No se pudo exportar PDF');
    }
  };

  if (profileLoading || loading) {
    return <div className="flex items-center justify-center h-96">Cargando...</div>;
  }

  if (!empresaId) {
    return <div className="flex items-center justify-center h-96 text-muted-foreground">No hay empresa asociada a tu usuario.</div>;
  }

  // Eliminadas funciones: refreshVencimientos y markPagada

  return (
    <RequirePermission permission="finanzas_view">
      <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Finanzas</h2>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-muted-foreground">Resumen financiero consolidado.</p>
          {updating && <span className="text-xs text-muted-foreground animate-pulse">Actualizando…</span>}
        </div>
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <div className="w-full sm:w-64">
            <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
              <SelectTrigger aria-label="Periodo">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hoy">Hoy</SelectItem>
                <SelectItem value="semana">Semana</SelectItem>
                <SelectItem value="mes">Mes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setFormOpen((o) => !o)}>{formOpen ? 'Ocultar formulario' : 'Registrar egreso'}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos ({period === 'hoy' ? 'Hoy' : period === 'semana' ? 'Semana' : 'Mes'})</CardTitle>
            <CardDescription>Ventas del periodo seleccionado</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{currencyFormatter.format(Number(resumen?.ingresos_mes || 0))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Egresos ({period === 'hoy' ? 'Hoy' : period === 'semana' ? 'Semana' : 'Mes'})</CardTitle>
            <CardDescription>COGS + egresos operacionales</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{currencyFormatter.format(Number(resumen?.egresos_mes || 0))}</p>
            {egresosTrend.length > 0 ? (
              <div className="mt-4">
                {(() => {
                  const width = 320;
                  const height = 96;
                  const padding = 8;
                  const maxTotal = Math.max(1, ...egresosTrend.map((x) => x.total));
                  const stepX = (width - padding * 2) / Math.max(1, egresosTrend.length - 1);
                  const points = egresosTrend.map((t, i) => {
                    const x = padding + i * stepX;
                    const y = padding + (1 - (t.total / maxTotal)) * (height - padding * 2);
                    return { x, y, label: t.label, total: t.total };
                  });
                  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
                  const area = `${path} L ${padding + (egresosTrend.length - 1) * stepX},${height - padding} L ${padding},${height - padding} Z`;
                  return (
                    <svg width={width} height={height} className="text-muted-foreground">
                      <path d={area} fill="rgba(220,38,38,0.15)" />
                      <path d={path} stroke="rgba(220,38,38,0.8)" strokeWidth="2" fill="none" />
                      {points.map((p) => (
                        <circle key={`pt-${p.label}`} cx={p.x} cy={p.y} r="2" fill="rgba(220,38,38,0.9)">
                          <title>{`${p.label}: ${currencyFormatter.format(p.total)}`}</title>
                        </circle>
                      ))}
                    </svg>
                  );
                })()}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">Sin datos para tendencia.</p>
            )}
            {egresosByCategoria.length > 0 && (
              <div className="mt-4 space-y-1">
                <div className="text-sm font-medium">Categorías principales</div>
                {egresosByCategoria.map((c) => (
                  <div key={c.categoria} className="flex justify-between text-xs">
                    <span>{c.categoria}</span>
                    <span>{currencyFormatter.format(c.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Balance ({period === 'hoy' ? 'Hoy' : period === 'semana' ? 'Semana' : 'Mes'})</CardTitle>
            <CardDescription>Ingresos - Egresos del periodo</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{currencyFormatter.format(Number(resumen?.balance_mes || 0))}</p>
          </CardContent>
        </Card>
        {/* Métricas financieras agrupadas */}
        <Card>
          <CardHeader>
            <CardTitle>Utilidad Operacional</CardTitle>
            <CardDescription>
              <Tooltip>
                <TooltipTrigger>Ingresos - Gastos operacionales</TooltipTrigger>
                <TooltipContent>Incluye compras (COGS) y egresos registrados</TooltipContent>
              </Tooltip>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{currencyFormatter.format(Number((resumen?.ingresos_mes || 0) - (resumen?.egresos_mes || 0)))}</p>
            <div className="text-xs mt-1">
              {(() => {
                const cur = Number((resumen?.ingresos_mes || 0) - (resumen?.egresos_mes || 0));
                const prev = Number((prevResumen?.ingresos_mes || 0) - (prevResumen?.egresos_mes || 0));
                const diff = cur - prev;
                const pct = prev !== 0 ? (diff / Math.abs(prev)) * 100 : 0;
                const up = diff >= 0;
                return (
                  <span className={up ? 'text-emerald-600' : 'text-destructive'}>
                    {up ? '▲' : '▼'} {pct.toFixed(1)}% vs periodo previo
                  </span>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Utilidad Bruta</CardTitle>
            <CardDescription>
              <Tooltip>
                <TooltipTrigger>Ventas - Costo de ventas</TooltipTrigger>
                <TooltipContent>COGS aproximado desde compras recibidas</TooltipContent>
              </Tooltip>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{currencyFormatter.format(Number((resumen?.ingresos_mes || 0) - (resumen?.cogs || 0)))}</p>
            <div className="text-xs text-muted-foreground mt-1">{(() => {
              const ventas = Number(resumen?.ingresos_mes || 0);
              const cogs = Number(resumen?.cogs || 0);
              const pct = ventas > 0 ? ((ventas - cogs) / ventas) * 100 : 0;
              return `Margen bruto: ${pct.toFixed(1)}%`;
            })()}</div>
            <div className="text-xs mt-1">
              {(() => {
                const cur = Number((resumen?.ingresos_mes || 0) - (resumen?.cogs || 0));
                const prev = Number((prevResumen?.ingresos_mes || 0) - (prevResumen?.cogs || 0));
                const diff = cur - prev;
                const pct = prev !== 0 ? (diff / Math.abs(prev)) * 100 : 0;
                const up = diff >= 0;
                return (
                  <span className={up ? 'text-emerald-600' : 'text-destructive'}>
                    {up ? '▲' : '▼'} {pct.toFixed(1)}% vs periodo previo
                  </span>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Margen Proyectado</CardTitle>
            <CardDescription>
              <Tooltip>
                <TooltipTrigger>Escenarios históricos</TooltipTrigger>
                <TooltipContent>Proyección simple basada en valores actuales</TooltipContent>
              </Tooltip>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const ventas = Number(resumen?.ingresos_mes || 0);
              const cogs = Number(resumen?.cogs || 0);
              const egresos = Number(resumen?.egresos_mes || 0);
              const margenActual = ventas > 0 ? (ventas - cogs) / ventas : 0;
              const optimistaVentas = ventas * 1.15;
              const optimistaEgresos = egresos * 0.95;
              const pesimistaVentas = ventas * 0.85;
              const pesimistaEgresos = egresos * 1.05;
              // Escenario puro (sin sumar el resultado actual)
              const optimistaPuro = optimistaVentas * margenActual - optimistaEgresos;
              const pesimistaPuro = pesimistaVentas * margenActual - pesimistaEgresos;
              // Escenario + resultado actual
              const resultadoActual = ventas - egresos;
              const optimistaConBase = optimistaPuro + resultadoActual;
              const pesimistaConBase = pesimistaPuro + resultadoActual;
              return (
                <div className="text-sm space-y-1">
                  <div className="text-muted-foreground">Escenario puro</div>
                  <div>Optimista: {currencyFormatter.format(optimistaPuro)}</div>
                  <div>Pesimista: {currencyFormatter.format(pesimistaPuro)}</div>
                  <div className="mt-2 text-muted-foreground">Con base actual</div>
                  <div>Optimista: {currencyFormatter.format(optimistaConBase)}</div>
                  <div>Pesimista: {currencyFormatter.format(pesimistaConBase)}</div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
        {/* Eliminada tarjeta: Cuentas por pagar (resumen) */}
      </div>

      {/* Formulario flotante con Dialog (consistencia con Inventario/Ventas) */}
      <Dialog open={formOpen} onOpenChange={(v) => setFormOpen(v)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Egreso</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm" htmlFor="monto">Monto</label>
              <Input id="monto" inputMode="decimal" placeholder="0.00" value={monto} onChange={(e) => setMonto(e.target.value)} aria-invalid={!!formErrors.monto} />
              {formErrors.monto && <div className="text-xs text-destructive mt-1">{formErrors.monto}</div>}
            </div>
            <div>
              <label className="text-sm" htmlFor="fecha">Fecha</label>
              <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} aria-invalid={!!formErrors.fecha} />
              {formErrors.fecha && <div className="text-xs text-destructive mt-1">{formErrors.fecha}</div>}
            </div>
            <div>
              <label className="text-sm" htmlFor="categoria">Categoría</label>
              <Input id="categoria" placeholder="Servicios, Impuestos, Renta..." value={categoria} onChange={(e) => setCategoria(e.target.value)} aria-invalid={!!formErrors.categoria} />
              {formErrors.categoria && <div className="text-xs text-destructive mt-1">{formErrors.categoria}</div>}
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="text-sm" htmlFor="descripcion">Descripción</label>
              <Textarea id="descripcion" placeholder="Detalle del egreso" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={submitEgreso}>Guardar egreso</Button>
              </TooltipTrigger>
              <TooltipContent>Registra y actualiza métricas en tiempo real</TooltipContent>
            </Tooltip>
            <Button variant="outline" onClick={() => { setMonto(""); setFecha(""); setCategoria(""); setDescripcion(""); setFormErrors({}); }}>Limpiar</Button>
            <Button variant="outline" onClick={exportEgresosCSV}>Exportar CSV</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Listado y filtros de egresos */}
      <Card>
        <CardHeader>
          <CardTitle>Egresos del periodo</CardTitle>
          <CardDescription>Filtra y explora tus egresos; exporta PDF por categoría.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm" htmlFor="filtroDesde2">Filtrar desde</label>
              <Input id="filtroDesde2" type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} />
            </div>
            <div>
              <label className="text-sm" htmlFor="filtroHasta2">Filtrar hasta</label>
              <Input id="filtroHasta2" type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} />
            </div>
            <div>
              <label className="text-sm" htmlFor="filtroCat2">Categoría</label>
              <Input id="filtroCat2" placeholder="Categoría" value={filtroCat} onChange={(e) => setFiltroCat(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => exportEgresosPDF(filteredEgresos)}>Exportar PDF</Button>
            </div>
          </div>
          <div className="mt-4 border rounded">
            <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium bg-muted/50">
              <div className="col-span-3">Fecha</div>
              <div className="col-span-3">Categoría</div>
              <div className="col-span-3">Descripción</div>
              <div className="col-span-3 text-right">Monto</div>
            </div>
            {filteredEgresos.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground">Sin egresos para los filtros seleccionados.</div>
            )}
            {filteredEgresos.map((r) => (
              <div key={r.id} className="grid grid-cols-12 gap-2 px-3 py-2 text-xs border-t">
                <div className="col-span-3">{format(new Date(r.fecha), 'dd/MM/yyyy')}</div>
                <div className="col-span-3">{r.categoria}</div>
                <div className="col-span-3 truncate" title={r.descripcion || ''}>{r.descripcion}</div>
                <div className="col-span-3 text-right">{currencyFormatter.format(Number(r.monto || 0))}</div>
              </div>
            ))}
            {filteredEgresos.length > 0 && (
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs bg-muted/30 border-t">
                <div className="col-span-9 font-medium">Total filtrado</div>
                <div className="col-span-3 text-right font-medium">
                  {currencyFormatter.format(filteredEgresos.reduce((s, r) => s + Number(r.monto || 0), 0))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Eliminada tarjeta: Flujo Neto del Periodo */}
      {/* Eliminada sección: Cuentas por pagar (detalle y acciones) */}
      </div>
    </RequirePermission>
  );
}