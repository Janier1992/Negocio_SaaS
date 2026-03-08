'use client'
// ... existing imports
// We'll append the new checkout logic to the existing file in the next step or rewrite here.
// Rewriting mostly for context, but will use replace logic if file is large. Since it is moderate, I will just rewrite the component key parts or upgrade it.
// Actually, I'll update the POSPage component I just wrote to include the real checkout logic using Supaba'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'
import { useAuthStore } from '@/stores/auth-store'
import { Search, ShoppingCart, Trash2, Plus, Minus, Loader2, CreditCard, Banknote } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

type ProductVariant = Database['public']['Tables']['product_variants']['Row']
type Product = Database['public']['Tables']['products']['Row'] & {
    variants: ProductVariant[]
}

type CartItem = {
    uniqueId: string
    productId: string
    variantId: string
    name: string
    sku: string
    price: number
    quantity: number
    maxStock: number
}

export default function POSPage() {
    const { user } = useAuthStore()
    const [products, setProducts] = useState<Product[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        async function init() {
            if (!user) return
            const { data: member } = await supabase.from('business_members').select('business_id').eq('user_id', user.id).single()
            if (!member) return

            const { data } = await supabase
                .from('products')
                .select(`*, variants:product_variants(*)`)
                .eq('business_id', member.business_id)
                .eq('is_active', true)

            if (data) setProducts(data)
            setLoading(false)
        }
        init()
    }, [user])

    const addToCart = (product: Product, variant: ProductVariant) => {
        const uniqueId = `${product.id}-${variant.id}`
        setCart(prev => {
            const existing = prev.find(item => item.uniqueId === uniqueId)
            if (existing) {
                if (existing.quantity >= existing.maxStock) {
                    alert('No hay suficiente stock')
                    return prev
                }
                return prev.map(item => item.uniqueId === uniqueId ? { ...item, quantity: item.quantity + 1 } : item)
            }
            return [...prev, {
                uniqueId,
                productId: product.id,
                variantId: variant.id,
                name: product.name,
                sku: variant.sku || '',
                price: variant.price,
                quantity: 1,
                maxStock: variant.stock_level || 0
            }]
        })
    }

    const removeFromCart = (uniqueId: string) => setCart(prev => prev.filter(item => item.uniqueId !== uniqueId))

    const updateQuantity = (uniqueId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.uniqueId === uniqueId) {
                const newQty = item.quantity + delta
                if (newQty < 1) return item
                if (newQty > item.maxStock) {
                    return item
                }
                return { ...item, quantity: newQty }
            }
            return item
        }))
    }

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    const handleCheckout = async () => {
        if (cart.length === 0 || !user) return
        if (!confirm(`Confirmar venta por $${cartTotal.toFixed(2)}?`)) return

        setProcessing(true)
        try {
            const { data: member } = await supabase.from('business_members').select('business_id').eq('user_id', user.id).single()
            if (!member) throw new Error('Usuario sin negocio')

            const { data: sale, error: saleError } = await supabase.from('sales').insert({
                business_id: member.business_id,
                total: cartTotal,
                seller_id: user.id,
                status: 'paid',
                payment_method: 'cash'
            }).select().single()

            if (saleError) throw saleError

            for (const item of cart) {
                await supabase.from('sale_items').insert({
                    business_id: member.business_id,
                    sale_id: sale.id,
                    variant_id: item.variantId,
                    quantity: item.quantity,
                    unit_price: item.price
                })

                const { error: stockError } = await supabase.rpc('decrement_stock', {
                    p_variant_id: item.variantId,
                    p_quantity: item.quantity
                })

                if (stockError) {
                    const currentStock = item.maxStock
                    await supabase.from('product_variants')
                        .update({ stock_level: currentStock - item.quantity })
                        .eq('id', item.variantId)
                }
            }

            // alert('¡Venta realizada con éxito!')
            setCart([])
            // Refresh products
            const { data } = await supabase
                .from('products')
                .select(`*, variants:product_variants(*)`)
                .eq('business_id', member.business_id)
                .eq('is_active', true)

            if (data) setProducts(data)

        } catch (e: any) {
            alert('Error procesando venta: ' + e.message)
        } finally {
            setProcessing(false)
        }
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.variants.some(v => v.sku?.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-6rem)] gap-4 lg:gap-6 pb-8 lg:pb-0">

            {/* LEFT: Product Grid */}
            <div className="flex-1 flex flex-col space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        type="search"
                        placeholder="Buscar por nombre o SKU..."
                        className="pl-9 h-12 text-lg"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>

                <Card className="flex-1 overflow-hidden border-border/50 min-h-[500px] lg:min-h-0">
                    <div className="h-full overflow-y-auto p-4 bg-muted/10">
                        {loading ? (
                            <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredProducts.map(product => {
                                    const mainVariant = product.variants?.[0]
                                    if (!mainVariant) return null
                                    const outOfStock = (mainVariant.stock_level ?? 0) <= 0

                                    return (
                                        <Card
                                            key={product.id}
                                            className={`cursor-pointer transition-all hover:border-primary/50 active:scale-95 group overflow-hidden ${outOfStock ? 'opacity-60' : ''}`}
                                            onClick={() => !outOfStock && addToCart(product, mainVariant)}
                                        >
                                            <CardHeader className="p-4 pb-2">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h3 className="font-semibold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">{product.name}</h3>
                                                </div>
                                                <p className="text-xs text-muted-foreground font-mono">{mainVariant.sku}</p>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-2">
                                                <div className="flex items-end justify-between mt-2">
                                                    <span className="text-lg font-bold">${mainVariant.price}</span>
                                                    <Badge variant={outOfStock ? "destructive" : "secondary"}>
                                                        {outOfStock ? 'Agotado' : `${mainVariant.stock_level}`}
                                                    </Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* RIGHT: Cart */}
            <Card className="w-full lg:w-[400px] flex flex-col shadow-xl border-border/50 h-auto lg:h-full">
                <CardHeader className="p-4 border-b bg-muted/20">
                    <CardTitle className="flex items-center justify-between text-lg">
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-primary" />
                            <span>Ticket de Venta</span>
                        </div>
                        {cart.length > 0 && (
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-destructive" onClick={() => { if (confirm('¿Limpiar carrito?')) setCart([]) }}>
                                Limpiar
                            </Button>
                        )}
                    </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 space-y-4">
                            <ShoppingCart className="w-16 h-16" />
                            <p className="font-medium">Carrito vacío</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {cart.map(item => (
                                <div key={item.uniqueId} className="flex gap-3 items-center group">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{item.name}</p>
                                        <div className="flex justify-between items-center pr-2">
                                            <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                                            <p className="text-xs font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
                                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm" onClick={() => updateQuantity(item.uniqueId, -1)}>
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="w-6 text-center text-xs font-bold tabular-nums">{item.quantity}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-sm" onClick={() => updateQuantity(item.uniqueId, 1)}>
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>

                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeFromCart(item.uniqueId)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>

                <Separator />

                <div className="p-6 bg-muted/20 space-y-6">
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>${cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 text-foreground">
                            <span>Total</span>
                            <span>${cartTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="w-full" disabled={cart.length === 0}>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Tarjeta
                        </Button>
                        <Button variant="outline" className="w-full" disabled={cart.length === 0}>
                            <Banknote className="w-4 h-4 mr-2" />
                            Efectivo
                        </Button>
                    </div>

                    <Button
                        size="lg"
                        className="w-full text-lg font-bold shadow-lg shadow-primary/20"
                        disabled={cart.length === 0 || processing}
                        onClick={handleCheckout}
                    >
                        {processing ? <Loader2 className="animate-spin mr-2" /> : 'Cobrar'}
                        {!processing && `$${cartTotal.toFixed(2)}`}
                    </Button>
                </div>
            </Card>
        </div>
    )
}

