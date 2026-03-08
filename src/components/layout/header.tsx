'use client'
import { Search, Bell, HelpCircle, Menu } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function Header() {
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-6 backdrop-blur-md">
            <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1">
                <div className="relative max-w-md hidden md:block">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar en todo el ERP (Ctrl+K)"
                        className="w-full bg-background pl-8 md:w-[300px] lg:w-[400px]"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <HelpCircle className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                </Button>
            </div>
        </header>
    )
}
