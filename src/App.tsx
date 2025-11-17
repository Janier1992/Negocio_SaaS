import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { lazy, Suspense } from "react";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Inventario = lazy(() => import("./pages/Inventario"));
const Ventas = lazy(() => import("./pages/Ventas"));
const Proveedores = lazy(() => import("./pages/Proveedores"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
const Alertas = lazy(() => import("./pages/Alertas"));
const Configuracion = lazy(() => import("./pages/Configuracion"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Finanzas = lazy(() => import("./pages/Finanzas"));
const InvitacionesAceptar = lazy(() => import("./pages/InvitacionesAceptar"));
import { ErrorBoundary } from "@/components/system/ErrorBoundary";
import { ThemeProvider } from "next-themes";
import { NotificationsProvider } from "@/components/notifications/NotificationsProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useEffect } from "react";
import { ensureAdminAccessForEmail } from "@/services/users";

const queryClient = new QueryClient();

const AppInner = () => {
  // Obtener empresaId para el proveedor de notificaciones
  const { empresaId, profile } = useUserProfile();

  // Garantizar acceso total para el usuario solicitado
  useEffect(() => {
    const email = profile?.email?.toLowerCase() || "";
    if (email === "jamosquera0518@gmail.com") {
      void ensureAdminAccessForEmail(email);
    }
  }, [profile?.email]);
  return (
    <TooltipProvider>
      <ErrorBoundary>
        <Sonner />
        <NotificationsProvider empresaId={empresaId}>
          <BrowserRouter
            basename={import.meta.env.BASE_URL}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <Suspense fallback={<div className="p-4 text-muted-foreground">Cargando…</div>}>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/invitaciones/aceptar" element={<InvitacionesAceptar />} />
                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/inventario" element={<Inventario />} />
                  <Route path="/ventas" element={<Ventas />} />
                  <Route path="/alertas" element={<Alertas />} />
                  <Route path="/proveedores" element={<Proveedores />} />
                  <Route path="/clientes" element={<Clientes />} />
                  <Route path="/finanzas" element={<Finanzas />} />
                  <Route path="/configuracion" element={<Configuracion />} />
                </Route>
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </NotificationsProvider>
      </ErrorBoundary>
    </TooltipProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppInner />
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
