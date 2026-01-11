
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
import { Search, Edit, Trash2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Product } from "@/hooks/useProducts";

interface InventoryTableProps {
    productos: Product[];
    onEdit: (producto: Product) => void;
    onDelete: (id: string) => void;
    onBulkDelete?: (ids: string[]) => void;
    isLoading: boolean;
}

export function InventoryTable({ productos, onEdit, onDelete, onBulkDelete, isLoading }: InventoryTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Column filters
    const [nameFilter, setNameFilter] = useState("");
    const [codeFilter, setCodeFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");

    // Toggle selection
    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredProducts.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredProducts.map(p => p.id)));
        }
    };

    const handleBulkDelete = () => {
        if (onBulkDelete && selectedIds.size > 0) {
            if (confirm(`¿Estás seguro de eliminar ${selectedIds.size} productos?`)) {
                onBulkDelete(Array.from(selectedIds));
                setSelectedIds(new Set()); // Clear selection
            }
        }
    };

    const filteredProducts = productos.filter((p) => {
        const matchesGlobal =
            p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.codigo?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesName = p.nombre.toLowerCase().includes(nameFilter.toLowerCase());
        const matchesCode = (p.codigo || "").toLowerCase().includes(codeFilter.toLowerCase());
        const matchesCategory = (p.categoria_id || "").toLowerCase().includes(categoryFilter.toLowerCase()) || // ID check
            ((p as any).categorias?.nombre || "").toLowerCase().includes(categoryFilter.toLowerCase()); // Name check

        return matchesGlobal && matchesName && matchesCode && matchesCategory;
    });

    if (isLoading) {
        return <div className="p-8 text-center">Cargando inventario...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Búsqueda global..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                    />
                </div>
                {selectedIds.size > 0 && (
                    <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar ({selectedIds.size})
                    </Button>
                )}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40px]">
                                <input
                                    type="checkbox"
                                    checked={filteredProducts.length > 0 && selectedIds.size === filteredProducts.length}
                                    onChange={toggleSelectAll}
                                    className="translate-y-[2px]"
                                />
                            </TableHead>
                            <TableHead>
                                <div className="space-y-1">
                                    <span>Código</span>
                                    <Input
                                        placeholder="Filtrar..."
                                        value={codeFilter}
                                        onChange={e => setCodeFilter(e.target.value)}
                                        className="h-7 text-xs"
                                    />
                                </div>
                            </TableHead>
                            <TableHead>
                                <div className="space-y-1">
                                    <span>Producto</span>
                                    <Input
                                        placeholder="Filtrar nombre..."
                                        value={nameFilter}
                                        onChange={e => setNameFilter(e.target.value)}
                                        className="h-7 text-xs"
                                    />
                                </div>
                            </TableHead>
                            <TableHead>
                                <div className="space-y-1">
                                    <span>Categoría</span>
                                    <Input
                                        placeholder="Filtrar cat..."
                                        value={categoryFilter}
                                        onChange={e => setCategoryFilter(e.target.value)}
                                        className="h-7 text-xs"
                                    />
                                </div>
                            </TableHead>
                            <TableHead className="text-right">Precio</TableHead>
                            <TableHead className="text-center">Stock</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                    No se encontraron productos
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProducts.map((producto) => (
                                <TableRow key={producto.id} data-state={selectedIds.has(producto.id) ? "selected" : undefined}>
                                    <TableCell>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(producto.id)}
                                            onChange={() => toggleSelect(producto.id)}
                                            className="translate-y-[2px]"
                                        />
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">{producto.codigo || "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                {(producto as any).image_url ? (
                                                    <img src={(producto as any).image_url} alt={producto.nombre} className="h-full w-full object-cover" />
                                                ) : (
                                                    <Edit className="h-4 w-4 text-slate-300" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium">{producto.nombre}</div>
                                                {producto.descripcion && (
                                                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                        {producto.descripcion}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {(producto as any).categorias?.nombre || "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        ${producto.precio.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className={producto.stock <= producto.stock_minimo ? "text-destructive font-bold" : ""}>
                                                {producto.stock}
                                            </span>
                                            {producto.stock <= producto.stock_minimo && (
                                                <AlertTriangle className="h-4 w-4 text-destructive" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEdit(producto)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => {
                                                    if (confirm("¿Eliminar este producto?")) onDelete(producto.id);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile View (Cards) */}
            <div className="md:hidden grid grid-cols-2 gap-2">
                {filteredProducts.length === 0 ? (
                    <div className="col-span-2 text-center p-8 text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed">
                        No se encontraron productos
                    </div>
                ) : (
                    filteredProducts.map((producto) => (
                        <div key={producto.id} className="bg-white dark:bg-card p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col relative overflow-hidden group">
                            {/* Selection Checkbox */}
                            <div className="absolute top-2 left-2 z-10">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.has(producto.id)}
                                    onChange={() => toggleSelect(producto.id)}
                                    className="h-4 w-4 accent-primary"
                                />
                            </div>

                            {/* Actions Overlay (Visible on tap/hover) */}
                            <div className="absolute top-2 right-2 z-10 flex gap-1">
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-6 w-6 rounded-full bg-white/90 shadow-sm"
                                    onClick={() => onEdit(producto)}
                                >
                                    <Edit className="h-3 w-3 text-slate-700" />
                                </Button>
                            </div>

                            {/* Image */}
                            <div className="w-full aspect-square mb-2 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                                {(producto as any).image_url ? (
                                    <img src={(producto as any).image_url} alt={producto.nombre} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center">
                                        <Edit className="h-6 w-6 text-slate-300" />
                                    </div>
                                )}
                                {/* Stock Badge */}
                                <div className={`absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm ${producto.stock <= producto.stock_minimo
                                        ? "bg-red-500 text-white"
                                        : "bg-white/90 text-slate-800"
                                    }`}>
                                    {producto.stock} und
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-0.5 truncate">
                                    {producto.codigo || "S/C"}
                                </span>
                                <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate leading-tight mb-1">
                                    {producto.nombre}
                                </h4>

                                <div className="mt-auto pt-1 flex items-end justify-between border-t border-slate-50 dark:border-slate-800/50">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-muted-foreground truncate max-w-[60px]">
                                            {(producto as any).categorias?.nombre || "-"}
                                        </span>
                                    </div>
                                    <span className="text-sm font-bold text-primary">
                                        ${producto.precio.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
