'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Save } from 'lucide-react'

export default function NewProductPage() {
    const router = useRouter()
    const { user } = useAuthStore()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        sku: '',
        stock: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return
        setLoading(true)

        try {
            // 1. Get Business ID
            const { data: memberData } = await supabase
                .from('business_members')
                .select('business_id')
                .eq('user_id', user.id)
                .single()

            if (!memberData) throw new Error('No business found')

            // 2. Create Product
            const { data: product, error: productError } = await supabase
                .from('products')
                .insert({
                    business_id: memberData.business_id,
                    name: formData.name,
                    description: formData.description,
                    is_active: true
                })
                .select()
                .single()

            if (productError) throw productError

            // 3. Create Default Variant
            const { error: variantError } = await supabase
                .from('product_variants')
                .insert({
                    business_id: memberData.business_id,
                    product_id: product.id,
                    sku: formData.sku,
                    price: parseFloat(formData.price) || 0,
                    stock_level: parseInt(formData.stock) || 0,
                    attributes: { name: 'Default' }
                })

            if (variantError) throw variantError

            router.push('/dashboard/products')
            router.refresh()
        } catch (error: any) {
            alert('Error creating product: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/products">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Nuevo Producto</h1>
                    <p className="text-muted-foreground">Agrega un nuevo item a tu inventario.</p>
                </div>
            </div>

            <Card>
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle>Detalles del Producto</CardTitle>
                        <CardDescription>Ingresa la información básica.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre del Producto</Label>
                            <Input
                                id="name"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej: Camiseta Básica"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Descripción corta del producto..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Precio (Venta)</Label>
                                <Input
                                    id="price"
                                    required
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sku">SKU / Código</Label>
                                <Input
                                    id="sku"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                    placeholder="ABC-123"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="stock">Stock Inicial</Label>
                            <Input
                                id="stock"
                                type="number"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                placeholder="0"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Link href="/dashboard/products">
                            <Button variant="ghost" type="button">Cancelar</Button>
                        </Link>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : <><Save className="mr-2 h-4 w-4" /> Crear Producto</>}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}

