import { supabase } from '@/lib/supabase'

export async function downloadSalesCSV(businessId: string) {
    try {
        const { data: sales, error } = await supabase
            .from('sales')
            .select('*')
            .eq('business_id', businessId)
            .order('created_at', { ascending: false })

        if (error || !sales) throw error || new Error('No data')

        // Define headers
        const headers = ['ID', 'Fecha', 'Total', 'Metodo Pago', 'Estado']

        // Convert to CSV string
        const csvContent = [
            headers.join(','),
            ...sales.map(sale => [
                sale.id,
                new Date(sale.created_at).toLocaleString(),
                sale.total,
                sale.payment_method,
                sale.status
            ].join(','))
        ].join('\n')

        // Trigger download
        const blob = new Blob(['\uFEFF', csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `ventas_${new Date().toISOString().slice(0, 10)}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    } catch (e) {
        alert('Error descargando reporte')
        console.error(e)
    }
}
