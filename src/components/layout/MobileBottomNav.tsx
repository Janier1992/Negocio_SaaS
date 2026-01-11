
import { useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    ShoppingCart,
    Layers,
    Receipt,
    Package,
    Truck,
    Users,
    AlertTriangle,
    Settings,
    Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function MobileBottomNav() {
    const location = useLocation();
    const navigate = useNavigate();

    const mainNavItems = [
        { title: "Inicio", url: "/dashboard", icon: LayoutDashboard },
        { title: "Productos", url: "/productos", icon: Package },
        { title: "Ventas", url: "/ventas", icon: ShoppingCart },
        { title: "Gastos", url: "/gastos", icon: Receipt },
    ];

    const moreNavItems = [
        { title: "Inventario", url: "/inventario", icon: Layers },
        { title: "Proveedores", url: "/proveedores", icon: Truck },
        { title: "Clientes", url: "/clientes", icon: Users },
        { title: "Alertas IA", url: "/alertas", icon: AlertTriangle },
        { title: "Configuración", url: "/configuracion", icon: Settings },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-safe md:hidden block h-16">
            <div className="flex items-center justify-around h-full px-1">
                {mainNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.url;

                    return (
                        <button
                            key={item.url}
                            onClick={() => navigate(item.url)}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full gap-1 p-1 transition-colors",
                                isActive
                                    ? "text-primary font-medium"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className={cn("h-5 w-5", isActive && "fill-current/10")} />
                            <span className="text-[10px] sm:text-xs truncate max-w-[64px]">
                                {item.title}
                            </span>
                        </button>
                    );
                })}

                {/* More Menu Trigger */}
                <Sheet>
                    <SheetTrigger asChild>
                        <button
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full gap-1 p-1 transition-colors text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div className="bg-primary/10 p-1 rounded-full">
                                <Plus className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-[10px] sm:text-xs font-medium text-primary">Más</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="rounded-t-[20px] pb-8">
                        <SheetHeader className="mb-4">
                            <SheetTitle className="text-center">Menú Principal</SheetTitle>
                        </SheetHeader>
                        <div className="grid grid-cols-3 gap-4">
                            {moreNavItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <SheetTrigger key={item.url} asChild>
                                        <Button
                                            variant="ghost"
                                            className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-muted/50"
                                            onClick={() => navigate(item.url)}
                                        >
                                            <div className="p-3 bg-secondary rounded-full">
                                                <Icon className="h-6 w-6 text-foreground" />
                                            </div>
                                            <span className="text-xs font-medium">{item.title}</span>
                                        </Button>
                                    </SheetTrigger>
                                );
                            })}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    );
}
