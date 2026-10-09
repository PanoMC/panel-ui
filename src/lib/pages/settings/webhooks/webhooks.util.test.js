import { describe, expect, test } from 'bun:test';

import {
  MASK,
  blankForm,
  buildBody,
  canRedeliver,
  deliveriesPath,
  describeError,
  endpointStatus,
  eventsCount,
  fieldErrorKey,
  formFromEndpoint,
  headerRows,
  isDiscordUrl,
  normalizeCatalogue,
  parseEndpointId,
  parseMaxAttempts,
  prettyText,
  serverFieldErrors,
  sourceOptions,
  subscribesToSource,
  testOutcome,
  unlistedEvents,
  validateHeaderRows,
  validateUrl,
  withEvent,
  withFormat,
  withSource,
} from './webhooks.util.js';

const CATALOGUE = normalizeCatalogue({
  items: [
    {
      source: 'market',
      title: 'Market',
      events: [
        { name: 'market.order.paid', subscribable: true, sample: {} },
        { name: 'market.order.refunded', subscribable: true, sample: {} },
      ],
    },
    {
      source: 'core',
      title: 'Pano',
      events: [
        { name: 'core.user.registered', subscribable: true, sample: { id: 1 } },
        { name: 'core.test.ping', subscribable: false, sample: {} },
      ],
    },
    { source: 'empty', title: 'Empty', events: [] },
  ],
});

const filled = (patch = {}) => ({
  ...blankForm(),
  name: 'Discord',
  url: 'https://example.com/hook',
  ...patch,
});

describe('event catalogue', () => {
  test('keeps subscribable events only, drops empty sources and puts core first', () => {
    expect(CATALOGUE.map((group) => group.source)).toEqual(['core', 'market']);
    expect(CATALOGUE[0].events.map((event) => event.name)).toEqual(['core.user.registered']);
  });

  test('a missing or broken answer is an empty catalogue', () => {
    expect(normalizeCatalogue(null)).toEqual([]);
    expect(normalizeCatalogue({ items: 'x' })).toEqual([]);
  });

  test('unlisted events are subscribed names the catalogue no longer offers', () => {
    expect(
      unlistedEvents(['core.user.registered', 'market.*', 'gone.order.paid', '*'], CATALOGUE),
    ).toEqual(['gone.order.paid']);
  });

  test('source options add the source the page was opened with', () => {
    expect(sourceOptions(CATALOGUE, 'stopped').map((item) => item.value)).toEqual([
      'core',
      'market',
      'stopped',
    ]);
    expect(sourceOptions(CATALOGUE, 'market')).toHaveLength(2);
  });

  test('an endpoint belongs to a source when it subscribes to anything of it', () => {
    expect(subscribesToSource({ events: ['*'] }, 'market')).toBe(true);
    expect(subscribesToSource({ events: ['market.*'] }, 'market')).toBe(true);
    expect(subscribesToSource({ events: ['market.order.paid'] }, 'market')).toBe(true);
    expect(subscribesToSource({ events: ['core.user.registered'] }, 'market')).toBe(false);
    expect(subscribesToSource({ events: ['core.user.registered'] }, '')).toBe(true);
  });

  test('a source switch replaces the single events of that source with source.*', () => {
    let form = filled({ allEvents: false, events: ['market.order.paid', 'core.user.registered'] });

    form = withSource(form, 'market', true);
    expect(form.events).toEqual(['core.user.registered', 'market.*']);

    form = withSource(form, 'market', false);
    expect(form.events).toEqual(['core.user.registered']);

    expect(withEvent(form, 'market.order.paid', true).events).toContain('market.order.paid');
    expect(withEvent(withEvent(form, 'a.b', true), 'a.b', false).events).toEqual(form.events);
  });
});

