
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setShowPrompt(true);
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, discard it
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top duration-500 w-[90%] max-w-sm">
            <div className="bg-primary text-primary-foreground p-4 rounded-lg shadow-lg flex items-center justify-between gap-4">
                <div className="flex-1">
                    <h4 className="font-bold text-sm">Instalar Aplicación</h4>
                    <p className="text-xs opacity-90">Instala Mi Negocio ERP para un acceso más rápido y uso sin conexión.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={handleInstallClick} size="sm" variant="secondary" className="whitespace-nowrap h-8">
                        <Download className="mr-2 h-4 w-4" /> Instalar
                    </Button>
                    <button onClick={() => setShowPrompt(false)} className="text-primary-foreground/80 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
