type SharedBatch = { id: string; files: File[]; expires: number };
function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open("matache-share-v1", 1);
    req.onupgradeneeded = () =>
      req.result.createObjectStore("batches", { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
export async function getSharedBatch(id: string): Promise<File[]> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("batches", "readwrite");
      const store = tx.objectStore("batches");
      const r = store.get(id);
      r.onsuccess = () => {
        const batch = r.result as SharedBatch | undefined;
        if (!batch || batch.expires < Date.now()) {
          store.delete(id);
          resolve([]);
        } else resolve(batch.files);
      };
      r.onerror = () => reject(r.error);
    });
  } finally {
    db.close();
  }
}
export async function deleteSharedBatch(id?: string) {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("batches", "readwrite");
      if (id) tx.objectStore("batches").delete(id);
      else tx.objectStore("batches").clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function purgeExpiredShares() {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("batches", "readwrite");
      const req = tx.objectStore("batches").openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          if (cursor.value.expires < Date.now()) cursor.delete();
          cursor.continue();
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
