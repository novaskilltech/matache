"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="auth card">
      <h1>Une erreur est survenue</h1>
      <p>Vos dossiers restent enregistrés. Réessayez dans un instant.</p>
      <button onClick={reset}>Réessayer</button>
    </main>
  );
}
