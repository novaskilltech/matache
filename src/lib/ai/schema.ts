import { z } from "zod";
import { categories, priorities, statuses, owners } from "@/lib/domain/models";
const text = z.string().max(2000).nullable(),
  bool = z.boolean().nullable(),
  count = z.number().int().nonnegative().nullable(),
  amount = z.number().nonnegative().nullable(),
  confidence = z.number().min(0).max(1),
  date = z.iso.date().nullable();
export const analysisResultSchema = z.object({
  client: z.object({ name: text, phone: text, phone_normalized: text }),
  request: z.object({
    category: z.enum(categories),
    summary: z.string().max(4000),
    action_owner: z.enum(owners),
  }),
  travel: z.object({
    departure_city: text,
    arrival_city: text,
    start_date: date,
    end_date: date,
    travelers_total: count,
    adults: count,
    children: count,
    room_type: text,
  }),
  documents: z.object({
    passport_type: text,
    passport_received: bool,
    residence_permit_received: bool,
    ticket_received: bool,
    missing_documents: z.array(z.string().max(240)).max(20),
  }),
  financial: z.object({
    total_amount: amount,
    deposit_amount: amount,
    balance_amount: amount,
    currency: z.string().max(8).nullable(),
    invoice_status: text,
    payment_status: text,
  }),
  action: z.object({
    title: z.string().min(1).max(240),
    description: z.string().max(4000),
    category: z.enum(categories),
    status: z.enum(statuses),
    priority: z.enum(priorities),
    due_at: z.string().datetime({ offset: true }).nullable(),
    confidence,
  }),
  confidence: z.object({
    client: confidence,
    request: confidence,
    travel: confidence,
    documents: confidence,
    financial: confidence,
    action: confidence,
  }),
  evidence: z
    .array(
      z.object({
        field_path: z.string().max(150),
        attachment_ids: z.array(z.string().uuid()).min(1).max(8),
      }),
    )
    .max(100)
    .default([]),
  warnings: z.array(z.string().max(500)).max(20).default([]),
  chronology: z.array(z.string().max(500)).max(20).default([]),
});
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export function mapAnalysis(input: unknown): AnalysisResult {
  const r = analysisResultSchema.parse(input);
  return {
    ...r,
    client: { ...r.client, phone_normalized: null },
    request: { ...r.request, category: r.action.category },
    action: {
      ...r.action,
      status:
        r.action.category === "WAITING_CLIENT" ||
        r.request.action_owner !== "ACTION_USER"
          ? "WAITING"
          : r.action.status,
    },
  };
}
export function manualResult(
  category: AnalysisResult["action"]["category"] = "OTHER",
): AnalysisResult {
  return mapAnalysis({
    client: { name: null, phone: null, phone_normalized: null },
    request: {
      category,
      summary: "",
      action_owner:
        category === "WAITING_CLIENT" ? "ACTION_CLIENT" : "ACTION_USER",
    },
    travel: {
      departure_city: null,
      arrival_city: null,
      start_date: null,
      end_date: null,
      travelers_total: null,
      adults: null,
      children: null,
      room_type: null,
    },
    documents: {
      passport_type: null,
      passport_received: null,
      residence_permit_received: null,
      ticket_received: null,
      missing_documents: [],
    },
    financial: {
      total_amount: null,
      deposit_amount: null,
      balance_amount: null,
      currency: null,
      invoice_status: null,
      payment_status: null,
    },
    action: {
      title: (
        {
          INVOICE: "Préparer la facture",
          CALLBACK: "Rappeler le client",
          OMRA_INFO: "Envoyer les informations Omra",
          TRIP_SUMMARY: "Préparer le récapitulatif",
          WAITING_CLIENT: "Relancer le client",
          OTHER: "Suivre le dossier",
        } as const
      )[category],
      description: "",
      category,
      status: category === "WAITING_CLIENT" ? "WAITING" : "TODO",
      priority: "NORMAL",
      due_at: null,
      confidence: 0,
    },
    confidence: {
      client: 0,
      request: 0,
      travel: 0,
      documents: 0,
      financial: 0,
      action: 0,
    },
  });
}
