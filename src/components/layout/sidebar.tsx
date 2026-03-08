'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingCart, Package, Users, Settings, LogOut, Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { supabase } from '@/lib/supabase'

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Ventas', href: '/dashboard/pos', icon: ShoppingCart },
    { name: 'Inventario', href: '/dashboard/inventory', icon: Package },
    { name: 'Productos', href: '/dashboard/products', icon: Store },
    { name: 'Clientes', href: '/dashboard/customers', icon: Users }, // Placeholder for now
    { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()
    const { user } = useAuthStore()

    return (
        <div className="hidden border-r bg-gray-50/40 lg:block dark:bg-gray-800/40 w-[240px] h-screen sticky top-0 flex flex-col">
            <div className="flex h-16 items-center border-b px-6">
                <Link className="flex items-center gap-2 font-bold text-xl" href="/dashboard">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                        N
                    </div>
                    <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Negocios</span>
                </Link>
            </div>

            <div className="flex-1 overflow-auto py-2">
                <nav className="grid items-start px-4 text-sm font-medium">
                    {navItems.map((item, index) => (
                        <Link
                            key={index}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                pathname === item.href
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.name}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="border-t p-4">
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                        {user?.email?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-medium truncate w-[120px]">{user?.email}</span>
                        <span className="text-[10px] text-muted-foreground">Propietario</span>
                    </div>
                </div>
                <button
                    onClick={() => supabase.auth.signOut()}
                    className="mt-2 w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
                >
                    <LogOut className="h-3 w-3" />
                    Cerrar Sesión
                </button>
            </div>
        </div>
    )
}
