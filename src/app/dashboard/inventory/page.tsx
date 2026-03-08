'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'
import { useAuthStore } from '@/stores/auth-store'
import { Search, ArrowUpCircle, ArrowDownCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

type ProductVariant = Database['public']['Tables']['product_variants']['Row'] & {
    product: Database['public']['Tables']['products']['Row']
}

export default function InventoryPage() {
    const { user } = useAuthStore()
    const [variants, setVariants] = useState<ProductVariant[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [businessId, setBusinessId] = useState<string | null>(null)

    // State for Adjustment Modal
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
    const [adjustmentType, setAdjustmentType] = useState<'in' | 'out'>('in')
    const [adjustmentQty, setAdjustmentQty] = useState('')
    const [adjusting, setAdjusting] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    useEffect(() => {
        if (selectedVariant) {
            setIsDialogOpen(true)
        } else {
            setIsDialogOpen(false)
        }
    }, [selectedVariant])

    const closeDialog = () => {
        setIsDialogOpen(false)
        setTimeout(() => setSelectedVariant(null), 300) // Wait for animation
    }

    useEffect(() => {
        async function init() {
            if (!user) return
            const { data: member } = await supabase.from('business_members').select('business_id').eq('user_id', user.id).single()
            if (!member) return
            setBusinessId(member.business_id)

            fetchInventory(member.business_id)
        }
        init()
    }, [user])

    async function fetchInventory(bId: string) {
        // Join variants with products to get names
        const { data, error } = await supabase
            .from('product_variants')
            .select(`
            *,
            product:products(name, description)
        `)
            .eq('business_id', bId)
            .order('stock_level', { ascending: true })

        if (data) {
            // @ts-ignore relationship typing
            setVariants(data)
        }
        setLoading(false)
    }

    const handleAdjustment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedVariant || !businessId || !user) return
        setAdjusting(true)

        const qty = parseInt(adjustmentQty)
        if (isNaN(qty) || qty <= 0) {
            alert('Cantidad inválida')
            setAdjusting(false)
            return
        }

        try {
            // 1. Create Movement Record
            const { error: moveError } = await supabase.from('inventory_movements').insert({
                business_id: businessId,
                variant_id: selectedVariant.id,
                type: adjustmentType === 'in' ? 'purchase' : 'adjustment',
                quantity: adjustmentType === 'in' ? qty : -qty,
            })

            if (moveError) throw moveError

            // 2. Update Variant Stock
            const newStock = adjustmentType === 'in'
                ? (selectedVariant.stock_level ?? 0) + qty
                : (selectedVariant.stock_level ?? 0) - qty

            const { error: updateError } = await supabase
                .from('product_variants')
                .update({ stock_level: newStock })
                .eq('id', selectedVariant.id)

            if (updateError) throw updateError

            // alert('Ajuste realizado')
            fetchInventory(businessId) // Refresh list
            closeDialog()
            setAdjustmentQty('')

        } catch (error: any) {
            alert('Error: ' + error.message)
        } finally {
            setAdjusting(false)
        }
    }

    const filteredVariants = variants.filter(v =>
        // @ts-ignore
        v.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
                <p className="text-muted-foreground">Monitorea niveles de stock y registra movimientos.</p>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar producto o SKU..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Producto</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Precio</TableHead>
                                <TableHead>Stock Actual</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        Cargando inventario...
                                    </TableCell>
                                </TableRow>
                            ) : filteredVariants.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No se encontraron productos.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredVariants.map(variant => (
                                    <TableRow key={variant.id}>
                                        <TableCell className="font-medium">
                                            {/* @ts-ignore */}
                                            {variant.product?.name}
                                            {variant.attributes && Object.keys(variant.attributes as any).length > 0 &&
                                                <span className="text-muted-foreground font-normal ml-2 text-xs">
                                                    ({JSON.stringify(variant.attributes).slice(1, -1)})
                                                </span>
                                            }
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{variant.sku || '-'}</TableCell>
                                        <TableCell>${variant.price}</TableCell>
                                        <TableCell>
                                            <Badge variant={(variant.stock_level ?? 0) <= 5 ? 'destructive' : 'default'} className="font-mono">
                                                {variant.stock_level} Unidades
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 w-8 p-0 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                                                    onClick={() => { setSelectedVariant(variant); setAdjustmentType('in'); }}
                                                    title="Entrada / Compra"
                                                >
                                                    <ArrowUpCircle className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                                    onClick={() => { setSelectedVariant(variant); setAdjustmentType('out'); }}
                                                    title="Salida / Ajuste"
                                                >
                                                    <ArrowDownCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ajuste de Inventario</DialogTitle>
                        <DialogDescription>
                            Registra una entrada o salida manual de stock.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedVariant && (
                        <form onSubmit={handleAdjustment} className="space-y-4 py-2">
                            <div className="rounded-md bg-muted p-3">
                                <p className="text-sm font-medium">Produkt: {/* @ts-ignore */}{selectedVariant.product?.name}</p>
                                <p className="text-xs text-muted-foreground">SKU: {selectedVariant.sku}</p>
                                <p className="text-xs text-muted-foreground">Actual: {selectedVariant.stock_level}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    type="button"
                                    variant={adjustmentType === 'in' ? 'default' : 'outline'}
                                    className={adjustmentType === 'in' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                                    onClick={() => setAdjustmentType('in')}
                                >
                                    <ArrowUpCircle className="w-4 h-4 mr-2" />
                                    Entrada
                                </Button>
                                <Button
                                    type="button"
                                    variant={adjustmentType === 'out' ? 'destructive' : 'outline'}
                                    onClick={() => setAdjustmentType('out')}
                                >
                                    <ArrowDownCircle className="w-4 h-4 mr-2" />
                                    Salida
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <Label>Cantidad</Label>
                                <Input
                                    type="number"
                                    autoFocus
                                    required
                                    min="1"
                                    placeholder="0"
                                    value={adjustmentQty}
                                    onChange={e => setAdjustmentQty(e.target.value)}
                                />
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={closeDialog}>Cancelar</Button>
                                <Button type="submit" disabled={adjusting}>
                                    {adjusting ? 'Guardando...' : 'Confirmar Ajuste'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

