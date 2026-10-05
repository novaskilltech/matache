import { notFound } from "next/navigation";
import { getDossiers } from "@/lib/repositories/read";
import {
  labels,
  categories,
  priorities,
  priorityLabels,
} from "@/lib/domain/models";
import { editAction } from "@/app/mutations";
import { isConfigured } from "@/lib/config";
export default async function Edit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { actions } = await getDossiers();
  const a = actions.find((a) => a.id === id);
  if (!a) notFound();
  return (
    <>
      <h1>Modifier l’action</h1>
      <form action={editAction} className="card" style={{ maxWidth: 650 }}>
        <input type="hidden" name="id" value={id} />
        <label htmlFor="title">Action</label>
        <input
          id="title"
          name="title"
          defaultValue={a.title}
          required
          maxLength={240}
        />
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          defaultValue={a.description}
          rows={4}
        />
        <label htmlFor="category">Catégorie</label>
        <select id="category" name="category" defaultValue={a.category}>
          {categories.map((k) => (
            <option value={k} key={k}>
              {labels[k]}
            </option>
          ))}
        </select>
        <label htmlFor="priority">Priorité</label>
        <select id="priority" name="priority" defaultValue={a.priority}>
          {priorities.map((k) => (
            <option value={k} key={k}>
              {priorityLabels[k]}
            </option>
          ))}
        </select>
        <button style={{ marginTop: 20 }} disabled={!isConfigured()}>
          Enregistrer
        </button>
      </form>
    </>
  );
}
