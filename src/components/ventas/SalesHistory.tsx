
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Download, Search, Receipt } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { MoreHorizontal, Eye } from "lucide-react";

interface Sale {
    id: string;
    created_at: string;
    total: number;
    payment_method: string;
    status: string;
    client_id: string;
    customer?: {
        full_name: string;
        doc_number: string;
    };
    items?: any[];
}

export function SalesHistory() {
    const { empresaId } = useUserProfile();
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateStart, setDateStart] = useState("");
    const [dateEnd, setDateEnd] = useState("");
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const fetchSales = async () => {
        if (!empresaId) return;
        setLoading(true);
        try {
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
                .eq("business_id", empresaId)
                .order("created_at", { ascending: false });

            if (dateStart) query = query.gte("created_at", `${dateStart}T00:00:00`);
            if (dateEnd) query = query.lte("created_at", `${dateEnd}T23:59:59`);

            const { data, error } = await query;

            if (error) throw error;
            setSales(data || []);
        } catch (error: any) {
            console.error("Error fetching sales:", error);
            toast.error("Error al cargar historial de ventas.");
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
            Documento: sale.customer?.doc_number || "N/A",
            "Método de Pago": sale.payment_method,
            Total: sale.total,
            Estado: sale.status === 'completed' ? 'Completado' : sale.status,
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
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Cargando historial...
                                </TableCell>
                            </TableRow>
                        ) : filteredSales.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <Receipt className="h-8 w-8 text-muted-foreground/50" />
                                        <p>No se encontraron ventas en este periodo.</p>
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
                                        <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'} className={sale.status === 'completed' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200' : ''}>
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
                            Venta realizada el {selectedSale && format(new Date(selectedSale.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-semibold text-muted-foreground">Cliente:</span>
                                <p className="font-medium">{selectedSale?.customer?.full_name || "Cliente General"}</p>
                            </div>
                            <div className="text-right">
                                <span className="font-semibold text-muted-foreground">ID Venta:</span>
                                <p className="font-mono text-xs text-slate-500">{selectedSale?.id}</p>
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
        </div>
    );
}
