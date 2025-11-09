import { useEffect, useState } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { Loader2, ShieldAlert } from "lucide-react";

export const RequirePermission = ({ permission, children }: { permission: string; children: React.ReactNode }) => {
  const { hasPermission } = usePermissions();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const ok = await hasPermission(permission);
        if (mounted) setAllowed(ok);
      } catch {
        if (mounted) setAllowed(false);
      }
    };
    check();
    return () => { mounted = false; };
  }, [permission, hasPermission]);

  if (allowed === null) {
    return (
      <div className="min-h-40 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="min-h-40 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <ShieldAlert className="h-5 w-5" />
          <span>No tienes permisos para acceder a esta sección.</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};