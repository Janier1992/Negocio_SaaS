
import { useState } from "react";
import { CustomerDialog } from "@/components/customers/CustomerDialog";
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
    UserPlus,
    Users,
    MapPin,
    TrendingUp,
    MoreHorizontal,
    Mail,
    Phone,
    Activity
} from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useCustomerStats } from "@/hooks/useCustomerStats";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageContainer } from "@/components/layout/PageContainer";
import * as XLSX from "xlsx";

export default function Customers() {
    const queryClient = useQueryClient();
    const [editingCustomer, setEditingCustomer] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const { empresaId } = useUserProfile();

    const { data: customers = [], isLoading } = useQuery({
        queryKey: ["customers_list", empresaId],
        queryFn: async () => {
            if (!empresaId) return [];
            const { data, error } = await supabase
                .from("customers")
                .select("*")
                .eq("business_id", empresaId)
                .order("full_name");
            if (error) throw error;
            return data;
        },
        enabled: !!empresaId
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("customers").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Cliente eliminado");
            queryClient.invalidateQueries({ queryKey: ["customers_list"] });
        },
        onError: (err: any) => {
            toast.error("Error al eliminar: " + err.message);
        }
    });

    const handleExport = () => {
        const dataToExport = customers.map((c: any) => ({
            Nombre: c.full_name,
            Email: c.email || "N/A",
            Telefono: c.phone || "N/A",
            Direccion: c.address || "N/A",
            Creado: new Date(c.created_at).toLocaleDateString(),
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Clientes");
        XLSX.writeFile(wb, "clientes_export.xlsx");
    };

    const filteredCustomers = customers.filter((c: any) =>
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Stats Logic (Mocked active/new status)
    // Stats Logic (Real)
    const { data: stats, isLoading: statsLoading } = useCustomerStats();

    // Fallbacks while loading or if error
    const totalCustomers = stats?.totalCustomers || 0;
    const newCustomers = stats?.newCustomers || 0;
    const activeCustomers = stats?.activeCustomers || 0;
    const retentionRate = totalCustomers > 0 ? Math.round((activeCustomers / totalCustomers) * 100) : 0;

    return (
        <PageContainer
            title="Clientes"
            description="Base de datos de clientes y relaciones comerciales."
            actions={
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleExport} className="gap-2 border-[#e7edf3] dark:border-[#2a3b4d] hover:bg-gray-50 dark:hover:bg-[#1a2632]">
                        <Download className="size-4" /> Exportar CSV
                    </Button>
                    <CustomerDialog
                        onCustomerAdded={() => queryClient.invalidateQueries({ queryKey: ["customers_list"] })}
                        editingCustomer={editingCustomer}
                        onClose={() => setEditingCustomer(null)}
                        trigger={
                            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
                                <UserPlus className="size-4" /> Nuevo Cliente
                            </Button>
                        }
                    />
                </div>
            }
        >

            {/* --- STATS CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total */}
                <div className="bg-white dark:bg-[#1a2632] p-6 rounded-2xl border border-[#e7edf3] dark:border-[#2a3b4d] shadow-sm flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Users className="size-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-[#4c739a] dark:text-[#8babc8]">Total Clientes</p>
                        <h3 className="text-2xl font-bold text-[#0d141b] dark:text-white">{totalCustomers}</h3>
                    </div>
                </div>

                {/* Nuevos */}
                <div className="bg-white dark:bg-[#1a2632] p-6 rounded-2xl border border-[#e7edf3] dark:border-[#2a3b4d] shadow-sm flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                        <UserPlus className="size-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-[#4c739a] dark:text-[#8babc8]">Nuevos este mes</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-2xl font-bold text-[#0d141b] dark:text-white">{statsLoading ? "..." : newCustomers}</h3>
                            <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">High Growth</span>
                        </div>
                    </div>
                </div>

                {/* Activos */}
                <div className="bg-white dark:bg-[#1a2632] p-6 rounded-2xl border border-[#e7edf3] dark:border-[#2a3b4d] shadow-sm flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                        <Activity className="size-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-[#4c739a] dark:text-[#8babc8]">Clientes Activos</p>
                        <h3 className="text-2xl font-bold text-[#0d141b] dark:text-white">{statsLoading ? "..." : activeCustomers}</h3>
                    </div>
                </div>

                {/* Retención */}
                <div className="bg-white dark:bg-[#1a2632] p-6 rounded-2xl border border-[#e7edf3] dark:border-[#2a3b4d] shadow-sm flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                        <TrendingUp className="size-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-[#4c739a] dark:text-[#8babc8]">Tasa de Retención</p>
                        <h3 className="text-2xl font-bold text-[#0d141b] dark:text-white">{statsLoading ? "..." : retentionRate}%</h3>
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
                            placeholder="Buscar cliente..."
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
                                <TableHead className="py-4 font-semibold text-[#4c739a] uppercase text-xs tracking-wider">Cliente</TableHead>
                                <TableHead className="py-4 font-semibold text-[#4c739a] uppercase text-xs tracking-wider">Contacto</TableHead>
                                <TableHead className="py-4 font-semibold text-[#4c739a] uppercase text-xs tracking-wider">Ubicación</TableHead>
                                <TableHead className="py-4 font-semibold text-[#4c739a] uppercase text-xs tracking-wider text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={4} className="h-32 text-center text-[#4c739a]">Cargando clientes...</TableCell></TableRow>
                            ) : filteredCustomers.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="h-32 text-center text-[#4c739a]">No se encontraron clientes</TableCell></TableRow>
                            ) : (
                                filteredCustomers.map((c: any, i: number) => (
                                    <TableRow key={c.id} className="border-b-[#e7edf3] dark:border-b-[#2a3b4d] hover:bg-gray-50 dark:hover:bg-[#23303e]/30 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className={`size-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${['bg-indigo-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500'][i % 4]}`}>
                                                    {c.full_name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[#0d141b] dark:text-white text-sm">{c.full_name}</p>
                                                    <p className="text-xs text-[#4c739a]">Registrado: Hoy</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                {c.email && (
                                                    <div className="flex items-center gap-2 text-xs text-[#0d141b] dark:text-white bg-gray-100 dark:bg-[#23303e] px-2 py-1 rounded-md w-fit">
                                                        <Mail className="size-3 text-[#4c739a]" /> {c.email}
                                                    </div>
                                                )}
                                                {c.phone && (
                                                    <div className="flex items-center gap-2 text-xs text-[#0d141b] dark:text-white bg-gray-100 dark:bg-[#23303e] px-2 py-1 rounded-md w-fit">
                                                        <Phone className="size-3 text-[#4c739a]" /> {c.phone}
                                                    </div>
                                                )}
                                                {!c.email && !c.phone && <span className="text-xs text-gray-400">-</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-[#4c739a]">
                                                <MapPin className="size-4 opacity-50" />
                                                {c.address ? <span className="truncate max-w-[200px]">{c.address}</span> : <span className="opacity-50">Sin dirección</span>}
                                            </div>
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
                                                    <DropdownMenuItem onClick={() => setEditingCustomer(c)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => {
                                                        if (confirm("¿Seguro que deseas eliminar el cliente?")) deleteMutation.mutate(c.id);
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
                {/* Pagination removed until implemented */}
            </div>
        </PageContainer>
    );
}
