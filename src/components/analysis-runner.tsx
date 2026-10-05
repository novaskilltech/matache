"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
export function AnalysisRunner({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        {
          const r = await fetch("/api/analyses/" + id, { method: "POST" });
          if (!r.ok) throw new Error();
        }
        const deadline = Date.now() + 125000;
        while (!cancelled && Date.now() < deadline) {
          const res = await fetch("/api/analyses/" + id, { cache: "no-store" });
          if (!res.ok) throw new Error();
          const data = (await res.json()) as { status: string };
          if (data.status !== "PROCESSING" && data.status !== "UPLOADED") {
            router.refresh();
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        if (!cancelled)
          setError(
            "L’analyse prend plus de temps que prévu. Vous pouvez saisir l’action manuellement.",
          );
      } catch {
        if (!cancelled) {
          setError("L’analyse est indisponible. Vos captures sont conservées.");
          router.refresh();
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [id, status, router]);
  return (
    <p role="status" className={error ? "error" : "notice"}>
      {error || "Analyse des captures… Nous identifions la prochaine action."}
    </p>
  );
}
