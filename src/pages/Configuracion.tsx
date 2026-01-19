
import { useState, useEffect } from "react";
import {
    User,
    Building2,
    Bell,
    Shield,
    Loader2,
    Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ConfigTab = "profile" | "company" | "preferences" | "security";

export default function Configuracion() {
    const [activeTab, setActiveTab] = useState<ConfigTab>("company");
    const { data: userProfile } = useUserProfile();
    const empresaId = userProfile?.business_id;
    const queryClient = useQueryClient();

    // 1. Fetch Real Business Data
    const { data: companyData, isLoading: loadingCompany } = useQuery({
        queryKey: ["business_config", empresaId],
        queryFn: async () => {
            if (!empresaId) return null;
            const { data, error } = await supabase
                .from("businesses")
                .select("*")
                .eq("id", empresaId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!empresaId
    });

    // 2. Form States initialized with real data
    const [companyForm, setCompanyForm] = useState({
        name: "",
        slug: "",
    });

    useEffect(() => {
        if (companyData) {
            setCompanyForm({
                name: companyData.name || "",
                slug: companyData.slug || "",
            });
        }
    }, [companyData]);

    const updateCompanyMutation = useMutation({
        mutationFn: async (updatedData: any) => {
            const { error } = await supabase
                .from("businesses")
                .update(updatedData)
                .eq("id", empresaId);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Empresa actualizada correctamente");
            queryClient.invalidateQueries({ queryKey: ["business_config"] });
        },
        onError: (err: any) => {
            toast.error("Error al actualizar: " + err.message);
        }
    });

    const handleSaveCompany = () => {
        if (!empresaId) {
            toast.error("Error: No se ha identificado la empresa. Recarga la página.");
            return;
        }
        updateCompanyMutation.mutate(companyForm);
    };

    const tabs = [
        { id: "company", label: "Empresa", icon: Building2 },
        { id: "profile", label: "Mi Perfil", icon: User },
    ];

    return (
        <div className="flex flex-col gap-8 p-8 min-h-screen bg-background-light dark:bg-background-dark font-sans animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col">
                <h1 className="text-3xl font-black text-[#0d141b] dark:text-white tracking-tight">Configuración</h1>
                <p className="text-[#4c739a] dark:text-[#8babc8] mt-1">Administra los ajustes de tu cuenta y negocio.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Sidebar Tabs */}
                <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as ConfigTab)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === tab.id
                                ? "bg-white dark:bg-[#1a2632] text-primary shadow-sm border border-[#e7edf3] dark:border-[#2a3b4d]"
                                : "text-[#4c739a] dark:text-[#8babc8] hover:bg-gray-100 dark:hover:bg-[#23303e]"
                                }`}
                        >
                            <tab.icon className={`size-5 ${activeTab === tab.id ? "text-primary" : "opacity-70"}`} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 w-full bg-white dark:bg-[#1a2632] rounded-2xl border border-[#e7edf3] dark:border-[#2a3b4d] shadow-sm p-8 min-h-[500px]">

                    {/* COMPANY SETTINGS */}
                    {activeTab === "company" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="pb-4 border-b border-[#e7edf3] dark:border-[#2a3b4d]">
                                <h2 className="text-xl font-bold text-[#0d141b] dark:text-white">Información de la Empresa</h2>
                                <p className="text-sm text-[#4c739a]">Estos datos identifican a tu negocio en el sistema.</p>
                            </div>

                            {loadingCompany ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6 max-w-lg">
                                    <div className="space-y-2">
                                        <Label>Nombre del Negocio</Label>
                                        <Input
                                            value={companyForm.name}
                                            onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Slug (Identificador URL)</Label>
                                        <Input
                                            value={companyForm.slug}
                                            disabled
                                            className="bg-gray-100 text-gray-500 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-muted-foreground">El slug no se puede cambiar por seguridad.</p>
                                    </div>

                                    <div className="pt-4">
                                        <Button
                                            onClick={handleSaveCompany}
                                            disabled={updateCompanyMutation.isPending}
                                            className="bg-primary hover:bg-blue-600 w-full md:w-auto"
                                        >
                                            {updateCompanyMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
                                            Guardar Cambios
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* PROFILE SETTINGS */}
                    {activeTab === "profile" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="pb-4 border-b border-[#e7edf3] dark:border-[#2a3b4d]">
                                <h2 className="text-xl font-bold text-[#0d141b] dark:text-white">Mi Perfil</h2>
                                <p className="text-sm text-[#4c739a]">Datos de tu cuenta de usuario.</p>
                            </div>

                            <div className="bg-gray-50 dark:bg-[#1f2d3b] p-6 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="size-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
                                        {userProfile?.full_name?.charAt(0) || "U"}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{userProfile?.full_name}</h3>
                                        <p className="text-sm text-gray-500">{userProfile?.email}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => supabase.auth.signOut()}>
                                        Cerrar Sesión
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

