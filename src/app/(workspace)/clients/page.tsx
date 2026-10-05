import Link from "next/link";
import { Users, ArrowUpRight } from "lucide-react";
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
      <h1>Mes clients</h1>
      <p className="muted">
        Le contexte et l’historique, toujours à portée de main.
      </p>
      <Search query={q} />
      <div className="stack">
        {filtered.map((c) => (
          <Link href={"/clients/" + c.id} className="card task" key={c.id}>
            <div className="task-icon">
              <Users size={22} />
            </div>
            <div className="task-body">
              <h3>{c.name || c.phone_normalized || "Client à identifier"}</h3>
              <p className="muted" style={{ margin: "6px 0" }}>
                {c.phone_normalized || "Téléphone non renseigné"}
              </p>
              <span className="badge">
                {
                  actions.filter(
                    (a) => a.client_id === c.id && a.status !== "DONE",
                  ).length
                }{" "}
                action(s) ouverte(s)
              </span>
            </div>
            <ArrowUpRight size={18} />
          </Link>
        ))}
        {!filtered.length && (
          <div className="card empty">Aucun client trouvé.</div>
        )}
      </div>
    </>
  );
}
