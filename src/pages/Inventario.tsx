import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { InventoryTable } from "@/components/inventario/InventoryTable";
import { ProductDialog } from "@/components/inventario/ProductDialog";
import { ExcelUploadDialog } from "@/components/inventario/ExcelUploadDialog";
import { ProductDetail } from "@/components/inventario/ProductDetail";
import { useProducts, Product } from "@/hooks/useProducts";
import { useCatalogos } from "@/hooks/useCatalogos";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Inventario() {


    const { productos, isLoading, refetch } = useProducts();
    const { categorias, proveedores } = useCatalogos();
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase.from("products").delete().eq("id", id);
            if (error) throw error;
            toast.success("Producto eliminado");
            refetch();
        } catch (error) {
            console.error("Error deleting product:", error);
            toast.error("Error al eliminar producto");
        }
    };

    const handleBulkDelete = async (ids: string[]) => {
        try {
            const { error } = await supabase.from("products").delete().in("id", ids);
            if (error) throw error;
            toast.success(`${ids.length} productos eliminados`);
            refetch();
        } catch (error) {
            console.error("Error deleting products:", error);
            toast.error("Error al eliminar productos");
        }
    };

    if (selectedProduct) {
        return (
            <ProductDetail
                product={selectedProduct}
                onBack={() => {
                    setSelectedProduct(null);
                    refetch();
                }}
                onSave={() => {
                    refetch();
                }}
            />
        );
    }

    return (
        <PageContainer
            title="Inventario"
            description="Gestiona tus productos y existencias"
            actions={
                <div className="flex flex-wrap gap-2">
                    <ExcelUploadDialog
                        onUploadComplete={refetch}
                        categorias={categorias}
                        proveedores={proveedores}
                    />
                    <ProductDialog
                        categorias={categorias}
                        proveedores={proveedores}
                        onProductAdded={refetch}
                        trigger={
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Nuevo Producto
                            </Button>
                        }
                    />
                </div>
            }
        >
            <InventoryTable
                productos={productos || []}
                isLoading={isLoading}
                onEdit={(product) => setSelectedProduct(product)}
                onDelete={handleDelete}
                onBulkDelete={handleBulkDelete}
            />
        </PageContainer>
    );
}
