import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { isConfigured } from "@/lib/config";
import { serverDb } from "@/lib/supabase/server";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isConfigured()) {
    const db = await serverDb();
    const { data } = await db.auth.getUser();
    if (!data.user) redirect("/login");
  }
  return (
    <>
      <main className="shell">
        <header className="topbar">
          <Link className="brand" href="/">
            <span className="logo">✓</span>MaTache
            <span className="badge">MON ESPACE</span>
          </Link>
          <Link className="muted" href="/settings">
            Paramètres
          </Link>
        </header>
        {!isConfigured() && (
          <p className="notice">
            Aperçu avec des données fictives. Configurez Supabase pour
            enregistrer vos dossiers.
          </p>
        )}
        {children}
      </main>
      <Nav />
    </>
  );
}
