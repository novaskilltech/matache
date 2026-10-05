import { getDossiers } from "@/lib/repositories/read";
import { ReviewForm } from "@/components/review-form";
import { getAnalysis } from "@/lib/repositories/analysis";
export default async function Manual({
  searchParams,
}: {
  searchParams: Promise<{ analysis?: string }>;
}) {
  const { analysis } = await searchParams;
  const { clients } = await getDossiers();
  if (analysis) {
    const a = await getAnalysis(analysis);
    if (a.status === "PROCESSING")
      return (
        <>
          <h1>Analyse en cours</h1>
          <p className="notice">
            Attendez la fin de l’analyse ou réessayez après quelques minutes.
          </p>
        </>
      );
  }
  return (
    <>
      <h1>Ajouter une action</h1>
      <p className="muted">Choisissez la prochaine étape et validez.</p>
      <ReviewForm
        initial={null}
        analysisId={analysis || crypto.randomUUID()}
        clients={clients}
        manual={!analysis}
      />
    </>
  );
}