describe('urls and headers', () => {
  test('url codes', () => {
    expect(validateUrl('', 'JSON')).toBe('REQUIRED');
    expect(validateUrl('ftp://x.test', 'JSON')).toBe('INVALID_URL');
    expect(validateUrl('x'.repeat(1030), 'JSON')).toBe('TOO_LONG');
    expect(validateUrl('https://example.com/h', 'JSON')).toBeNull();
    expect(validateUrl('https://example.com/h', 'DISCORD')).toBe('DISCORD_URL');
    expect(validateUrl('https://discord.com/api/webhooks/1/abc', 'DISCORD')).toBeNull();
    expect(isDiscordUrl('https://ptb.discordapp.com/api/webhooks/1/a')).toBe(true);
  });

  test('header rows: forbidden, duplicate and bad names, blank rows ignored', () => {
    const result = validateHeaderRows([
      { key: 'X-Token', value: 'a' },
      { key: 'x-token', value: 'b' },
      { key: 'Host', value: 'c' },
      { key: 'Bad Name', value: 'd' },
      { key: '', value: '' },
      { key: 'X-Empty', value: '' },
    ]);

    expect(result.byIndex).toEqual({
      1: 'DUPLICATE',
      2: 'FORBIDDEN_NAME',
      3: 'INVALID_NAME',
      5: 'REQUIRED',
    });
    expect(result.tooMany).toBe(false);
    expect(
      validateHeaderRows(Array.from({ length: 11 }, (_, i) => ({ key: `X-${i}`, value: 'v' })))
        .tooMany,
    ).toBe(true);
    expect(validateHeaderRows([{ key: 'X-Pano-Event', value: 'v' }]).byIndex[0]).toBe(
      'FORBIDDEN_NAME',
    );
  });

  test('a masked header value is valid and goes back unchanged', () => {
    const form = formFromEndpoint({
      events: ['*'],
      headers: { Authorization: MASK },
      format: 'JSON',
    });

    expect(form.headers).toEqual([{ key: 'Authorization', value: MASK }]);

    const built = buildBody({ ...form, name: 'n', url: 'https://example.com/h' });

    expect(built.body.headers).toEqual({ Authorization: MASK });
  });

  test('headerRows tolerates nothing', () => {
    expect(headerRows(null)).toEqual([]);
  });
});

describe('request body', () => {
  test('create body for a JSON endpoint with all events', () => {
    const built = buildBody(filled());

    expect(built.errors).toBeUndefined();
    expect(built.body).toEqual({
      name: 'Discord',
      url: 'https://example.com/hook',
      events: ['*'],
      format: 'JSON',
      signing: 'HMAC_SHA256',
      headers: {},
      template: null,
      enabled: true,
      maxAttempts: 8,
    });
    // The secret is made by the server; the form never sends one.
    expect('secret' in built.body).toBe(false);
  });

  test('chosen events, a whole source and a deduplicated list', () => {
    const built = buildBody(
      filled({ allEvents: false, events: ['core.user.registered', 'market.*', 'market.*'] }),
    );

    expect(built.body.events).toEqual(['core.user.registered', 'market.*']);
  });

  test('Discord is sent unsigned, with the template only when customized', () => {
    const discord = withFormat(
      filled({ url: 'https://discord.com/api/webhooks/1/a', template: '{"content":"hi"}' }),
      'DISCORD',
    );

    expect(buildBody(discord).body).toMatchObject({
      format: 'DISCORD',
      signing: 'NONE',
      template: null,
    });
    expect(buildBody({ ...discord, customTemplate: true }).body.template).toBe('{"content":"hi"}');
    expect(buildBody({ ...discord, customTemplate: true, template: '{nope' }).errors.template).toBe(
      'INVALID_JSON',
    );
    // Switching back to JSON drops the template switch.
    expect(withFormat({ ...discord, customTemplate: true }, 'JSON').customTemplate).toBe(false);
  });

  test('every rule names its field', () => {
    const { errors } = buildBody({
      ...blankForm(),
      name: ' ',
      url: 'nope',
      allEvents: false,
      events: [],
      maxAttempts: '21',
      headers: [{ key: 'Host', value: 'x' }],
    });

    expect(errors.name).toBe('REQUIRED');
    expect(errors.url).toBe('INVALID_URL');
    expect(errors.events).toBe('REQUIRED');
    expect(errors.maxAttempts).toBe('OUT_OF_RANGE');
    expect(errors.headers.byIndex[0]).toBe('FORBIDDEN_NAME');
    expect(buildBody(filled({ name: 'x'.repeat(129) })).errors.name).toBe('TOO_LONG');
  });

  test('max attempts is a whole number from 1 to 20', () => {
    expect(parseMaxAttempts('1')).toBe(1);
    expect(parseMaxAttempts('20')).toBe(20);
    expect(parseMaxAttempts('0')).toBeNull();
    expect(parseMaxAttempts('2.5')).toBeNull();
    expect(parseMaxAttempts('')).toBeNull();
  });

  test('an edit form is the stored endpoint and builds the same body back', () => {
    const stored = {
      id: 4,
      name: 'Ops',
      url: 'https://example.com/ops',
      events: ['core.user.registered', 'market.*'],
      format: 'JSON',
      signing: 'HMAC_SHA256',
      secret: MASK,
      headers: { 'X-Token': MASK },
      template: null,
      enabled: false,
      maxAttempts: 5,
    };
    const form = formFromEndpoint(stored);

    expect(form).toMatchObject({ allEvents: false, signing: 'HMAC_SHA256', enabled: false });
    expect(buildBody(form).body).toEqual({
      name: 'Ops',
      url: 'https://example.com/ops',
      events: ['core.user.registered', 'market.*'],
      format: 'JSON',
      signing: 'HMAC_SHA256',
      headers: { 'X-Token': MASK },
      template: null,
      enabled: false,
      maxAttempts: 5,
    });
  });
});

