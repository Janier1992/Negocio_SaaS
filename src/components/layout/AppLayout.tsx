
import { Outlet, useNavigate } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Search, Bell, HelpCircle, LogOut, Menu } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

import { MobileBottomNav } from "./MobileBottomNav";
import { InstallPrompt } from "./InstallPrompt";
import { NotificationsBell } from "./NotificationsBell";
import { UserNav } from "./UserNav";

export const AppLayout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error al cerrar sesión");
    } else {
      toast.success("Sesión cerrada exitosamente");
      navigate("/auth", { replace: true });
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background-light dark:bg-background-dark text-text-main dark:text-gray-100 font-sans transition-colors duration-200 supports-[min-height:100dvh]:min-h-[100dvh]">
        <AppSidebar />
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* TOP NAVBAR */}
          <header className="h-14 md:h-16 bg-surface-light dark:bg-surface-dark/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-6 z-10 sticky top-0">
            <div className="flex items-center gap-4">
              {/* <SidebarTrigger className="md:hidden" />  <-- Hidden in favor of Bottom Nav */}
              <SidebarTrigger className="hidden md:flex" />

              {/* Search */}
              <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg h-9 px-3 w-64 focus-within:ring-2 ring-primary/20 transition-all">
                <Search className="text-slate-400 h-5 w-5" />
                <input
                  className="bg-transparent border-none outline-none text-sm ml-2 w-full text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:ring-0"
                  placeholder="Buscar productos, clientes..."
                  type="text"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <NotificationsBell />

              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

              <UserNav />
            </div>
          </header>

          {/* MAIN CONTENT */}
          <main className="flex-1 overflow-y-auto p-2 md:p-8 space-y-8 pb-24 md:pb-8">
            <Outlet />
          </main>

          {/* MOBILE BOTTOM NAV */}
          <MobileBottomNav />

          <InstallPrompt />
        </div>
      </div>
    </SidebarProvider>
  );
};
