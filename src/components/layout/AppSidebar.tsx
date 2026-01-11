import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, AlertTriangle, Users, Settings, Layers, Truck, Receipt } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Inicio", url: "/", icon: LayoutDashboard },
  { title: "Productos", url: "/productos", icon: Package },
  { title: "Ventas", url: "/ventas", icon: ShoppingCart },
  { title: "Inventario", url: "/inventario", icon: Layers },
  { title: "Proveedores", url: "/proveedores", icon: Truck },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Gastos", url: "/gastos", icon: Receipt },
  { title: "Alertas IA", url: "/alertas", icon: AlertTriangle },
  { title: "Configuración", url: "/configuracion", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="w-64">
      <SidebarContent>
        <div className="p-4">
          <h2 className="text-lg font-bold text-sidebar-foreground mb-6">ERP Fácil</h2>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.url;
                const classes = isActive
                  ? "bg-sidebar-accent text-sidebar-primary font-medium"
                  : "hover:bg-sidebar-accent/50";
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild className={classes}>
                      <NavLink to={item.url}>
                        <Icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
