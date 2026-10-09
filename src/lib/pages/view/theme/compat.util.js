/**
 * Plain helpers of the theme override warnings (doc 01 section 7): one sentence per issue type,
 * the report read defensively, and the "did the fallback count grow" rule behind the toast that
 * follows a plugin update.
 */

/** Issue types the backend reports, with the lang key of the sentence that describes each. */
export const IssueKeys = Object.freeze({
  CONTRACT_MISMATCH: 'pages.theme-compat.issues.CONTRACT_MISMATCH',
  CONTROLLER_MISMATCH: 'pages.theme-compat.issues.CONTROLLER_MISMATCH',
  VIEW_REMOVED: 'pages.theme-compat.issues.VIEW_REMOVED',
  ENGINE_MISMATCH: 'pages.theme-compat.issues.ENGINE_MISMATCH',
  NAMESPACE_CLASH: 'pages.theme-compat.issues.NAMESPACE_CLASH',
});

/** Used for a type this panel does not know yet (a newer backend), so nothing is dropped silently. */
const UNKNOWN_ISSUE_KEY = 'pages.theme-compat.issues.UNKNOWN';

/** `market` becomes `Market`, `my-shop` becomes `My Shop`. */
export function namespaceLabel(namespace) {
  return String(namespace ?? '')
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** The view id `market:ProductCard` as `{ namespace: 'market', name: 'ProductCard' }`; an engine view has no namespace. */
export function splitViewId(view) {
  const id = String(view ?? '');
  const at = id.indexOf(':');

  return at < 0
    ? { namespace: '', name: id }
    : { namespace: id.slice(0, at), name: id.slice(at + 1) };
}

/**
 * The sentence of one issue as a lang key and its values.
 * `ProductCard of Market shows the plugin's default look: the theme was made for version 1, the plugin is on 2`
 *
 * @param {any} issue one entry of `issues`
 * @returns {{ key: string, values: Record<string, string | number> }}
 */
export function describeIssue(issue) {
  const type = String(issue?.type ?? '');
  const { namespace, name } = splitViewId(issue?.view);
  const plugin = namespaceLabel(namespace);
  const show = (value) => (value === undefined || value === null ? '?' : value);

  switch (type) {
    case 'CONTRACT_MISMATCH':
      return {
        key: IssueKeys.CONTRACT_MISMATCH,
        values: {
          view: name,
          plugin,
          themeContract: show(issue.themeContract),
          currentContract: show(issue.currentContract),
        },
      };
    case 'CONTROLLER_MISMATCH':
      return {
        key: IssueKeys.CONTROLLER_MISMATCH,
        values: {
          view: name,
          plugin,
          controller: String(issue.controller ?? ''),
          themeVersion: show(issue.themeVersion),
          currentVersion: show(issue.currentVersion),
        },
      };
    case 'VIEW_REMOVED':
      return {
        key: IssueKeys.VIEW_REMOVED,
        values: { view: name, plugin, pluginVersion: show(issue.pluginVersion) },
      };
    case 'ENGINE_MISMATCH':
      return {
        key: IssueKeys.ENGINE_MISMATCH,
        values: {
          view: name,
          themeContract: show(issue.themeContract),
          engineContract: show(issue.engineContract),
        },
      };
    case 'NAMESPACE_CLASH':
      return {
        key: IssueKeys.NAMESPACE_CLASH,
        values: {
          pluginId: String(issue.pluginId ?? ''),
          namespace: String(issue.namespace ?? ''),
          heldBy: String(issue.heldBy ?? ''),
        },
      };
    default:
      return { key: UNKNOWN_ISSUE_KEY, values: { type, view: name } };
  }
}

/**
 * The answer of `GET /panel/theme/compatibility` with every field present, or null when the
 * answer is not a report.
 *
 * @param {any} body
 */
export function normalizeReport(body) {
  if (!body || typeof body !== 'object' || body.error) {
    return null;
  }

  const count = (value) => (Number.isFinite(value) ? value : 0);

  return {
    theme: body.theme && typeof body.theme === 'object' ? body.theme : null,
    status: ['OK', 'OUTDATED', 'UNKNOWN'].includes(body.status) ? body.status : 'UNKNOWN',
    counts: {
      overrides: count(body.counts?.overrides),
      active: count(body.counts?.active),
      fallback: count(body.counts?.fallback),
      pluginNotInstalled: count(body.counts?.pluginNotInstalled),
    },
    issues: Array.isArray(body.issues) ? body.issues : [],
  };
}

/** True while the dashboard alert and the theme card badge should show. */
export function isOutdated(report) {
  return report?.status === 'OUTDATED';
}

/** Issues that make a view show its default look (everything except a namespace clash). */
export function fallbackIssues(report) {
  return (report?.issues ?? []).filter((issue) => issue?.type !== 'NAMESPACE_CLASH');
}

/** A stable identity of an issue, to tell a new one from one the admin has already seen. */
export function issueKey(issue) {
  return [
    issue?.type,
    issue?.view ?? issue?.namespace ?? '',
    issue?.controller ?? '',
    issue?.themeContract ?? issue?.themeVersion ?? '',
    issue?.currentContract ?? issue?.currentVersion ?? issue?.engineContract ?? '',
  ].join('|');
}

/**
 * @typedef {object} Baseline what the panel last showed for a theme
 * @property {string} theme theme id
 * @property {number} fallback `counts.fallback` at that time
 * @property {string[]} keys `issueKey` of every fallback issue at that time
 */

/** @returns {Baseline} */
export function baselineOf(report) {
  return {
    theme: String(report?.theme?.id ?? ''),
    fallback: report?.counts?.fallback ?? 0,
    keys: fallbackIssues(report).map(issueKey),
  };
}

/**
 * The issues that are new since [baseline], and only when `counts.fallback` grew. No baseline, or one
 * of another theme, is a first look: nothing is new, so a fresh install or a theme switch never toasts.
 *
 * @param {Baseline | null} baseline
 * @param {any} report a normalized report
 */
export function newFallbackIssues(baseline, report) {
  if (!report || report.status === 'UNKNOWN') return [];
  if (!baseline || baseline.theme !== String(report.theme?.id ?? '')) return [];
  if (report.counts.fallback <= baseline.fallback) return [];

  const seen = new Set(baseline.keys);

  return fallbackIssues(report).filter((issue) => !seen.has(issueKey(issue)));
}

const STORAGE_KEY = 'pano.theme-compat.baseline';

/** The browser storage, or an in-memory stand-in when it is blocked (private window, tests). */
export function browserStorage() {
  try {
    const storage = globalThis.localStorage;

    if (storage) {
      storage.getItem(STORAGE_KEY);

      return storage;
    }
  } catch (e) {
    // fall through to the stand-in
  }

  return memoryStorage();
}

export function memoryStorage() {
  const map = new Map();

  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => void map.set(key, String(value)),
  };
}

