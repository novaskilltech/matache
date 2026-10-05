"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function AnalyzeButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function run() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/analyses/" + id, { method: "POST" });
      if (!r.ok) throw new Error();
      router.refresh();
    } catch {
      setError("L’IA est indisponible. Vos captures sont conservées.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button disabled={busy} onClick={run}>
        {busy ? "Analyse en cours…" : "Analyser les captures"}
      </button>
      {error && <p className="error">{error}</p>}
    </>
  );
}
