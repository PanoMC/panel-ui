/**
 * Plain rules of the Webhooks page (doc 06 section 4.5): the form model of an endpoint, the request
 * body and its checks, the event catalogue grouped by source, the delivery filters and the error
 * codes turned into lang keys. No Svelte and no HTTP client in here.
 */

export const WEBHOOK_FORMATS = ['JSON', 'DISCORD'];
export const WEBHOOK_SIGNINGS = ['NONE', 'HMAC_SHA256'];
/** The value a stored secret or header value reads back as; sending it back keeps the stored one. */
export const MASK = '********';

export const WILDCARD = '*';
export const MAX_NAME_LENGTH = 128;
export const MAX_URL_LENGTH = 1024;
export const MAX_TEMPLATE_LENGTH = 20000;
export const MAX_HEADERS = 10;
export const MAX_HEADER_VALUE_LENGTH = 512;
export const MAX_EVENTS = 200;
export const DEFAULT_MAX_ATTEMPTS = 8;
export const MAX_ATTEMPTS = 20;
export const DEFAULT_ENDPOINT_LIMIT = 50;
export const URL_DISPLAY_LENGTH = 48;
export const DELIVERY_PAGE_SIZE = 25;

const HEADER_NAME_PATTERN = /^[A-Za-z0-9-]{1,64}$/;
const FORBIDDEN_HEADERS = [
  'host',
  'content-length',
  'content-type',
  'transfer-encoding',
  'connection',
  'user-agent',
];

const present = (value) => value !== null && value !== undefined && String(value).trim() !== '';

// ---------------------------------------------------------------------------------------------
// Event catalogue
// ---------------------------------------------------------------------------------------------

/**
 * @typedef {object} EventSource
 * @property {string} source `core` or a plugin namespace
 * @property {string} title
 * @property {Array<{ name: string, subscribable: boolean, sample?: any }>} events
 */

/**
 * The catalogue as the page uses it: only subscribable events, sources without any dropped, `core` first.
 *
 * @param {any} body the answer of `GET /webhooks/events`
 * @returns {EventSource[]}
 */
export function normalizeCatalogue(body) {
  const items = Array.isArray(body?.items) ? body.items : [];

  return items
    .map((item) => ({
      source: String(item?.source ?? ''),
      title: String(item?.title || item?.source || ''),
      events: (Array.isArray(item?.events) ? item.events : [])
        .filter((event) => event?.subscribable !== false && present(event?.name))
        .map((event) => ({
          name: String(event.name),
          subscribable: true,
          sample: event.sample ?? null,
        })),
    }))
    .filter((item) => item.source !== '' && item.events.length > 0)
    .sort((a, b) => (a.source === 'core' ? -1 : b.source === 'core' ? 1 : 0));
}

/** `core.*`: the subscription that covers every subscribable event of a source. */
export const sourceWildcard = (source) => `${source}.*`;

/**
 * Subscribed names the catalogue does not list (a plugin that is stopped now). The server keeps
 * them on save, so the form keeps them too and shows them apart.
 *
 * @param {string[]} events
 * @param {EventSource[]} catalogue
 */
export function unlistedEvents(events, catalogue) {
  const known = new Set();

  for (const group of catalogue) {
    known.add(sourceWildcard(group.source));

    for (const event of group.events) known.add(event.name);
  }

  return (events ?? []).filter((name) => name !== WILDCARD && !known.has(name));
}

/** The event sources of the catalogue plus any source the filter was opened with. */
export function sourceOptions(catalogue, extra = '') {
  const sources = catalogue.map((group) => ({ value: group.source, title: group.title }));

  if (present(extra) && !sources.some((item) => item.value === extra)) {
    sources.push({ value: extra, title: extra });
  }

  return sources;
}

/** Whether an endpoint's subscriptions touch a source (used by the source filter of the endpoint list). */
export function subscribesToSource(endpoint, source) {
  if (!present(source)) return true;

  const events = Array.isArray(endpoint?.events) ? endpoint.events : [];

  return events.some(
    (name) => name === WILDCARD || name === sourceWildcard(source) || name.startsWith(`${source}.`),
  );
}

// ---------------------------------------------------------------------------------------------
// URL
// ---------------------------------------------------------------------------------------------

