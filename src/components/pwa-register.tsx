"use client";
import { purgeExpiredShares } from "@/lib/share-store";
import { useEffect } from "react";
export function PwaRegister() {
  useEffect(() => {
    void purgeExpiredShares().catch(() => {});
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* Gallery upload remains available without a service worker. */
      });
    }
  }, []);
  return null;
}
