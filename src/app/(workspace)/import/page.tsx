import Link from "next/link";
import { ImportInbox } from "@/components/import-inbox";
import { Importer } from "@/components/importer";
import { PencilLine } from "lucide-react";
export default async function Import({
  searchParams,
}: {
  searchParams: Promise<{ share?: string }>;
}) {
  const { share } = await searchParams;
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">D’UN ÉCHANGE À UNE ACTION</p>
        <h1>Ajouter un échange</h1>
        <p className="muted">
          Une capture suffit pour retrouver la prochaine action.
        </p>
      </div>
      {share && (
        <p className="notice">
          Le partage direct n’a pas pu être reçu. Choisissez les captures dans
          votre galerie.
        </p>
      )}
      <Importer />
      <Link className="button secondary manual-link" href="/manual">
        <PencilLine size={17} aria-hidden="true" />
        Créer une action sans capture
      </Link>
      <ImportInbox />
    </>
  );
}
