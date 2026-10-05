import Link from "next/link";
import { ImportInbox } from "@/components/import-inbox";
import { Importer } from "@/components/importer";
export default async function Import({
  searchParams,
}: {
  searchParams: Promise<{ share?: string }>;
}) {
  const { share } = await searchParams;
  return (
    <>
      <h1>Ajouter un échange</h1>
      <p className="muted">
        Une capture suffit pour retrouver la prochaine action.
      </p>
      {share && (
        <p className="notice">
          Le partage direct n’a pas pu être reçu. Choisissez les captures dans
          votre galerie.
        </p>
      )}
      <Importer />
      <Link className="button secondary" href="/manual">
        Créer une action sans capture
      </Link>
      <ImportInbox />
    </>
  );
}
