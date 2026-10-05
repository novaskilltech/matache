import Link from "next/link";
import { redirect } from "next/navigation";
import { getAnalysis } from "@/lib/repositories/analysis";
import { getDossiers } from "@/lib/repositories/read";
import { Attachments } from "@/components/attachments";
import { ReviewForm } from "@/components/review-form";
import { AnalysisRunner } from "@/components/analysis-runner";
import { AnalyzeButton } from "@/components/analyze-button";
export default async function Review({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [a, { clients, actions }] = await Promise.all([
    getAnalysis(id),
    getDossiers(),
  ]);
  if (a.status === "VALIDATED") {
    const action = actions.find((x) => x.analysis_id === id);
    redirect(action ? "/actions/" + action.id : "/");
  }
  if (a.status === "IGNORED") redirect("/");
  return (
    <>
      <h1>
        {a.status === "FAILED"
          ? "Créer l’action manuellement"
          : "Vérifier, puis valider."}
      </h1>
      <p className="muted">
        Vérifiez l’identité et la prochaine action. Le dossier reste lié à vos
        captures.
      </p>
      <div className="split">
        <div>
          {a.status === "UPLOADED" || a.status === "PROCESSING" ? (
            <>
              <AnalysisRunner id={id} status={a.status} />
              <Link
                className="button secondary"
                href={"/manual?analysis=" + id}
              >
                Créer une action manuelle
              </Link>
            </>
          ) : (
            <>
              {a.status === "FAILED" && (
                <section className="notice" style={{ marginBottom: 16 }}>
                  <p>
                    L’IA est indisponible. Choisissez la prochaine action : vos
                    images restent enregistrées.
                  </p>
                  <AnalyzeButton id={id} />
                </section>
              )}
              <ReviewForm
                initial={a.result}
                analysisId={id}
                clients={clients}
              />
            </>
          )}
        </div>
        <section className="card" style={{ alignSelf: "start" }}>
          <h2>Captures originales</h2>
          <Attachments analysisId={id} preview />
          {a.result?.chronology.length ? (
            <>
              <h2>Chronologie détectée</h2>
              {a.result.chronology.map((c, i) => (
                <p className="muted" key={i}>
                  {c}
                </p>
              ))}
            </>
          ) : null}
        </section>
      </div>
    </>
  );
}
