import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  AlertTriangle,
  Users,
  Settings,
  UserCircle,
  Wallet,
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { useUserProfile } from "@/hooks/useUserProfile";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Inventario", url: "/inventario", icon: Package },
  { title: "Ventas", url: "/ventas", icon: ShoppingCart },
  { title: "Alertas", url: "/alertas", icon: AlertTriangle },
  { title: "Proveedores", url: "/proveedores", icon: Users },
  { title: "Clientes", url: "/clientes", icon: UserCircle },
  { title: "Finanzas", url: "/finanzas", icon: Wallet },
  { title: "Configuración", url: "/configuracion", icon: Settings },
];

export function MobileRail() {
  const { permissions } = usePermissions();
  const { profile } = useUserProfile();
  const location = useLocation();
  const isAdmin = (profile?.rol || "").toLowerCase() === "admin";

  return (
    <nav
      aria-label="Navegación móvil"
      className="fixed inset-y-0 left-0 w-14 bg-sidebar text-sidebar-foreground border-r border-sidebar-border z-10 md:hidden"
    >
      <ul className="flex flex-col items-center gap-2 py-2">
        {menuItems
          .filter((item) => {
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
          })
          .map((item) => {
            const isActive = location.pathname === item.url;
            const Icon = item.icon;
            return (
              <li key={item.title} className="w-full flex justify-center">
                <NavLink
                  to={item.url}
                  aria-label={item.title}
                  className={
                    `flex items-center justify-center w-10 h-10 rounded-md transition-colors ` +
                    (isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "hover:bg-sidebar-accent/50")
                  }
                >
                  <Icon className="h-5 w-5" />
                </NavLink>
              </li>
            );
          })}
      </ul>
    </nav>
  );
}

export default MobileRail;