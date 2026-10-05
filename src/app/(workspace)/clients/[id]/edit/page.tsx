import { notFound } from "next/navigation";
import { getDossiers } from "@/lib/repositories/read";
import { ClientEditor } from "@/components/client-editor";
export default async function Edit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { clients } = await getDossiers();
  const c = clients.find((c) => c.id === id);
  if (!c) notFound();
  return (
    <>
      <h1>Corriger le dossier</h1>
      <ClientEditor client={c} />
    </>
  );
}
