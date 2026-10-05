import "server-only";
import { isConfigured } from "@/lib/config";
import { demoActions, demoClients, demoEvents } from "@/lib/demo";
import { listDossiers, timeline } from "./dossiers";
export async function getDossiers() {
  return isConfigured()
    ? listDossiers()
    : { clients: demoClients, actions: demoActions };
}
export async function getTimeline(id: string) {
  return isConfigured()
    ? timeline(id)
    : demoEvents.filter((e) => e.client_id === id);
}
