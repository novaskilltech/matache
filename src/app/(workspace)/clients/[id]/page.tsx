import Link from "next/link";
import { FieldHistory } from "@/components/field-history";
import { Attachments } from "@/components/attachments";
import { notFound } from "next/navigation";
import { getDossiers, getTimeline } from "@/lib/repositories/read";
import { Facts } from "@/components/facts";
import { TaskCard } from "@/components/task-card";
import { dateLabel } from "@/lib/domain/queue";
export default async function Dossier({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { clients, actions } = await getDossiers();
  const client = clients.find((c) => c.id === id);
  if (!client) notFound();
  const events = await getTimeline(id);
  return (
    <>
      <Link className="muted" href="/clients">
        ← Clients
      </Link>
      <h1>{client.name || "Client à identifier"}</h1>
      <div className="split">
        <div className="stack">
          <section className="card">
            <h2>Identité</h2>
            <p>
              {client.phone_normalized ||
                client.phone ||
                "Téléphone non renseigné"}
            </p>
            <Link
              className="button secondary"
              href={"/clients/" + id + "/edit"}
            >
              Modifier le dossier
            </Link>
          </section>
          <section className="card">
            <h2>Voyage</h2>
            <Facts data={client.travel} />
          </section>
          <section className="card">
            <h2>Documents</h2>
            <Facts data={client.documents} />
          </section>
          <section className="card">
            <h2>Finances</h2>
            <Facts data={client.financial} />
          </section>
          <FieldHistory clientId={id} />
        </div>
        <div className="stack">
          <section>
            <h2>Actions ouvertes</h2>
            <div className="stack">
              {actions
                .filter((a) => a.client_id === id && a.status !== "DONE")
                .map((a) => (
                  <TaskCard key={a.id} action={a} client={client} />
                ))}
              {!actions.some(
                (a) => a.client_id === id && a.status !== "DONE",
              ) && <p className="card muted">Aucune action ouverte.</p>}
            </div>
          </section>
          <section className="card">
            <h2>Historique</h2>
            {events.map((e) => (
              <div className="field" key={e.id}>
                <small>{dateLabel(e.created_at)}</small>
                {(
                  {
                    CREATED: "Action créée",
                    STATUS_CHANGED: "Statut modifié",
                    SNOOZED: "Rappel reporté",
                    FOLLOW_UP: "Relance à effectuer",
                    DOCUMENTS_RECEIVED: "Documents reçus",
                    EDITED: "Informations corrigées",
                  } as Record<string, string>
                )[e.event_type] || e.event_type}
              </div>
            ))}
            {!events.length && <p className="muted">Le suivi commence ici.</p>}
          </section>
          <section className="card">
            <h2>Pièces jointes</h2>
            <Attachments clientId={id} />
          </section>
        </div>
      </div>
    </>
  );
}
