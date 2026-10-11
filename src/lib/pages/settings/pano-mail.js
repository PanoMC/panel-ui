/**
 * Pano Mail in the e-mail settings: the status call, the switch call and the usage logic.
 *
 * The HTTP client is passed in (`ApiUtil` in the panel, a stub in tests), so this file imports
 * nothing. Money-free, DOM-free: the page only renders what these functions answer.
 */

/** From this share of a limit the panel warns. */
export const WARNING_PERCENT = 80;

const UNAVAILABLE_CODES = ['NOT_IMPLEMENTED', 'UNSUPPORTED', 'PAGE_NOT_FOUND'];

/**
 * @param {any} body
 * @returns {string}
 */
function errorCode(body) {
  const error = body?.error;

  if (error == null) return '';

  return typeof error === 'string' ? error : String(error.code ?? '');
}

/**
 * @param {any} value
 * @returns {number | null}
 */
function num(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * @param {any} raw `{ used, limit, resetsAt }`
 * @returns {{ used: number, limit: number, resetsAt: number | null } | null}
 */
function readPeriod(raw) {
  const used = num(raw?.used);
  const limit = num(raw?.limit);

  if (used === null || limit === null) return null;

  return { used, limit, resetsAt: num(raw?.resetsAt) };
}

/**
 * @typedef {object} PanoMailStatus
 * @property {string} website
 * @property {boolean} connected
 * @property {{ username: string } | null} account
 * @property {'SMTP' | 'PANO_MAIL'} provider
 * @property {boolean} enabled
 * @property {boolean} ready
 * @property {string} from
 * @property {boolean} held
 * @property {{ id: string, name: string, free: boolean, mailsPerMonth: number, mailsPerDay: number } | null} plan
 * @property {{ day: { used: number, limit: number, resetsAt: number | null }, month: { used: number, limit: number, resetsAt: number | null } } | null} usage
 * @property {{ mailsPerMonth: number, mailsPerDay: number } | null} freePlan
 * @property {string[]} senders the domains the account may send from
 * @property {string} manageUrl
 */

/**
 * Turns the answer of `GET /panel/settings/pano-mail` into one tolerant shape.
 *
 * @param {any} body
 * @returns {{ supported: false, status: null } | { supported: true, status: PanoMailStatus }}
 *   `supported` is false for an older platform (no route) and for any other failed answer.
 */
export function readPanoMail(body) {
  if (
    !body ||
    typeof body !== 'object' ||
    errorCode(body) ||
    UNAVAILABLE_CODES.includes(body.error)
  ) {
    return { supported: false, status: null };
  }

  const day = readPeriod(body.usage?.day);
  const month = readPeriod(body.usage?.month);
  const plan = body.plan && typeof body.plan === 'object' ? body.plan : null;
  const freePlan = body.freePlan && typeof body.freePlan === 'object' ? body.freePlan : null;

  return {
    supported: true,
    status: {
      website: typeof body.website === 'string' ? body.website : '',
      connected: body.connected === true,
      account: body.account && typeof body.account === 'object' ? body.account : null,
      provider: body.provider === 'PANO_MAIL' ? 'PANO_MAIL' : 'SMTP',
      enabled: body.enabled === true,
      ready: body.ready === true,
      from: typeof body.from === 'string' ? body.from : '',
      held: body.held === true,
      plan: plan
        ? {
            id: String(plan.id ?? ''),
            name: String(plan.name ?? ''),
            free: plan.free === true,
            mailsPerMonth: num(plan.mailsPerMonth) ?? 0,
            mailsPerDay: num(plan.mailsPerDay) ?? 0,
          }
        : null,
      usage: day && month ? { day, month } : null,
      freePlan: freePlan
        ? {
            mailsPerMonth: num(freePlan.mailsPerMonth) ?? 0,
            mailsPerDay: num(freePlan.mailsPerDay) ?? 0,
          }
        : null,
      senders: Array.isArray(body.senders)
        ? body.senders
            .map((/** @type {any} */ sender) => sender?.domain)
            .filter((/** @type {any} */ domain) => typeof domain === 'string' && domain !== '')
        : [],
      manageUrl: typeof body.manageUrl === 'string' ? body.manageUrl : '',
    },
  };
}

/**
 * @param {any} client `ApiUtil`-like: `get` / `put` resolving with the answer body
 * @param {any} [request] the SvelteKit load event, for a call made while loading
 */
export function createPanoMailApi(client, request) {
  return {
    /** `GET /panel/settings/pano-mail` read through [readPanoMail]. */
    getStatus: async () =>
      readPanoMail(await client.get({ path: '/panel/settings/pano-mail', request })),

    /**
     * `PUT /panel/settings` with the `email` form field `{ enabled: true, provider: 'PANO_MAIL' }`,
     * the call the SMTP form uses too. With `from`, that address becomes the sender (it has to be at
     * one of the account's sender domains, else `INVALID_DATA`).
     *
     * @param {string} [from]
     * @returns {Promise<{ ok: boolean, code: string }>} `code` is `CONNECT_REQUIRED`,
     *   `PANO_MAIL_UNAVAILABLE` or another backend code when `ok` is false.
     */
    switchToPanoMail: async (from) => {
      const form = new FormData();

      form.append(
        'email',
        JSON.stringify({ enabled: true, provider: 'PANO_MAIL', ...(from ? { from } : {}) }),
      );

      const body = await client.put({ path: '/panel/settings', body: form, request });

      if (body === undefined || body === null) return { ok: false, code: 'DISABLED_FOR_DEMO' };

      const code = errorCode(body);

      return { ok: !code, code };
    },
  };
}

/**
 * @param {{ used: number, limit: number } | null | undefined} period
 * @returns {number} 0 to 100, whole percent (rounded down so 99.9 % is never shown as full);
 *   0 when there is no usable limit.
 */
export function percentUsed(period) {
  if (!period || !(period.limit > 0)) return 0;

  return Math.max(0, Math.min(100, Math.floor((period.used / period.limit) * 100)));
}

/**
 * @param {{ used: number, limit: number } | null | undefined} period
 * @returns {'ok' | 'warning' | 'danger'} danger at 100 %, warning from 80 %.
 */
export function usageLevel(period) {
  if (!period || !(period.limit > 0)) return 'ok';
  if (period.used >= period.limit) return 'danger';

  return percentUsed(period) >= WARNING_PERCENT ? 'warning' : 'ok';
}

/**
 * The one usage alert to show: the worse period wins, the month on a tie (it resets later).
 *
 * @param {PanoMailStatus['usage']} usage
 * @returns {{ level: 'warning' | 'danger', period: 'day' | 'month', percent: number, resetsAt: number | null } | null}
 */
export function usageAlert(usage) {
  if (!usage) return null;

  const rank = { ok: 0, warning: 1, danger: 2 };
  const day = usageLevel(usage.day);
  const month = usageLevel(usage.month);

  if (rank[day] === 0 && rank[month] === 0) return null;

  const period = rank[day] > rank[month] ? 'day' : 'month';
  const level = /** @type {'warning' | 'danger'} */ (period === 'day' ? day : month);

  return { level, period, percent: percentUsed(usage[period]), resetsAt: usage[period].resetsAt };
}

/**
 * What the Pano Mail side of the card shows for a status.
 *
 * @param {PanoMailStatus} status
 * @returns {'connect' | 'activate' | 'unreadable' | 'active'}
 *   connect: no account; activate: connected but still on SMTP; unreadable: Pano Mail is the
 *   provider but the website could not be reached; active: the full status.
 */
export function panoMailView(status) {
  if (!status.connected) return 'connect';
  if (status.provider !== 'PANO_MAIL') return 'activate';

  return status.usage && status.plan ? 'active' : 'unreadable';
}

/**
 * The limits to show before Pano Mail is on: the connected account's own plan when it is known,
 * else the free plan every account starts with.
 *
 * @param {PanoMailStatus} status
 * @returns {{ name: string, free: boolean, mailsPerMonth: number, mailsPerDay: number } | null}
 */
export function offeredPlan(status) {
  if (status.connected && status.plan) return status.plan;

  return status.freePlan ? { name: '', free: true, ...status.freePlan } : null;
}

/**
 * @param {string} address `local@domain` or `Name <local@domain>`
 * @returns {{ localPart: string, domain: string }} empty strings when it is not an address
 */
export function splitAddress(address) {
  const text = String(address ?? '').trim();
  const bare = /<([^>]*)>\s*$/.exec(text)?.[1]?.trim() ?? text;
  const at = bare.lastIndexOf('@');

  if (at <= 0) return { localPart: '', domain: '' };

  return { localPart: bare.slice(0, at), domain: bare.slice(at + 1).toLowerCase() };
}

const LOCAL_PART = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;

/**
 * @param {string} localPart
 * @returns {boolean} a plain e-mail local part of at most 64 characters (the backend's rule)
 */
export function validLocalPart(localPart) {
  return localPart.length > 0 && localPart.length <= 64 && LOCAL_PART.test(localPart);
}

/**
 * @param {number | null} resetsAt epoch millis
 * @param {string} locale
 * @returns {string} short date and time, empty when unknown
 */
export function formatReset(resetsAt, locale) {
  if (resetsAt === null || resetsAt === undefined) return '';

  try {
    return new Date(resetsAt).toLocaleString(locale, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return new Date(resetsAt).toLocaleString();
  }
}
