/**
 * Plain helpers of the Compatibility card and the update plan (doc 04 section 7).
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

/** The lang key of an agent type's name. */
export const AGENT_TYPE_KEYS = Object.freeze({
  SERVER: 'components.compatibility-card.agent-type.SERVER',
  NODE: 'components.compatibility-card.agent-type.NODE',
  AGENT: 'components.compatibility-card.agent-type.AGENT',
});

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
 * What the card has to say. `theme` is the answer of `/panel/theme/compatibility` (already
 * normalized by `normalizeReport`), or null.
 *
 * @param {ReturnType<typeof normalizeCompatibility>} report
 * @param {any} [theme]
 */
export function cardSections(report, theme = null) {
  // The backend lists only refused rows; a row that says OK is not a reason to show the card.
  const resources = (report?.resources ?? []).filter(
    (row) => row.verdict !== Verdicts.OK || isHeld(row),
  );
  const themeOutdated = theme?.status === 'OUTDATED';
  const fallback = themeOutdated
    ? (theme.issues ?? []).filter((issue) => issue?.type !== 'NAMESPACE_CLASH').length
    : 0;

  const sections = {
    plugins: resources.filter((row) => row.type === 'PLUGIN'),
    themes: resources.filter((row) => row.type === 'THEME'),
    externalUrls: report?.externalUrls ?? [],
    themeViews:
      themeOutdated && fallback > 0 ? { theme: theme.theme ?? null, count: fallback } : null,
  };

  const count =
    sections.plugins.length +
    sections.themes.length +
    sections.externalUrls.length +
    (sections.themeViews ? 1 : 0);

  return { ...sections, count, visible: count > 0 };
}

/** The refused rows a Retry could still fix: a compatible version exists, or the store was not asked yet. */
export function retryable(report) {
  return (report?.resources ?? []).some((row) => isLocked(row));
}

/**
 * The sentence that explains a refused row, as a lang key and its values: what the last reconcile
 * learned about it.
 */
export function resourceNote(row) {
  const held = normalizeHeldBy(row.heldBy);

  if (held && !isRefused(row.verdict)) {
    return { key: 'components.compatibility-card.held', values: { name: held.name } };
  }

  if (row.lastError) {
    return {
      key: 'components.compatibility-card.note.error',
      values: { error: row.lastError },
    };
  }

  if (row.hasCompatibleUpdate) {
    return { key: 'components.compatibility-card.note.update-found', values: {} };
  }

  return { key: 'components.compatibility-card.note.no-update', values: {} };
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
 * - `loading`: the plan is being asked for (the store may take 20 seconds); the button is off.
 * - `ready`: the plan is shown; the button is on.
 * - `unavailable`: this Pano has no plan endpoint (an older platform); nothing to wait for.
 * - `failed`: the plan could not be read; the button stays off until the admin says they want to
 *   update without it, or a retry reads it.
 *
 * @param {{ status: 'loading' | 'ready' | 'unavailable' | 'failed', plan: any, acknowledged: boolean }} state
 */
export function canUpdate(state) {
  switch (state.status) {
    case 'ready':
    case 'unavailable':
      return true;
    case 'failed':
      return state.acknowledged === true;
    default:
      return false;
  }
}

/**
 * Loads the plan and holds its state. The panel passes `onChange` to re-render and to enable the
 * update button; tests pass a recorder.
 *
 * @param {{ api: { getPlan: () => Promise<any> }, onChange?: (state: any) => void }} options
 */
export function createPlanController({ api, onChange = () => {} }) {
  /** @type {{ status: 'loading' | 'ready' | 'unavailable' | 'failed', plan: any, errorCode: string, acknowledged: boolean }} */
  let state = { status: 'loading', plan: null, errorCode: '', acknowledged: false };
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

      set({ status: 'loading', errorCode: '', acknowledged: false });

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

    /** The admin's "update without the plan" box. Only means something while the plan has failed. */
    acknowledge(value) {
      set({ acknowledged: value === true });
    },

    get canUpdate() {
      return canUpdate(state);
    },
  };
}

/* ------------------------------------------------------------------------------------------ */
/* The Retry of the card                                                                      */
/* ------------------------------------------------------------------------------------------ */

/**
 * Holds the card's report and runs its Retry (`POST /panel/compatibility/reconcile`). The call
 * answers with the refreshed report, so the card never needs a second read.
 *
 * @param {{ api: { reconcile: () => Promise<any> },
 *   report: ReturnType<typeof normalizeCompatibility>,
 *   notify?: { success: (key: string, values?: any) => void, error: (key: string, values?: any) => void },
 *   onChange?: (state: any) => void }} options
 */
export function createCompatibilityController({
  api,
  report,
  notify = { success() {}, error() {} },
  onChange = () => {},
}) {
  let state = { report, retrying: false, failed: false };

  const set = (next) => {
    state = { ...state, ...next };
    onChange(state);
  };

  return {
    get state() {
      return state;
    },

    async retry() {
      if (state.retrying) return state;

      set({ retrying: true, failed: false });

      const result = await api.reconcile();
      const next = result.ok ? normalizeCompatibility(result.body) : null;

      if (!next) {
        set({ retrying: false, failed: true });
        notify.error('components.compatibility-card.retry-failed', {
          code: result.error?.code ?? 'UNKNOWN',
        });

        return state;
      }

      const left = next.resources.filter((row) => isLocked(row)).length;

      set({ report: next, retrying: false, failed: false });

      if (left === 0) {
        notify.success('components.compatibility-card.retry-done');
      } else {
        notify.error('components.compatibility-card.retry-still', { count: left });
      }

      return state;
    },
  };
}
