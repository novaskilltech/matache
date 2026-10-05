import type { Client, Action, ActionEvent } from "./domain/models";
const workspace = "10000000-0000-4000-8000-000000000000";
const now = new Date();
const ids = [
  "10000000-0000-4000-8000-000000000001",
  "10000000-0000-4000-8000-000000000002",
  "10000000-0000-4000-8000-000000000003",
];
export const demoClients: Client[] = [
  "Mme Benali",
  "M. Amrani",
  "Famille Haddad",
].map((name, i) => ({
  id: ids[i],
  workspace_id: workspace,
  name,
  phone: null,
  phone_normalized: null,
  travel: {
    departure_city: ["Bruxelles", "Paris", "Lyon"][i],
    arrival_city: "Jeddah",
  },
  documents: { missing_documents: ["Passeport"] },
  financial: {},
  created_at: now.toISOString(),
}));
export const demoActions: Action[] = [
  {
    title: "Préparer la facture",
    category: "INVOICE" as const,
    priority: "URGENT" as const,
    status: "TODO" as const,
  },
  {
    title: "Rappeler pour confirmer le départ",
    category: "CALLBACK" as const,
    priority: "TODAY" as const,
    status: "TODO" as const,
  },
  {
    title: "Relancer pour les passeports",
    category: "WAITING_CLIENT" as const,
    priority: "NORMAL" as const,
    status: "WAITING" as const,
  },
].map((a, i) => ({
  ...a,
  id: `20000000-0000-4000-8000-00000000000${i + 1}`,
  workspace_id: workspace,
  client_id: ids[i],
  analysis_id: null,
  description: [
    "Le dossier est complet. La cliente attend sa facture.",
    "Préciser les dates et le nombre de voyageurs.",
    "Les documents sont attendus pour préparer le dossier.",
  ][i],
  action_owner: i === 2 ? "ACTION_CLIENT" : "ACTION_USER",
  due_at: new Date(
    now.getTime() + (i === 0 ? -3600000 : i === 1 ? 3600000 : 86400000),
  ).toISOString(),
  context: { summary: "Exemple fictif de suivi client" },
  created_at: now.toISOString(),
}));
export const demoEvents: ActionEvent[] = demoActions.map((a) => ({
  id: a.id,
  workspace_id: workspace,
  action_id: a.id,
  client_id: a.client_id,
  event_type: "CREATED",
  payload: {},
  created_at: a.created_at,
}));