describe('server errors', () => {
  test('field errors of every refusal', () => {
    expect(
      serverFieldErrors({ code: 'WEBHOOK_URL_REFUSED', fields: { url: 'PRIVATE_ADDRESS' } }),
    ).toEqual({
      url: 'PRIVATE_ADDRESS',
    });
    expect(serverFieldErrors({ code: 'INVALID_FIELDS', fields: { name: 'REQUIRED' } })).toEqual({
      name: 'REQUIRED',
    });
    expect(
      serverFieldErrors({
        code: 'WEBHOOK_HEADERS_INVALID',
        fields: { 'headers.X-Bad': 'INVALID_VALUE', headers: 'TOO_MANY' },
      }),
    ).toEqual({ headers: { byName: { 'X-Bad': 'INVALID_VALUE' }, tooMany: true } });
    expect(serverFieldErrors({ code: 'WEBHOOK_LIMIT' })).toEqual({});
    expect(serverFieldErrors(null)).toEqual({});
  });

  test('messages and field codes have a lang key, unknown ones read as generic', () => {
    expect(describeError({ code: 'WEBHOOK_LIMIT', details: { limit: 50 } })).toEqual({
      key: 'pages.webhooks.errors.WEBHOOK_LIMIT',
      values: { limit: '50' },
    });
    expect(
      describeError({ code: 'WEBHOOK_UNKNOWN_EVENT', details: { events: ['a.b', 'c.d'] } }).values,
    ).toEqual({ events: 'a.b, c.d' });
    expect(describeError({ code: 'SOMETHING' }).key).toBe('pages.webhooks.errors.UNKNOWN');
    expect(fieldErrorKey('PRIVATE_ADDRESS')).toBe('pages.webhooks.field-errors.PRIVATE_ADDRESS');
    expect(fieldErrorKey('???')).toBe('pages.webhooks.field-errors.INVALID');
  });
});

describe('list helpers', () => {
  test('endpoint status and event count', () => {
    expect(endpointStatus({ enabled: true })).toEqual({ kind: 'enabled', auto: false });
    expect(endpointStatus({ enabled: false, disabledReason: 'MANUAL' })).toEqual({
      kind: 'disabled',
      auto: false,
    });
    expect(endpointStatus({ enabled: false, disabledReason: 'FAILURES' }).auto).toBe(true);
    expect(eventsCount({ events: ['*'] })).toBeNull();
    expect(eventsCount({ events: ['a.b', 'c.d'] })).toBe(2);
  });

  test('test outcome: a 2xx without an error text is ok', () => {
    expect(testOutcome({ statusCode: 204, durationMs: 31, error: null })).toMatchObject({
      ok: true,
      status: 204,
      ms: 31,
    });
    expect(testOutcome({ statusCode: 500, durationMs: 10, error: null }).ok).toBe(false);
    expect(testOutcome({ statusCode: null, durationMs: 5, error: 'DNS' })).toMatchObject({
      ok: false,
      error: 'DNS',
    });
  });

  test('delivery paths carry the filters', () => {
    expect(deliveriesPath()).toBe('/panel/webhook-deliveries?pageSize=25');
    expect(deliveriesPath({ source: 'market', status: 'FAILED', page: 3 })).toBe(
      '/panel/webhook-deliveries?source=market&status=FAILED&page=3&pageSize=25',
    );
    expect(deliveriesPath({ endpointId: 7 })).toBe('/panel/webhooks/7/deliveries?pageSize=25');
    expect(parseEndpointId('12')).toBe(12);
    expect(parseEndpointId('0')).toBeNull();
    expect(parseEndpointId('x')).toBeNull();
  });

  test('redeliver is offered unless the row is being sent', () => {
    expect(canRedeliver({ status: 'DEAD' })).toBe(true);
    expect(canRedeliver({ status: 'SENDING' })).toBe(false);
  });

  test('pretty text formats JSON and leaves other text alone', () => {
    expect(prettyText('{"a":1}')).toBe('{\n  "a": 1\n}');
    expect(prettyText('plain')).toBe('plain');
    expect(prettyText(null)).toBe('');
  });
});
