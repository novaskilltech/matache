import Link from "next/link";
import { Snooze } from "@/components/snooze";
import { Attachments } from "@/components/attachments";
import { notFound } from "next/navigation";
import { getDossiers } from "@/lib/repositories/read";
import { labels, priorityLabels, statusLabels } from "@/lib/domain/models";
import { dateLabel } from "@/lib/domain/queue";
import { Facts } from "@/components/facts";
import { changeStatus } from "@/app/mutations";
import { isConfigured } from "@/lib/config";
export default async function ActionDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { clients, actions } = await getDossiers();
  const a = actions.find((a) => a.id === id);
  if (!a) notFound();
  const c = clients.find((c) => c.id === a.client_id);
  return (
    <>
      <Link className="muted" href="/actions">
        ← Actions
      </Link>
      <h1>{a.title}</h1>
      <div className="split">
        <section className="card">
          <div className="row">
            <span className="badge">{labels[a.category]}</span>
            <span className="badge">{priorityLabels[a.priority]}</span>
            <span className="badge">{statusLabels[a.status]}</span>
          </div>
          <h2>
            <Link href={"/clients/" + a.client_id}>
              {c?.name || "Client à identifier"} →
            </Link>
          </h2>
          <p>{a.description}</p>
          <p className="muted">Échéance : {dateLabel(a.due_at)}</p>
          <p className="muted">
            Responsable :{" "}
            {a.action_owner === "ACTION_USER"
              ? "Vous"
              : a.action_owner === "ACTION_CLIENT"
                ? "Client"
                : "Prestataire"}
          </p>
          <div className="row">
            {[
              ["DONE", "TERMINÉ"],
              ["WAITING", "EN ATTENTE"],
              ["TODO", "À FAIRE"],
            ].map(([status, label]) => (
              <form action={changeStatus} key={status}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="status" value={status} />
                <button
                  className={status === "DONE" ? "" : "secondary"}
                  disabled={!isConfigured()}
                >
                  {label}
                </button>
              </form>
            ))}
            <Link
              className="button secondary"
              href={"/actions/" + id + "/edit"}
            >
              MODIFIER
            </Link>
          </div>
        </section>
        <section className="card">
          <h2>Contexte</h2>
          <Facts data={a.context} />
          <h2>Capture source</h2>
          {a.analysis_id ? (
            <Attachments analysisId={a.analysis_id} preview />
          ) : (
            <p className="muted">Action saisie manuellement.</p>
          )}
        </section>
      </div>
      <Snooze id={id} status={a.status} />
    </>
  );
}
