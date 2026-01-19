import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";

interface ExpenseDialogProps {
    onExpenseAdded?: () => void;
    trigger?: React.ReactNode;
}

export function ExpenseDialog({ onExpenseAdded, trigger }: ExpenseDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const queryClient = useQueryClient();
    const { data: userProfile } = useUserProfile();
    const empresaId = userProfile?.business_id;

    const [formData, setFormData] = useState({
        description: "",
        amount: "",
        category: "Operativo",
        date: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!empresaId || !userProfile?.id) {
            toast.error("No se encontró información de la sesión/empresa");
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.from("expenses").insert({
                description: formData.description,
                amount: parseFloat(formData.amount),
                category: formData.category,
                date: formData.date,
                business_id: empresaId,
                user_id: userProfile.id
            });

            if (error) throw error;

            toast.success("Gasto registrado exitosamente");
            setOpen(false);
            setFormData({
                description: "",
                amount: "",
                category: "Operativo",
                date: new Date().toISOString().split('T')[0]
            });
            onExpenseAdded?.();
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }); // Update dashboard
            queryClient.invalidateQueries({ queryKey: ["expenses-list"] });
        } catch (error: any) {
            toast.error("Error al registrar gasto: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="gap-2 bg-red-600 hover:bg-red-700 text-white">
                        <Plus className="size-4" /> Registrar Gasto
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Registrar Nuevo Gasto</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Input
                            id="description"
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Ej: Pago de Luz"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Monto</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                required
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date">Fecha</Label>
                            <Input
                                id="date"
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Categoría</Label>
                        <select
                            id="category"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="Operativo">Operativo</option>
                            <option value="Inventario">Inventario</option>
                            <option value="Servicios">Servicios</option>
                            <option value="Personal">Personal</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Otros">Otros</option>
                        </select>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isLoading} className="bg-red-600 hover:bg-red-700 text-white">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Registrar Gasto
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
