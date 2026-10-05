import { deleteSharedBatch } from "./share-store";
function applicationKey(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}
export async function enablePush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window))
    throw new Error("Ce navigateur ne prend pas en charge les notifications.");
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!key)
    throw new Error("Les notifications ne sont pas encore configurées.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted")
    throw new Error(
      "Autorisez les notifications dans les paramètres du navigateur.",
    );
  const registration = await navigator.serviceWorker.ready;
  const sub =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationKey(key),
    }));
  const r = await fetch("/api/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub.toJSON()),
  });
  if (!r.ok) throw new Error("Impossible d’enregistrer les notifications.");
}
export async function disablePush() {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  const sub = await registration.pushManager.getSubscription();
  if (sub) {
    const r = await fetch("/api/push", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
    if (!r.ok)
      throw new Error(
        "Suppression impossible. Réessayez avant de vous déconnecter.",
      );
    await sub.unsubscribe();
  }
  await deleteSharedBatch();
}
