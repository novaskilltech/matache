"use client";
import { useState } from "react";
import { browserDb } from "@/lib/supabase/browser";
import { isConfigured } from "@/lib/config";
export function LoginForm() {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [signup, setSignup] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const form = new FormData(e.currentTarget);
      const db = browserDb();
      const credentials = {
        email: String(form.get("email")),
        password: String(form.get("password")),
      };
      const result = signup
        ? await db.auth.signUp({
            ...credentials,
            options: { emailRedirectTo: location.origin + "/auth/callback" },
          })
        : await db.auth.signInWithPassword(credentials);
      if (result.error) throw result.error;
      if (signup && !result.data.session)
        setError("Vérifiez votre email pour confirmer votre compte.");
      else {
        const next = new URLSearchParams(location.search).get("next");
        location.assign(next?.startsWith("/share?batch=") ? next : "/");
      }
    } catch {
      setError(
        "Connexion impossible. Vérifiez vos identifiants ou votre email de confirmation.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="card" onSubmit={submit}>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <label htmlFor="password">Mot de passe</label>
      <input
        id="password"
        name="password"
        type="password"
        minLength={12}
        autoComplete={signup ? "new-password" : "current-password"}
        required
      />
      {error && (
        <p role="status" className="notice">
          {error}
        </p>
      )}
      <button
        style={{ width: "100%", marginTop: 20 }}
        disabled={busy || !isConfigured()}
      >
        {busy ? "Connexion…" : signup ? "Créer mon compte" : "Se connecter"}
      </button>
      <button
        type="button"
        className="secondary"
        style={{ marginTop: 12, width: "100%" }}
        onClick={() => setSignup(!signup)}
      >
        {signup ? "J’ai déjà un compte" : "Créer un compte"}
      </button>
    </form>
  );
}
