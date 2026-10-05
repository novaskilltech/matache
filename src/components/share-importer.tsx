"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getSharedBatch, deleteSharedBatch } from "@/lib/share-store";
import { uploadScreenshots } from "@/lib/upload-client";
export function ShareImporter({
  batch,
  authenticated,
}: {
  batch: string;
  authenticated: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [count, setCount] = useState(0);
  useEffect(() => {
    void getSharedBatch(batch)
      .then((files) => setCount(files.length))
      .catch(() => setError("Partage indisponible. Utilisez la galerie."));
  }, [batch]);
  async function send() {
    setBusy(true);
    setError("");
    try {
      const files = await getSharedBatch(batch);
      if (!files.length)
        throw new Error("Partage expiré. Choisissez à nouveau vos captures.");
      const id = await uploadScreenshots(files);
      await deleteSharedBatch(batch);
      location.assign("/review/" + id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import impossible");
      setBusy(false);
    }
  }
  return (
    <section className="card">
      <h1>{count} capture(s) partagée(s)</h1>
      <p className="muted">
        Les captures restent sur cet appareil jusqu’à leur import. Le partage
        expire après 10 minutes ; les éléments expirés sont nettoyés à la
        prochaine ouverture.
      </p>
      {authenticated ? (
        <button disabled={busy || !count} onClick={send}>
          {busy ? "Import sécurisé…" : "Analyser les captures"}
        </button>
      ) : (
        <Link
          className="button"
          href={"/login?next=" + encodeURIComponent("/share?batch=" + batch)}
        >
          Se connecter pour importer
        </Link>
      )}
      {error && <p className="error">{error}</p>}
      <Link
        className="button secondary"
        style={{ marginLeft: 10 }}
        href="/import"
      >
        Ouvrir la galerie
      </Link>
    </section>
  );
}
