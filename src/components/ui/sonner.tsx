import { useTheme } from "next-themes";
import { Toaster as Sonner, toast as originalToast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

// Wrapper para deduplicar y limitar la frecuencia de toasts comunes
const last: { msg: string; type: string; ts: number } = { msg: "", type: "", ts: 0 };
const throttleMs = 600;

function call(type: "success" | "error" | "warning" | "info", message: string, options?: any) {
  const now = Date.now();
  const same = last.msg === String(message) && last.type === type;
  if (same && now - last.ts < throttleMs) return; // suprime duplicados muy seguidos
  last.msg = String(message);
  last.type = type;
  last.ts = now;
  // delega al toast original
  return (originalToast as any)[type](message, options);
}

export const toast = {
  ...originalToast,
  success: (message: string, options?: any) => call("success", message, options),
  error: (message: string, options?: any) => call("error", message, options),
  warning: (message: string, options?: any) => call("warning", message, options),
  info: (message: string, options?: any) => call("info", message, options),
};

export { Toaster };
