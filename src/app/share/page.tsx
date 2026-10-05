import { ShareImporter } from "@/components/share-importer";
import { isConfigured } from "@/lib/config";
import { serverDb } from "@/lib/supabase/server";
import { uuid } from "@/lib/domain/models";
export default async function Share({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string }>;
}) {
  const { batch } = await searchParams;
  const parsed = uuid.safeParse(batch);
  if (!parsed.success)
    return (
      <main className="auth">
        <h1>Partage expiré ou invalide</h1>
        <a href="/import">Choisir les captures dans la galerie</a>
      </main>
    );
  let authenticated = false;
  if (isConfigured()) {
    const { data } = await (await serverDb()).auth.getUser();
    authenticated = Boolean(data.user);
  }
  return (
    <main className="shell">
      <ShareImporter batch={parsed.data} authenticated={authenticated} />
    </main>
  );
}
