
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, CreditCard, Banknote, User } from "lucide-react";
import { useState } from "react";

interface CustomerData {
    docId: string;
    name: string;
    email: string;
    phone: string;
}

interface CartPanelProps {
    onCheckout: (method: string, customer: CustomerData) => Promise<void>;
    isProcessing: boolean;
}

export function CartPanel({ onCheckout, isProcessing }: CartPanelProps) {
    const { items, updateQuantity, removeFromCart, total, clearCart } = useCart();
    const [paymentMethod, setPaymentMethod] = useState("efectivo");
    const [customerData, setCustomerData] = useState<CustomerData>({
        docId: "",
        name: "",
        email: "",
        phone: ""
    });

    const handleCheckoutClick = () => {
        onCheckout(paymentMethod, customerData);
    };

    return (
        <Card className="h-full flex flex-col border-0 shadow-lg lg:rounded-l-none lg:border-l">
            <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="flex justify-between items-center text-lg">
                    <span>Ticket de Venta</span>
                    <Button variant="ghost" size="sm" onClick={clearCart} disabled={items.length === 0} className="text-muted-foreground hover:text-destructive text-xs h-7 px-2">
                        Limpiar
                    </Button>
                </CardTitle>

                {/* Customer Form - Compact */}
                <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-4 space-y-0.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground">Cédula *</label>
                            <input
                                className="flex h-7 w-full rounded-md border border-input bg-background px-2 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                placeholder="123..."
                                value={customerData.docId}
                                onChange={(e) => setCustomerData({ ...customerData, docId: e.target.value })}
                            />
                        </div>
                        <div className="col-span-8 space-y-0.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground">Nombre *</label>
                            <input
                                className="flex h-7 w-full rounded-md border border-input bg-background px-2 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                placeholder="Juan Pérez"
                                value={customerData.name}
                                onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Collapsible details or second row */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                            <input
                                className="flex h-7 w-full rounded-md border border-input bg-background px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                placeholder="Email (Opcional)"
                                value={customerData.email}
                                onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-0.5">
                            <input
                                className="flex h-7 w-full rounded-md border border-input bg-background px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                placeholder="Teléfono (Opcional)"
                                value={customerData.phone}
                                onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </CardHeader>

            <Separator />

            {/* Cart Items - Table View */}
            <div className="flex-1 overflow-y-auto bg-muted/10 p-2 min-h-0">
                <div className="bg-background rounded-md border shadow-sm overflow-hidden h-full">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[45%] h-8 text-xs">Producto</TableHead>
                                <TableHead className="w-[20%] h-8 text-xs text-center">Cant.</TableHead>
                                <TableHead className="w-[25%] h-8 text-xs text-right">Total</TableHead>
                                <TableHead className="w-[10%] h-8"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center opacity-50">
                                            <CreditCard className="h-6 w-6 mb-1" />
                                            <p className="text-xs">Vacío</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item) => (
                                    <TableRow key={item.id} className="text-xs">
                                        <TableCell className="font-medium p-2">
                                            <div className="flex flex-col">
                                                <span className="truncate max-w-[110px]" title={item.nombre}>
                                                    {item.nombre}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    ${item.precio.toLocaleString()}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-1 text-center">
                                            <div className="flex items-center justify-center gap-0.5">
                                                <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full" onClick={() => updateQuantity(item.id, item.cantidad - 1)}>-</Button>
                                                <span className="w-4 text-center font-mono">{item.cantidad}</span>
                                                <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full" onClick={() => updateQuantity(item.id, item.cantidad + 1)}>+</Button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-bold tabular-nums p-2">
                                            ${(item.precio * item.cantidad).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-center p-0 pr-1">
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeFromCart(item.id)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Separator />

            {/* Payment & Totals */}
            <div className="p-3 bg-background space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        variant={paymentMethod === "efectivo" ? "default" : "outline"}
                        size="sm"
                        className="flex gap-2 h-8 text-xs"
                        onClick={() => setPaymentMethod("efectivo")}
                    >
                        <Banknote className="h-3 w-3" /> Efectivo
                    </Button>
                    <Button
                        variant={paymentMethod === "tarjeta" ? "default" : "outline"}
                        size="sm"
                        className="flex gap-2 h-8 text-xs"
                        onClick={() => setPaymentMethod("tarjeta")}
                    >
                        <CreditCard className="h-3 w-3" /> Tarjeta
                    </Button>
                </div>

                <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold pt-1 border-t">
                        <span>Total</span>
                        <span>${total.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <CardFooter className="p-4 pt-0">
                <Button
                    size="lg"
                    className="w-full font-bold text-lg h-12"
                    onClick={handleCheckoutClick}
                    disabled={items.length === 0 || isProcessing}
                >
                    {isProcessing ? "Procesando..." : `Cobrar $${total.toLocaleString()}`}
                </Button>
            </CardFooter>
        </Card>
    );
}
