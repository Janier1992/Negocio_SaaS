'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search, Loader2 } from 'lucide-react'

type Product = Database['public']['Tables']['products']['Row'] & {
    variants?: Database['public']['Tables']['product_variants']['Row'][]
}

export default function ProductsPage() {
    const { user } = useAuthStore()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        if (!user) return

        const fetchProducts = async () => {
            const { data: member } = await supabase.from('business_members').select('business_id').eq('user_id', user.id).single()
            if (!member) return

            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    variants:product_variants(count)
                `)
                .eq('business_id', member.business_id)
                .order('name')

            if (data) {
                // @ts-ignore: Supabase types for count are tricky
                setProducts(data)
            }
            setLoading(false)
        }

        fetchProducts()
    }, [user])

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
                <Button asChild>
                    <Link href="/dashboard/products/new">
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Inventario</CardTitle>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Buscar productos..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Variantes</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No se encontraron productos.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredProducts.map((product) => (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell>
                                                <Badge variant={product.is_active ? 'success' : 'secondary'}>
                                                    {product.is_active ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {/* @ts-ignore */}
                                                {product.variants?.[0]?.count ?? 0}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button asChild variant="ghost" size="sm">
                                                    <Link href={`/dashboard/products/${product.id}`}>
                                                        Editar
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
