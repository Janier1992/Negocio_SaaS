
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, Package } from "lucide-react";
import { useProducts, Product } from "@/hooks/useProducts";
import { useCatalogos } from "@/hooks/useCatalogos";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProductCatalogProps {
    onAddToCart: (product: Product) => void;
}

export function ProductCatalog({ onAddToCart }: ProductCatalogProps) {
    const { productos, isLoading } = useProducts();
    const { categorias } = useCatalogos();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    const filteredProducts = useMemo(() => {
        if (!productos) return [];

        let result = productos;

        // Filter by category
        if (selectedCategory !== "all") {
            // Note: New schema might not have mapped category_id yet, but keeping logic for when it does.
            result = result.filter(p => p.categoria_id === selectedCategory);
        }

        // Filter by search term
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.nombre.toLowerCase().includes(lower) ||
                p.codigo?.toLowerCase().includes(lower)
            );
        }

        return result;
    }, [productos, searchTerm, selectedCategory]);

    if (isLoading) {
        return <div className="p-8 text-center">Cargando catálogo...</div>;
    }

    return (
        <div className="flex flex-col h-full gap-4">
            {/* Search and Filters */}
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar producto..."
                        className="pl-9 bg-background"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Category Filters */}
                <div className="w-full overflow-x-auto pb-2">
                    <div className="flex gap-2">
                        <Button
                            variant={selectedCategory === "all" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory("all")}
                            className="whitespace-nowrap"
                        >
                            Todos
                        </Button>
                        {categorias?.map((cat) => (
                            <Button
                                key={cat.id}
                                variant={selectedCategory === cat.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedCategory(cat.id)}
                                className="whitespace-nowrap"
                            >
                                {cat.nombre}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto -mx-2 px-2">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4 pb-20 md:pb-4">
                    {filteredProducts.map((product) => (
                        <Card
                            key={product.id}
                            className="cursor-pointer hover:border-primary transition-all active:scale-95 group overflow-hidden flex flex-col justify-between shadow-sm border-slate-200 dark:border-slate-800"
                            onClick={() => onAddToCart(product)}
                        >
                            <CardContent className="p-4 flex flex-col h-full gap-2">
                                <div className="aspect-square rounded-md bg-muted flex items-center justify-center relative overflow-hidden">
                                    {(product as any).image_url ? (
                                        <img
                                            src={(product as any).image_url}
                                            alt={product.nombre}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <Package className="h-10 w-10 text-muted-foreground opacity-20" />
                                    )}

                                    {product.stock <= product.stock_minimo && (
                                        <Badge variant="destructive" className="absolute top-2 right-2 text-[10px] px-1 py-0.5 h-auto">
                                            Bajo Stock
                                        </Badge>
                                    )}
                                </div>
                                <div className="space-y-1 flex-1">
                                    <h3 className="font-semibold text-sm leading-tight line-clamp-2" title={product.nombre}>
                                        {product.nombre}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Stock: {product.stock}
                                    </p>
                                </div>
                                <div className="flex items-end justify-between mt-auto">
                                    <span className="font-bold text-lg text-primary">
                                        ${product.precio.toLocaleString()}
                                    </span>
                                    <Button size="icon" variant="secondary" className="h-6 w-6 rounded-full shadow-sm">
                                        +
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {filteredProducts.length === 0 && (
                        <div className="col-span-full text-center py-12 text-muted-foreground">
                            No se encontraron productos
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
