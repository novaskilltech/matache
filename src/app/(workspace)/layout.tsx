import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { Brand } from "@/components/brand";
import { Settings, FlaskConical } from "lucide-react";
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
      <a href="#workspace-content" className="skip-link">
        Aller au contenu
      </a>
      <main className="shell">
        <header className="topbar">
          <Link className="mobile-brand" href="/" aria-label="MaTache, accueil">
            <Brand />
          </Link>
          <span className="workspace-label">
            <span className="status-dot" /> Mon espace de suivi
          </span>
          <Link className="settings-link" href="/settings">
            <Settings size={18} aria-hidden="true" />
            Paramètres
          </Link>
        </header>
        {!isConfigured() && (
          <div className="preview-notice">
            <FlaskConical size={17} aria-hidden="true" />
            <p>
              <strong>Mode aperçu</strong> · Les dossiers affichés sont fictifs.
            </p>
          </div>
        )}
        <div id="workspace-content" tabIndex={-1}>
          {children}
        </div>
      </main>
      <Nav />
    </>
  );
}
