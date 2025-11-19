import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type DeferredPrompt = any; // BeforeInstallPromptEvent (no tipado en TS estándar)

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<DeferredPrompt | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as DeferredPrompt);
      setVisible(true);
      toast.info("La app puede instalarse. Usa el botón Instalar.");
    };
    window.addEventListener("beforeinstallprompt", handler);
    const installed = () => {
      setDeferred(null);
      setVisible(false);
      toast.success("Aplicación instalada correctamente");
    };
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler as any);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  const onInstall = async () => {
    try {
      const prompt = deferred;
      if (!prompt) return;
      const r = await (prompt as any).prompt();
      const choice = r?.outcome || "unknown";
      if (choice === "accepted") {
        toast.success("Instalación aceptada");
      } else {
        toast.info("Instalación cancelada");
      }
      setDeferred(null);
      setVisible(false);
    } catch (e: any) {
      toast.error("No se pudo mostrar el prompt de instalación");
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 shadow-lg rounded-md bg-white dark:bg-neutral-900 border p-3 flex items-center gap-3">
      <div className="text-sm">Instala esta aplicación para acceso rápido.</div>
      <Button size="sm" onClick={onInstall}>
        Instalar
      </Button>
    </div>
  );
}
