import Link from "next/link";
import { ImportInbox } from "@/components/import-inbox";
import { ArrowUpRight, ScanLine } from "lucide-react";
import { getDossiers } from "@/lib/repositories/read";
import { activeActions, isOverdue, isToday } from "@/lib/domain/queue";
import { TaskCard } from "@/components/task-card";
export const dynamic = "force-dynamic";
export default async function Home() {
  const { clients, actions } = await getDossiers();
  const active = activeActions(actions);
  const stats = [
    {
      label: "Aujourd’hui",
      n: active.filter((a) => isToday(a.due_at) || a.priority === "TODAY")
        .length,
      filter: "today",
    },
    {
      label: "En retard",
      n: active.filter((a) => isOverdue(a)).length,
      filter: "overdue",
    },
    {
      label: "Factures",
      n: active.filter((a) => a.category === "INVOICE").length,
      filter: "INVOICE",
    },
    {
      label: "À rappeler",
      n: active.filter((a) => a.category === "CALLBACK").length,
      filter: "CALLBACK",
    },
    {
      label: "Demandes Omra",
      n: active.filter((a) => a.category === "OMRA_INFO").length,
      filter: "OMRA_INFO",
    },
    {
      label: "Récapitulatifs",
      n: active.filter((a) => a.category === "TRIP_SUMMARY").length,
      filter: "TRIP_SUMMARY",
    },
  ];
  return (
    <>
      <section className="hero">
        <span style={{ fontSize: 12, letterSpacing: 1.4 }}>
          CHAQUE CLIENT COMPTE
        </span>
        <h1>
          Que dois-je faire
          <br />
          pour mes clients ?
        </h1>
        <p>Un suivi clair. Les priorités devant vous.</p>
        <Link
          className="button"
          style={{ background: "#c8ebbd", color: "#174137" }}
          href="/import"
        >
          <ScanLine size={18} />
          Importer une capture
        </Link>
      </section>
      <ImportInbox />
      <div className="grid">
        {stats.map((s) => (
          <Link
            className="card"
            href={"/actions?filter=" + s.filter}
            key={s.label}
          >
            <div className="row between muted">
              <span>{s.label}</span>
              <ArrowUpRight size={16} />
            </div>
            <span className="stat">{s.n.toString().padStart(2, "0")}</span>
          </Link>
        ))}
      </div>
      <div className="row between section-title">
        <h2>Vos prochaines actions</h2>
        <Link className="muted" href="/actions">
          Tout voir →
        </Link>
      </div>
      <div className="stack">
        {active.slice(0, 6).map((a) => (
          <TaskCard
            key={a.id}
            action={a}
            client={clients.find((c) => c.id === a.client_id)}
          />
        ))}
        {active.length === 0 && (
          <div className="card empty">
            <h2>Vous êtes à jour.</h2>
            <p className="muted">
              Importez un échange pour préparer la prochaine action.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
