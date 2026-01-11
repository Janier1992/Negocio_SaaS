
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import {
    Activity,
    CreditCard,
    DollarSign,
    Package,
    Users,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Bell,
    TrendingUp,
    Receipt,
    Wallet,
    ArrowDown,
    AlertTriangle,
    Plus,
    ShoppingBag,
    PieChart,
    Store,
    ShoppingCart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

import { useUserProfile } from "@/hooks/useUserProfile";

export default function Dashboard() {
    const { data: stats, isLoading, error } = useDashboardStats();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { userProfile } = useUserProfile() as any;
    const navigate = useNavigate();

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
        }).format(value);
    };

    const translateStatus = (status: string) => {
        switch (status) {
            case 'completed': return 'Completado';
            case 'pending': return 'Pendiente';
            case 'cancelled': return 'Cancelado';
            default: return status;
        }
    };

    const firstName = userProfile?.full_name?.split(' ')[0] || "Usuario";

    return (
        <div className="space-y-8">
            {/* PAGE HEADING */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Hola, {firstName} 👋</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Aquí tienes el resumen de tu negocio.</p>
                </div>
                <div className="flex gap-3">
                    {/* Filter button removed for production consistency (no half-baked features) */}
                    <button
                        onClick={() => navigate("/ventas")}
                        className="flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-bold shadow-sm shadow-blue-500/30 transition-all active:scale-95"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Nueva Venta</span>
                    </button>
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Productos en Stock */}
                <div className="bg-white dark:bg-card p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Productos en Stock</p>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {isLoading ? "..." : (stats?.inventoryStats?.totalProducts || 0).toLocaleString()}
                            </h3>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-lg">
                            <Package className="h-6 w-6 text-blue-500" />
                        </div>
                    </div>
                </div>

                {/* Ventas del Periodo */}
                <div className="bg-white dark:bg-card p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Ventas del Periodo</p>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {isLoading ? "..." : formatCurrency(stats?.periodSales || 0)}
                            </h3>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2.5 rounded-lg">
                            <DollarSign className="h-6 w-6 text-emerald-500" />
                        </div>
                    </div>
                </div>

                {/* Valor Inventario */}
                <div className="bg-white dark:bg-card p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Valor Inventario</p>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {isLoading ? "..." : formatCurrency(stats?.inventoryStats?.totalValue || 0)}
                            </h3>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-2.5 rounded-lg hidden sm:block">
                            <CreditCard className="h-6 w-6 text-purple-500" />
                        </div>
                    </div>
                </div>

                {/* Crecimiento de Ventas (Time Intelligence) */}
                <div className="bg-white dark:bg-card p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Crecimiento Ventas</p>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {isLoading ? "..." : formatCurrency(stats?.periodSales || 0)}
                            </h3>
                            <div className="flex items-center mt-1">
                                {(() => {
                                    const current = stats?.periodSales || 0;
                                    const previous = stats?.previousPeriodSales || 0;
                                    let percentage = 0;
                                    if (previous > 0) {
                                        percentage = ((current - previous) / previous) * 100;
                                    } else if (current > 0) {
                                        percentage = 100; // 100% growth if prev was 0
                                    }

                                    const isPositive = percentage >= 0;
                                    return (
                                        <>
                                            <span className={`text-xs font-bold ${isPositive ? 'text-emerald-600' : 'text-red-500'} flex items-center`}>
                                                {isPositive ? '+' : ''}{percentage.toFixed(1)}%
                                            </span>
                                            <span className="text-xs text-slate-400 ml-1">vs mes anterior</span>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-2.5 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-orange-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* CASH FLOW CHART */}
                <div className="lg:col-span-2 bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Flujo de Caja</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Ingresos vs Gastos (Últimos 6 meses)</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                                <div className="w-3 h-3 rounded-full bg-primary"></div> Ingresos
                            </div>
                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                                <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600"></div> Gastos
                            </div>
                        </div>
                    </div>
                    {/* Simple CSS Bar Chart for robustness */}
                    <div className="flex-1 flex items-end justify-between gap-2 sm:gap-4 h-64 w-full pt-4">
                        {(stats?.monthlyStats || []).length > 0 ? (
                            stats?.monthlyStats?.map((stat: any, i: number) => {
                                // Calculate scale based on max value in the set to fit container (80% max height)
                                const allValues = stats.monthlyStats.flatMap((s: any) => [Number(s.income), Number(s.expenses)]);
                                const maxVal = Math.max(...allValues, 1); // Avoid div by zero
                                const incomeH = Math.min((Number(stat.income) / maxVal) * 80, 80);
                                const expenseH = Math.min((Number(stat.expenses) / maxVal) * 80, 80);

                                return (
                                    <div key={stat.name} className="flex flex-col items-center gap-2 h-full justify-end flex-1 group cursor-pointer" title={`Ingresos: ${formatCurrency(stat.income)} | Gastos: ${formatCurrency(stat.expenses)}`}>
                                        <div className="relative w-full max-w-[40px] flex items-end h-[80%] gap-1">
                                            <div style={{ height: `${Math.max(expenseH, 2)}%` }} className="w-1/2 bg-slate-300 dark:bg-slate-700 rounded-t-sm group-hover:opacity-80 transition-all"></div>
                                            <div style={{ height: `${Math.max(incomeH, 2)}%` }} className="w-1/2 bg-primary rounded-t-sm group-hover:bg-primary-dark transition-all"></div>
                                        </div>
                                        <span className="text-xs text-slate-500 font-medium">{stat.name}</span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex items-center justify-center w-full h-full text-sm text-slate-400">
                                No hay datos suficientes
                            </div>
                        )}
                    </div>
                </div>

                {/* RECENT SALES */}
                <div className="lg:col-span-1 bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex flex-col gap-1 mb-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ventas Recientes</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Últimas transacciones</p>
                    </div>
                    <div className="flex flex-col gap-5">
                        {isLoading ? (
                            <p className="text-sm text-slate-400">Cargando...</p>
                        ) : stats?.recentSales?.length === 0 ? (
                            <p className="text-sm text-slate-400">No hay ventas recientes.</p>
                        ) : (
                            stats?.recentSales.map((sale) => (
                                <div key={sale.id} className="flex flex-col gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0 last:pb-0">
                                    <div className="flex justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <ShoppingBag className="w-4 h-4 text-primary" />
                                            <span className="font-medium text-slate-700 dark:text-slate-200">
                                                {sale.customer?.name || "Cliente General"}
                                            </span>
                                        </div>
                                        <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(Number(sale.total))}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-400 pl-6">
                                        <span>{formatDistanceToNow(new Date(sale.created_at), { addSuffix: true, locale: es })}</span>
                                        <span className={`px-1.5 rounded ${sale.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {translateStatus(sale.status)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* BOTTOM ROW: OPERATIONAL METRICS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* INVENTORY ALERTS */}
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="text-red-500 h-5 w-5" />
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Alertas de Inventario</h3>
                        </div>
                        <button className="text-primary hover:text-primary-dark text-sm font-medium">Ver todo</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-700">
                                    <th className="py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Producto</th>
                                    <th className="py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Stock</th>
                                    <th className="py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                                    <th className="py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4} className="py-4 text-center text-sm text-slate-500">Cargando alertas...</td>
                                    </tr>
                                ) : !stats?.lowStockItems || stats.lowStockItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-4 text-center text-sm text-slate-500">Todo en orden, inventario saludable.</td>
                                    </tr>
                                ) : (
                                    stats.lowStockItems.map((item: any) => (
                                        <tr key={item.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="py-3 font-medium text-slate-700 dark:text-slate-200">
                                                {item.product?.name || "Producto sin nombre"}
                                            </td>
                                            <td className="py-3 text-right font-mono text-slate-600 dark:text-slate-300">
                                                {item.stock_level}
                                            </td>
                                            <td className="py-3 text-center">
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${item.stock_level === 0
                                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                    : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                                    }`}>
                                                    {item.stock_level === 0 ? "Agotado" : "Bajo"}
                                                </span>
                                            </td>
                                            <td className="py-3 text-right">
                                                <button
                                                    onClick={() => navigate("/inventario")}
                                                    className="text-primary hover:underline text-xs font-bold"
                                                >
                                                    Reponer
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* CUSTOMER STATS */}
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Salud de Clientes</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Nuevos vs Recurrentes</p>
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg">
                            <PieChart className="text-slate-500 h-5 w-5" />
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-8 justify-center py-4">
                        {/* Donut Chart representation with CSS Conic Gradient */}
                        <div className="relative size-32 rounded-full flex items-center justify-center shadow-inner" style={{ background: `conic-gradient(#137fec 0% ${stats?.customerStats?.retentionRate || 0}%, #cbd5e1 ${stats?.customerStats?.retentionRate || 0}% 100%)` }}>
                            <div className="size-24 bg-surface-light dark:bg-surface-dark rounded-full flex flex-col items-center justify-center z-10">
                                <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.customerStats?.retentionRate || 0}%</span>
                                <span className="text-[10px] text-slate-500 uppercase font-bold">Lealtad</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4 flex-1 w-full">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="size-3 bg-primary rounded-full"></div>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Recurrentes</span>
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white">{stats?.customerStats?.recurringCustomers || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="size-3 bg-slate-300 dark:bg-slate-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Nuevos (Mes)</span>
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white">{stats?.customerStats?.newCustomers || 0}</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-center text-slate-400 mt-2">
                        <span className="font-medium text-green-600 dark:text-green-400">{stats?.customerStats?.retentionRate || 0}%</span> tasa de retención.
                    </p>
                </div>
            </div>

            {/* Decorative Gradients to soften the look (very subtle) */}
            <div className="fixed top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none"></div>
            <div className="fixed bottom-0 left-0 -z-10 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none"></div>
        </div>
    );
}
