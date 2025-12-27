// Web Worker for filtering translations without blocking the UI thread.

let pageType = "PANEL";
let locale = "en-US";
/** @type {{key:string, keyLc:string, originalLc:string, customLc:string, pluginId:string, pluginIdLc:string}[]} */
let records = [];
/** @type {Map<string, number>} */
let keyToIndex = new Map();

function norm(v) {
  return String(v || "").toLocaleLowerCase(locale);
}

function extractPluginId(key) {
  const m = String(key || "").match(/^plugins\.([^.]+)/);
  return m ? m[1] : "";
}

function buildRecords(translations) {
  keyToIndex = new Map();
  records = (translations || []).map((t, idx) => {
    const key = String(t?.key || "");
    const pluginId = extractPluginId(key);
    keyToIndex.set(key, idx);
    return {
      key,
      keyLc: norm(key),
      originalLc: norm(t?.original),
      customLc: norm(t?.custom),
      pluginId,
      pluginIdLc: norm(pluginId),
    };
  });
}

function filterKeys(query) {
  const q = norm(query).trim();
  if (!q) {
    // return all keys grouped (if needed)
    if (pageType === "PLUGIN") {
      /** @type {Record<string, string[]>} */
      const grouped = {};
      for (const r of records) {
        if (!r.pluginId) continue;
        const pid = r.pluginId;
        if (!grouped[pid]) grouped[pid] = [];
        grouped[pid].push(r.key);
      }
      return grouped;
    }
    return records.map((r) => r.key);
  }

  if (pageType === "PLUGIN") {
    /** @type {Record<string, string[]>} */
    const grouped = {};
    for (const r of records) {
      if (!r.pluginId) continue;
      const matches =
        r.keyLc.includes(q) ||
        r.originalLc.includes(q) ||
        r.customLc.includes(q) ||
        r.pluginIdLc.includes(q);

      if (!matches) continue;
      const pid = r.pluginId;
      if (!grouped[pid]) grouped[pid] = [];
      grouped[pid].push(r.key);
    }
    return grouped;
  }

  return records
    .filter((r) => r.keyLc.includes(q) || r.originalLc.includes(q) || r.customLc.includes(q))
    .map((r) => r.key);
}

self.onmessage = (e) => {
  const msg = e?.data || {};

  if (msg.type === "init") {
    pageType = msg.pageType || "PANEL";
    locale = msg.locale || "en-US";
    buildRecords(msg.translations || []);
    return;
  }

  if (msg.type === "updateCustom") {
    const key = String(msg.key || "");
    const idx = keyToIndex.get(key);
    if (idx === undefined) return;
    records[idx] = { ...records[idx], customLc: norm(msg.custom) };
    return;
  }

  if (msg.type === "search") {
    const result = filterKeys(msg.query || "");
    self.postMessage({
      type: "result",
      requestId: msg.requestId,
      result,
    });
  }
};


