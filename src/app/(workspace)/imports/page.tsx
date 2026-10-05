import Link from "next/link";
import { pendingImports } from "@/lib/repositories/inbox";
import { dateLabel } from "@/lib/domain/queue";
export default async function Imports({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(0, Math.min(1000, Number(params.page) || 0));
  const { items, total } = await pendingImports(page);
  return (
    <>
      <h1>Imports à terminer · {total}</h1>
      <div className="stack">
        {items.map((a) => (
          <Link
            className="card row between"
            key={a.id}
            href={"/review/" + a.id}
          >
            <span>
              {a.result?.action.title || "Capture à traiter"}
              <small className="muted"> · {dateLabel(a.created_at)}</small>
            </span>
            Ouvrir →
          </Link>
        ))}
      </div>
      <div className="row" style={{ marginTop: 20 }}>
        {page > 0 && (
          <Link
            className="button secondary"
            href={"/imports?page=" + (page - 1)}
          >
            Précédent
          </Link>
        )}
        {(page + 1) * 50 < total && (
          <Link
            className="button secondary"
            href={"/imports?page=" + (page + 1)}
          >
            Suivant
          </Link>
        )}
      </div>
    </>
  );
}
