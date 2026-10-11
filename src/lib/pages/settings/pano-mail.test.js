import { describe, expect, test } from 'bun:test';

import {
  createPanoMailApi,
  formatReset,
  offeredPlan,
  panoMailView,
  percentUsed,
  readPanoMail,
  splitAddress,
  usageAlert,
  usageLevel,
  validLocalPart,
} from './pano-mail.js';
import { stubClient } from '../view/frontend/testkit.js';

const period = (used, limit) => ({ used, limit, resetsAt: 1_800_000_000_000 });

const FULL = {
  website: 'https://example.test',
  connected: true,
  account: { username: 'steve' },
  provider: 'PANO_MAIL',
  enabled: true,
  ready: true,
  from: 'noreply@example.test',
  held: false,
  plan: { id: 'free', name: 'Free', free: true, mailsPerMonth: 1000, mailsPerDay: 100 },
  usage: { day: period(10, 100), month: period(100, 1000) },
  freePlan: { mailsPerMonth: 1000, mailsPerDay: 100 },
  manageUrl: 'https://example.test/profile/mail',
};

describe('percentUsed and usageLevel', () => {
  test('percent is rounded down and clamped', () => {
    expect(percentUsed(period(0, 100))).toBe(0);
    expect(percentUsed(period(999, 1000))).toBe(99);
    expect(percentUsed(period(5000, 1000))).toBe(100);
    expect(percentUsed(period(5, 0))).toBe(0);
    expect(percentUsed(null)).toBe(0);
  });

  test('warns from 80 percent, danger at 100', () => {
    expect(usageLevel(period(79, 100))).toBe('ok');
    expect(usageLevel(period(80, 100))).toBe('warning');
    expect(usageLevel(period(99, 100))).toBe('warning');
    expect(usageLevel(period(100, 100))).toBe('danger');
    expect(usageLevel(period(120, 100))).toBe('danger');
    expect(usageLevel(period(1, 0))).toBe('ok');
  });
});

describe('usageAlert', () => {
  test('no alert below 80 percent or without usage', () => {
    expect(usageAlert(FULL.usage)).toBeNull();
    expect(usageAlert(null)).toBeNull();
  });

  test('the worse period wins, the month on a tie', () => {
    expect(usageAlert({ day: period(90, 100), month: period(10, 100) })).toMatchObject({
      level: 'warning',
      period: 'day',
      percent: 90,
    });
    expect(usageAlert({ day: period(100, 100), month: period(85, 100) })).toMatchObject({
      level: 'danger',
      period: 'day',
    });
    expect(usageAlert({ day: period(100, 100), month: period(100, 100) })).toMatchObject({
      level: 'danger',
      period: 'month',
    });
    expect(usageAlert({ day: period(85, 100), month: period(85, 100) })?.period).toBe('month');
  });
});

describe('readPanoMail', () => {
  test('a full answer is read through', () => {
    const { supported, status } = readPanoMail(FULL);

    expect(supported).toBe(true);
    expect(status.provider).toBe('PANO_MAIL');
    expect(status.plan.name).toBe('Free');
    expect(status.usage.month.limit).toBe(1000);
    expect(status.manageUrl).toBe('https://example.test/profile/mail');
  });

  test('a missing route or an error answer is not supported', () => {
    expect(readPanoMail('Not Found').supported).toBe(false);
    expect(readPanoMail(undefined).supported).toBe(false);
    expect(readPanoMail({ error: 'PAGE_NOT_FOUND' }).supported).toBe(false);
    expect(readPanoMail({ error: { code: 'NOT_IMPLEMENTED' } }).supported).toBe(false);
  });

  test('nulls from an unreachable website stay nulls', () => {
    const { status } = readPanoMail({ ...FULL, plan: null, usage: null, freePlan: null });

    expect(status.plan).toBeNull();
    expect(status.usage).toBeNull();
    expect(status.freePlan).toBeNull();
  });

  test('an unknown provider reads as SMTP', () => {
    expect(readPanoMail({ connected: false }).status.provider).toBe('SMTP');
  });
});

describe('panoMailView', () => {
  test('connect, activate, unreadable, active', () => {
    const read = (patch) => readPanoMail({ ...FULL, ...patch }).status;

    expect(panoMailView(read({ connected: false, account: null }))).toBe('connect');
    expect(panoMailView(read({ provider: 'SMTP' }))).toBe('activate');
    expect(panoMailView(read({ usage: null }))).toBe('unreadable');
    expect(panoMailView(read({}))).toBe('active');
  });
});

