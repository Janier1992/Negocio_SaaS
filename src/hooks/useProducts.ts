
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserProfile } from "./useUserProfile";

// Defined to match the UI needs, flattened from Product + Variant
export interface Product {
    id: string;
    // Business fields
    business_id: string;
    // Product fields
    nombre: string; // mapped from name
    descripcion: string | null; // mapped from description
    // Variant fields (taking from 1st variant)
    precio: number; // mapped from price
    stock: number; // mapped from stock_level
    stock_minimo: number; // Hardcoded or added to DB later? DB doesn't have stock_min in variants? Checked schema, it doesn't. Will default 0.
    codigo: string | null; // mapped from sku
    categoria_id: string | null;
    proveedor_id: string | null; // Added for UI compatibility
    image_url: string | null; // Added for image rendering

    // Raw identifiers for precision if needed
    product_id: string;
    variant_id: string;
}

export function useProducts() {
    const { data: userProfile } = useUserProfile();
    const empresaId = userProfile?.business_id;
    const queryClient = useQueryClient();

    const { data: productosData = [], isLoading, error, refetch } = useQuery({
        queryKey: ["products", empresaId],
        queryFn: async () => {
            if (!empresaId) return [];

            // Fetch products with their variants
            const { data, error } = await (supabase as any)
                .from("products")
                .select(`
                    *,
                    product_variants (*)
                `)
                .eq("business_id", empresaId);

            if (error) {
                console.error("Error fetching products:", error);
                throw error;
            }

            // Map new English schema to the UI 'Product' interface
            return data.map((p: any) => {
                const variant = p.product_variants?.[0] || {};
                return {
                    id: p.id,
                    product_id: p.id,
                    variant_id: variant.id || "no-variant",
                    business_id: p.business_id,
                    nombre: p.name,
                    descripcion: p.description,
                    precio: Number(variant.price || 0),
                    stock: Number(variant.stock_level || 0),
                    codigo: variant.sku || "",
                    stock_minimo: 5,
                    categoria_id: p.category_id || null,
                    proveedor_id: p.supplier_id || null,
                    image_url: p.image_url || null
                } as Product;
            });
        },
        enabled: !!empresaId,
    });

    return {
        productos: productosData,
        isLoading,
        error,
        refetch
    };
}

export function useDeleteProduct() {
    const queryClient = useQueryClient();
    const { data: userProfile } = useUserProfile();
    const empresaId = userProfile?.business_id;

    return useMutation({
        mutationFn: async (productId: string) => {
            const { error } = await supabase
                .from("products")
                .delete()
                .eq("id", productId);

            if (error) {
                console.error("Error deleting product:", error);
                throw error;
            }
        },
        onSuccess: () => {
            toast.success("Producto eliminado correctamente");
            queryClient.invalidateQueries({ queryKey: ["products", empresaId] });
        },
        onError: (error: any) => {
            toast.error("Error al eliminar producto: " + error.message);
        }
    });
}
