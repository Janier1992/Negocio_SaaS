import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const VAPID_PUBLIC = (import.meta.env as any)?.VITE_VAPID_PUBLIC_KEY as string | undefined;

export default function PushSetup() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(Notification.permission);
  const [shouldShow, setShouldShow] = useState(false);
  const [swReady, setSwReady] = useState(false);

  useEffect(() => {
    const ok = "serviceWorker" in navigator && "PushManager" in window;
    setSupported(ok);
    if (!ok) return;
    // Verificar si el SW está listo
    navigator.serviceWorker.ready.then(() => setSwReady(true)).catch(() => setSwReady(false));
    // Mostrar solo si el permiso está en 'default' y no se ha marcado como completado/oculto
    const dismissed = localStorage.getItem("push-setup-dismissed") === "1";
    const done = localStorage.getItem("push-setup-done") === "1";
    setShouldShow(!dismissed && !done && Notification.permission === "default");
  }, []);

  const requestPermission = async () => {
    try {
      const p = await Notification.requestPermission();
      setPermission(p);
      if (p !== "granted") {
        toast.info("Permiso de notificaciones no concedido");
        // Ocultar para no interferir cuando el usuario no quiere
        localStorage.setItem("push-setup-dismissed", "1");
        setShouldShow(false);
        return;
      }
      await subscribePush();
    } catch (e) {
      toast.error("No se pudo solicitar permisos de notificaciones");
    }
  };

  const subscribePush = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        toast.error("Service Worker no registrado");
        return;
      }
      if (!VAPID_PUBLIC) {
        toast.info("VAPID_PUBLIC_KEY no configurado; suscripción omitida");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });
      // TODO: enviar 'sub' a tu backend para almacenarla (Supabase/Edge)
      console.log("Push subscription:", sub);
      toast.success("Notificaciones habilitadas");
      // Marcar como completado y ocultar el banner
      localStorage.setItem("push-setup-done", "1");
      setShouldShow(false);
    } catch (e: any) {
      const msg = String(e?.message || e || "");
      toast.error(msg || "No se pudo suscribir a notificaciones push");
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("push-setup-dismissed", "1");
    setShouldShow(false);
  };

  if (!supported || !swReady || !shouldShow) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-16 right-4 z-40 shadow-lg rounded-md bg-card border p-3 flex items-center gap-3 md:bottom-6 md:right-6"
    >
      <div className="text-sm">Habilita notificaciones push</div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={requestPermission}>
          Permitir
        </Button>
        <button
          className="text-xs text-muted-foreground hover:text-foreground"
          aria-label="Cerrar aviso"
          onClick={handleDismiss}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
