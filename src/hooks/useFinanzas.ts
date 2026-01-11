
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FinanzasResumen {
    ingresos: number;
    compras: number;
    cxp_pendientes: number;
    cxp_vencidas: number;
}

export function useFinanzas() {
    return useQuery({
        queryKey: ["finanzas", "resumen"],
        queryFn: async () => {
            // First get the user's company ID
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No authenticated user");

            const { data: profile } = await supabase
                .from("profiles")
                .select("empresa_id")
                .eq("id", user.id)
                .single();

            if (!profile?.empresa_id) throw new Error("No company linked to user");

            const { data, error } = await supabase.rpc("get_finanzas_resumen", {
                _empresa: profile.empresa_id,
            });

            if (error) throw error;

            // Parse the JSON response if necessary, or cast it
            return data as FinanzasResumen;
        },
    });
}
