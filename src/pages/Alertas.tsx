import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
    Bell,
    AlertTriangle,
    CheckCircle,
    Info,
    Settings,
    Sparkles,
    User,
    Bot,
    Send,
    X,
    MessageCircle,
    ChevronDown,
    Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserProfile } from "@/hooks/useUserProfile";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { chatWithAI } from "@/services/aiService";
import { cn } from "@/lib/utils";

type AlertType = "warning" | "success" | "info" | "error";

interface AlertItem {
    id: string;
    title: string;
    description: string;
    type: AlertType;
    date: Date;
    read: boolean;
    source: "inventory" | "system" | "sales";
}

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

export default function Alertas() {
    const { empresaId } = useUserProfile();
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const [isOpen, setIsOpen] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Hola. Soy tu asistente de negocios. Puedo ayudarte a analizar tus alertas o darte recomendaciones sobre tu inventario y ventas. ¿En qué te ayudo hoy?",
            timestamp: new Date()
        }
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch Low Stock Products
    const { data: lowStockProducts = [] } = useQuery({
        queryKey: ["low_stock_alerts", empresaId],
        queryFn: async () => {
            if (!empresaId) return [];
            const { data, error } = await supabase
                .from("product_variants")
                .select("*, product:product_id(name)")
                .lt("stock_level", 10)
                .limit(20);

            if (error) {
                console.error("Error fetching low stock", error);
                return [];
            }
            return data as any[];
        },
        enabled: !!empresaId
    });

    // Real System Alerts (Empty for now until backend implementation)
    const [alerts, setAlerts] = useState<AlertItem[]>([]);

    // Merge Real Stock Alerts
    useEffect(() => {
        if (lowStockProducts.length > 0) {
            const stockAlerts: AlertItem[] = lowStockProducts.map((variant: any) => ({
                id: `stock-${variant.id}`,
                title: "Stock Bajo Detectado",
                description: `El producto "${variant.product?.name || 'Item'}" (SKU: ${variant.sku || 'N/A'}) tiene solo ${variant.stock_level} unidades.`,
                type: "warning",
                date: new Date(),
                read: false,
                source: "inventory"
            }));

            setAlerts(prev => {
                const existingIds = new Set(prev.map(a => a.id));
                const newAlerts = stockAlerts.filter(a => !existingIds.has(a.id));
                return [...newAlerts, ...prev].sort((a, b) => b.date.getTime() - a.date.getTime());
            });
        }
    }, [lowStockProducts]);

    // Auto-scroll chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatMessages, isOpen]);

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: "user",
            content: chatInput,
            timestamp: new Date()
        };

        setChatMessages(prev => [...prev, userMsg]);
        setChatInput("");

        // Prepare context from alerts and low stock
        const context = `
            Alertas Activas: ${alerts.filter(a => !a.read).length}.
            Productos con Stock Bajo: ${lowStockProducts.map(p => `${p.product?.name} (${p.stock_level})`).join(", ")}.
        `;

        try {
            const responseText = await chatWithAI(userMsg.content, context);
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: responseText,
                timestamp: new Date()
            };
            setChatMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            const errorMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "Lo siento, hubo un error al conectar con el servicio de IA.",
                timestamp: new Date()
            };
            setChatMessages(prev => [...prev, errorMsg]);
        }
    };

    const filteredAlerts = filter === "all" ? alerts : alerts.filter(a => !a.read);
    const markAsRead = (id: string) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    const deleteAlert = (id: string) => setAlerts(prev => prev.filter(a => a.id !== id));

    const getIcon = (type: AlertType) => {
        switch (type) {
            case "warning": return <AlertTriangle className="size-5 text-orange-500" />;
            case "error": return <AlertTriangle className="size-5 text-red-500" />;
            case "success": return <CheckCircle className="size-5 text-green-500" />;
            case "info": return <Info className="size-5 text-blue-500" />;
        }
    };

    const getBgColor = (type: AlertType) => {
        switch (type) {
            case "warning": return "bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30";
            case "error": return "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30";
            case "success": return "bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30";
            case "info": return "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30";
        }
    };

    return (
        <div className="relative flex flex-col h-[calc(100vh-2rem)] p-6 gap-6 bg-background-light dark:bg-background-dark font-sans animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-[#0d141b] dark:text-white tracking-tight flex items-center gap-3">
                        <Sparkles className="size-8 text-primary" /> Alertas & Agente IA
                    </h1>
                    <p className="text-[#4c739a] dark:text-[#8babc8] mt-1 ml-11">Centro de inteligencia y notificaciones de tu negocio.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={() => setIsOpen(true)}>
                        <Bot className="size-4" /> Consultar Agente
                    </Button>
                </div>
            </div>

            {/* Main Content - Full Width Alerts */}
            <div className="w-full flex flex-col gap-4 min-h-0 flex-1">
                <div className="flex gap-2 items-center shrink-0">
                    <h3 className="font-bold text-lg text-[#0d141b] dark:text-white">Notificaciones</h3>
                    <div className="ml-auto flex bg-gray-100 dark:bg-[#1a2632] p-1 rounded-lg">
                        <button onClick={() => setFilter("all")} className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${filter === "all" ? "bg-white shadow text-primary" : "text-gray-500"}`}>Todas</button>
                        <button onClick={() => setFilter("unread")} className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${filter === "unread" ? "bg-white shadow text-primary" : "text-gray-500"}`}>Sin Leer</button>
                    </div>
                </div>

                <ScrollArea className="flex-1 pr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredAlerts.length === 0 ? (
                            <div className="col-span-full h-40 flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-[#1a2632] rounded-xl border border-dashed border-[#e7edf3]">
                                <Bell className="size-8 text-gray-300 mb-2" />
                                <p className="text-[#4c739a]">No tienes notificaciones pendientes.</p>
                            </div>
                        ) : (
                            filteredAlerts.map(alert => (
                                <div key={alert.id} className={`group relative p-4 rounded-xl border transition-all hover:shadow-md ${getBgColor(alert.type)} ${alert.read ? 'opacity-70 grayscale-[0.5]' : 'bg-white dark:bg-[#1a2632] border-[#e7edf3] dark:border-[#2a3b4d]'}`}>
                                    <div className="flex gap-4 items-start">
                                        <div className="mt-1 shrink-0">{getIcon(alert.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h4 className={`font-bold text-sm truncate pr-2 ${alert.read ? 'text-[#4c739a]' : 'text-[#0d141b] dark:text-white'}`}>{alert.title}</h4>
                                                <span className="text-xs text-[#4c739a] flex items-center gap-1 shrink-0">
                                                    <Clock className="size-3" /> {format(alert.date, "p", { locale: es })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-[#4c739a] dark:text-[#8babc8] mt-1 line-clamp-2">{alert.description}</p>
                                            {!alert.read && (
                                                <div className="mt-3">
                                                    <Button size="sm" variant="ghost" className="h-6 text-xs text-primary px-0 hover:bg-transparent hover:underline" onClick={() => markAsRead(alert.id)}>Marcar leído</Button>
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={() => deleteAlert(alert.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X className="size-3" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Floating Chat Widget */}
            <div className="fixed bottom-24 md:bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">

                {/* Chat Window */}
                <div className={cn(
                    "pointer-events-auto w-[380px] h-[600px] max-h-[70vh] bg-white dark:bg-[#1a2632] rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right",
                    isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-10 h-0"
                )}>
                    {/* Chat Header */}
                    <div className="p-4 bg-primary text-primary-foreground flex justify-between items-center shrink-0">
                        <div className="flex gap-3 items-center">
                            <div className="p-1.5 bg-white/20 rounded-full">
                                <Bot className="size-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Asistente Virtual</h3>
                                <p className="text-[10px] text-green-200 flex items-center gap-1"><span className="size-1.5 rounded-full bg-green-400 animate-pulse"></span> En línea</p>
                            </div>
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20 rounded-full" onClick={() => setIsOpen(false)}>
                            <ChevronDown className="size-5" />
                        </Button>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-transparent" ref={scrollRef}>
                        {chatMessages.map(msg => (
                            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`size-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-[#0d141b] text-white' : 'bg-primary/10 text-primary'}`}>
                                    {msg.role === 'user' ? <User className="size-4" /> : <Bot className="size-4" />}
                                </div>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-[#0d141b] text-white rounded-tr-none' : 'bg-white dark:bg-[#23303e] text-[#0d141b] dark:text-white rounded-tl-none border border-gray-100 dark:border-gray-800'}`}>
                                    <p>{msg.content}</p>
                                    <span className="text-[10px] opacity-50 block mt-1 text-right">{format(msg.timestamp, "HH:mm")}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chat Input */}
                    <div className="p-3 border-t border-[#e7edf3] dark:border-[#2a3b4d] bg-white dark:bg-[#1a2632] shrink-0">
                        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2 relative">
                            <Input
                                placeholder="Escribe tu consulta..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                className="pr-10 bg-gray-50 dark:bg-[#23303e] border-gray-200 dark:border-gray-700 focus-visible:ring-1 focus-visible:ring-primary rounded-full px-4 h-11"
                            />
                            <Button type="submit" size="icon" className="absolute right-1 top-1 h-9 w-9 rounded-full bg-primary hover:bg-primary/90 transition-colors shadow-sm" disabled={!chatInput.trim()}>
                                <Send className="size-4" />
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Toggle Button (FAB) */}
                <Button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "pointer-events-auto h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 aspect-square p-0 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-50",
                        isOpen ? "rotate-90 bg-red-500 hover:bg-red-600" : ""
                    )}
                >
                    {isOpen ? <X className="size-6" /> : <MessageCircle className="size-8" />}
                </Button>
            </div>
        </div>
    );
}
