import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const TABLET_DESKTOP_SPLIT = 1024;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

// Devuelve true para móviles y tablets (ancho < 1024px)
export function useIsMobileOrTablet() {
  const [isCompact, setIsCompact] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${TABLET_DESKTOP_SPLIT - 1}px)`);
    const onChange = () => {
      setIsCompact(window.innerWidth < TABLET_DESKTOP_SPLIT);
    };
    mql.addEventListener("change", onChange);
    setIsCompact(window.innerWidth < TABLET_DESKTOP_SPLIT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isCompact;
}
