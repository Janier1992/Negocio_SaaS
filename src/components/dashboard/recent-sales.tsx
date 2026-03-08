'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
// cleaned imports 
// CHECK: user didn't install date-fns. I will use Intl.DateTimeFormat or simple math to avoid error.

export function RecentSales({ businessId }: { businessId: string }) {
    const [sales, setSales] = useState<any[]>([]) // using any for speed, ideally typed
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchRecent() {
            if (!businessId) return

            const { data, error } = await supabase
                .from('sales')
                .select('id, total, created_at, status, payment_method')
                .eq('business_id', businessId)
                .order('created_at', { ascending: false })
                .limit(5)

            if (!error && data) {
                setSales(data)
            }
            setLoading(false)
        }

        fetchRecent()
    }, [businessId])

    if (loading) return <div>Cargando historial...</div>

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Ventas Recientes</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {sales.length === 0 ? (
                        <p className="text-muted-foreground text-sm text-center py-4">No hay ventas registradas aún.</p>
                    ) : (
                        sales.map(sale => (
                            <div key={sale.id} className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">Venta #{sale.id.slice(0, 8)}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(sale.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge variant="outline" className="hidden sm:inline-flex capitalize">{sale.payment_method}</Badge>
                                    <div className="font-medium">+${sale.total.toFixed(2)}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
