import Link from "next/link";
export default function NotFound() {
  return (
    <main className="auth">
      <h1>Page introuvable</h1>
      <Link className="button" href="/">
        Retour à l’accueil
      </Link>
    </main>
  );
}
