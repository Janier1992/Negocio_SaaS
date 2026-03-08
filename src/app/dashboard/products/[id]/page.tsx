'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, Save, Trash2, Plus } from 'lucide-react'

type Product = Database['public']['Tables']['products']['Row'] & {
    variants?: Database['public']['Tables']['product_variants']['Row'][]
}

export default function EditProductPage() {
    const router = useRouter()
    const params = useParams()
    const { user } = useAuthStore()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [product, setProduct] = useState<Product | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        is_active: true
    })

    useEffect(() => {
        async function fetchProduct() {
            if (!user) return

            const { data, error } = await supabase
                .from('products')
                .select(`
          *,
          variants:product_variants(*)
        `)
                .eq('id', params.id as string)
                .single()

            if (error) {
                console.error(error)
                router.push('/dashboard/products')
                return
            }

            setProduct(data)
            setFormData({
                name: data.name,
                description: data.description || '',
                is_active: data.is_active || true
            })
            setLoading(false)
        }

        fetchProduct()
    }, [user, params.id, router])

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        const { error } = await supabase
            .from('products')
            .update({
                name: formData.name,
                description: formData.description,
                is_active: formData.is_active,
                updated_at: new Date().toISOString()
            })
            .eq('id', params.id as string)

        if (error) {
            alert('Error updating product: ' + error.message)
        } else {
            // alert('Product updated successfully')
            router.refresh()
        }
        setSaving(false)
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure? This will delete the product and all inventory/sales history associated.')) return;

        const { error } = await supabase.from('products').delete().eq('id', params.id as string);

        if (error) alert(error.message)
        else router.push('/dashboard/products')
    }

    if (loading) return <div className="container py-8">Loading...</div>
    if (!product) return null

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/products">
                        <Button variant="ghost" size="icon">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Editar Producto</h1>
                        <p className="text-muted-foreground">Gestiona los detalles y variantes.</p>
                    </div>
                </div>
                <Button variant="destructive" onClick={handleDelete} className="gap-2">
                    <Trash2 className="h-4 w-4" /> Eliminar
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <form onSubmit={handleUpdate}>
                            <CardHeader>
                                <CardTitle>Información Básica</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nombre</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Descripción</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="active"
                                        checked={formData.is_active}
                                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                    />
                                    <Label htmlFor="active">Producto Activo</Label>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-end bg-muted/50 py-3">
                                <Button type="submit" disabled={saving}>
                                    {saving ? 'Guardando...' : <><Save className="h-4 w-4 mr-2" /> Guardar Cambios</>}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-medium">Variantes e Inventario</CardTitle>
                            <Button size="sm" variant="outline" onClick={() => alert('Pronto: Agregar Variante')}>
                                <Plus className="h-4 w-4 mr-2" /> Agregar
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Precio</TableHead>
                                        <TableHead>Stock</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {product.variants?.map(variant => (
                                        <TableRow key={variant.id}>
                                            <TableCell className="font-mono">{variant.sku || '-'}</TableCell>
                                            <TableCell>${variant.price}</TableCell>
                                            <TableCell>{variant.stock_level}</TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" variant="ghost">Editar</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Metadatos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">ID</span>
                                <span className="font-mono text-xs text-right truncate bg-muted p-1 rounded max-w-[120px]" title={product.id}>{product.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Creado</span>
                                <span>{new Date(product.created_at!).toLocaleDateString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

