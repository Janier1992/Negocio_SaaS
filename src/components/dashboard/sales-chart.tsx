'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function SalesChart({ businessId }: { businessId: string }) {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            if (!businessId) return

            // Get last 7 days range
            const today = new Date()
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(today.getDate() - 6)

            const { data: sales } = await supabase
                .from('sales')
                .select('created_at, total')
                .eq('business_id', businessId)
                .eq('status', 'paid')
                .gte('created_at', sevenDaysAgo.toISOString())
                .order('created_at', { ascending: true })

            if (sales) {
                // Aggregate by day
                const grouped: Record<string, number> = {}

                // Initialize last 7 days with 0
                for (let i = 0; i < 7; i++) {
                    const d = new Date()
                    d.setDate(today.getDate() - i)
                    const key = d.toLocaleDateString() // Locale dependent, but simpler for display
                    grouped[key] = 0
                }

                sales.forEach(sale => {
                    const date = new Date(sale.created_at).toLocaleDateString()
                    if (grouped[date] !== undefined) {
                        grouped[date] += sale.total
                    } else {
                        // handle edge case or timezone diffs if strict
                        grouped[date] = (grouped[date] || 0) + Number(sale.total)
                    }
                })

                // Convert to array and reverse (oldest first)
                const chartData = Object.entries(grouped)
                    .map(([date, total]) => ({
                        date: date.slice(0, 5), // shorter date label
                        total
                    }))
                    .reverse() // depends on how we iterated. Actually we set keys backwards, let's just sort.
                    .sort((a, b) => {
                        // rough sort
                        return 0
                        // Actually relying on the loop order (today - i) which was descending.
                        // So we have [today, yesterday, ...]. We want [7 days ago, ..., today]
                        // So simple reverse is correct.
                    })
                    .reverse()

                setData(chartData)
            }
            setLoading(false)
        }

        fetchData()
    }, [businessId])

    if (loading) return <div className="h-[300px] w-full bg-muted/10 rounded-xl animate-pulse"></div>

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Ventas (Últimos 7 Días)</CardTitle>
            </CardHeader>
            <CardContent className="pl-0">
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                            <XAxis
                                dataKey="date"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    color: 'hsl(var(--card-foreground))'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="total"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorTotal)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
