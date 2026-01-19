
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "./useUserProfile";

export function useCatalogos() {
    const { data: userProfile } = useUserProfile();
    const businessId = userProfile?.business_id;

    const { data: categorias = [] } = useQuery({
        queryKey: ["categories", businessId],
        queryFn: async () => {
            if (!businessId) return [];

            const { data, error } = await supabase
                .from("categories")
                .select("id, name")
                .eq("business_id", businessId)
                .order("name");

            if (error) throw error;
            return (data as any[]).map(c => ({ id: c.id, nombre: c.name }));
        },
        enabled: !!businessId,
    });

    const { data: proveedores = [] } = useQuery({
        queryKey: ["suppliers", businessId],
        queryFn: async () => {
            if (!businessId) return [];

            const { data, error } = await supabase
                .from("suppliers")
                .select("id, name")
                .eq("business_id", businessId)
                .order("name");

            if (error) throw error;
            return (data as any[]).map(p => ({ id: p.id, nombre: p.name }));
        },
        enabled: !!businessId,
    });

    return { categorias, proveedores };
}