/** The most lines one check shows as toasts; the rest are summed up in one. */
export const MAX_TOASTS = 3;

/** @param {{ getItem: (k: string) => string | null }} storage @returns {Baseline | null} */
export function readBaseline(storage) {
  try {
    const value = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');

    return value && typeof value.theme === 'string' && Array.isArray(value.keys) ? value : null;
  } catch (e) {
    return null;
  }
}

/**
 * Records [report] as seen, without a toast (the admin is looking at it). A report without a
 * verdict (`UNKNOWN`) is not recorded.
 *
 * @param {any} report a normalized report
 * @param {{ setItem: (k: string, v: string) => void }} [storage]
 */
export function rememberReport(report, storage = browserStorage()) {
  if (!report || report.status === 'UNKNOWN') return;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(baselineOf(report)));
  } catch (e) {
    // a blocked storage only means the next check cannot compare
  }
}

/**
 * Tells the admin, by toast, about views that started to show a plugin's default look since the
 * panel last looked. `check()` is what a plugin update calls (and what the dashboard calls when it
 * opens, which is the next time the admin looks after an update).
 *
 * @param {object} options
 * @param {ReturnType<import('./theme.api.js').createThemeApi>} options.api
 * @param {{ warn: (key: string, values?: object) => any }} options.notify
 * @param {{ getItem: (k: string) => string | null, setItem: (k: string, v: string) => void }} [options.storage]
 */
export function createCompatWatcher({ api, notify, storage = browserStorage() }) {
  return {
    /**
     * Fetches the report, toasts the lines of the issues that are new, remembers the report.
     * @returns {Promise<{ report: any, fresh: any[] } | null>} null when the report could not be read
     */
    async check() {
      const result = await api.getCompatibility();
      const report = result.ok ? normalizeReport(result.body) : null;

      if (!report) return null;

      const fresh = newFallbackIssues(readBaseline(storage), report);

      fresh.slice(0, MAX_TOASTS).forEach((issue) => {
        const { key, values } = describeIssue(issue);

        notify.warn(key, values);
      });

      if (fresh.length > MAX_TOASTS) {
        notify.warn('pages.theme-compat.toast-more', { count: fresh.length - MAX_TOASTS });
      }

      rememberReport(report, storage);

      return { report, fresh };
    },
  };
}
