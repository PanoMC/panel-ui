/**
 * Plain helpers of the compatibility icons and the update plan (doc 04 section 7).
 *
 * `GET /panel/compatibility` says which plugins and themes the API level gate refused, which game
 * servers and nodes need their new jar placed by hand, and which addresses outside Pano changed.
 * `GET /panel/updates/platform/plan` says what a later platform update would do to the installed
 * plugins and themes. Both are read defensively here: a field a newer or older backend leaves out
 * becomes an empty list, never a crash.
 */

/** Verdicts of the API level gate; anything else is shown as the unknown one. */
export const Verdicts = Object.freeze({ OK: 'OK', TOO_OLD: 'TOO_OLD', TOO_NEW: 'TOO_NEW' });

/** Verdicts of the update plan. */
export const PlanVerdicts = Object.freeze({
  COMPATIBLE: 'COMPATIBLE',
  UPDATE: 'UPDATE',
  DISABLE: 'DISABLE',
});

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
    externalUrls: list(body.externalUrls)
      .map((row) => ({ pluginId: text(row.pluginId), label: text(row.label), url: text(row.url) }))
      .filter((row) => row.url !== ''),
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

/**
 * The lang key of a gate verdict's short name. The same words everywhere a row shows one (the card,
 * the addon list, the update plan).
 */
