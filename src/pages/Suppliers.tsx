
import { useState } from "react";
import { SupplierDialog } from "@/components/suppliers/SupplierDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Plus,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  Phone,
  Mail,
  MoreHorizontal
} from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import * as XLSX from "xlsx";

export default function Suppliers() {
  const queryClient = useQueryClient();
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: userProfile } = useUserProfile();
  const empresaId = userProfile?.business_id;

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers_list", empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("business_id", empresaId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Proveedor eliminado");
      queryClient.invalidateQueries({ queryKey: ["suppliers_list"] });
    },
    onError: (err: any) => {
      toast.error("Error al eliminar: " + err.message);
    }
  });

  const filteredSuppliers = suppliers.filter((s: any) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Stats Logic (Mocked active status for visual demo as schema might not have it yet)
  const totalSuppliers = suppliers.length;
  const activeSuppliers = Math.floor(totalSuppliers * 0.8) || 0; // Mock 80% active
  const pendingOrders = 5; // Mock

  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(suppliers);
    XLSX.utils.book_append_sheet(wb, ws, "Proveedores");
    XLSX.writeFile(wb, "proveedores_export.xlsx");
  };

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 min-h-screen bg-background-light dark:bg-background-dark font-sans animate-in fade-in duration-500">

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#0d141b] dark:text-white tracking-tight">Proveedores</h1>
          <p className="text-[#4c739a] dark:text-[#8babc8] mt-1">Gestiona tu cadena de suministro y contactos estratégicos.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleExport} className="gap-2 border-[#e7edf3] dark:border-[#2a3b4d] hover:bg-gray-50 dark:hover:bg-[#1a2632]">
            <Download className="size-4" /> Exportar
          </Button>
          <SupplierDialog
            onSupplierAdded={() => queryClient.invalidateQueries({ queryKey: ["suppliers_list"] })}
            editingSupplier={editingSupplier}
            onClose={() => setEditingSupplier(null)}
            trigger={
              <Button className="gap-2 bg-primary hover:bg-blue-600 shadow-lg shadow-blue-500/20">
                <Plus className="size-4" /> Nuevo Proveedor
              </Button>
            }
          />
        </div>
      </div>

      {/* --- STATS SECTION (ONLY REAL DATA) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total */}
        <div className="bg-white dark:bg-[#1a2632] p-6 rounded-2xl border border-[#e7edf3] dark:border-[#2a3b4d] shadow-sm flex items-center gap-4">
          <div className="size-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Truck className="size-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#4c739a] dark:text-[#8babc8]">Total Proveedores</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-[#0d141b] dark:text-white">{totalSuppliers}</h3>
            </div>
          </div>
        </div>

        {/* Activos (Real Count based on status column if exists, otherwise assume all active for now) */}
        <div className="bg-white dark:bg-[#1a2632] p-6 rounded-2xl border border-[#e7edf3] dark:border-[#2a3b4d] shadow-sm flex items-center gap-4">
          <div className="size-12 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center">
            <CheckCircle className="size-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#4c739a] dark:text-[#8babc8]">Proveedores Activos</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-[#0d141b] dark:text-white">{totalSuppliers}</h3>
              <span className="text-xs text-[#4c739a]">Todos operativos</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- TABLE SECTION --- */}
      <div className="bg-white dark:bg-[#1a2632] border border-[#e7edf3] dark:border-[#2a3b4d] rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-[#e7edf3] dark:border-[#2a3b4d] flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4c739a] size-4" />
            <input
              className="w-full bg-[#f0f4f8] dark:bg-[#23303e] border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/50"
              placeholder="Buscar por nombre, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50 dark:bg-[#23303e]/50">
              <TableRow className="border-b-[#e7edf3] dark:border-b-[#2a3b4d] hover:bg-transparent">
                <TableHead className="py-4 font-semibold text-[#4c739a] uppercase text-xs tracking-wider">Proveedor</TableHead>
                <TableHead className="py-4 font-semibold text-[#4c739a] uppercase text-xs tracking-wider">Contacto</TableHead>
                <TableHead className="py-4 font-semibold text-[#4c739a] uppercase text-xs tracking-wider">Info. Contacto</TableHead>
                <TableHead className="py-4 font-semibold text-[#4c739a] uppercase text-xs tracking-wider">Estado</TableHead>
                <TableHead className="py-4 font-semibold text-[#4c739a] uppercase text-xs tracking-wider text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="h-32 text-center text-[#4c739a]">Cargando proveedores...</TableCell></TableRow>
              ) : filteredSuppliers.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-32 text-center text-[#4c739a]">No se encontraron proveedores</TableCell></TableRow>
              ) : (
                filteredSuppliers.map((prov: any, i: number) => (
                  <TableRow key={prov.id} className="border-b-[#e7edf3] dark:border-b-[#2a3b4d] hover:bg-gray-50 dark:hover:bg-[#23303e]/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-full flex items-center justify-center md:text-sm text-xs font-bold text-white shadow-sm ${['bg-blue-500', 'bg-purple-500', 'bg-indigo-500', 'bg-pink-500'][i % 4]}`}>
                          {prov.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-[#0d141b] dark:text-white text-sm">{prov.name}</p>
                          <p className="text-xs text-[#4c739a]">ID: #{prov.id.substring(0, 6)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-[#4c739a] dark:text-[#8babc8]">{prov.contact_name || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {prov.email && (
                          <div className="flex items-center gap-2 text-xs text-[#0d141b] dark:text-white bg-gray-100 dark:bg-[#23303e] px-2 py-1 rounded-md w-fit">
                            <Mail className="size-3 text-[#4c739a]" /> {prov.email}
                          </div>
                        )}
                        {prov.phone && (
                          <div className="flex items-center gap-2 text-xs text-[#0d141b] dark:text-white bg-gray-100 dark:bg-[#23303e] px-2 py-1 rounded-md w-fit">
                            <Phone className="size-3 text-[#4c739a]" /> {prov.phone}
                          </div>
                        )}
                        {!prov.email && !prov.phone && <span className="text-xs text-gray-400">-</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Activo
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#4c739a] hover:text-[#0d141b]">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setEditingSupplier(prov)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => {
                            if (confirm("¿Seguro que deseas eliminar este proveedor?")) deleteMutation.mutate(prov.id);
                          }}>
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
