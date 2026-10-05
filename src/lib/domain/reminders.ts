import { z } from "zod";
export const snoozeOptions = [
  "hour",
  "tonight",
  "tomorrow",
  "2days",
  "3days",
  "week",
  "custom",
] as const;
export const snoozeLabels = {
  hour: "+1 heure",
  tonight: "Ce soir",
  tomorrow: "Demain",
  "2days": "Dans 2 jours",
  "3days": "Dans 3 jours",
  week: "Dans 1 semaine",
  custom: "Date personnalisée",
};
function parts(date: Date, timezone: string) {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, Number(p.value)]),
  );
}
export function localDateTimeToUtc(local: string, timezone = "Europe/Paris") {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local))
    throw new Error("Date invalide");
  const desired = new Date(local + ":00Z");
  if (!Number.isFinite(desired.getTime())) throw new Error("Date invalide");
  let actual = desired;
  for (let i = 0; i < 3; i++) {
    const p = parts(actual, timezone);
    const wall = Date.UTC(
      p.year,
      p.month - 1,
      p.day,
      p.hour,
      p.minute,
      p.second,
    );
    actual = new Date(actual.getTime() + desired.getTime() - wall);
  }
  const p = parts(actual, timezone);
  const rendered = `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}T${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
  if (rendered !== local)
    throw new Error("Cette heure n’existe pas dans votre fuseau");
  return actual.toISOString();
}
export function snoozeAt(
  option: (typeof snoozeOptions)[number],
  now = new Date(),
  custom?: string,
  timezone = "Europe/Paris",
) {
  if (option === "hour") return new Date(now.getTime() + 3600000).toISOString();
  if (option === "custom") {
    const due = localDateTimeToUtc(z.string().parse(custom), timezone);
    if (new Date(due) <= now) throw new Error("Choisissez une date future");
    return due;
  }
  const p = parts(now, timezone);
  const days =
    option === "tonight"
      ? 0
      : option === "tomorrow"
        ? 1
        : option === "2days"
          ? 2
          : option === "3days"
            ? 3
            : 7;
  const wall = new Date(
    Date.UTC(p.year, p.month - 1, p.day + days, option === "tonight" ? 20 : 9),
  );
  const stamp = wall.toISOString().slice(0, 16);
  let due = localDateTimeToUtc(stamp, timezone);
  if (option === "tonight" && new Date(due) <= now)
    due = new Date(now.getTime() + 3600000).toISOString();
  return due;
}
