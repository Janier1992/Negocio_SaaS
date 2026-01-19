
import { useUserProfile } from "@/hooks/useUserProfile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, Save } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Profile() {
    const { data: userProfile, isLoading, refetch } = useUserProfile();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (userProfile) {
            setFirstName(userProfile.first_name || "");
            setLastName(userProfile.last_name || "");
        }
    }, [userProfile]);

    if (isLoading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const initials = firstName
        ? `${firstName[0]}${lastName?.[0] || ""}`.toUpperCase()
        : "U";

    const handleSave = async () => {
        if (!userProfile?.id) return;

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from("profiles")
                .update({
                    first_name: firstName,
                    last_name: lastName,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", userProfile.id);

            if (error) throw error;
            toast.success("Perfil actualizado correctamente");
            refetch();
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar el perfil");
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !userProfile?.id) return;

        // Validate type and size
        if (!file.type.startsWith("image/")) {
            toast.error("Por favor selecciona una imagen válida");
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB
            toast.error("La imagen no debe pesar más de 5MB");
            return;
        }

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const filePath = `${userProfile.id}/${Math.random()}.${fileExt}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // Update Profile
            const { error: updateError } = await supabase
                .from("profiles")
                .update({ avatar_url: publicUrl })
                .eq("id", userProfile.id);

            if (updateError) throw updateError;

            toast.success("Foto de perfil actualizada");
            refetch();

        } catch (error: any) {
            console.error(error);
            toast.error("Error al subir la imagen: " + (error.message || "Error desconocido"));
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Mi Perfil</h2>
                <p className="text-muted-foreground">Administra tu información personal.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Información Personal</CardTitle>
                    <CardDescription>Edita tu foto y datos de identificación.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <Avatar className="h-32 w-32 border-4 border-surface-light shadow-xl transition-transform group-hover:scale-105">
                                <AvatarImage src={userProfile?.avatar_url} className="object-cover" />
                                <AvatarFallback className="text-4xl bg-primary/10 text-primary">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                {isUploading ? (
                                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                                ) : (
                                    <Camera className="h-8 w-8 text-white" />
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileSelect}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">Clic para cambiar foto</p>
                    </div>

                    {/* Form Section */}
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input id="email" value={userProfile?.email} disabled className="bg-muted" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="first_name">Nombre</Label>
                                <Input
                                    id="first_name"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="Tu nombre"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="last_name">Apellido</Label>
                                <Input
                                    id="last_name"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Tu apellido"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Guardar Cambios
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
