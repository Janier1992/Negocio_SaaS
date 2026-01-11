
import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    ChevronRight,
    Trash2,
    Save,
    CloudUpload,
    Plus,
    Edit,
    Link,
    ShoppingCart,
    Monitor,
    AlertTriangle,
    TrendingUp,
    Loader2,
    Image as ImageIcon,
    CheckCircle
} from "lucide-react";
import { useCatalogos } from "@/hooks/useCatalogos";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ProductDetailProps {
    product: any;
    onBack: () => void;
    onSave: () => void;
}

interface Variant {
    id: string;
    name: string;
    sku: string;
    stock: number;
    price: number;
}

export const ProductDetail = ({ product, onBack, onSave }: ProductDetailProps) => {
    const { categorias, proveedores } = useCatalogos();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        nombre: product.nombre,
        codigo: product.codigo,
        categoria_id: product.categoria_id,
        descripcion: product.descripcion || "",
        precio: product.precio,
        stock: product.stock,
        stock_minimo: product.stock_minimo,
        proveedor_id: product.proveedor_id,
    });

    // Local "Frontend-only" State
    const [imagePreview, setImagePreview] = useState<string | null>(product.image_url || null);
    // Initialize with empty variants or real ones if passed in product
    const [variants, setVariants] = useState<Variant[]>(product.variants || []);
    const [barcode, setBarcode] = useState(product.barcode || "");

    // Calculate total stock from variants if they exist
    const totalStock = useMemo(() => {
        if (variants.length > 0) {
            return variants.reduce((acc, v) => acc + v.stock, 0);
        }
        return formData.stock;
    }, [variants, formData.stock]);

    // Handlers
    const handleChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                toast.info("Subiendo imagen...");
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

                setImagePreview(publicUrl);
                toast.success("Imagen actualizada");
            } catch (error: any) {
                console.error("Upload error:", error);
                toast.error("Error al subir imagen: " + error.message);
            }
        }
    };

    const handleAddVariant = () => {
        const newVariant: Variant = {
            id: crypto.randomUUID(),
            name: "Nueva Variante",
            sku: `${formData.codigo}-NW`,
            stock: 0,
            price: formData.precio
        };
        setVariants([...variants, newVariant]);
    };

    const handleUpdateVariant = (id: string, field: keyof Variant, value: any) => {
        setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
    };

    const handleDeleteVariant = (id: string) => {
        setVariants(variants.filter(v => v.id !== id));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Update the main stock to match total stock from variants
            const finalStock = variants.length > 0 ? totalStock : formData.stock;

            const { error } = await (supabase as any)
                .from("products")
                .update({
                    name: formData.nombre,
                    description: formData.descripcion,
                    category_id: formData.categoria_id,
                    supplier_id: formData.proveedor_id,
                    image_url: imagePreview,
                })
                .eq("id", product.id);

            if (error) throw error;

            toast.success("Información principal guardada correctamente");

            if (variants.length > 0) {
                // Future: Save variants to DB
            }
            onSave();
        } catch (error: any) {
            toast.error("Error al guardar: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("¿Estás seguro de eliminar este producto?")) return;
        try {
            const { error } = await supabase.from("products").delete().eq("id", product.id);
            if (error) throw error;
            toast.success("Producto eliminado");
            onBack();
        } catch (error: any) {
            toast.error("Error al eliminar: " + error.message);
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in text-slate-900 dark:text-slate-100 font-sans">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
            />

            {/* Breadcrumbs & Heading */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-2">
                    <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <span onClick={onBack} className="cursor-pointer hover:text-primary transition-colors">Inventario</span>
                        <ChevronRight className="h-4 w-4" />
                        <span className="cursor-pointer hover:text-primary transition-colors">
                            {categorias.find(c => c.id === formData.categoria_id)?.nombre || "General"}
                        </span>
                        <ChevronRight className="h-4 w-4" />
                        <span className="text-slate-900 dark:text-white font-medium">
                            {formData.nombre}
                        </span>
                    </nav>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        {formData.nombre}
                        <span className="px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-wide border border-green-200 dark:border-green-800">
                            Activo
                        </span>
                    </h1>
                    <p className="text-sm text-slate-500">SKU: {formData.codigo}</p>
                </div>
                <div className="flex items-center gap-3 mt-4 sm:mt-0">
                    <button
                        onClick={handleDelete}
                        className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                        <Trash2 className="h-[18px] w-[18px]" />
                        <span className="hidden sm:inline">Eliminar</span>
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 rounded-lg bg-primary hover:bg-blue-600 text-white font-medium text-sm shadow-sm shadow-blue-500/20 transition-all flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <Save className="h-[18px] w-[18px]" />}
                        Guardar Cambios
                    </button>
                </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Identity & Pricing */}
                <div className="flex flex-col gap-6 lg:col-span-1">

                    {/* Main Image & Status */}
                    <div className="bg-white dark:bg-[#15202b] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-900 dark:text-white">Imagen Principal</h3>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-primary text-xs font-medium hover:underline"
                            >
                                Editar
                            </button>
                        </div>
                        <div className="p-6 flex flex-col items-center">
                            <div
                                className="relative group size-48 rounded-lg bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden mb-4 cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="object-cover w-full h-full" />
                                ) : (
                                    <img
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuChpiJmQhLfPAjLfFnyhVaOYrmZtdRP_ikyhKJTIc3s4tPQl2MFc9dSdbTYSDG8oeW6XHPD0A7qy_6ah9ta3PDEaHtt2jgxBPrCUR4HGxVGifNI_kkyyKggUpruSclMNpNxcqcu9UIu7p_-ejUtS0rcvr9r9-0Lt49yHGic2jOPN4c4FSQsDau3Jguf2WuKvkCmenVrMbt6YZo4N6dd9v1R4cWqeaJ57jzM266MqmDBjiHAk5P6FfMfZ62O6kfx-KPA8jvw-sRuAkCN"
                                        alt="Default"
                                        className="object-cover w-full h-full opacity-60 hover:opacity-100 transition-opacity"
                                    />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <CloudUpload className="text-white h-8 w-8" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 w-full">
                                <div className="aspect-square rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-primary transition-colors"></div>
                                <div className="aspect-square rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-primary transition-colors"></div>
                                <div className="aspect-square rounded-md bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 cursor-pointer hover:text-primary hover:border-primary transition-colors">
                                    <Plus className="h-5 w-5" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="bg-white dark:bg-[#15202b] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-semibold text-slate-900 dark:text-white">Información General</h3>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Nombre del Producto</label>
                                <input
                                    type="text"
                                    value={formData.nombre}
                                    onChange={(e) => handleChange("nombre", e.target.value)}
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-primary focus:border-primary text-sm font-medium"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">SKU</label>
                                    <input
                                        type="text"
                                        value={formData.codigo}
                                        onChange={(e) => handleChange("codigo", e.target.value)}
                                        className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary text-sm font-mono uppercase"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5 relative">
                                    <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Código de Barras</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={barcode}
                                            onChange={(e) => setBarcode(e.target.value)}
                                            className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-primary focus:border-primary text-sm font-mono pl-3 pr-8"
                                        />
                                        <Monitor className="absolute right-2 top-2 text-slate-400 h-5 w-5 cursor-pointer hover:text-primary" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Categoría</label>
                                <select
                                    value={formData.categoria_id || ""}
                                    onChange={(e) => handleChange("categoria_id", e.target.value)}
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-primary focus:border-primary text-sm"
                                >
                                    <option value="">Seleccionar Categoría</option>
                                    {categorias.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Descripción</label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) => handleChange("descripcion", e.target.value)}
                                    className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-primary focus:border-primary text-sm resize-none"
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="bg-white dark:bg-[#15202b] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-semibold text-slate-900 dark:text-white">Precios y Costos</h3>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Precio Venta</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-500 text-sm">$</span>
                                    <input
                                        type="number"
                                        value={formData.precio}
                                        onChange={(e) => handleChange("precio", parseFloat(e.target.value))}
                                        className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-primary focus:border-primary text-sm pl-7 font-semibold"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Costo Compra</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-500 text-sm">$</span>
                                    <input
                                        type="number"
                                        defaultValue={formData.precio * 0.5}
                                        className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-primary focus:border-primary text-sm pl-7"
                                    />
                                </div>
                            </div>
                            <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Margen Estimado</span>
                                    <span className="text-sm font-bold text-green-600 dark:text-green-400">50% (${(formData.precio * 0.5).toFixed(2)})</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Inventory & Details */}
                <div className="flex flex-col gap-6 lg:col-span-2">

                    {/* Stock Real Time */}
                    <div className="bg-white dark:bg-[#15202b] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="text-primary h-5 w-5" />
                                <h3 className="font-semibold text-slate-900 dark:text-white">Inventario en Tiempo Real</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                <span className="text-xs font-medium text-slate-500">Sincronizado</span>
                            </div>
                        </div>
                        <div className="p-6 flex flex-col md:flex-row gap-8 items-start">
                            <div className="flex flex-col gap-1 items-start min-w-[140px]">
                                <span className="text-sm text-slate-500 font-medium">Stock Total</span>
                                <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">{totalStock}</span>
                                <span className="text-xs text-green-600 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded flex items-center gap-1 mt-1">
                                    <TrendingUp className="h-[14px] w-[14px]" />
                                    +12 esta semana
                                </span>
                            </div>
                            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Almacén Central</span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{Math.floor(totalStock * 0.8)}</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                        <div className="bg-primary h-1.5 rounded-full" style={{ width: "80%" }}></div>
                                    </div>
                                </div>
                                <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tienda Centro</span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">{totalStock - Math.floor(totalStock * 0.8)}</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                        <div className="bg-primary h-1.5 rounded-full" style={{ width: "20%" }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Low Stock Alert Config */}
                        <div className="px-6 pb-6 pt-2">
                            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 flex flex-col sm:flex-row gap-4 items-center">
                                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full text-yellow-600 dark:text-yellow-500">
                                    <AlertTriangle className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Alerta de Stock Bajo</h4>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">Notificar cuando el inventario global baje de este nivel.</p>
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={formData.stock_minimo}
                                        onChange={(e) => handleChange("stock_minimo", parseInt(e.target.value))}
                                        className="flex-1 w-full sm:w-32 accent-yellow-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <input
                                        type="number"
                                        value={formData.stock_minimo}
                                        onChange={(e) => handleChange("stock_minimo", parseInt(e.target.value))}
                                        className="w-16 rounded-md border-slate-300 dark:border-slate-700 text-center text-sm font-bold py-1 bg-white dark:bg-slate-900"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Variants Table */}
                    <div className="bg-white dark:bg-[#15202b] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col min-h-[300px]">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-900 dark:text-white">Variantes</h3>
                            <button
                                onClick={handleAddVariant}
                                className="flex items-center gap-1 text-primary text-sm font-medium hover:bg-primary/5 px-2 py-1 rounded transition-colors"
                            >
                                <Plus className="h-[18px] w-[18px]" />
                                Añadir Variante
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3">Variante</th>
                                        <th className="px-6 py-3">SKU</th>
                                        <th className="px-6 py-3 text-right">Stock</th>
                                        <th className="px-6 py-3 text-right">Precio</th>
                                        <th className="px-6 py-3 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {variants.map((variant) => (
                                        <tr key={variant.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                                <div className="flex items-center gap-2">
                                                    <span className="size-3 rounded-full bg-white border border-slate-300 shadow-sm block"></span>
                                                    <input
                                                        type="text"
                                                        value={variant.name}
                                                        onChange={(e) => handleUpdateVariant(variant.id, 'name', e.target.value)}
                                                        className="bg-transparent border-none focus:ring-0 p-0 w-full font-medium"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs">
                                                <input
                                                    type="text"
                                                    value={variant.sku}
                                                    onChange={(e) => handleUpdateVariant(variant.id, 'sku', e.target.value)}
                                                    className="bg-transparent border-none focus:ring-0 p-0 w-full font-mono text-xs uppercase"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <input
                                                    type="number"
                                                    value={variant.stock}
                                                    onChange={(e) => handleUpdateVariant(variant.id, 'stock', parseInt(e.target.value))}
                                                    className="w-16 text-right bg-transparent border border-transparent hover:border-slate-200 rounded px-1"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <input
                                                    type="number"
                                                    value={variant.price}
                                                    onChange={(e) => handleUpdateVariant(variant.id, 'price', parseFloat(e.target.value))}
                                                    className="w-20 text-right bg-transparent border border-transparent hover:border-slate-200 rounded px-1"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleDeleteVariant(variant.id)}
                                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="h-[18px] w-[18px]" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Bottom Section: Integrations & Suppliers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Suppliers */}
                        <div className="bg-white dark:bg-[#15202b] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 h-full">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="font-semibold text-slate-900 dark:text-white">Proveedores</h3>
                            </div>
                            <div className="p-4 flex flex-col gap-3">
                                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                            {proveedores.find(p => p.id === formData.proveedor_id)?.nombre || "Sin Asignar"}
                                        </span>
                                        <span className="text-xs text-slate-500">Principal • Lead Time: 5 días</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-sm font-bold text-slate-900 dark:text-white">${(formData.precio * 0.5).toFixed(2)}</span>
                                        <span className="text-xs text-slate-500">Costo</span>
                                    </div>
                                </div>
                                <select
                                    value={formData.proveedor_id || ""}
                                    onChange={(e) => handleChange("proveedor_id", e.target.value)}
                                    className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-slate-500 text-sm font-medium hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 bg-transparent text-center"
                                >
                                    <option value="">+ Asociar Proveedor</option>
                                    {proveedores.map(p => (
                                        <option key={p.id} value={p.id}>{p.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Integrations */}
                        <div className="bg-white dark:bg-[#15202b] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 h-full">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="font-semibold text-slate-900 dark:text-white">Canales & Integraciones</h3>
                            </div>
                            <div className="p-4 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                            <ShoppingCart className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-900 dark:text-white">Tienda E-commerce</span>
                                            <span className="text-xs text-slate-500">Visible en web</span>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" defaultChecked className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                                            <Monitor className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-900 dark:text-white">Punto de Venta (POS)</span>
                                            <span className="text-xs text-slate-500">Disponible en caja</span>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" defaultChecked className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
