'use client'
import { useAuthStore } from '@/stores/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { RecentSales } from '@/components/dashboard/recent-sales'
import { SalesChart } from '@/components/dashboard/sales-chart'
import { Button } from '@/components/ui/button'
import { Download, Plus } from 'lucide-react'
import { downloadSalesCSV } from '@/lib/reports'

export default function DashboardPage() {
    const { user, isLoading } = useAuthStore()
    const router = useRouter()
    const [businessId, setBusinessId] = useState<string | null>(null)

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login')
            return;
        }

        async function getBusiness() {
            if (!user) return
            const { data } = await supabase.from('business_members').select('business_id').eq('user_id', user.id).single()
            if (data) setBusinessId(data.business_id)
        }
        getBusiness()
    }, [isLoading, user, router])

    if (isLoading) return null
    if (!user) return null

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-primary-foreground/90 dark:text-white">Hola, {user.email?.split('@')[0]} 👋</h2>
                    <p className="text-muted-foreground mt-1">Aquí tienes el resumen de tu negocio de los últimos 30 días.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" className="bg-background">
                        Últimos 30 días
                    </Button>
                    <Button onClick={() => businessId && downloadSalesCSV(businessId)} variant="secondary">
                        <Download className="mr-2 h-4 w-4" />
                        Reporte
                    </Button>
                    <Button onClick={() => router.push('/dashboard/pos')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Venta
                    </Button>
                </div>
            </div>

            {businessId ? (
                <div className="space-y-8">
                    <DashboardStats businessId={businessId} />

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <div className="col-span-4">
                            <SalesChart businessId={businessId} />
                        </div>
                        <div className="col-span-3">
                            <RecentSales businessId={businessId} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex h-[400px] items-center justify-center rounded-xl border border-dashed p-8 text-center animate-in fade-in-50">
                    <div className="max-w-md space-y-2">
                        <h3 className="text-xl font-bold">No se encontró negocio</h3>
                        <p className="text-muted-foreground">Parece que no estás asignado a ningún negocio aún.</p>
                    </div>
                </div>
            )}
        </div>
    )
}
