import { PageContainer } from "@/components/layout/PageContainer";
import { CartProvider, useCart } from "@/context/CartContext";
import { ProductCatalog } from "@/components/ventas/ProductCatalog";
import { CartPanel } from "@/components/ventas/CartPanel";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesHistory } from "@/components/ventas/SalesHistory";
import { ShoppingCart, History } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

function VentasContent() {
    const { items, addToCart, total, clearCart } = useCart();
    const [isProcessing, setIsProcessing] = useState(false);
    const { data: userProfile } = useUserProfile();
    const empresaId = userProfile?.business_id;
    const queryClient = useQueryClient();

    const handleCheckout = async (paymentMethod: string, customerData: any) => {
        if (items.length === 0) return;
        if (!empresaId || !userProfile?.id) {
            toast.error("Error de sesión: No se puede identificar el usuario o empresa");
            return;
        }

        // Validate minimal customer data if provided
        if (customerData.docId && !customerData.name) {
            toast.error("Por favor ingrese el nombre del cliente si ingresó cédula");
            return;
        }

        setIsProcessing(true);
        try {
            let clientId = null;

            // 1. Handle Customer (Find or Create)
            if (customerData.docId && customerData.name) {
                // Check if exists
                const { data: existingClient } = await supabase
                    .from("customers")
                    .select("id")
                    .eq("business_id", empresaId)
                    .eq("doc_number", customerData.docId)
                    .maybeSingle();

                if (existingClient) {
                    clientId = (existingClient as any).id;
                    // Optional: Update client info could go here
                } else {
                    // Create new
                    const { data: newClient, error: clientError } = await supabase
                        .from("customers")
                        .insert({
                            business_id: empresaId,
                            doc_number: customerData.docId,
                            full_name: customerData.name,
                            email: customerData.email || null,
                            phone: customerData.phone || null,
                            address: "Registrado en POS"
                        } as any)
                        .select()
                        .single();

                    if (clientError) throw clientError;
                    if (newClient) {
                        clientId = (newClient as any).id;
                    }
                }
            }

            // 2. Create Sale
            const { data: sale, error: saleError } = await supabase
                .from("sales")
                .insert({
                    business_id: empresaId,
                    seller_id: userProfile.id,
                    client_id: clientId, // Link to customer
                    total: total,
                    payment_method: paymentMethod,
                    status: 'completed',
                } as any)
                .select()
                .single();

            if (saleError) throw saleError;
            if (!sale) throw new Error("No se pudo crear la venta");

            // 3. Create Sale Items
            const saleItems = items.map((item) => ({
                sale_id: (sale as any).id,
                business_id: empresaId,
                variant_id: item.variant_id || null,
                quantity: item.cantidad,
                unit_price: item.precio,
                subtotal: item.precio * item.cantidad
            }));

            const { error: itemsError } = await supabase
                .from("sale_items")
                .insert(saleItems as any);

            if (itemsError) throw itemsError;

            // 4. Stock Update & Invalidation
            await queryClient.invalidateQueries({ queryKey: ["products"] });
            await queryClient.invalidateQueries({ queryKey: ["finanzas"] });
            await queryClient.invalidateQueries({ queryKey: ["alerts"] });
            await queryClient.invalidateQueries({ queryKey: ["customers"] });
            await queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });

            toast.success(`Venta registrada exitosamente: $${total.toLocaleString()}`);
            clearCart();

        } catch (error: any) {
            console.error("Checkout error:", error);
            toast.error("Error al procesar la venta: " + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <PageContainer
            title="Gestión de Ventas"
            description="Punto de venta e historial de transacciones."
        >
            <Tabs defaultValue="pos" className="w-full space-y-4">
                <div className="flex items-center justify-between px-1">
                    <TabsList className="grid w-full md:w-[400px] grid-cols-2">
                        <TabsTrigger value="pos" className="gap-2 text-xs md:text-sm">
                            <ShoppingCart className="h-4 w-4" /> Punto de Venta
                        </TabsTrigger>
                        <TabsTrigger value="history" className="gap-2 text-xs md:text-sm">
                            <History className="h-4 w-4" /> Historial
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="pos" className="space-y-0 md:space-y-4 h-full">
                    <div className="h-[calc(100dvh-180px)] md:h-[calc(85dvh-8rem)] -mx-2 md:mx-0 p-0 gap-0 flex flex-col relative">
                        <div className="flex flex-col lg:flex-row h-full gap-4 max-h-full overflow-hidden">
                            {/* Left: Catalog */}
                            <div className="flex-1 min-w-0 bg-card rounded-lg border shadow-sm p-4 overflow-hidden flex flex-col">
                                <ProductCatalog onAddToCart={(product) => {
                                    addToCart(product);
                                    toast.success("Producto agregado al carrito");
                                }} />
                            </div>

                            {/* Right: Cart (Desktop) */}
                            <div className="hidden lg:block w-full lg:w-[400px] shrink-0 h-[400px] lg:h-full">
                                <CartPanel onCheckout={handleCheckout} isProcessing={isProcessing} />
                            </div>
                        </div>

                        {/* Mobile Cart Trigger & Sheet */}
                        <div className="lg:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button size="icon" className="fixed bottom-24 lg:bottom-6 right-6 h-14 w-14 rounded-full shadow-xl z-50 animate-in zoom-in duration-300">
                                        <div className="relative">
                                            <ShoppingCart className="h-6 w-6" />
                                            {items.reduce((acc, item) => acc + item.cantidad, 0) > 0 && (
                                                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold border-2 border-primary">
                                                    {items.reduce((acc, item) => acc + item.cantidad, 0)}
                                                </span>
                                            )}
                                        </div>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="h-[95dvh] p-0 rounded-t-[10px] flex flex-col">
                                    <div className="h-full pt-4">
                                        <CartPanel
                                            onCheckout={handleCheckout}
                                            isProcessing={isProcessing}
                                        />
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="history">
                    <SalesHistory />
                </TabsContent>
            </Tabs>
        </PageContainer>
    );
}

export default function Ventas() {
    return (
        <CartProvider>
            <VentasContent />
        </CartProvider>
    );
}
