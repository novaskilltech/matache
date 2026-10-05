import { analysisResultSchema, type AnalysisResult } from "@/lib/ai/schema";
export function correctedField(
  result: AnalysisResult,
  group: keyof AnalysisResult,
  field: string,
  value: unknown,
): AnalysisResult {
  const current = result[group];
  if (!current || Array.isArray(current) || typeof current !== "object")
    throw new Error("Invalid field group");
  return {
    ...result,
    [group]: { ...current, [field]: value },
    confidence: { ...result.confidence, [group]: 0 },
    evidence: result.evidence.filter(
      (e) => e.field_path !== group + "." + field,
    ),
  } as AnalysisResult;
}
export function lowConfidenceGroups(result: AnalysisResult) {
  return Object.entries(result.confidence)
    .filter(
      ([group, n]) =>
        n < 0.75 &&
        Object.values(result[group as keyof AnalysisResult] ?? {}).some(
          (v) => v !== null && v !== "" && (!Array.isArray(v) || v.length > 0),
        ),
    )
    .map(([group]) => group);
}
export const groupLabels: Record<string, string> = {
  client: "Identité",
  request: "Contexte",
  travel: "Voyage",
  documents: "Documents",
  financial: "Finances",
  action: "Action",
};

export function changeReviewCategory(
  result: AnalysisResult,
  category: AnalysisResult["action"]["category"],
): AnalysisResult {
  return {
    ...result,
    request: {
      ...result.request,
      category,
      action_owner:
        category === "WAITING_CLIENT" ? "ACTION_CLIENT" : "ACTION_USER",
    },
    action: {
      ...result.action,
      category,
      status: category === "WAITING_CLIENT" ? "WAITING" : "TODO",
    },
  };
}
