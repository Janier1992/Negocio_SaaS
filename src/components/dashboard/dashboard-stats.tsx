'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DollarSign, ShoppingBag, CreditCard, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function DashboardStats({ businessId }: { businessId: string }) {
    const [stats, setStats] = useState({
        totalSales: 0,
        orderCount: 0,
        avgTicket: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            if (!businessId) return

            const { data: sales, error } = await supabase
                .from('sales')
                .select('total')
                .eq('business_id', businessId)
                .eq('status', 'paid')

            if (!error && sales) {
                const total = sales.reduce((acc, curr) => acc + curr.total, 0)
                const count = sales.length
                setStats({
                    totalSales: total,
                    orderCount: count,
                    avgTicket: count > 0 ? total / count : 0
                })
            }
            setLoading(false)
        }

        fetchStats()
    }, [businessId])

    if (loading) return <div className="grid gap-4 md:grid-cols-3 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted/20 rounded-xl"></div>)}
    </div>

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${stats.totalSales.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                        <span className="text-emerald-500 font-medium flex items-center mr-1">
                            +20.1% <TrendingUp className="h-3 w-3 ml-1" />
                        </span>
                        vs mes anterior
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ventas Realizadas</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+{stats.orderCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">Transacciones procesadas</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${stats.avgTicket.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Promedio por orden</p>
                </CardContent>
            </Card>
        </div>
    )
}
