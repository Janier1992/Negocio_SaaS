
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useProductos, Producto } from "@/hooks/useProductos";
import { Card } from "@/components/ui/card";

interface ProductSearchProps {
    onSelectProduct: (product: Producto) => void;
}

export function ProductSearch({ onSelectProduct }: ProductSearchProps) {
    const { productos, isLoading } = useProductos();
    const [term, setTerm] = useState("");
    const [results, setResults] = useState<Producto[]>([]);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        if (term.length > 1 && productos) {
            const lower = term.toLowerCase();
            const filtered = productos.filter(
                (p) =>
                    p.nombre.toLowerCase().includes(lower) ||
                    p.codigo?.toLowerCase().includes(lower)
            );
            setResults(filtered);
            setShowResults(true);
        } else {
            setResults([]);
            setShowResults(false);
        }
    }, [term, productos]);

    return (
        <div className="relative w-full">
            <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="Buscar producto por nombre o código..."
                    className="pl-9 h-12 text-lg"
                    autoFocus
                />
            </div>

            {showResults && results.length > 0 && (
                <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto shadow-lg">
                    <div className="p-1">
                        {results.map((product) => (
                            <div
                                key={product.id}
                                onClick={() => {
                                    onSelectProduct(product);
                                    setTerm("");
                                    setShowResults(false);
                                }}
                                className="cursor-pointer p-3 hover:bg-accent rounded-md flex justify-between items-center group"
                            >
                                <div>
                                    <div className="font-medium group-hover:text-primary transition-colors">
                                        {product.nombre}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Código: {product.codigo || "-"} | Stock: {product.stock}
                                    </div>
                                </div>
                                <div className="font-bold text-lg">
                                    ${product.precio.toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
