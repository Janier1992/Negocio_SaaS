import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  AlertTriangle,
  Settings,
  Users,
  UserCircle,
  Wallet,
  MoreHorizontal,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { useUserProfile } from "@/hooks/useUserProfile";

type MenuItem = { title: string; url: string; icon: any };

// Menú inferior: 5 módulos principales para móvil
const primaryMenuItems: MenuItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Inventario", url: "/inventario", icon: Package },
  { title: "Ventas", url: "/ventas", icon: ShoppingCart },
  { title: "Alertas", url: "/alertas", icon: AlertTriangle },
  { title: "Configuración", url: "/configuracion", icon: Settings },
];

// Catálogo completo para el menú de desborde
const allMenuItems: MenuItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Inventario", url: "/inventario", icon: Package },
  { title: "Ventas", url: "/ventas", icon: ShoppingCart },
  { title: "Alertas", url: "/alertas", icon: AlertTriangle },
  { title: "Proveedores", url: "/proveedores", icon: Users },
  { title: "Clientes", url: "/clientes", icon: UserCircle },
  { title: "Finanzas", url: "/finanzas", icon: Wallet },
  { title: "Configuración", url: "/configuracion", icon: Settings },
];

export function MobileBottomNav() {
  const { permissions } = usePermissions();
  const { profile } = useUserProfile();
  const location = useLocation();
  const isAdmin = (profile?.rol || "").toLowerCase() === "admin";
  const primaryUrls = new Set(primaryMenuItems.map((m) => m.url));

  const permitted = allMenuItems.filter((item) => {
    const required: Record<string, string | null> = {
      "/inventario": "inventario_read",
      "/ventas": "ventas_read",
      "/proveedores": "proveedores_read",
      "/clientes": "clientes_read",
      "/finanzas": "finanzas_view",
      "/configuracion": "config_view",
      "/": null,
      "/alertas": null,
    };
    const key = required[item.url] ?? null;
    if (isAdmin) return true;
    return key ? permissions.includes(key) : true;
  });

  const overflowItems = permitted.filter((item) => !primaryUrls.has(item.url));

  return (
    <nav
      aria-label="Navegación inferior móvil"
      className="fixed bottom-0 inset-x-0 bg-sidebar text-sidebar-foreground border-t border-sidebar-border z-20 md:hidden"
    >
      <ul className="flex items-center justify-between px-2 py-1 pb-[env(safe-area-inset-bottom)]">
        {primaryMenuItems.map((item) => {
            const isActive = location.pathname === item.url;
            const Icon = item.icon;
            return (
              <li key={item.title} className="flex-1">
                <NavLink
                  to={item.url}
                  aria-label={item.title}
                  className={
                    `flex flex-col items-center justify-center gap-0.5 py-2 rounded-md transition-colors duration-200 ` +
                    (isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "hover:bg-sidebar-accent/50")
                  }
                >
                  <Icon className="h-5 w-5" />
                  {/* Mantener accesibilidad sin mostrar texto visualmente */}
                  <span className="sr-only">{item.title}</span>
                </NavLink>
              </li>
            );
          })}
        {/* Menú de desborde (⋯) para módulos extra */}
        <li className="w-14 flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Más"
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 w-12 rounded-md transition-colors duration-200",
                "hover:bg-sidebar-accent/50"
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[11px] leading-none">Más</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="end"
              className={
                "p-2 bg-sidebar text-sidebar-foreground border border-sidebar-border rounded-md " +
                "data-[state=open]:animate-in data-[state=closed]:animate-out data-[side=top]:slide-in-from-bottom-2"
              }
            >
              <DropdownMenuLabel className="text-xs">Más módulos</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="grid grid-cols-3 gap-2">
                {overflowItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.title} asChild>
                      <NavLink
                        to={item.url}
                        aria-label={item.title}
                        className={
                          "flex flex-col items-center justify-center gap-0.5 p-2 rounded-md transition-colors " +
                          "hover:bg-sidebar-accent/50"
                        }
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-[11px] leading-none">{item.title}</span>
                      </NavLink>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </li>
      </ul>
    </nav>
  );
}

export default MobileBottomNav;