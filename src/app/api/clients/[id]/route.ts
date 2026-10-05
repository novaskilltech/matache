import { NextResponse } from "next/server";
import { z } from "zod";
import { analysisResultSchema } from "@/lib/ai/schema";
import { normalizePhone, phoneCountry } from "@/lib/domain/phone";
import { uuid } from "@/lib/domain/models";
import { workspaceContext } from "@/lib/repositories/workspace";
import { apiError, requireSameOrigin, HttpError } from "@/lib/http";
const input = z.object({
  name: z.string().max(240).nullable(),
  phone: z.string().max(50).nullable(),
  country: z.string().length(2),
  travel: analysisResultSchema.shape.travel,
  documents: analysisResultSchema.shape.documents,
  financial: analysisResultSchema.shape.financial,
});
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireSameOrigin(req);
    const patch = input.parse(await req.json());
    const phone = normalizePhone(patch.phone, phoneCountry(patch.country));
    if (patch.phone && !phone) throw new HttpError(400, "Invalid phone");
    const { country, ...data } = patch;
    const { db, workspaceId } = await workspaceContext();
    const { error } = await db.rpc("correct_client", {
      p_workspace: workspaceId,
      p_client: uuid.parse((await params).id),
      p_patch: { ...data, phone_normalized: phone },
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
