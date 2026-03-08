import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-muted/40">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
                <Header />
                <main className="flex-1 p-6 md:p-8 pt-6 max-w-[1600px] w-full mx-auto animate-in fade-in zoom-in-95 duration-500">
                    {children}
                </main>
            </div>
        </div>
    )
}
