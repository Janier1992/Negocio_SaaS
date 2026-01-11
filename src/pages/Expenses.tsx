import { PageContainer } from "@/components/layout/PageContainer";
import { ExpenseDialog } from "@/components/expenses/ExpenseDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Expense {
    id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
    business_id: string;
    created_at: string;
    user_id: string;
}

export default function Expenses() {
    const { data: expenses, isLoading, refetch } = useQuery({
        queryKey: ["expenses-list"],
        queryFn: async () => {
            // Verify user auth first
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No authentificado");

            const { data, error } = await supabase
                .from("expenses")
                .select("*")
                .order("date", { ascending: false });
            if (error) throw error;
            return data as Expense[];
        }
    });

    const handleDelete = async (id: string) => {
        if (!confirm("¿Está seguro de eliminar este gasto?")) return;

        try {
            const { error } = await supabase.from("expenses").delete().eq("id", id);
            if (error) throw error;
            toast.success("Gasto eliminado");
            refetch();
        } catch (e: any) {
            toast.error("Error al eliminar");
        }
    };

    return (
        <PageContainer
            title="Gastos"
            description="Registro y control de salidas de dinero."
            actions={<ExpenseDialog onExpenseAdded={refetch} />}
        >
            {/* Desktop View */}
            <div className="hidden md:block bg-white dark:bg-[#1a2632] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                                    Cargando...
                                </TableCell>
                            </TableRow>
                        ) : expenses?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                    No hay gastos registrados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            expenses?.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell>{format(new Date(expense.date), "dd MMM yyyy", { locale: es })}</TableCell>
                                    <TableCell className="font-medium">{expense.description}</TableCell>
                                    <TableCell>
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                            {expense.category}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-red-600 dark:text-red-400">
                                        -{formatCurrency(Number(expense.amount))}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)} className="text-red-500 hover:text-red-700">
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {isLoading ? (
                    <div className="text-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </div>
                ) : expenses?.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed">
                        No hay gastos registrados.
                    </div>
                ) : (
                    expenses?.map((expense) => (
                        <div key={expense.id} className="bg-white dark:bg-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs text-muted-foreground block mb-1">
                                        {format(new Date(expense.date), "dd MMM yyyy", { locale: es })}
                                    </span>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                                        {expense.description}
                                    </h4>
                                </div>
                                <span className="font-bold text-red-600 dark:text-red-400 text-lg">
                                    -{formatCurrency(Number(expense.amount))}
                                </span>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                    {expense.category}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(expense.id)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 h-8 px-2"
                                >
                                    <Trash2 className="size-4 mr-1.5" />
                                    Eliminar
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </PageContainer>
    );
}
