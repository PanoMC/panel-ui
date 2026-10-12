/**
 * Plain helpers of the compatibility icons (doc 04 section 7).
 *
 * `GET /panel/compatibility` says which plugins and themes the API level gate refused and which game
 * servers and nodes need their new jar placed by hand.
 * It is read defensively here: a field a newer or older backend leaves out becomes an empty list,
 * never a crash.
 */

/** Verdicts of the API level gate; anything else is shown as the unknown one. */
export const Verdicts = Object.freeze({ OK: 'OK', TOO_OLD: 'TOO_OLD', TOO_NEW: 'TOO_NEW' });

const text = (value) => (value === undefined || value === null ? '' : String(value));
const list = (value) =>
  Array.isArray(value) ? value.filter((row) => row && typeof row === 'object') : [];
const whole = (value) => (Number.isFinite(value) ? value : null);

/** `PLUGIN` or `THEME`; a type this panel does not know reads as a plugin. */
function typeOf(value) {
  return value === 'THEME' ? 'THEME' : 'PLUGIN';
}

/**
 * The answer of `GET /panel/compatibility` (and of the reconcile call) with every field present, or
 * null when the answer is not a report.
 *
 * @param {any} body
 */
export function normalizeCompatibility(body) {
  if (!body || typeof body !== 'object' || body.error) {
    return null;
  }

  const reconcile = body.reconcile && typeof body.reconcile === 'object' ? body.reconcile : {};

  return {
    apiLevel: {
      min: whole(body.apiLevel?.min),
      current: whole(body.apiLevel?.current),
    },
    resources: list(body.resources).map((row) => ({
      id: text(row.id),
      type: typeOf(row.type),
      title: text(row.title) || text(row.id),
      version: text(row.version),
      apiLevel: whole(row.apiLevel),
      verdict: text(row.verdict),
      hasCompatibleUpdate: row.hasCompatibleUpdate === true,
      lastError: row.lastError ? text(row.lastError) : null,
      heldBy: normalizeHeldBy(row.heldBy),
    })),
    agents: list(body.agents).map(normalizeAgent),
    reconcile: {
      running: reconcile.running === true,
      ranAt: whole(reconcile.ranAt),
      storeReachable:
        typeof reconcile.storeReachable === 'boolean' ? reconcile.storeReachable : null,
      installed: list(reconcile.installed).map((row) => ({
        id: text(row.id),
        type: typeOf(row.type),
        fromVersion: text(row.fromVersion),
        version: text(row.version),
        restartRequired: row.restartRequired === true,
      })),
    },
  };
}

/**
 * `heldBy` of a plugin: it is compatible itself, but a plugin it requires is refused, so Pano keeps
 * it off as well. `pluginId` / `name` / `verdict` are the refused plugin (the one to update), `via`
 * the dependency the plugin names directly. Null for everything else.
 * @param {any} value
 * @returns {{ pluginId: string, name: string, verdict: string, via: string } | null}
 */
export function normalizeHeldBy(value) {
  if (!value || typeof value !== 'object' || !text(value.pluginId)) {
    return null;
  }

  return {
    pluginId: text(value.pluginId),
    name: text(value.name) || text(value.pluginId),
    verdict: text(value.verdict),
    via: text(value.via) || text(value.pluginId),
  };
}

/** One game server, node or agent that is still on an old protocol. */
export function normalizeAgent(row) {
  const type = ['SERVER', 'NODE', 'AGENT'].includes(row.type) ? row.type : 'SERVER';

  return {
    type,
    id: row.id ?? null,
    name: text(row.name) || `#${text(row.id)}`,
    protocolVersion: whole(row.protocolVersion),
    minProtocolVersion: whole(row.minProtocolVersion),
    pluginVersion: row.pluginVersion ? text(row.pluginVersion) : null,
    action: text(row.action),
    downloadPath: safeDownloadPath(row.downloadPath),
  };
}

/**
 * A jar link must stay on this Pano: only an absolute path is kept (no scheme, no `//host`), so a
 * hostile or broken answer cannot turn the button into a link to another site.
 * @param {any} value
 * @returns {string | null}
 */
export function safeDownloadPath(value) {
  const path = text(value);

  return path.startsWith('/') && !path.startsWith('//') && !path.includes('\\') ? path : null;
}

/** True for a verdict that means the resource does not run (the gate refused it). */
export function isRefused(verdict) {
  return verdict === Verdicts.TOO_OLD || verdict === Verdicts.TOO_NEW;
}

