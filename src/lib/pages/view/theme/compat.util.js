/**
 * Plain helpers of the theme override warning (doc 01 section 7): the report read defensively and
 * the issues that make a view fall back.
 */

/** Issues that make a view show its default look (everything except a namespace clash, which is about plugins). */
export function fallbackIssues(report) {
  return (report?.issues ?? []).filter((issue) => issue?.type !== 'NAMESPACE_CLASH');
}

/** `market` reads `Market`, `my-shop` reads `My Shop`. */
function namespaceLabel(namespace) {
  return namespace
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * What the dialog lists: one row per plugin whose views fell back, with the plugin's version (when
 * the report names it) and those views. The views of the theme engine come last, in a row without
 * a name (`name` is null) or a version.
 *
 * @param {any} report a normalized report
 * @returns {{ name: string | null, version: string | null, views: string[] }[]}
 */
export function incompatibilities(report) {
  const rows = new Map();

  for (const issue of fallbackIssues(report)) {
    const id = String(issue?.view ?? '');
    const at = id.indexOf(':');
    const namespace = at > 0 ? id.slice(0, at) : '';
    const view = at > 0 ? id.slice(at + 1) : id;

    if (!rows.has(namespace)) {
      rows.set(namespace, {
        name: namespace ? namespaceLabel(namespace) : null,
        version: null,
        views: [],
      });
    }

    const row = rows.get(namespace);

    row.version ??= issue?.pluginVersion ? String(issue.pluginVersion) : null;

    if (view && !row.views.includes(view)) row.views.push(view);
  }

  return [...rows.values()].sort(
    (a, b) => (a.name === null) - (b.name === null) || String(a.name).localeCompare(String(b.name)),
  );
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
