import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { useProducts } from "@/hooks/useProducts";
import { Product } from "@/hooks/useProducts";
import {
    Plus,
    Search,
    Filter,
    Grid,
    List,
    MoreVertical,
    Save,
    AlertTriangle,
    CheckCircle2,
    Download,
    Edit,
    Trash2,
    MoreHorizontal
} from "lucide-react";
import { ProductDialog } from "@/components/inventario/ProductDialog";
import { useCatalogos } from "@/hooks/useCatalogos";
import * as XLSX from "xlsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteProduct } from "@/hooks/useProducts";


// Helper to get image
const getProductImage = (product: any) => {
    return product.image_url || "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=500&q=80"; // Generic placeholder
};


export default function Productos() {
    const { productos, isLoading, refetch } = useProducts();
    const { categorias, proveedores } = useCatalogos();
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [filter, setFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [productToEdit, setProductToEdit] = useState<Product | undefined>(undefined);
    const deleteProduct = useDeleteProduct();

    // Enhanced logic for display
    const getStockStatus = (stock: number) => {
        if (stock <= 5) return { label: "Crítico", color: "text-red-600 dark:text-red-400", bg: "bg-red-500", badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
        if (stock <= 20) return { label: "Bajo", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500", badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" };
        return { label: "Saludable", color: "text-green-600 dark:text-green-400", bg: "bg-green-500", badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
    };

    const handleExport = () => {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(productos);
        XLSX.utils.book_append_sheet(wb, ws, "Productos");
        XLSX.writeFile(wb, "productos_export.xlsx");
    };

    const filteredProducts = productos.filter(p => {
        const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.codigo && p.codigo.toLowerCase().includes(searchTerm.toLowerCase()));

        if (!matchesSearch) return false;

        if (filter === "low_stock") return p.stock <= 20;
        // 'offer' filter logic could be added here if 'price < cost' or similar
        return true;
    });

    const lowStockCount = productos.filter(p => p.stock <= 20).length;

    return (
        <PageContainer
            title="Productos"
            description="Gestiona tu catálogo, precios y stock en tiempo real."
            actions={
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                    >
                        <Download className="w-5 h-5" />
                        <span>Exportar</span>
                    </button>
                    <ProductDialog
                        categorias={categorias}
                        proveedores={proveedores}
                        onProductAdded={refetch}
                        trigger={
                            <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-blue-600 shadow-md shadow-primary/20 transition-all">
                                <Plus className="w-5 h-5" />
                                <span>Nuevo Producto</span>
                            </button>
                        }
                    />
                </div>
            }
        >
            <div className="space-y-6">

                {/* Toolbar */}
                <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2 -mx-2 px-2 border-b border-transparent">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                        {/* Search */}
                        <div className="relative w-full lg:w-96">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="text-slate-400 w-5 h-5" />
                            </div>
                            <input
                                className="block w-full pl-10 pr-3 py-2.5 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                placeholder="Filtrar por nombre or SKU..."
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
                            <button
                                onClick={() => setFilter("all")}
                                className={`px-3.5 py-1.5 rounded-full text-sm font-medium shadow-sm transition-colors ${filter === "all" ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50"}`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setFilter("low_stock")}
                                className={`px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${filter === "low_stock" ? "bg-slate-100 dark:bg-slate-700" : "bg-white dark:bg-slate-800 hover:bg-slate-50"}`}
                            >
                                <span className="text-slate-600 dark:text-slate-300">Bajo Stock</span>
                                {lowStockCount > 0 && (
                                    <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-1.5 py-0.5 rounded-full font-bold">{lowStockCount}</span>
                                )}
                            </button>

                            <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1"></div>

                            <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm border border-slate-200 dark:border-slate-700">
                                <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-slate-600'}`}>
                                    <Grid className="w-5 h-5" />
                                </button>
                                <button onClick={() => setViewMode("list")} className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-slate-600'}`}>
                                    <List className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid Content */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-80 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
                        {filteredProducts.map((product, index) => {
                            const status = getStockStatus(product.stock);
                            return (
                                <div key={product.id} className="group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden">
                                    {/* Image */}
                                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                                        <img
                                            src={getProductImage(product)}
                                            alt={product.nombre}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        {product.stock <= 5 && (
                                            <div className="absolute top-3 left-3">
                                                <span className="px-2 py-1 bg-red-500/90 text-white text-[10px] font-bold uppercase tracking-wider rounded backdrop-blur-sm flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" /> BAJO STOCK
                                                </span>
                                            </div>
                                        )}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="absolute top-3 right-3 p-1.5 bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-full transition-colors hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={(e) => {
                                                    e.stopPropagation();
                                                    setProductToEdit(product);
                                                }}>
                                                    <Edit className="mr-2 h-4 w-4" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:text-red-600"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm("¿Estás seguro de eliminar este producto?")) {
                                                            deleteProduct.mutate(product.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* Body */}
                                    <div className="p-4 flex flex-col flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-semibold text-slate-900 dark:text-white leading-tight group-hover:text-primary transition-colors line-clamp-1">{product.nombre}</h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">SKU: {product.codigo || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="mt-auto space-y-3">
                                            {/* Price Input */}
                                            <div className="relative group/price">
                                                <label className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-0.5 block">Precio Venta</label>
                                                <div className="relative flex items-center">
                                                    <span className="absolute left-2 text-slate-400 dark:text-slate-500 font-medium">$</span>
                                                    <input
                                                        className="block w-full pl-6 pr-8 py-1.5 text-lg font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-primary focus:ring-0 rounded transition-all"
                                                        type="number"
                                                        defaultValue={product.precio}
                                                    />
                                                    <div className="absolute right-2 text-green-500 opacity-0 group-focus-within/price:opacity-100 transition-opacity cursor-pointer">
                                                        <Save className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Stock Bar */}
                                            <div>
                                                <div className="flex justify-between text-xs mb-1.5">
                                                    <span className="text-slate-600 dark:text-slate-300 font-medium">Stock: {product.stock}</span>
                                                    <span className={`font-bold ${status.color}`}>{status.label}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${status.bg} rounded-full transition-all duration-500`}
                                                        style={{ width: `${Math.min(product.stock, 100)}%` }} // Simple calc for demo
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            {/* Edit Product Dialog */}
            <ProductDialog
                categorias={categorias}
                proveedores={proveedores}
                editingProduct={productToEdit}
                onClose={() => setProductToEdit(undefined)}
                onProductAdded={refetch}
            />
        </PageContainer>
    );
}
