"use client";
import { useRef, useState } from "react";
import { Camera, Images, ShieldCheck } from "lucide-react";
import { isConfigured } from "@/lib/config";
import { uploadScreenshots } from "@/lib/upload-client";
export function Importer() {
  const picker = useRef<HTMLInputElement>(null),
    camera = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function send(files: File[]) {
    if (!files.length) return;
    setBusy(true);
    setError("");
    try {
      const id = await uploadScreenshots(files);
      location.assign("/review/" + id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import impossible.");
      setBusy(false);
    }
  }
  return (
    <>
      <section className="card empty import-panel">
        <span className="import-kicker">01 · IMPORTER VOS CAPTURES</span>
        <div className="upload-illustration" aria-hidden="true">
          <div className="upload-sheet back" />
          <div className="upload-sheet">
            <Images size={34} />
          </div>
        </div>
        <h2>Capturez. Partagez. Suivez.</h2>
        <p className="muted">
          Une ou plusieurs captures du même client.
          <br />
          MaTache vous aide à retrouver ce qu’il reste à faire.
        </p>
        <div className="row" style={{ justifyContent: "center" }}>
          <button
            disabled={busy || !isConfigured()}
            onClick={() => picker.current?.click()}
          >
            <Images size={18} aria-hidden="true" />
            Choisir les captures
          </button>
          <button
            className="secondary"
            disabled={busy || !isConfigured()}
            onClick={() => camera.current?.click()}
          >
            <Camera size={18} aria-hidden="true" />
            Appareil photo
          </button>
        </div>
        <p className="upload-limits">
          JPEG, PNG ou WebP · 8 images maximum
          <br />
          10 Mo par image · 20 Mo par dossier
        </p>
        <input
          ref={picker}
          aria-label="Captures du dossier"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(e) => void send(Array.from(e.target.files || []))}
        />
        <input
          ref={camera}
          aria-label="Prendre une photo"
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => void send(Array.from(e.target.files || []))}
        />
        {busy && <p role="status">Envoi sécurisé des captures…</p>}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
      </section>
      <p className="privacy-note">
        <ShieldCheck size={16} aria-hidden="true" />
        Vos captures sont privées et accessibles uniquement dans votre espace.
      </p>
    </>
  );
}
