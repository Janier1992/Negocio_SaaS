
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function NotificationsBell() {
    const { empresaId } = useUserProfile();
    const navigate = useNavigate();

    const { data: alerts = [], isLoading } = useQuery({
        queryKey: ["header-notifications", empresaId],
        queryFn: async () => {
            if (!empresaId) return [];

            const { data, error } = await supabase
                .from("product_variants")
                .select(`
                    id,
                    stock_level,
                    products (
                        name
                    )
                `)
                .eq("business_id", empresaId)
                .lt("stock_level", 10) // Threshold for notification
                .order("stock_level", { ascending: true })
                .limit(5);

            if (error) {
                console.error("Error fetching low stock:", error);
                return [];
            }

            // Filter locally against min_stock if needed or trust the query
            return (data as any[]).map(item => ({
                id: item.id,
                title: "Stock Bajo",
                message: `El producto "${item.products?.name || 'Producto'}" tiene ${item.stock_level} unidades.`,
                type: "critical",
                route: "/inventario"
            }));
        },
        enabled: !!empresaId,
        // Refetch every minute
        refetchInterval: 60000
    });

    const hasAlerts = alerts.length > 0;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <Bell className="h-5 w-5" />
                    {hasAlerts && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-surface-dark animate-pulse"></span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b border-border">
                    <h4 className="font-semibold text-sm">Notificaciones</h4>
                    <p className="text-xs text-muted-foreground">Alertas de inventario y sistema</p>
                </div>
                <ScrollArea className="h-[300px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
                            Cargando...
                        </div>
                    ) : alerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                            <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
                            <p className="text-sm text-muted-foreground">No tienes notificaciones nuevas</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {alerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className="p-4 hover:bg-muted/50 transition-colors cursor-pointer flex gap-3 items-start"
                                    onClick={() => navigate(alert.route)}
                                >
                                    <div className={cn(
                                        "h-2 w-2 mt-1.5 rounded-full shrink-0",
                                        alert.type === "critical" ? "bg-red-500" : "bg-blue-500"
                                    )} />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{alert.title}</p>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {alert.message}
                                        </p>
                                        <p className="text-[10px] text-primary font-medium mt-1">Ver Inventario</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
