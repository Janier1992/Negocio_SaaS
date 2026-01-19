
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

interface SupplierDialogProps {
  onSupplierAdded: () => void;
  editingSupplier?: any;
  onClose?: () => void;
}

export const SupplierDialog = ({
  onSupplierAdded,
  editingSupplier,
  onClose,
}: SupplierDialogProps) => {
  const { data: userProfile, isLoading: loadingProfile } = useUserProfile();
  const empresaId = userProfile?.business_id;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Debug log
  useEffect(() => {
    console.log("SupplierDialog - Empresa ID:", empresaId, "Loading:", loadingProfile);
  }, [empresaId, loadingProfile]);

  const [formData, setFormData] = useState({
    name: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
  });

  // ... (effect for editingSupplier)

  const handleClose = () => {
    // ... same code
    setOpen(false);
    if (onClose) onClose();
    setFormData({
      name: "",
      contact_name: "",
      email: "",
      phone: "",
      address: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loadingProfile) {
      toast.info("Cargando perfil de empresa, intente de nuevo en un segundo...");
      return;
    }

    if (!empresaId) {
      console.error("Critical: No company ID found on submit");
      toast.error("Error crítico: No se identificó la empresa. Recargue la página.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        contact_name: formData.contact_name || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        business_id: empresaId
      };

      if (editingSupplier) {
        const { error } = await supabase
          .from("suppliers")
          .update({
            name: payload.name,
            contact_name: payload.contact_name,
            email: payload.email,
            phone: payload.phone,
            address: payload.address
          })
          .eq("id", editingSupplier.id);

        if (error) throw error;
        toast.success("Proveedor actualizado");
      } else {
        const { error } = await supabase
          .from("suppliers")
          .insert(payload);

        if (error) throw error;
        toast.success("Proveedor agregado");
      }

      handleClose();
      onSupplierAdded();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al guardar proveedor");
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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Proveedor
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingSupplier ? "Editar Proveedor" : "Agregar Nuevo Proveedor"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre Empresa *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="contact_name">Contacto</Label>
            <Input
              id="contact_name"
              value={formData.contact_name}
              onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
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
