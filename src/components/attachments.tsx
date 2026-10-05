import Link from "next/link";
import Image from "next/image";
import { listAttachments } from "@/lib/repositories/attachments";
import { isConfigured } from "@/lib/config";
export async function Attachments({
  analysisId,
  clientId,
  preview = false,
}: {
  analysisId?: string;
  clientId?: string;
  preview?: boolean;
}) {
  if (!isConfigured())
    return (
      <p className="muted">
        Les captures apparaîtront ici après votre premier import.
      </p>
    );
  const files = await listAttachments({ analysisId, clientId });
  return files.length ? (
    <div className="stack">
      {files.map((f, i) => (
        <Link
          href={"/api/attachments/" + f.id}
          className="card"
          target="_blank"
          rel="noreferrer"
          key={f.id}
        >
          {preview && (
            <Image
              src={"/api/attachments/" + f.id}
              width={480}
              height={720}
              unoptimized
              alt={"Capture source " + (i + 1)}
              style={{
                width: "100%",
                height: "auto",
                maxHeight: 480,
                objectFit: "contain",
                display: "block",
                marginBottom: 10,
              }}
            />
          )}
          Voir la capture {i + 1} ↗
        </Link>
      ))}
    </div>
  ) : (
    <p className="muted">Aucune pièce jointe.</p>
  );
}
