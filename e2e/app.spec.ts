import { test, expect } from "@playwright/test";
test("dashboard → action → dossier and search", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Que dois-je faire/ }),
  ).toBeVisible();
  await page
    .getByRole("link")
    .filter({ hasText: "Préparer la facture" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Préparer la facture" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Mme Benali →" }).click();
  await expect(
    page.getByRole("heading", { name: "Mme Benali", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Historique" })).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Actions", exact: true })
    .click();
  await page.getByRole("textbox", { name: "Rechercher" }).fill("Amrani");
  await page.getByRole("button", { name: "Rechercher" }).click();
  await expect(
    page
      .getByRole("link")
      .filter({ hasText: "Rappeler pour confirmer le départ" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link").filter({ hasText: "Préparer la facture" }),
  ).toHaveCount(0);
  if (test.info().project.name === "mobile")
    await page.screenshot({ path: "/tmp/matache-mobile.png", fullPage: true });
  expect(errors).toEqual([]);
});
test("manual correction and import controls render without overflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/manual");
  await page.getByLabel("Client", { exact: true }).fill("Mme Test");
  await page.getByLabel("Prochaine action").fill("");
  await page.getByLabel("Prochaine action").fill("Vérifier les documents");
  await page.getByLabel("Catégorie").selectOption("WAITING_CLIENT");
  await expect(
    page.getByRole("heading", { name: "Vérifier les documents" }),
  ).toBeVisible();
  await page.getByText("Corriger les informations du dossier").click();
  await expect(
    page.getByText("Ville de départ", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/import");
  await expect(
    page.getByRole("button", { name: "Choisir les captures" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Appareil photo" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("PWA installs worker and caches only public offline files", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  const manifest = await (
    await page.request.get("/manifest.webmanifest")
  ).json();
  expect(manifest.share_target.action).toBe("/share-target");
  expect(manifest.icons).toHaveLength(3);
  const cached = await page.evaluate(async () => {
    const keys = await caches.keys();
    const entries = await Promise.all(
      keys.map(async (key) =>
        (await (await caches.open(key)).keys()).map(
          (r) => new URL(r.url).pathname,
        ),
      ),
    );
    return entries.flat();
  });
  expect(cached).toContain("/offline.html");
  expect(cached.some((p) => p === "/actions" || p === "/")).toBe(false);
});
test("private API rejects cross-origin writes and unauthenticated cron", async ({
  request,
}) => {
  const csrf = await request.post("/api/uploads/prepare", {
    headers: { Origin: "https://attacker.invalid" },
    data: { files: [] },
  });
  expect(csrf.status()).toBe(403);
  const cron = await request.get("/api/cron/reminders");
  expect(cron.status()).toBe(401);
});

test("share target accepts real multipart files through the service worker", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.evaluate(async () => {
    const blob = await (await fetch("/icons/icon-192.png")).blob();
    const form = document.createElement("form");
    form.method = "POST";
    form.enctype = "multipart/form-data";
    form.action = "/share-target";
    const input = document.createElement("input");
    input.type = "file";
    input.name = "images";
    const transfer = new DataTransfer();
    transfer.items.add(
      new File([blob], "fictitious.png", { type: "image/png" }),
    );
    input.files = transfer.files;
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
  });
  await page.waitForURL("**/share?batch=*");
  await expect(
    page.getByRole("heading", { name: "1 capture(s) partagée(s)" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Se connecter pour importer" }),
  ).toBeVisible();
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open("matache-share-v1", 1);
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction("batches", "readwrite");
        tx.objectStore("batches").clear();
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
      };
      req.onerror = () => reject(req.error);
    });
  });
});
