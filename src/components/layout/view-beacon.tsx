"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Counts one view per browser tab session per path. No cookies, no personal data.
export function ViewBeacon() {
  const pathname = usePathname();
  useEffect(() => {
    try {
      const key = `ah-view:${pathname}`;
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {}
    const body = JSON.stringify({ path: pathname });
    if (!navigator.sendBeacon?.("/api/view", body)) {
      fetch("/api/view", { method: "POST", body, keepalive: true }).catch(() => {});
    }
  }, [pathname]);
  return null;
}