/** True for a plugin held back only because a plugin it requires is refused. */
export function isHeld(resource) {
  return normalizeHeldBy(resource?.heldBy) !== null;
}

/** True when the plugin can not be switched on: refused itself, or held back by a refused dependency. */
export function isLocked(resource) {
  return isRefused(resource?.verdict) || isHeld(resource);
}

/**
 * The reason a held plugin has no enable switch: which plugin it needs and what to do.
 * Empty for a plugin that is not held.
 *
 * @param {{ heldBy?: any } | null | undefined} resource
 * @param {(key: string, options?: any) => string} translate the `$_` of svelte-i18n
 */
export function heldReason(resource, translate) {
  const held = normalizeHeldBy(resource?.heldBy);

  return held
    ? translate('components.compatibility-card.held', { values: { name: held.name } })
    : '';
}

/**
 * The reason a refused addon or theme has no enable / activate control, for its title: the level it
 * was built for and what to do. Empty for a resource the gate lets run.
 *
 * @param {{ verdict?: string | null, apiLevel?: number | null } | null | undefined} resource
 * @param {(key: string, options?: any) => string} translate the `$_` of svelte-i18n
 * @param {'PLUGIN' | 'THEME'} [type]
 */
export function lockedReason(resource, translate, type = 'PLUGIN') {
  if (!isRefused(resource?.verdict)) {
    return type === 'PLUGIN' ? heldReason(resource, translate) : '';
  }

  const level = Number.isFinite(resource?.apiLevel) ? resource.apiLevel : 0;

  return translate(
    type === 'THEME'
      ? 'components.compatibility-card.locked-theme'
      : 'components.compatibility-card.locked',
    { values: { level } },
  );
}

/**
 * The text of the exclamation icon on a refused or held plugin or theme: one word for a refused one,
 * the dependency to update for a held one. Empty for a resource the gate lets run.
 *
 * @param {{ verdict?: string | null, heldBy?: any } | null | undefined} resource
 * @param {(key: string, options?: any) => string} translate the `$_` of svelte-i18n
 */
export function refusalProblem(resource, translate) {
  if (!isRefused(resource?.verdict)) {
    return heldReason(resource, translate);
  }

  return translate('components.compatibility-card.incompatible');
}

/**
 * The problem the list shows as an icon on a plugin card, as the text of its tooltip: Pano keeps
 * the plugin off.
 *
 * @param {any} plugin the row of `GET /panel/addons`
 * @param {ReturnType<typeof normalizeCompatibility> | null} report
 * @param {(key: string, options?: any) => string} translate
 * @returns {{ text: string, level: 'danger' } | null}
 */
export function pluginProblem(plugin, report, translate) {
  const refusal = refusalProblem(plugin, translate);

  if (!refusal) return null;

  return { text: refusal, level: 'danger' };
}

/**
 * The same for a theme: refused by the gate, or (the active one) some of its views show a plugin's
 * default look.
 *
 * @param {any} theme the row of `GET /panel/themes`
 * @param {ReturnType<typeof normalizeCompatibility> | null} report
 * @param {any} themeReport the normalized `/panel/theme/compatibility` answer, or null
 * @param {(key: string, options?: any) => string} translate
 * @returns {{ text: string, level: 'danger' | 'warning' } | null}
 */
export function themeProblem(theme, report, themeReport, translate) {
  const lines = [];
  const refusal = isRefused(theme?.verdict) ? refusalProblem(theme, translate) : '';

  if (refusal) lines.push(refusal);

  const fallback =
    theme?.active && themeReport?.status === 'OUTDATED'
      ? (themeReport.issues ?? []).filter((issue) => issue?.type !== 'NAMESPACE_CLASH').length
      : 0;

  if (fallback > 0) {
    lines.push(translate('pages.theme-compat.badge-title'));
  }

  if (lines.length === 0) return null;

  return { text: lines.join(' · '), level: refusal ? 'danger' : 'warning' };
}

/**
 * What the sidebar counts beside "Addons": plugins Pano keeps off or holds.
 *
 * @param {ReturnType<typeof normalizeCompatibility> | null} report
 */
export function attentionCounts(report) {
  const rows = report?.resources ?? [];
  const plugins = new Set(
    rows
      .filter((row) => row.type === 'PLUGIN' && (row.verdict !== Verdicts.OK || isHeld(row)))
      .map((row) => row.id),
  );

  return { addons: plugins.size };
}
