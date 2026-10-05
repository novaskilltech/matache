import { NextResponse } from "next/server";
import { z } from "zod";
import { analysisResultSchema } from "@/lib/ai/schema";
import { uuid } from "@/lib/domain/models";
import { validateDossier } from "@/lib/repositories/validation";
import { workspaceContext } from "@/lib/repositories/workspace";
import { requireSameOrigin, apiError } from "@/lib/http";
const input = z.object({
  analysisId: uuid,
  result: analysisResultSchema,
  clientId: uuid.nullable(),
  country: z.string().length(2).optional(),
  manual: z.boolean().default(false),
});
export async function POST(req: Request) {
  try {
    requireSameOrigin(req);
    const parsed = input.parse(await req.json());
    if (parsed.manual) {
      const { db, workspaceId } = await workspaceContext();
      const { error } = await db.from("analyses").upsert(
        {
          id: parsed.analysisId,
          workspace_id: workspaceId,
          status: "UPLOADED",
        },
        { onConflict: "id", ignoreDuplicates: true },
      );
      if (error) throw error;
    }
    const actionId = await validateDossier(
      parsed.analysisId,
      parsed.result,
      parsed.clientId,
      parsed.country,
    );
    return NextResponse.json(
      { actionId },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
