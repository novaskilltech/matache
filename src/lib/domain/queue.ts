import type { Action, Client } from "./models";
export function isOverdue(
  a: Pick<Action, "status" | "due_at">,
  now = new Date(),
) {
  return (
    a.status !== "DONE" &&
    a.due_at !== null &&
    new Date(a.due_at).getTime() < now.getTime()
  );
}
export function priorityRank(priority: Action["priority"]) {
  return { URGENT: 0, TODAY: 1, NORMAL: 2 }[priority];
}
export function activeActions(actions: Action[], now = new Date()) {
  return actions
    .filter((a) => a.status !== "DONE")
    .sort(
      (a, b) =>
        Number(isOverdue(b, now)) - Number(isOverdue(a, now)) ||
        priorityRank(a.priority) - priorityRank(b.priority) ||
        (a.due_at ?? "9999").localeCompare(b.due_at ?? "9999"),
    );
}
export function isToday(
  iso: string | null,
  now = new Date(),
  timezone = "Europe/Paris",
) {
  if (!iso) return false;
  const f = new Intl.DateTimeFormat("fr-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return f.format(new Date(iso)) === f.format(now);
}
export function matchesSearch(
  action: Action,
  client: Client | undefined,
  query: string,
) {
  const normalized = query.toLocaleLowerCase().trim();
  const haystack = [
    action.title,
    action.description,
    action.due_at,
    client?.name,
    client?.phone,
    client?.phone_normalized,
    JSON.stringify(client?.travel ?? {}),
    JSON.stringify(action.context),
  ]
    .join(" ")
    .toLocaleLowerCase();
  if (haystack.includes(normalized)) return true;
  const digits = query.replace(/\D/g, "");
  return (
    digits.length >= 4 &&
    [client?.phone, client?.phone_normalized]
      .join("")
      .replace(/\D/g, "")
      .includes(digits)
  );
}
export function dateLabel(iso: string | null) {
  return iso
    ? new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Europe/Paris",
      }).format(new Date(iso))
    : "Sans échéance";
}
