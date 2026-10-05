"use client";
import { useState } from "react";
import { enablePush, disablePush } from "@/lib/push-client";
import { isConfigured } from "@/lib/config";
export function PushSettings() {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function run(enable: boolean) {
    setBusy(true);
    setMessage("");
    try {
      if (enable) await enablePush();
      else await disablePush();
      setMessage(
        enable
          ? "Notifications activées sur cet appareil."
          : "Notifications désactivées.",
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Opération impossible.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="row">
        <button disabled={busy || !isConfigured()} onClick={() => run(true)}>
          Activer les rappels
        </button>
        <button
          className="secondary"
          disabled={busy || !isConfigured()}
          onClick={() => run(false)}
        >
          Désactiver
        </button>
      </div>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
    </>
  );
}
