
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Product } from "@/hooks/useProducts";
import { ReactNode } from "react";
import { Upload, X } from "lucide-react";

interface ProductDialogProps {
  onProductAdded: () => void;
  categorias: Array<{ id: string; nombre: string }>;
  proveedores: Array<{ id: string; nombre: string }>;
  editingProduct?: Product | null;
  onClose?: () => void;
  trigger?: ReactNode;
}

export function ProductDialog({
  onProductAdded,
  categorias,
  proveedores,
  editingProduct,
  onClose,
  trigger,
}: ProductDialogProps) {
  const { data: userProfile } = useUserProfile();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    precio: "",
    stock: "",
    stock_minimo: "",
    categoria_id: "",
    proveedor_id: "",
    image_url: "",
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Preview logic could be added here if needed, but we upload directly
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        setFormData(prev => ({ ...prev, image_url: publicUrl }));
        toast.success("Imagen cargada");
      } catch (error: any) {
        console.error("Upload error:", error);
        toast.error("Error al subir imagen: " + error.message);
      }
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image_url: "" }));
  };

  const isControlled = editingProduct !== undefined;
  const showDialog = isControlled ? !!editingProduct : open;

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        codigo: editingProduct.codigo || "",
        nombre: editingProduct.nombre,
        descripcion: editingProduct.descripcion || "",
        precio: String(editingProduct.precio),
        stock: String(editingProduct.stock),
        stock_minimo: String(editingProduct.stock_minimo),
        categoria_id: editingProduct.categoria_id || "",
        proveedor_id: editingProduct.proveedor_id || "",
        image_url: editingProduct.image_url || "",
      });
    } else if (open) {
      // Reset form when opening new, set first category as default
      const defaultCategoryId = categorias.length > 0 ? categorias[0].id : "";
      setFormData({
        codigo: "",
        nombre: "",
        descripcion: "",
        precio: "",
        stock: "",
        stock_minimo: "",
        categoria_id: defaultCategoryId,
        proveedor_id: "",
        image_url: "",
      });
    }
  }, [editingProduct, open, categorias]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      if (onClose) onClose();
      setOpen(false);
    } else {
      setOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.empresa_id) {
      toast.error("Error de sesión: No se identificó la empresa");
      return;
    }
    setLoading(true);

    try {
      const productPayload = {
        name: formData.nombre,
        description: formData.descripcion || null,
        business_id: userProfile.empresa_id,
        category_id: formData.categoria_id || null,
        supplier_id: formData.proveedor_id || null,
        image_url: formData.image_url || null,
      };

      let productId = editingProduct?.id;

      if (editingProduct) {
        const { error: prodError } = await supabase
          .from("products")
          .update(productPayload as any)
          .eq("id", editingProduct.id);
        if (prodError) throw prodError;

        if ((editingProduct as any).variant_id) {
          const variantPayload = {
            sku: formData.codigo || null,
            price: parseFloat(formData.precio) || 0,
            stock_level: parseInt(formData.stock) || 0,
          };
          const { error: varError } = await supabase
            .from("product_variants")
            .update(variantPayload as any)
            .eq("id", (editingProduct as any).variant_id);
          if (varError) throw varError;
        }

        toast.success("Producto actualizado");
      } else {
        const { data: newProd, error: prodError } = await supabase
          .from("products")
          .insert(productPayload as any)
          .select()
          .single();

        if (prodError) throw prodError;
        if (!newProd) throw new Error("No se pudo crear el producto");

        productId = newProd.id;

        const variantPayload = {
          product_id: productId,
          business_id: userProfile.empresa_id,
          sku: formData.codigo || `GEN-${Date.now()}`,
          price: parseFloat(formData.precio) || 0,
          stock_level: parseInt(formData.stock) || 0,
        };

        const { error: varError } = await supabase
          .from("product_variants")
          .insert(variantPayload as any);

        if (varError) throw varError;

        toast.success("Producto creado exitosamente");
      }

      onProductAdded();
      handleOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al guardar producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingProduct ? "Editar Producto" : "Nuevo Producto"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Image Upload Area */}
          <div className="flex justify-center mb-6">
            <div className="relative w-32 h-32 bg-slate-100 hover:bg-slate-200 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors group">
              {formData.image_url ? (
                <>
                  <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeImage(); }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-slate-400 mb-2" />
                  <span className="text-xs text-slate-500 font-medium">Subir Imagen</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleImageUpload}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) =>
                  setFormData({ ...formData, codigo: e.target.value })
                }
                placeholder="Código de barras o SKU"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                required
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="precio">Precio *</Label>
              <Input
                id="precio"
                type="number"
                step="0.01"
                required
                value={formData.precio}
                onChange={(e) =>
                  setFormData({ ...formData, precio: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock Actual *</Label>
              <Input
                id="stock"
                type="number"
                required
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock_minimo">Stock Mínimo *</Label>
              <Input
                id="stock_minimo"
                type="number"
                required
                value={formData.stock_minimo}
                onChange={(e) =>
                  setFormData({ ...formData, stock_minimo: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Select
                value={formData.categoria_id}
                onValueChange={(val) =>
                  setFormData({ ...formData, categoria_id: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="proveedor">Proveedor</Label>
              <Select
                value={formData.proveedor_id}
                onValueChange={(val) =>
                  setFormData({ ...formData, proveedor_id: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {proveedores.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
