import Link from "next/link";
import { getDossiers } from "@/lib/repositories/read";
import {
  activeActions,
  isOverdue,
  isToday,
  matchesSearch,
} from "@/lib/domain/queue";
import { TaskCard } from "@/components/task-card";
import { Search } from "@/components/search";
import { labels } from "@/lib/domain/models";
import { Plus, ListTodo } from "lucide-react";
export default async function Actions({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const { q = "", filter = "active" } = await searchParams;
  const { clients, actions } = await getDossiers();
  const filtered = (
    filter === "DONE"
      ? actions.filter((a) => a.status === "DONE")
      : activeActions(actions)
  )
    .filter((a) =>
      matchesSearch(
        a,
        clients.find((c) => c.id === a.client_id),
        q,
      ),
    )
    .filter((a) =>
      filter === "overdue"
        ? isOverdue(a)
        : filter === "today"
          ? isToday(a.due_at) || a.priority === "TODAY"
          : filter === "WAITING"
            ? a.status === "WAITING"
            : filter in labels
              ? a.category === filter
              : true,
    );
  return (
    <>
      <div className="row between page-heading">
        <div>
          <p className="eyebrow">LES PROCHAINES ÉTAPES</p>
          <h1>
            Mes actions <span className="count-pill">{filtered.length}</span>
          </h1>
          <p className="muted">Une prochaine étape pour chaque dossier.</p>
        </div>
        <Link className="button" href="/import">
          <Plus size={18} aria-hidden="true" /> Ajouter
        </Link>
      </div>
      <Search query={q}>
        <select
          name="filter"
          defaultValue={filter}
          aria-label="Filtrer les actions"
        >
          {[
            ["active", "Actives"],
            ["today", "Aujourd’hui"],
            ["overdue", "En retard"],
            ["WAITING", "En attente"],
            ...Object.entries(labels),
            ["DONE", "Terminées"],
          ].map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </Search>
      <div className="stack">
        {filtered.map((a) => (
          <TaskCard
            key={a.id}
            action={a}
            client={clients.find((c) => c.id === a.client_id)}
          />
        ))}
        {!filtered.length && (
          <div className="card empty">
            <span className="empty-icon">
              <ListTodo size={28} aria-hidden="true" />
            </span>
            <h2>Aucune action dans cette sélection.</h2>
            <p className="muted">
              Changez le filtre ou importez un nouvel échange.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
