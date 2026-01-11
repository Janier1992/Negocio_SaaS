
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { toast } from "sonner";

interface CustomerDialogProps {
    onCustomerAdded: () => void;
    editingCustomer?: any;
    onClose?: () => void;
    trigger?: React.ReactNode;
}

export const CustomerDialog = ({
    onCustomerAdded,
    editingCustomer,
    onClose,
    trigger,
}: CustomerDialogProps) => {
    const { empresaId } = useUserProfile();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone: "",
        address: "",
    });

    useEffect(() => {
        if (editingCustomer) {
            setFormData({
                full_name: editingCustomer.full_name || "",
                email: editingCustomer.email || "",
                phone: editingCustomer.phone || "",
                address: editingCustomer.address || "",
            });
            setOpen(true);
        }
    }, [editingCustomer]);

    const handleClose = () => {
        setOpen(false);
        if (onClose) onClose();
        setFormData({
            full_name: "",
            email: "",
            phone: "",
            address: "",
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!empresaId) {
            toast.error("No se pudo identificar la empresa");
            return;
        }

        setLoading(true);

        try {
            const payload = {
                full_name: formData.full_name,
                email: formData.email || null,
                phone: formData.phone || null,
                address: formData.address || null,
                business_id: empresaId
            };

            if (editingCustomer) {
                const { error } = await supabase
                    .from("customers")
                    .update({
                        full_name: payload.full_name,
                        email: payload.email,
                        phone: payload.phone,
                        address: payload.address
                    } as any)
                    .eq("id", editingCustomer.id);

                if (error) throw error;
                toast.success("Cliente actualizado");
            } else {
                const { error } = await supabase
                    .from("customers")
                    .insert(payload as any);

                if (error) throw error;
                toast.success("Cliente agregado");
            }

            handleClose();
            onCustomerAdded();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Error al guardar cliente");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                setOpen(v);
                if (!v) handleClose();
            }}
        >
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Cliente
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {editingCustomer ? "Editar Cliente" : "Agregar Nuevo Cliente"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="full_name">Nombre *</Label>
                        <Input
                            id="full_name"
                            required
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label htmlFor="address">Dirección</Label>
                        <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? "Guardando..." : "Guardar"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};
