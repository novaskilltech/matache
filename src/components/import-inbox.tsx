import Link from "next/link";
import { pendingImports } from "@/lib/repositories/inbox";
import { dateLabel } from "@/lib/domain/queue";
export async function ImportInbox() {
  const { items: pending, total } = await pendingImports();
  if (!pending.length) return null;
  return (
    <section className="card" style={{ margin: "18px 0" }}>
      <h2>Imports à terminer · {total}</h2>
      <p className="muted">
        Ces captures attendent votre validation. Aucun dossier ne disparaît
        après un import interrompu.
      </p>
      {pending.map((a) => (
        <Link className="field row between" key={a.id} href={"/review/" + a.id}>
          <span>
            {a.result?.action.title || "Capture à traiter"}
            <small>{dateLabel(a.created_at)}</small>
          </span>
          <span className="badge">
            {a.status === "FAILED"
              ? "Saisie manuelle"
              : a.status === "READY"
                ? "À valider"
                : a.status === "PROCESSING"
                  ? "En cours"
                  : "À analyser"}{" "}
            →
          </span>
        </Link>
      ))}
      {total > 50 && (
        <Link className="button secondary" href="/imports">
          Voir tous les imports en attente
        </Link>
      )}
    </section>
  );
}
