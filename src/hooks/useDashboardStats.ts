import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "./useUserProfile";

export interface DashboardStats {
    totalRevenue: number;
    totalExpenses: number;
    lowStockCount: number;
    averageTicket: number;
    lowStockItems: any[];
    recentSales: any[];
    monthlyStats: { name: string; income: number; expenses: number }[];
    customerStats: { newCustomers: number; recurringCustomers: number; retentionRate: number };
    inventoryStats: { totalProducts: number; totalValue: number; lowStock: number; criticalStock: number };
    periodSales: number;
    previousPeriodSales: number;
}

export function useDashboardStats() {
    const { empresaId, isLoading: isProfileLoading } = useUserProfile();

    return useQuery({
        queryKey: ["dashboard", "stats", empresaId],
        enabled: !!empresaId,
        queryFn: async () => {
            console.log("Dashboard: Starting stats fetch...");

            if (!empresaId) {
                console.error("Dashboard: No business linked to user");
                throw new Error("No company linked to user");
            }

            console.log("Dashboard: Fetching for business:", empresaId);

            // Fetch all independent data in parallel (Raw Data)
            const [salesResult, expensesResult, inventoryResult, recentSalesResult, customersResult] = await Promise.all([
                // 1. Sales (Total Revenue)
                supabase
                    .from("sales")
                    .select("total, created_at, status")
                    .eq("business_id", empresaId)
                    .eq("status", "completed"),

                // 2. Expenses
                supabase
                    .from("expenses")
                    .select("amount, date, created_at")
                    .eq("business_id", empresaId),

                // 3a. Inventory Stats (Query PRODUCTS -> VARIANTS)
                supabase
                    .from("products")
                    .select("id, product_variants (stock_level, price)")
                    .eq("business_id", empresaId),

                // 3b. (Removed - Fetched separately to handle OR logic cleanly)


                // 4. Recent Sales (Raw)
                supabase
                    .from("sales")
                    .select("id, created_at, total, status, client_id")
                    .eq("business_id", empresaId)
                    .order("created_at", { ascending: false })
                    .limit(5),

                // 5. Customers
                supabase
                    .from("customers")
                    .select("created_at")
                    .eq("business_id", empresaId)
            ]);

            // Process Sales & Period Sales
            const { data: sales, error: salesError } = salesResult;
            if (salesError) console.error("Error fetching sales:", salesError);
            const salesData = (sales as any[]) || [];

            const totalRevenue = salesData.reduce((acc, sale) => acc + Number(sale.total), 0);
            const averageTicket = salesData.length > 0 ? totalRevenue / salesData.length : 0;

            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const periodSales = salesData
                .filter(s => new Date(s.created_at) >= startOfMonth)
                .reduce((acc, sale) => acc + Number(sale.total), 0);

            const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const endOfPrevMonth = startOfMonth; // Start of current is end of prev (exclusive)

            const previousPeriodSales = salesData
                .filter(s => {
                    const d = new Date(s.created_at);
                    return d >= startOfPrevMonth && d < endOfPrevMonth;
                })
                .reduce((acc, sale) => acc + Number(sale.total), 0);

            // Process Expenses
            const { data: expenses, error: expensesError } = expensesResult;
            if (expensesError) console.error("Error fetching expenses:", expensesError);
            const expensesData = (expenses as any[]) || [];
            const totalExpenses = expensesData.reduce((acc, exp) => acc + Number(exp.amount), 0);

            // Process Inventory Stats (From Products -> Variants)
            let inventoryStats = { totalProducts: 0, totalValue: 0, lowStock: 0, criticalStock: 0 };
            const { data: productsData, error: invError } = inventoryResult;

            if (invError) console.error("Error fetching inventory:", invError);

            if (productsData) {
                const products = productsData as any[];
                // Flatten all variants from all products
                const allVariants = products.flatMap(p => p.product_variants || []);

                inventoryStats.totalProducts = allVariants.reduce((acc, v) => acc + (v.stock_level || 0), 0);
                inventoryStats.totalValue = allVariants.reduce((acc, v) => acc + ((v.stock_level || 0) * (v.price || 0)), 0);

                // Critical: <= 0 or NULL
                // Low: 1-5
                inventoryStats.lowStock = allVariants.filter(v => (v.stock_level || 0) <= 5 && (v.stock_level || 0) > 0).length;
                inventoryStats.criticalStock = allVariants.filter(v => (v.stock_level || 0) <= 0).length;
            }

            // JOIN PRODUCTS (Alerts List)
            // Fix: Query Products that have low stock variants
            // We use the same 'products' source if possible, but for list limits we might need specific query
            // Let's query products with inner join variants filter
            const { data: stockItems, error: stockError } = await supabase
                .from("product_variants")
                .select("id, stock_level, product_id, products!inner(id, name, business_id)")
                .eq("products.business_id", empresaId)
                .or("stock_level.lte.5,stock_level.is.null")
                .limit(5);

            let lowStockItems: any[] = [];
            if (stockError) {
                console.error("Error stock items:", stockError);
            } else if (stockItems) {
                // Map to format expected by UI { stock_level, product: { name } }
                lowStockItems = stockItems.map((item: any) => ({
                    id: item.id,
                    stock_level: item.stock_level,
                    product_id: item.product_id,
                    product: item.products // The inner join returns the product data here
                }));
            }

            // JOIN CLIENTS for Recent Sales
            let recentSales: any[] = recentSalesResult.data || [];
            if (recentSalesResult.error) console.error("Error recent sales:", recentSalesResult.error);

            if (recentSales.length > 0) {
                const clientIds = recentSales.map((s: any) => s.client_id).filter(Boolean);
                if (clientIds.length > 0) {
                    const { data: clients } = await supabase
                        .from("customers") // Using "customers" table
                        .select("id, full_name") // Assuming full_name exists
                        .in("id", clientIds);

                    const clientMap = new Map((clients || []).map((c: any) => [c.id, c]));
                    recentSales = recentSales.map((sale: any) => ({
                        ...sale,
                        customer: { name: clientMap.get(sale.client_id)?.full_name || 'Cliente General' }
                    }));
                }
            }

            // Process Monthly Stats
            const monthlyStats: { name: string; income: number; expenses: number }[] = [];

            for (let i = 5; i >= 0; i--) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const monthName = d.toLocaleString('es-ES', { month: 'short' });
                const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
                const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);

                const income = salesData.filter(s => {
                    const saleDate = new Date(s.created_at);
                    return saleDate >= monthStart && saleDate <= monthEnd;
                }).reduce((sum, s) => sum + Number(s.total), 0);

                const expense = expensesData.filter(e => {
                    const expDate = new Date(e.date || e.created_at);
                    return expDate >= monthStart && expDate <= monthEnd;
                }).reduce((sum, e) => sum + Number(e.amount), 0);

                monthlyStats.push({ name: monthName, income, expenses: expense });
            }

            // Process Customer Stats
            let customerStats = { newCustomers: 0, recurringCustomers: 0, retentionRate: 0 };
            const { data: customers, error: customersError } = customersResult;
            if (!customersError && customers) {
                const customersData = customers as any[];

                const totalCustomers = customersData.length;
                const newCustomers = customersData.filter(c => new Date(c.created_at) >= startOfMonth).length;
                const recurringCustomers = totalCustomers - newCustomers;
                const retentionRate = totalCustomers > 0 ? (recurringCustomers / totalCustomers) * 100 : 0;

                customerStats = {
                    newCustomers,
                    recurringCustomers,
                    retentionRate: Math.round(retentionRate)
                };
            } else if (customersError) {
                console.error("Error fetching customers:", customersError);
            }

            console.log("Dashboard: Stats computed successfully");

            return {
                totalRevenue,
                totalExpenses,
                lowStockCount: inventoryStats.lowStock + inventoryStats.criticalStock, // Legacy
                averageTicket,
                lowStockItems,
                recentSales,
                monthlyStats,
                customerStats,
                inventoryStats,
                periodSales,
                previousPeriodSales
            } as DashboardStats;
        },
        refetchInterval: 30000,
    });
}
