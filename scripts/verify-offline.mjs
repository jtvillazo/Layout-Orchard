/**
 * Offline/PWA smoke test for production server.
 * Usage: node scripts/verify-offline.mjs [baseUrl]
 */
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:3001";

async function waitForServiceWorker(page) {
  await page.waitForFunction(
    () => "serviceWorker" in navigator && navigator.serviceWorker.controller !== null,
    null,
    { timeout: 15000 }
  );
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];

  try {
    await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
    await waitForServiceWorker(page);

    const manifest = await page.evaluate(async () => {
      const res = await fetch("/manifest.webmanifest");
      return res.json();
    });
    results.push(["manifest.name", manifest.name === "SAF Layout"]);

    await page.goto(`${baseUrl}/new-project`, { waitUntil: "networkidle" });
    await page.goto(`${baseUrl}/test-grid`, { waitUntil: "networkidle" });
    await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });

    const layoutId = await page.evaluate(async () => {
      const db = await new Promise((resolve, reject) => {
        const req = indexedDB.open("layout-orchard");
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result);
      });

      const tx = db.transaction("layouts", "readonly");
      const store = tx.objectStore("layouts");
      const layouts = await new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result);
      });

      if (layouts.length > 0) {
        return layouts[0].id;
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const writeTx = db.transaction(
        ["projects", "orchards", "blocks", "layouts", "grids", "treatments", "vines", "mapObjects", "mapTexts", "rows"],
        "readwrite"
      );

      const projectId = crypto.randomUUID();
      const orchardId = crypto.randomUUID();

      writeTx.objectStore("projects").put({
        id: projectId,
        name: "Offline Test Project",
        variety: "Hayward",
        projectLeader: "Tester",
        createdAt: now,
        createdBy: "offline-test",
      });
      writeTx.objectStore("orchards").put({
        id: orchardId,
        name: "Offline Orchard",
      });
      writeTx.objectStore("blocks").put({
        id: crypto.randomUUID(),
        orchardId,
        name: "Block A",
      });
      writeTx.objectStore("layouts").put({
        id,
        projectId,
        orchardId,
        blockIds: [],
        status: "draft",
        lastEditedBy: "offline-test",
        lastEditedAt: now,
      });

      await new Promise((resolve, reject) => {
        writeTx.oncomplete = () => resolve();
        writeTx.onerror = () => reject(writeTx.error);
      });

      return id;
    });

    await page.goto(`${baseUrl}/test-grid?layoutId=${layoutId}`, {
      waitUntil: "networkidle",
    });

    await context.setOffline(true);

    for (const path of ["/", "/new-project", `/test-grid?layoutId=${layoutId}`]) {
      const response = await page.goto(`${baseUrl}${path}`, {
        waitUntil: "domcontentloaded",
      });
      results.push([`offline ${path}`, response?.ok() ?? false]);
    }

    const offlineDataOk = await page.evaluate(async (expectedLayoutId) => {
      const db = await new Promise((resolve, reject) => {
        const req = indexedDB.open("layout-orchard");
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result);
      });
      const tx = db.transaction("layouts", "readonly");
      const layout = await new Promise((resolve, reject) => {
        const req = tx.objectStore("layouts").get(expectedLayoutId);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result);
      });
      return Boolean(layout?.id === expectedLayoutId);
    }, layoutId);

    results.push(["offline indexeddb layout", offlineDataOk]);

    await page.evaluate(async (expectedLayoutId) => {
      const db = await new Promise((resolve, reject) => {
        const req = indexedDB.open("layout-orchard");
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result);
      });
      const tx = db.transaction("layouts", "readwrite");
      const layout = await new Promise((resolve, reject) => {
        const req = tx.objectStore("layouts").get(expectedLayoutId);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result);
      });
      layout.lastEditedAt = new Date().toISOString();
      layout.offlineMarker = "edited-offline";
      tx.objectStore("layouts").put(layout);
      await new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }, layoutId);

    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    await page.goto(`${baseUrl}/test-grid?layoutId=${layoutId}`, {
      waitUntil: "domcontentloaded",
    });

    const offlineEditOk = await page.evaluate(async (expectedLayoutId) => {
      const db = await new Promise((resolve, reject) => {
        const req = indexedDB.open("layout-orchard");
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result);
      });
      const tx = db.transaction("layouts", "readonly");
      const layout = await new Promise((resolve, reject) => {
        const req = tx.objectStore("layouts").get(expectedLayoutId);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result);
      });
      return layout?.offlineMarker === "edited-offline";
    }, layoutId);

    results.push(["offline edit persisted", offlineEditOk]);
  } finally {
    await browser.close();
  }

  let failed = 0;
  for (const [name, ok] of results) {
    console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
    if (!ok) failed += 1;
  }

  if (failed > 0) {
    process.exit(1);
  }

  console.log("All offline checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
