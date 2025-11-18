import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const VAPID_PUBLIC = (import.meta.env as any)?.VITE_VAPID_PUBLIC_KEY as string | undefined;

export default function PushSetup() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(Notification.permission);

  useEffect(() => {
    const ok = "serviceWorker" in navigator && "PushManager" in window;
    setSupported(ok);
  }, []);

  const requestPermission = async () => {
    try {
      const p = await Notification.requestPermission();
      setPermission(p);
      if (p !== "granted") {
        toast.info("Permiso de notificaciones no concedido");
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
    } catch (e: any) {
      const msg = String(e?.message || e || "");
      toast.error(msg || "No se pudo suscribir a notificaciones push");
    }
  };

  if (!supported) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 shadow rounded-md bg-white dark:bg-neutral-900 border p-3 flex items-center gap-3">
      <div className="text-sm">Habilita notificaciones push</div>
      <Button size="sm" onClick={requestPermission} disabled={permission === "granted"}>
        {permission === "granted" ? "Habilitadas" : "Permitir"}
      </Button>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}