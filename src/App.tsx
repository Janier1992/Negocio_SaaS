import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Productos from "./pages/Productos";
import Inventario from "./pages/Inventario";
import Ventas from "./pages/Ventas";
import Suppliers from "./pages/Suppliers";
import Customers from "./pages/Customers";
import Compras from "./pages/Compras";
import Alertas from "./pages/Alertas";
import Configuracion from "./pages/Configuracion";
import Auth from "./pages/Auth";
import Expenses from "./pages/Expenses";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/" element={<Productos />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/productos" element={<Productos />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/ventas" element={<Ventas />} />
            <Route path="/alertas" element={<Alertas />} />
            <Route path="/proveedores" element={<Suppliers />} />
            <Route path="/clientes" element={<Customers />} />
            <Route path="/gastos" element={<Expenses />} />
            <Route path="/compras" element={<Compras />} />
            <Route path="/configuracion" element={<Configuracion />} />
            <Route path="/perfil" element={<Profile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
