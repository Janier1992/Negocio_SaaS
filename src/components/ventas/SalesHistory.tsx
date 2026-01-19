// --- Importaciones ---
import { useState, useEffect } from "react";
// Cliente Supabase para conexión a BD
import { supabase } from "@/integrations/supabase/client";
// Hook para obtener perfil de usuario
import { useUserProfile } from "@/hooks/useUserProfile";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Download, Search, Receipt, AlertTriangle, Trash2, Eye } from "lucide-react";
import * as XLSX from "xlsx"; // Librería para exportar Excel
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { MoreHorizontal } from "lucide-react";

// --- Interfaces de Datos ---
// Definición de la estructura de una Venta recuperada de la BD
interface Sale {
    id: string;             // Identificador único
    created_at: string;     // Fecha de creación
    total: number;          // Monto total
    payment_method: string; // Método de pago (efectivo, tarjeta...)
    status: string;         // Estado (completed, pending...)
    client_id: string;      // ID del cliente
    // Relación con Cliente (Join)
    customer?: {
        full_name: string;
        doc_number: string;
    };
    // Relación con Items (Join) [Opcional hasta que se pidan detalles]
    items?: any[];
}

export function SalesHistory() {
    // 1. Obtener contexto del usuario (Empresa y Rol)
    const { data: userProfile } = useUserProfile();
    const empresaId = userProfile?.business_id;
    // Forcing admin true for testing/dev purposes as requested by user to enable function
    // In production, uncomment the role check:
    // const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'owner';
    const isAdmin = true;

    // Debug info
    console.log("UserProfile:", userProfile);

    // --- Estados Locales ---
    const [sales, setSales] = useState<Sale[]>([]); // Lista de ventas
    const [loading, setLoading] = useState(true);   // Estado de carga
    const [searchTerm, setSearchTerm] = useState(""); // Filtro de búsqueda
    const [dateStart, setDateStart] = useState("");   // Filtro fecha inicio
    const [dateEnd, setDateEnd] = useState("");       // Filtro fecha fin
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null); // Venta seleccionada para ver detalles
    const [detailsOpen, setDetailsOpen] = useState(false); // Modal de detalles abierto/cerrado

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false); // Modal de confirmación de borrado
    const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null); // Venta a eliminar
    const [isDeleting, setIsDeleting] = useState(false); // Estado "eliminando..."

    // --- Función para Cargar Ventas ---
    const fetchSales = async () => {
        if (!empresaId) return;
        setLoading(true);
        try {
            // Consulta: Selecciona ventas de la tabla 'sales'
            // JOINs: 
            // 1. customer: Trae nombre y documento del cliente.
            // 2. items: Trae items de la venta.
            //    -> variant: Trae variante del producto
            //       -> product: Trae nombre base del producto
            let query = supabase
                .from("sales")
                .select(`
                    *,
                    customer:customers(full_name, doc_number),
                    items:sale_items(
                        quantity,
                        unit_price,
                        subtotal,
                        variant:product_variants(
                            product:products(name)
                        )
                    )
                `)
                .eq("business_id", empresaId) // Filtrar por empresa actual
                .order("created_at", { ascending: false }); // Ordenar por fecha (más reciente primero)

            // Aplicar filtros de fecha si existen
            if (dateStart) query = query.gte("created_at", `${dateStart}T00:00:00`);
            if (dateEnd) query = query.lte("created_at", `${dateEnd}T23:59:59`);

            const { data, error } = await query;

            if (error) throw error;
            setSales(data || []);
        } catch (error: any) {
            console.error("Error fetching sales:", error);
            toast.error("Error al cargar historial: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();
    }, [empresaId, dateStart, dateEnd]);

    const filteredSales = sales.filter((sale) =>
        sale.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const exportToExcel = () => {
        const dataToExport = filteredSales.map((sale) => ({
            Fecha: format(new Date(sale.created_at), "dd/MM/yyyy HH:mm"),
            Cliente: sale.customer?.full_name || "Cliente General",
            "Método de Pago": sale.payment_method,
            Total: sale.total,
            Estado: sale.status,
            ID_Venta: sale.id
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Ventas");
        XLSX.writeFile(wb, `Reporte_Ventas_${format(new Date(), "yyyyMMdd")}.xlsx`);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
        }).format(value);
    };

    // Confirmar y Ejecutar Reversión de Venta
    const handleDeleteSale = async () => {
        if (!saleToDelete) return;
        setIsDeleting(true);
        try {
            // Llamada a función RPC (Remote Procedure Call) en el servidor.
            // Esta función "revert_sale" se encarga de:
            // 1. Devolver stock.
            // 2. Borrar venta.
            // 3. Borrar cliente huérfano (si aplica).
            const { error } = await supabase.rpc('revert_sale', { p_sale_id: saleToDelete.id });

            if (error) throw error;

            toast.success("Venta revertida exitosamente. El stock ha sido restaurado.");
            fetchSales(); // Recargar lista
            setDeleteDialogOpen(false);
            setSaleToDelete(null);

        } catch (error: any) {
            console.error("Delete error:", error);
            toast.error("Error al revertir venta: " + error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-end bg-card p-4 rounded-lg border shadow-sm">
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Buscar Cliente</span>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Nombre..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 w-full md:w-[200px]"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Desde</span>
                        <Input
                            type="date"
                            value={dateStart}
                            onChange={(e) => setDateStart(e.target.value)}
                            className="w-full md:w-[150px]"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Hasta</span>
                        <Input
                            type="date"
                            value={dateEnd}
                            onChange={(e) => setDateEnd(e.target.value)}
                            className="w-full md:w-[150px]"
                        />
                    </div>
                </div>
                <Button variant="outline" onClick={exportToExcel} className="gap-2">
                    <Download className="h-4 w-4" />
                    Exportar Excel
                </Button>
            </div>

            <div className="rounded-md border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>Fecha</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Método</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Cargando historial...
                                </TableCell>
                            </TableRow>
                        ) : filteredSales.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <Receipt className="h-8 w-8 text-muted-foreground/50" />
                                        <p>No se encontraron ventas.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredSales.map((sale) => (
                                <TableRow key={sale.id} className="hover:bg-muted/50">
                                    <TableCell className="font-medium">
                                        {format(new Date(sale.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{sale.customer?.full_name || "Cliente General"}</span>
                                            {sale.customer?.doc_number && (
                                                <span className="text-xs text-muted-foreground">{sale.customer.doc_number}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {sale.payment_method}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={sale.status === 'completed' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200' : ''} variant={sale.status === 'completed' ? 'secondary' : 'default'}>
                                            {sale.status === 'completed' ? 'Completado' : sale.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-base">
                                        {formatCurrency(sale.total)}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Abrir menú</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => {
                                                    setSelectedSale(sale);
                                                    setDetailsOpen(true);
                                                }}>
                                                    <Eye className="mr-2 h-4 w-4" /> Ver Productos
                                                </DropdownMenuItem>

                                                {/* Always show for now due to isAdmin forced true */}
                                                {isAdmin && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuLabel>
                                                            Admin ({userProfile?.role || 'No Role'})
                                                        </DropdownMenuLabel>
                                                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => {
                                                            setSaleToDelete(sale);
                                                            setDeleteDialogOpen(true);
                                                        }}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar / Revertir
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Detalle de Venta</DialogTitle>
                        <DialogDescription>
                            ID: {selectedSale?.id}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-semibold text-muted-foreground">Cliente:</span>
                                <p className="font-medium">{selectedSale?.customer?.full_name || "Cliente General"}</p>
                            </div>
                            <div className="text-right">
                                <span className="font-semibold text-muted-foreground">Fecha:</span>
                                <p>
                                    {selectedSale && format(new Date(selectedSale.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>Producto</TableHead>
                                        <TableHead className="text-right">Cant.</TableHead>
                                        <TableHead className="text-right">Precio</TableHead>
                                        <TableHead className="text-right">Subtotal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedSale?.items?.map((item: any, i: number) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium">
                                                {item.variant?.product?.name || "Producto desconocido"}
                                            </TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                                            <TableCell className="text-right font-bold">
                                                {formatCurrency(item.subtotal)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-muted/50">
                                        <TableCell colSpan={3} className="text-right font-bold">Total Pagado</TableCell>
                                        <TableCell className="text-right font-bold text-lg">
                                            {selectedSale && formatCurrency(selectedSale.total)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Revertir Venta?</DialogTitle>
                        <DialogDescription>
                            Esta acción es irreversible y realizará los siguientes cambios:
                        </DialogDescription>
                        <div className="text-sm text-muted-foreground mt-2">
                            <ul className="list-disc ml-5 space-y-1">
                                <li>Devolverá el stock de todos los productos.</li>
                                <li>Eliminará el registro de la venta permanentemente.</li>
                                <li>Si el cliente no tiene otras compras, se eliminará del registro.</li>
                            </ul>
                        </div>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDeleteSale} disabled={isDeleting}>
                            {isDeleting ? "Revirtiendo..." : "Confirmar Reversión"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
