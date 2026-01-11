
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
            <div className="md:hidden space-y-4">
                {filteredProducts.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed">
                        No se encontraron productos
                    </div>
                ) : (
                    filteredProducts.map((producto) => (
                        <div key={producto.id} className="bg-white dark:bg-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3 relative overflow-hidden">
                            {/* Selection Checkbox Overlay */}
                            <div className="absolute top-4 right-4 z-10">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.has(producto.id)}
                                    onChange={() => toggleSelect(producto.id)}
                                    className="h-5 w-5 accent-primary"
                                />
                            </div>

                            <div className="flex gap-4">
                                {/* Image */}
                                <div className="h-20 w-20 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                    {(producto as any).image_url ? (
                                        <img src={(producto as any).image_url} alt={producto.nombre} className="h-full w-full object-cover" />
                                    ) : (
                                        <Edit className="h-8 w-8 text-slate-300" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-mono text-slate-500 mb-0.5">{producto.codigo || "S/C"}</span>
                                        <h4 className="font-bold text-slate-900 dark:text-white truncate pr-6">{producto.nombre}</h4>
                                        <p className="text-xs text-slate-500 truncate">{(producto as any).categorias?.nombre || "Sin categoría"}</p>
                                    </div>

                                    <div className="flex items-end justify-between mt-3">
                                        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-medium">
                                            <span>Stock:</span>
                                            <span className={producto.stock <= producto.stock_minimo ? "text-red-500 font-bold" : "text-slate-800 dark:text-white"}>
                                                {producto.stock}
                                            </span>
                                            {producto.stock <= producto.stock_minimo && (
                                                <AlertTriangle className="h-3 w-3 text-red-500" />
                                            )}
                                        </div>
                                        <span className="text-lg font-bold text-primary">
                                            ${producto.precio.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="grid grid-cols-2 gap-3 pt-3 mt-1 border-t border-slate-100 dark:border-slate-800">
                                <Button variant="outline" size="sm" onClick={() => onEdit(producto)} className="w-full">
                                    <Edit className="h-3.5 w-3.5 mr-2" />
                                    Editar
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => {
                                    if (confirm("¿Eliminar este producto?")) onDelete(producto.id);
                                }} className="w-full text-destructive hover:text-destructive">
                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                    Eliminar
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