describe('createPanoMailApi', () => {
  test('getStatus asks the documented path', async () => {
    const client = stubClient({ 'GET /panel/settings/pano-mail': FULL });
    const result = await createPanoMailApi(client).getStatus();

    expect(client.calls).toEqual([
      { method: 'GET', path: '/panel/settings/pano-mail', body: undefined },
    ]);
    expect(result.supported).toBe(true);
  });

  test('switchToPanoMail saves the provider through the settings route', async () => {
    const client = stubClient({ 'PUT /panel/settings': {} });
    const result = await createPanoMailApi(client).switchToPanoMail();

    expect(result).toEqual({ ok: true, code: '' });
    expect(client.calls[0].method).toBe('PUT');
    expect(client.calls[0].path).toBe('/panel/settings');
    expect(JSON.parse(client.calls[0].body.get('email'))).toEqual({
      enabled: true,
      provider: 'PANO_MAIL',
    });
  });

  test('switch errors come back as codes', async () => {
    const client = stubClient({ 'PUT /panel/settings': { error: { code: 'CONNECT_REQUIRED' } } });

    expect(await createPanoMailApi(client).switchToPanoMail()).toEqual({
      ok: false,
      code: 'CONNECT_REQUIRED',
    });

    const unavailable = stubClient({ 'PUT /panel/settings': { error: 'PANO_MAIL_UNAVAILABLE' } });

    expect((await createPanoMailApi(unavailable).switchToPanoMail()).code).toBe(
      'PANO_MAIL_UNAVAILABLE',
    );
  });
});

describe('formatReset', () => {
  test('empty without a time, text with one', () => {
    expect(formatReset(null, 'en-US')).toBe('');
    expect(formatReset(1_800_000_000_000, 'en-US')).not.toBe('');
  });
});

describe('the sender picker and the offered plan', () => {
  const base = readPanoMail({
    connected: true,
    provider: 'SMTP',
    plan: { id: 'plus', name: 'Plus', free: false, mailsPerMonth: 5000, mailsPerDay: 500 },
    freePlan: { mailsPerMonth: 500, mailsPerDay: 50 },
    senders: [{ domain: 'mysite.mail.example', kind: 'SUBDOMAIN' }, { domain: '' }, null],
  }).status;

  test('reads the sender domains, skipping broken rows', () => {
    expect(base.senders).toEqual(['mysite.mail.example']);
    expect(readPanoMail({ connected: false }).status.senders).toEqual([]);
  });

  test('offers the account plan when connected, else the free plan', () => {
    expect(offeredPlan(base)).toMatchObject({ name: 'Plus', free: false, mailsPerDay: 500 });
    expect(offeredPlan({ ...base, connected: false })).toEqual({
      name: '',
      free: true,
      mailsPerMonth: 500,
      mailsPerDay: 50,
    });
    expect(offeredPlan({ ...base, plan: null, freePlan: null })).toBeNull();
  });

  test('splits an address with or without a display name', () => {
    expect(splitAddress('hello@Play.Example.com')).toEqual({
      localPart: 'hello',
      domain: 'play.example.com',
    });
    expect(splitAddress('Site <no-reply@a.b>')).toEqual({ localPart: 'no-reply', domain: 'a.b' });
    expect(splitAddress('nothing')).toEqual({ localPart: '', domain: '' });
  });

  test('accepts only a plain local part', () => {
    expect(validLocalPart('no-reply')).toBe(true);
    expect(validLocalPart('a.b')).toBe(true);
    expect(validLocalPart('a b')).toBe(false);
    expect(validLocalPart('a..b')).toBe(false);
    expect(validLocalPart('')).toBe(false);
    expect(validLocalPart('x'.repeat(65))).toBe(false);
  });

  test('sends the picked address with the switch call', async () => {
    let sent;
    const api = createPanoMailApi({
      put: async ({ body }) => {
        sent = JSON.parse(body.get('email'));

        return { result: 'ok' };
      },
    });

    expect(await api.switchToPanoMail('hello@play.example.com')).toEqual({ ok: true, code: '' });
    expect(sent).toEqual({ enabled: true, provider: 'PANO_MAIL', from: 'hello@play.example.com' });
  });
});
