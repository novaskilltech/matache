import { z } from "zod";
export const categories = [
  "INVOICE",
  "CALLBACK",
  "OMRA_INFO",
  "TRIP_SUMMARY",
  "WAITING_CLIENT",
  "OTHER",
] as const;
export const statuses = ["TODO", "WAITING", "DONE"] as const;
export const priorities = ["NORMAL", "TODAY", "URGENT"] as const;
export const owners = [
  "ACTION_USER",
  "ACTION_CLIENT",
  "ACTION_THIRD_PARTY",
] as const;
export const labels: Record<(typeof categories)[number], string> = {
  INVOICE: "Facture",
  CALLBACK: "Rappeler",
  OMRA_INFO: "Infos Omra",
  TRIP_SUMMARY: "Récapitulatif",
  WAITING_CLIENT: "Attente client",
  OTHER: "Autre",
};
export const priorityLabels = {
  NORMAL: "Normal",
  TODAY: "Aujourd’hui",
  URGENT: "Urgent",
};
export const statusLabels = {
  TODO: "À faire",
  WAITING: "En attente",
  DONE: "Terminé",
};
export const clientSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  name: z.string().nullable(),
  phone: z.string().nullable(),
  phone_normalized: z.string().nullable(),
  travel: z.record(z.string(), z.unknown()),
  documents: z.record(z.string(), z.unknown()),
  financial: z.record(z.string(), z.unknown()),
  created_at: z.string(),
});
export const actionSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  client_id: z.string().uuid(),
  analysis_id: z.string().uuid().nullable(),
  title: z.string().min(1).max(240),
  description: z.string(),
  category: z.enum(categories),
  status: z.enum(statuses),
  priority: z.enum(priorities),
  action_owner: z.enum(owners),
  due_at: z.string().nullable(),
  context: z.record(z.string(), z.unknown()),
  created_at: z.string(),
});
export const eventSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  action_id: z.string().uuid(),
  client_id: z.string().uuid(),
  event_type: z.string(),
  payload: z.record(z.string(), z.unknown()),
  created_at: z.string(),
});
export type Client = z.infer<typeof clientSchema>;
export type Action = z.infer<typeof actionSchema>;
export type ActionEvent = z.infer<typeof eventSchema>;
export const uuid = z.string().uuid();
