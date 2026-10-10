import Link from "next/link";
import { Users, ArrowUpRight, Plus, Phone } from "lucide-react";
import { getDossiers } from "@/lib/repositories/read";
import { Search } from "@/components/search";
export default async function Clients({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const { clients, actions } = await getDossiers();
  const filtered = clients.filter((c) =>
    [c.name, c.phone, c.phone_normalized, JSON.stringify(c.travel)]
      .join(" ")
      .toLocaleLowerCase()
      .includes(q.toLocaleLowerCase()),
  );
  return (
    <>
      <div className="page-heading row between">
        <div>
          <p className="eyebrow">VOTRE CARNET CLIENTS</p>
          <h1>
            Mes clients <span className="count-pill">{clients.length}</span>
          </h1>
          <p className="muted">
            Le contexte et l’historique, toujours à portée de main.
          </p>
        </div>
        <Link href="/import" className="button">
          <Plus size={18} aria-hidden="true" />
          Ajouter un échange
        </Link>
      </div>
      <Search query={q} />
      <div className="stack client-list">
        {filtered.map((c) => {
          const open = actions.filter(
            (a) => a.client_id === c.id && a.status !== "DONE",
          ).length;
          const name = c.name || c.phone_normalized || "Client à identifier";
          const initials = c.name
            ?.split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((word) => word[0])
            .join("");
          return (
            <Link
              href={"/clients/" + c.id}
              className="card task client-card"
              key={c.id}
            >
              <div className="client-avatar" aria-hidden="true">
                {initials || <Users size={22} />}
              </div>
              <div className="task-body">
                <h3>{name}</h3>
                <p className="client-phone">
                  <Phone size={13} aria-hidden="true" />
                  {c.phone_normalized || "Téléphone non renseigné"}
                </p>
                <span className={`badge ${open ? "" : "neutral"}`}>
                  {open
                    ? `${open} action${open > 1 ? "s" : ""} à suivre`
                    : "Dossier à jour"}
                </span>
              </div>
              <ArrowUpRight
                className="card-arrow"
                size={18}
                aria-hidden="true"
              />
            </Link>
          );
        })}
        {!filtered.length && (
          <div className="card empty">
            <span className="empty-icon">
              <Users size={28} aria-hidden="true" />
            </span>
            <h2>Aucun client trouvé.</h2>
            <p className="muted">
              Essayez un autre nom ou un numéro de téléphone.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