export function verdictKey(verdict) {
  switch (verdict) {
    case Verdicts.OK:
      return 'components.compatibility-card.verdict.OK';
    case Verdicts.TOO_OLD:
      return 'components.compatibility-card.verdict.TOO_OLD';
    case Verdicts.TOO_NEW:
      return 'components.compatibility-card.verdict.TOO_NEW';
    default:
      return 'components.compatibility-card.verdict.UNKNOWN';
  }
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
 * The text of the exclamation icon on a refused or held plugin or theme: why Pano keeps it off and
 * what to do. Empty for a resource the gate lets run.
 *
 * @param {{ verdict?: string | null, apiLevel?: number | null, heldBy?: any } | null | undefined} resource
 * @param {{ min?: number | null, current?: number | null } | null | undefined} range the levels this
 *   Pano accepts (`apiLevel` of the compatibility report); null when the report is not at hand.
 * @param {(key: string, options?: any) => string} translate the `$_` of svelte-i18n
 */
export function refusalProblem(resource, range, translate) {
  if (!isRefused(resource?.verdict)) {
    return heldReason(resource, translate);
  }

  const old = resource.verdict === Verdicts.TOO_OLD;
  const level = Number.isFinite(resource.apiLevel) ? resource.apiLevel : 0;
  const ranged = Number.isFinite(range?.min) && Number.isFinite(range?.current);

  return translate(
    `components.compatibility-card.problem.${old ? 'too-old' : 'too-new'}${ranged ? '' : '-plain'}`,
    { values: { level, min: range?.min, current: range?.current } },
  );
}

/** The addresses outside Pano that changed for one plugin, from the compatibility report. */
export function externalUrlsOf(report, pluginId) {
  return (report?.externalUrls ?? []).filter((row) => row.pluginId === pluginId);
}

/**
 * Every problem the list shows as an icon on a plugin card, as lines of one tooltip, and how loud
 * it is: `danger` while Pano keeps the plugin off, `warning` for addresses to re-enter.
 *
 * @param {any} plugin the row of `GET /panel/addons`
 * @param {ReturnType<typeof normalizeCompatibility> | null} report
 * @param {(key: string, options?: any) => string} translate
 * @returns {{ text: string, level: 'danger' | 'warning' } | null}
 */
export function pluginProblem(plugin, report, translate) {
  const lines = [];
  const refusal = refusalProblem(plugin, report?.apiLevel, translate);

  if (refusal) lines.push(refusal);

  if (externalUrlsOf(report, plugin?.id).length > 0) {
    lines.push(translate('components.compatibility-card.problem.urls'));
  }

  if (lines.length === 0) return null;

  return { text: lines.join(' · '), level: refusal ? 'danger' : 'warning' };
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
  const refusal = isRefused(theme?.verdict)
    ? refusalProblem(theme, report?.apiLevel, translate)
    : '';

  if (refusal) lines.push(refusal);

  const fallback =
    theme?.active && themeReport?.status === 'OUTDATED'
      ? (themeReport.issues ?? []).filter((issue) => issue?.type !== 'NAMESPACE_CLASH').length
      : 0;

  if (fallback > 0) {
    lines.push(translate('pages.theme-compat.badge-title', { values: { count: fallback } }));
  }

  if (lines.length === 0) return null;

  return { text: lines.join(' · '), level: refusal ? 'danger' : 'warning' };
}

/**
 * What the sidebar counts: plugins Pano keeps off or holds, plugins with changed addresses, themes
 * the gate refused, and the active theme when views fall back.
 *
 * @param {ReturnType<typeof normalizeCompatibility> | null} report
 * @param {any} themeReport
 */
export function attentionCounts(report, themeReport = null) {
  const rows = report?.resources ?? [];
  const plugins = new Set(
    rows
      .filter((row) => row.type === 'PLUGIN' && (row.verdict !== Verdicts.OK || isHeld(row)))
      .map((row) => row.id),
  );

  for (const row of report?.externalUrls ?? []) {
    if (row.pluginId) plugins.add(row.pluginId);
  }

  const themes = rows.filter((row) => row.type === 'THEME' && row.verdict !== Verdicts.OK).length;
  const fallback =
    themeReport?.status === 'OUTDATED' &&
    (themeReport.issues ?? []).some((issue) => issue?.type !== 'NAMESPACE_CLASH');

  return { addons: plugins.size, themes: themes + (fallback ? 1 : 0) };
}

/* ------------------------------------------------------------------------------------------ */
/* The update plan                                                                            */
/* ------------------------------------------------------------------------------------------ */

/**
 * The answer of `GET /panel/updates/platform/plan` with every field present, or null when the
 * answer is not a plan.
 *
 * @param {any} body
 */
export function normalizePlan(body) {
  if (!body || typeof body !== 'object' || body.error) {
    return null;
  }

  const target =
    body.target && typeof body.target === 'object'
      ? {
          version: text(body.target.version),
          apiLevel: whole(body.target.apiLevel),
          minApiLevel: whole(body.target.minApiLevel),
        }
      : null;

  return {
    target,
    // A target that does not say its level is unknown: the backend then reads everything as
    // compatible, which is not a promise.
    known: target !== null && target.apiLevel !== null,
    resources: list(body.resources).map((row) => ({
      id: text(row.id),
      type: typeOf(row.type),
      installedVersion: text(row.installedVersion),
      verdict: Object.values(PlanVerdicts).includes(row.verdict)
        ? row.verdict
        : PlanVerdicts.COMPATIBLE,
      updateVersionId: row.updateVersionId ? text(row.updateVersionId) : null,
    })),
    agents: list(body.agents).map(normalizeAgent),
    storeReachable: typeof body.storeReachable === 'boolean' ? body.storeReachable : null,
  };
}

/** How many resources fall in each plan verdict. */
export function planCounts(plan) {
  const counts = { COMPATIBLE: 0, UPDATE: 0, DISABLE: 0 };

  for (const row of plan?.resources ?? []) {
    counts[row.verdict] += 1;
  }

  return counts;
}

/** The rows of one plan verdict. */
export function planRows(plan, verdict) {
  return (plan?.resources ?? []).filter((row) => row.verdict === verdict);
}

/**
 * Whether the plan asks the admin for something by hand: a resource that stays refused, or a game
 * server or node whose jar has to be replaced.
 */
export function planNeedsAttention(plan) {
  return planCounts(plan).DISABLE > 0 || (plan?.agents ?? []).length > 0;
}

/** Codes of an answer that mean "this Pano has no plan endpoint" (an older platform): nothing to gate on. */
const NO_PLAN_CODES = ['NOT_FOUND', 'PAGE_NOT_FOUND'];

/**
 * The state machine behind the update button:
 *
 * - `loading`: the plan is being asked for (the store may take 20 seconds); the button waits.
 * - `ready`: the plan is read; the button is on.
 * - `unavailable`: this Pano has no plan endpoint (an older platform); nothing to wait for.
 * - `failed`: the plan could not be read; the button is on all the same, the icon beside it warns
 *   and the confirmation says so.
 *
 * @param {{ status: 'loading' | 'ready' | 'unavailable' | 'failed' }} state
 */
export function canUpdate(state) {
  return state.status !== 'loading';
}

/**
 * The lines of the tooltip beside the update button, joined with a dot like a server's problems.
 * Empty while the update fits (the icon then shows nothing).
 *
 * @param {{ status: string, plan: any }} state
 * @param {(key: string, options?: any) => string} translate
 */
export function planProblem(state, translate) {
  if (state.status !== 'ready' || !state.plan?.target) return '';

  const plan = state.plan;
  const lines = [];
  const names = (rows) => rows.map((row) => row.id).join(', ');
  const disabled = planRows(plan, PlanVerdicts.DISABLE);
  const updated = planRows(plan, PlanVerdicts.UPDATE);
  const base = 'pages.settings.updates.plan.tip';

  if (plan.known === false) {
    lines.push(translate(`${base}.unknown`, { values: { version: plan.target.version } }));
  }

  if (disabled.length > 0) {
    lines.push(
      translate(`${base}.disable`, { values: { count: disabled.length, names: names(disabled) } }),
    );
  }

  if (updated.length > 0) {
    lines.push(
      translate(`${base}.update`, { values: { count: updated.length, names: names(updated) } }),
    );
  }

  if (plan.agents.length > 0) {
    lines.push(
      translate(`${base}.agents`, {
        values: { count: plan.agents.length, names: plan.agents.map((row) => row.name).join(', ') },
      }),
    );
  }

  if (plan.storeReachable === false) {
    lines.push(translate(`${base}.store-down`));
  }

  return lines.join(' · ');
}

/**
 * Loads the plan and holds its state. The panel passes `onChange` to re-render and to enable the
 * update button; tests pass a recorder.
 *
 * @param {{ api: { getPlan: () => Promise<any> }, onChange?: (state: any) => void }} options
 */
export function createPlanController({ api, onChange = () => {} }) {
  /** @type {{ status: 'loading' | 'ready' | 'unavailable' | 'failed', plan: any, errorCode: string }} */
  let state = { status: 'loading', plan: null, errorCode: '' };
  let run = 0;

  const set = (next) => {
    state = { ...state, ...next };
    onChange(state);
  };

  return {
    get state() {
      return state;
    },

    /** Asks for the plan. A second call while one runs wins; the older answer is dropped. */
    async load() {
      const mine = ++run;

      set({ status: 'loading', errorCode: '' });

      const result = await api.getPlan();

      if (mine !== run) return state;

      if (result.ok) {
        const plan = normalizePlan(result.body);

        set(
          plan
            ? { status: 'ready', plan }
            : { status: 'failed', plan: null, errorCode: 'BAD_ANSWER' },
        );
      } else if (NO_PLAN_CODES.includes(result.error?.code)) {
        set({ status: 'unavailable', plan: null, errorCode: result.error.code });
      } else {
        set({ status: 'failed', plan: null, errorCode: result.error?.code ?? 'UNKNOWN' });
      }

      return state;
    },

    get canUpdate() {
      return canUpdate(state);
    },
  };
}