/** `new URL` result when the text is an http(s) URL, else null. */
export function parseHttpUrl(text) {
  try {
    const url = new URL(String(text ?? '').trim());

    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

/** A Discord webhook address: host ends with discord.com / discordapp.com, path starts /api/webhooks/. */
export function isDiscordUrl(text) {
  const url = parseHttpUrl(text);

  if (!url) return false;

  const host = url.hostname.toLowerCase();
  const hostOk = ['discord.com', 'discordapp.com'].some(
    (d) => host === d || host.endsWith('.' + d),
  );

  return hostOk && url.pathname.startsWith('/api/webhooks/');
}

/** Error code of the URL input or null: REQUIRED, TOO_LONG, INVALID_URL, DISCORD_URL. */
export function validateUrl(text, format) {
  const value = String(text ?? '').trim();

  if (value === '') return 'REQUIRED';
  if (value.length > MAX_URL_LENGTH) return 'TOO_LONG';
  if (!parseHttpUrl(value)) return 'INVALID_URL';
  if (format === 'DISCORD' && !isDiscordUrl(value)) return 'DISCORD_URL';

  return null;
}

/** URL shortened for a table cell. */
export function shortUrl(text, max = URL_DISPLAY_LENGTH) {
  const value = String(text ?? '');

  return value.length > max ? value.slice(0, max - 1) + '…' : value;
}

// ---------------------------------------------------------------------------------------------
// Headers
// ---------------------------------------------------------------------------------------------

/** Error code of one header name or null. */
export function headerNameError(name) {
  const value = String(name ?? '');

  if (!HEADER_NAME_PATTERN.test(value)) return 'INVALID_NAME';

  const lower = value.toLowerCase();

  if (FORBIDDEN_HEADERS.includes(lower) || lower.startsWith('x-pano-')) return 'FORBIDDEN_NAME';

  return null;
}

/** Error code of one header value or null. A masked value (a stored one kept as is) is always fine. */
export function headerValueError(value) {
  const text = String(value ?? '');

  if (text === MASK) return null;
  if (text === '') return 'REQUIRED';
  if (text.length > MAX_HEADER_VALUE_LENGTH) return 'TOO_LONG';
  if (!/^[\x20-\x7e]+$/.test(text)) return 'INVALID_VALUE';

  return null;
}

/** Rows (`[{ key, value }]`) of the header list from a stored `headers` object; values stay masked. */
export function headerRows(headers) {
  return Object.entries(headers && typeof headers === 'object' ? headers : {}).map(
    ([key, value]) => ({ key, value: String(value ?? '') }),
  );
}

/** Row errors by index plus a flag for too many rows. Blank rows (both empty) are ignored. */
export function validateHeaderRows(rows) {
  const list = rows ?? [];
  const used = list.filter((row) => row.key !== '' || row.value !== '');
  const byIndex = {};
  const seen = new Set();

  list.forEach((row, index) => {
    if (row.key === '' && row.value === '') return;

    const lower = String(row.key).toLowerCase();
    const error =
      headerNameError(row.key) ||
      (seen.has(lower) ? 'DUPLICATE' : null) ||
      headerValueError(row.value);

    seen.add(lower);

    if (error) byIndex[index] = error;
  });

  return { byIndex, tooMany: used.length > MAX_HEADERS };
}

/** The `headers` object of the request body; a masked value goes back so the server keeps it. */
export function headersBody(rows) {
  const out = {};

  for (const row of rows ?? []) {
    if (row.key === '' && row.value === '') continue;

    out[row.key] = row.value;
  }

  return out;
}

// ---------------------------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------------------------

/** Error code of a custom Discord template or null: REQUIRED, TOO_LONG, INVALID_JSON. */
export function templateError(text) {
  const value = String(text ?? '');

  if (value.trim() === '') return 'REQUIRED';
  if (value.length > MAX_TEMPLATE_LENGTH) return 'TOO_LONG';

  try {
    JSON.parse(value);
  } catch {
    return 'INVALID_JSON';
  }

  return null;
}

// ---------------------------------------------------------------------------------------------
// Form model
// ---------------------------------------------------------------------------------------------

/** Empty create form. */
export function blankForm() {
  return {
    name: '',
    url: '',
    format: 'JSON',
    allEvents: true,
    events: [],
    signing: 'HMAC_SHA256',
    headers: [],
    customTemplate: false,
    template: '',
    maxAttempts: String(DEFAULT_MAX_ATTEMPTS),
    enabled: true,
  };
}

/** Edit form of a stored endpoint (header values arrive masked and stay masked). */
export function formFromEndpoint(endpoint) {
  const events = Array.isArray(endpoint?.events) ? endpoint.events : [];
  const format = WEBHOOK_FORMATS.includes(endpoint?.format) ? endpoint.format : 'JSON';
  const template = typeof endpoint?.template === 'string' ? endpoint.template : '';

  return {
    name: endpoint?.name ?? '',
    url: endpoint?.url ?? '',
    format,
    allEvents: events.includes(WILDCARD),
    events: events.filter((name) => name !== WILDCARD),
    signing: format === 'DISCORD' || endpoint?.signing !== 'HMAC_SHA256' ? 'NONE' : 'HMAC_SHA256',
    headers: headerRows(endpoint?.headers),
    customTemplate: format === 'DISCORD' && template !== '',
    template,
    maxAttempts: String(endpoint?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS),
    enabled: endpoint?.enabled !== false,
  };
}

/** Format change: Discord never signs, and only Discord has a template. */
export function withFormat(form, format) {
  const next = { ...form, format };

  if (format === 'DISCORD') {
    next.signing = 'NONE';
  } else {
    next.customTemplate = false;
  }

  return next;
}

/** Turns one event on or off in the form's list. */
export function withEvent(form, name, on) {
  const rest = form.events.filter((item) => item !== name);

  return { ...form, events: on ? [...rest, name] : rest };
}

/** Turns a whole source on or off: `source.*` replaces the single names of that source. */
export function withSource(form, source, on) {
  const wildcard = sourceWildcard(source);
  const rest = form.events.filter((name) => name !== wildcard && !name.startsWith(`${source}.`));

  return { ...form, events: on ? [...rest, wildcard] : rest };
}

/** Integer 1..20 or null. */
export function parseMaxAttempts(text) {
  const value = String(text ?? '').trim();

  if (!/^\d+$/.test(value)) return null;

  const number = Number(value);

  return number >= 1 && number <= MAX_ATTEMPTS ? number : null;
}

/**
 * Checks and request body of `POST /webhooks` and `PUT /webhooks/:id`. Answers `{ errors }` (field to
 * code; `headers` holds `{ byIndex, tooMany }`) or `{ body }`. Discord is sent with signing `NONE`
 * and, unless it is customized, `template: null`. A masked header value is sent back as it is.
 */
export function buildBody(form) {
  const errors = {};
  const name = String(form.name ?? '').trim();

  if (name === '') errors.name = 'REQUIRED';
  else if (name.length > MAX_NAME_LENGTH) errors.name = 'TOO_LONG';

  const urlError = validateUrl(form.url, form.format);

  if (urlError) errors.url = urlError;

  if (!WEBHOOK_FORMATS.includes(form.format)) errors.format = 'INVALID';

  const discord = form.format === 'DISCORD';
  const signing = discord ? 'NONE' : form.signing;

  if (!WEBHOOK_SIGNINGS.includes(signing)) errors.signing = 'INVALID';

  const events = form.allEvents ? [WILDCARD] : [...new Set(form.events ?? [])];

  if (events.length === 0) errors.events = 'REQUIRED';
  else if (events.length > MAX_EVENTS) errors.events = 'TOO_MANY';

  const rowErrors = validateHeaderRows(form.headers);

  if (Object.keys(rowErrors.byIndex).length > 0 || rowErrors.tooMany) errors.headers = rowErrors;

  const customTemplate = discord && form.customTemplate === true;

  if (customTemplate) {
    const problem = templateError(form.template);

    if (problem) errors.template = problem;
  }

  const attempts = parseMaxAttempts(form.maxAttempts);

  if (attempts === null) errors.maxAttempts = 'OUT_OF_RANGE';

  if (Object.keys(errors).length > 0) return { errors };

  return {
    body: {
      name,
      url: String(form.url).trim(),
      events,
      format: form.format,
      signing,
      headers: headersBody(form.headers),
      template: customTemplate ? form.template : null,
      enabled: form.enabled !== false,
      maxAttempts: attempts,
    },
  };
}

/**
 * The field errors a failed save carries, as `{ field: CODE }` with header errors as
 * `{ headers: { byName: { name: CODE }, tooMany } }`. Anything else is not a field error.
 *
 * @param {{ code?: string, fields?: Record<string, any> } | null | undefined} error
 */
export function serverFieldErrors(error) {
  const fields = error?.fields && typeof error.fields === 'object' ? error.fields : {};
  const out = {};
  const byName = {};

  for (const [field, value] of Object.entries(fields)) {
    if (field.startsWith('headers.')) {
      byName[field.slice('headers.'.length)] = String(value);
    } else if (field === 'headers') {
      out.headers = { byName, tooMany: String(value) === 'TOO_MANY' };
    } else {
      out[field] = String(value);
    }
  }

  if (Object.keys(byName).length > 0) {
    out.headers = { byName, tooMany: out.headers?.tooMany === true };
  }

  return out;
}

// ---------------------------------------------------------------------------------------------
// Endpoint list
// ---------------------------------------------------------------------------------------------

/** `{ kind, auto }`: kind `enabled` | `disabled`; `auto` = the server switched it off after failures. */
export function endpointStatus(endpoint) {
  if (endpoint?.enabled) return { kind: 'enabled', auto: false };

  return {
    kind: 'disabled',
    auto: present(endpoint?.disabledReason) && endpoint.disabledReason !== 'MANUAL',
  };
}

/** Events cell: `null` = all events, else the number of subscriptions. */
export function eventsCount(endpoint) {
  const events = Array.isArray(endpoint?.events) ? endpoint.events : [];

  return events.includes(WILDCARD) ? null : events.length;
}

/** Test result `{ statusCode, durationMs, error }` to `{ ok, status, ms, error }`. */
export function testOutcome(result) {
  const status = Number(result?.statusCode);
  const ok = !result?.error && status >= 200 && status < 300;

  return {
    ok,
    status: Number.isFinite(status) ? status : 0,
    ms: Number.isFinite(Number(result?.durationMs)) ? Number(result.durationMs) : 0,
    error: typeof result?.error === 'string' ? result.error : '',
  };
}

// ---------------------------------------------------------------------------------------------
// Deliveries
// ---------------------------------------------------------------------------------------------

export const DELIVERY_STATUSES = ['PENDING', 'SENDING', 'SUCCEEDED', 'FAILED', 'DEAD'];

/** Redeliver is offered for rows that are not on their way out (never while `SENDING`). */
export const canRedeliver = (delivery) =>
  ['PENDING', 'SUCCEEDED', 'FAILED', 'DEAD'].includes(delivery?.status);

/** Badge class of a delivery status. */
export function statusBadgeClass(status) {
  switch (status) {
    case 'SUCCEEDED':
      return 'text-bg-success';
    case 'FAILED':
      return 'text-bg-warning';
    case 'DEAD':
      return 'text-bg-danger';
    case 'SENDING':
      return 'text-bg-info';
    default:
      return 'text-bg-secondary';
  }
}

/** The delivery list path: all endpoints, or one. */
export function deliveriesPath({
  endpointId = null,
  source = '',
  status = '',
  page = 1,
  pageSize = DELIVERY_PAGE_SIZE,
} = {}) {
  const base = endpointId
    ? `/panel/webhooks/${endpointId}/deliveries`
    : '/panel/webhook-deliveries';
  const params = [];

  if (present(source)) params.push(`source=${encodeURIComponent(source)}`);
  if (present(status)) params.push(`status=${encodeURIComponent(status)}`);
  if (page > 1) params.push(`page=${page}`);

  params.push(`pageSize=${pageSize}`);

  return `${base}?${params.join('&')}`;
}

/** A positive integer from `?endpointId=` or null. */
export function parseEndpointId(value) {
  const text = String(value ?? '');

  return /^[1-9]\d*$/.test(text) ? Number(text) : null;
}

/** Body or response text for a `<pre>`: JSON is pretty-printed. */
export function prettyText(value) {
  if (value === null || value === undefined || value === '') return '';

  if (typeof value !== 'string') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

// ---------------------------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------------------------

const KNOWN_ERRORS = new Set([
  'WEBHOOK_URL_REFUSED',
  'WEBHOOK_LIMIT',
  'WEBHOOK_UNKNOWN_EVENT',
  'WEBHOOK_HEADERS_INVALID',
  'WEBHOOK_NOT_FOUND',
  'WEBHOOK_IN_FLIGHT',
  'INVALID_FIELDS',
  'PAGE_NOT_FOUND',
  'NO_PERMISSION',
  'DISABLED_FOR_DEMO',
  'NETWORK_ERROR',
]);

/**
 * The lang key and values of the message for a failed call.
 *
 * @param {{ code?: string, details?: Record<string, any> } | null | undefined} error
 */
export function describeError(error) {
  const code = error?.code ?? '';
  const details = error?.details ?? {};

  if (!KNOWN_ERRORS.has(code)) return { key: 'pages.webhooks.errors.UNKNOWN', values: {} };

  const values = {};

  if (details.limit != null) values.limit = String(details.limit);
  if (Array.isArray(details.events)) values.events = details.events.join(', ');

  return { key: `pages.webhooks.errors.${code}`, values };
}

const FIELD_CODES = new Set([
  'REQUIRED',
  'TOO_LONG',
  'TOO_MANY',
  'INVALID',
  'INVALID_URL',
  'INVALID_JSON',
  'INVALID_NAME',
  'INVALID_VALUE',
  'FORBIDDEN_NAME',
  'DUPLICATE',
  'OUT_OF_RANGE',
  'NOT_ALLOWED',
  'UNKNOWN_EVENT',
  'MALFORMED',
  'SCHEME',
  'USERINFO',
  'HOST',
  'PORT',
  'DISCORD_URL',
  'DNS',
  'PRIVATE_ADDRESS',
]);

/** Lang key of a field error code; a code this page does not know reads as `INVALID`. */
export const fieldErrorKey = (code) =>
  `pages.webhooks.field-errors.${FIELD_CODES.has(code) ? code : 'INVALID'}`;
