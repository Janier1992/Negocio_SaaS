import React from "react";
import { Bell, CheckCheck, Inbox, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";

export const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAllRead, markRead, removeNotification, clearNotifications } = useNotifications();
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificaciones" data-testid="notification-bell">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={markAllRead} data-testid="notifications-mark-all">
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar leídas
            </Button>
            <Button variant="ghost" size="sm" className="gap-1" onClick={clearNotifications} data-testid="notifications-clear-all">
              <Trash2 className="h-3.5 w-3.5" />
              Limpiar
            </Button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            No hay notificaciones
          </div>
        ) : (
          notifications.slice(0, 10).map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex items-start gap-2 cursor-pointer"
              data-testid="notification-item"
              data-read={n.read ? "true" : "false"}
              onClick={() => {
                const tipo = n.type === "stock_critico" || n.type === "stock_bajo" ? n.type : undefined;
                const params = new URLSearchParams();
                if (tipo) params.set("tipo", tipo);
                params.set("estado", "activas");
                params.set("source", "bell");
                navigate(`/alertas?${params.toString()}`);
                markRead(n.id);
              }}
            >
              {n.type === "stock_critico" ? (
                <Badge variant="destructive">Crítico</Badge>
              ) : n.type === "stock_bajo" ? (
                <Badge className="bg-warning text-warning-foreground">Bajo</Badge>
              ) : (
                <Badge variant="secondary">Info</Badge>
              )}
              <div className="flex-1 text-sm">
                <p className="leading-tight">{n.message}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!n.read && (
                  <Button variant="ghost" size="sm" className="p-1 h-6" onClick={(e) => { e.stopPropagation(); markRead(n.id); }} title="Marcar como leída" data-testid="notification-mark-read">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="p-1 h-6" onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }} title="Eliminar" data-testid="notification-delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};