import Link from "next/link";
import { z } from "zod";
import { workspaceContext } from "@/lib/repositories/workspace";
import { isConfigured } from "@/lib/config";
import { dateLabel } from "@/lib/domain/queue";
const schema = z.object({
  id: z.string(),
  field_path: z.string(),
  value: z.unknown(),
  attachment_id: z.string().nullable(),
  confidence: z.number(),
  created_at: z.string(),
});
export async function FieldHistory({ clientId }: { clientId: string }) {
  if (!isConfigured()) return null;
  const { db, workspaceId } = await workspaceContext();
  const { data, error } = await db
    .from("extracted_fields")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Facts unavailable");
  const fields = schema.array().parse(data);
  if (!fields.length) return null;
  return (
    <details className="card">
      <summary>Informations extraites et leurs sources</summary>
      {fields.map((f) => (
        <div key={f.id} className="field">
          <small>
            {f.field_path} · {dateLabel(f.created_at)} ·{" "}
            {Math.round(f.confidence * 100)} %
          </small>
          <span>
            {typeof f.value === "object"
              ? JSON.stringify(f.value)
              : String(f.value)}
          </span>
          {f.attachment_id ? (
            <Link
              className="muted"
              style={{ display: "block" }}
              href={"/api/attachments/" + f.attachment_id}
              target="_blank"
            >
              Capture source ↗
            </Link>
          ) : (
            <small>
              Source non attribuée à une image précise ; voir les pièces du
              dossier.
            </small>
          )}
        </div>
      ))}
    </details>
  );
}
