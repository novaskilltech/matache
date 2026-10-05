import "server-only";
import { workspaceContext } from "./workspace";
import { mapAnalysis } from "@/lib/ai/schema";
import { normalizePhone, phoneCountry } from "@/lib/domain/phone";
import { uuid } from "@/lib/domain/models";
export async function validateDossier(
  analysisId: string,
  input: unknown,
  clientId: string | null = null,
  countryOverride?: string,
) {
  const result = mapAnalysis(input);
  const { db, workspaceId, userId } = await workspaceContext();
  const { data: profile } = await db
    .from("profiles")
    .select("phone_country")
    .eq("id", userId)
    .single();
  const country = phoneCountry(
    countryOverride ??
      String(
        profile?.phone_country ?? process.env.DEFAULT_PHONE_COUNTRY ?? "FR",
      ),
  );
  result.client.phone_normalized = normalizePhone(result.client.phone, country);
  const { data, error } = await db.rpc("validate_dossier", {
    p_workspace: workspaceId,
    p_analysis: uuid.parse(analysisId),
    p_result: result,
    p_client: clientId ? uuid.parse(clientId) : null,
  });
  if (error) throw new Error("Validation failed");
  return uuid.parse(data);
}
