import Link from "next/link";
import { ImportInbox } from "@/components/import-inbox";
import {
  ArrowUpRight,
  ArrowRight,
  ScanLine,
  CalendarDays,
  Clock,
  FileText,
  Phone,
  Plane,
  Map,
  CheckCheck,
} from "lucide-react";
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
      Icon: CalendarDays,
      tone: "green",
    },
    {
      label: "En retard",
      n: active.filter((a) => isOverdue(a)).length,
      filter: "overdue",
      Icon: Clock,
      tone: "orange",
    },
    {
      label: "Factures",
      n: active.filter((a) => a.category === "INVOICE").length,
      filter: "INVOICE",
      Icon: FileText,
      tone: "green",
    },
    {
      label: "À rappeler",
      n: active.filter((a) => a.category === "CALLBACK").length,
      filter: "CALLBACK",
      Icon: Phone,
      tone: "blue",
    },
    {
      label: "Demandes Omra",
      n: active.filter((a) => a.category === "OMRA_INFO").length,
      filter: "OMRA_INFO",
      Icon: Plane,
      tone: "purple",
    },
    {
      label: "Récapitulatifs",
      n: active.filter((a) => a.category === "TRIP_SUMMARY").length,
      filter: "TRIP_SUMMARY",
      Icon: Map,
      tone: "sand",
    },
  ];
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="status-dot" /> CHAQUE CLIENT COMPTE
          </span>
          <h1>
            Que dois-je faire
            <br />
            pour mes clients ?
          </h1>
          <p>
            Vos échanges deviennent des actions.
            <br />
            Vos priorités restent à portée de main.
          </p>
          <Link className="button hero-button" href="/import">
            <ScanLine size={19} aria-hidden="true" />
            Importer une capture
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-orbit" />
          <div className="capture-illustration">
            <span className="illustration-label">
              <ScanLine size={17} /> UN ÉCHANGE
            </span>
            <span className="message-line" />
            <span className="message-line short" />
            <span className="message-line outgoing" />
            <span className="message-line outgoing short" />
          </div>
          <div className="action-illustration">
            <span className="illustration-check">
              <CheckCheck size={22} />
            </span>
            <span>
              <strong>La prochaine action</strong>
              <small>Identifiée. Prête à suivre.</small>
            </span>
          </div>
        </div>
      </section>
      <ImportInbox />
      <div className="row between section-title dashboard-heading">
        <h2>Votre suivi, en un coup d’œil</h2>
        <span className="section-note">Les dossiers à faire avancer</span>
      </div>
      <div className="grid stats-grid">
        {stats.map((s) => (
          <Link
            className={`card stat-card tone-${s.tone}`}
            href={"/actions?filter=" + s.filter}
            key={s.label}
          >
            <div className="row between stat-top">
              <span className="stat-icon">
                <s.Icon size={19} aria-hidden="true" />
              </span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </div>
            <div className="stat-bottom">
              <span className="stat">{s.n.toString().padStart(2, "0")}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          </Link>
        ))}
      </div>
      <div className="row between section-title">
        <div className="row">
          <h2>Vos prochaines actions</h2>
          <span className="count-pill">{active.length}</span>
        </div>
        <Link className="text-link" href="/actions">
          Tout voir <ArrowRight size={16} aria-hidden="true" />
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
            <span className="empty-icon">
              <CheckCheck size={28} aria-hidden="true" />
            </span>
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
