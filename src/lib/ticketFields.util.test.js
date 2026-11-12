import { describe, expect, test } from 'bun:test';

import {
  displayValue,
  fieldLink,
  isEmpty,
  newField,
  normalizeDefinitions,
  slugKey,
  uniqueKey,
  validateDefinitions,
  validateValue,
  visibleFields,
} from './ticketFields.util.js';

const field = (props) => ({ ...newField(props.key), ...props });
const keys = (definitions, values) => visibleFields(definitions, values).map((item) => item.key);
const rule = (fieldKey, op, value = '') => ({ field: fieldKey, op, value });
const when = (match, ...rules) => ({ match, rules });

const topicOptions = [
  { value: 'appeal', label: 'Ban appeal' },
  { value: 'bug', label: 'Bug report' },
];

describe('empty values', () => {
  test('absent, null, blank, [] and an unticked checkbox are empty', () => {
    expect(isEmpty('TEXT', undefined)).toBe(true);
    expect(isEmpty('TEXT', null)).toBe(true);
    expect(isEmpty('TEXT', '   ')).toBe(true);
    expect(isEmpty('MULTISELECT', [])).toBe(true);
    expect(isEmpty('CHECKBOX', false)).toBe(true);
    expect(isEmpty('CHECKBOX', true)).toBe(false);
    expect(isEmpty('NUMBER', 0)).toBe(false);
    expect(isEmpty('TEXT', ' a ')).toBe(false);
  });
});

describe('visibility', () => {
  const chain = [
    field({ key: 'a', type: 'SELECT', options: topicOptions }),
    field({ key: 'b', conditions: when('ALL', rule('a', 'EQUALS', 'appeal')) }),
    field({ key: 'c', conditions: when('ALL', rule('b', 'FILLED')) }),
  ];

  test('chained conditions: B shows when A = appeal, C when B is filled', () => {
    expect(keys(chain, {})).toEqual(['a']);
    expect(keys(chain, { a: 'appeal' })).toEqual(['a', 'b']);
    expect(keys(chain, { a: 'APPEAL ' })).toEqual(['a', 'b']);
    expect(keys(chain, { a: 'appeal', b: 'ban 42' })).toEqual(['a', 'b', 'c']);
  });

  test('a rule on a hidden field counts as empty', () => {
    // B still holds a value, but B is hidden (A is not appeal), so C stays hidden too.
    expect(keys(chain, { a: 'bug', b: 'ban 42' })).toEqual(['a']);

    const withEmpty = [...chain, field({ key: 'd', conditions: when('ALL', rule('b', 'EMPTY')) })];

    expect(keys(withEmpty, { a: 'bug', b: 'ban 42' })).toEqual(['a', 'd']);
  });

  test('a hidden checkbox counts as unticked (false)', () => {
    const definitions = [
      field({ key: 'gate', type: 'CHECKBOX' }),
      field({ key: 'box', type: 'CHECKBOX', conditions: when('ALL', rule('gate', 'FILLED')) }),
      field({ key: 'x', conditions: when('ALL', rule('box', 'EQUALS', 'false')) }),
    ];

    expect(keys(definitions, { gate: false, box: true })).toEqual(['gate', 'x']);
    expect(keys(definitions, { gate: true, box: true })).toEqual(['gate', 'box']);
  });

  test('ANY needs one rule, ALL needs every rule', () => {
    const rules = [rule('a', 'EQUALS', 'appeal'), rule('b', 'FILLED')];
    const base = [field({ key: 'a', type: 'SELECT', options: topicOptions }), field({ key: 'b' })];
    const all = [...base, field({ key: 'c', conditions: when('ALL', ...rules) })];
    const any = [...base, field({ key: 'c', conditions: when('ANY', ...rules) })];

    expect(keys(all, { a: 'appeal' })).toEqual(['a', 'b']);
    expect(keys(any, { a: 'appeal' })).toEqual(['a', 'b', 'c']);
    expect(keys(any, { b: 'x' })).toEqual(['a', 'b', 'c']);
    expect(keys(all, { a: 'appeal', b: 'x' })).toEqual(['a', 'b', 'c']);
    expect(keys(any, {})).toEqual(['a', 'b']);
  });

  test('MULTISELECT: EQUALS and CONTAINS both mean "has the option"', () => {
    const definitions = [
      field({ key: 'm', type: 'MULTISELECT', options: topicOptions }),
      field({ key: 'eq', conditions: when('ALL', rule('m', 'EQUALS', 'bug')) }),
      field({ key: 'has', conditions: when('ALL', rule('m', 'CONTAINS', 'bug')) }),
    ];

    expect(keys(definitions, { m: ['appeal', 'bug'] })).toEqual(['m', 'eq', 'has']);
    expect(keys(definitions, { m: ['appeal'] })).toEqual(['m']);
    expect(keys(definitions, { m: [] })).toEqual(['m']);
  });

  test('CHECKBOX compares with "true" / "false"', () => {
    const definitions = [
      field({ key: 'ok', type: 'CHECKBOX' }),
      field({ key: 'yes', conditions: when('ALL', rule('ok', 'EQUALS', 'true')) }),
      field({ key: 'no', conditions: when('ALL', rule('ok', 'EQUALS', 'false')) }),
    ];

    expect(keys(definitions, { ok: true })).toEqual(['ok', 'yes']);
    expect(keys(definitions, { ok: false })).toEqual(['ok', 'no']);
    expect(keys(definitions, {})).toEqual(['ok', 'no']);
  });

  test('NOT_EQUALS on an empty value is true', () => {
    const definitions = [
      field({ key: 'a' }),
      field({ key: 'b', conditions: when('ALL', rule('a', 'NOT_EQUALS', 'x')) }),
    ];

    expect(keys(definitions, {})).toEqual(['a', 'b']);
    expect(keys(definitions, { a: '  ' })).toEqual(['a', 'b']);
    expect(keys(definitions, { a: 'X' })).toEqual(['a']);
  });

  test('NUMBER EQUALS parses both sides, text CONTAINS is a case-insensitive substring', () => {
    const definitions = [
      field({ key: 'n', type: 'NUMBER' }),
      field({ key: 't' }),
      field({ key: 'num', conditions: when('ALL', rule('n', 'EQUALS', '2.50')) }),
      field({ key: 'sub', conditions: when('ALL', rule('t', 'CONTAINS', 'GRIEF')) }),
    ];

    expect(keys(definitions, { n: 2.5, t: 'they griefed me' })).toEqual(['n', 't', 'num', 'sub']);
    expect(keys(definitions, { n: '2.5' })).toEqual(['n', 't', 'num']);
    expect(keys(definitions, { n: 3 })).toEqual(['n', 't']);
  });

  test('a rule on a later or unknown field counts as empty', () => {
    const definitions = [
      field({ key: 'a', conditions: when('ALL', rule('b', 'FILLED')) }),
      field({ key: 'b' }),
      field({ key: 'c', conditions: when('ALL', rule('nope', 'EMPTY')) }),
    ];

    expect(keys(definitions, { b: 'x' })).toEqual(['b', 'c']);
  });
});

describe('values', () => {
  test('required only when set; a required checkbox must be ticked', () => {
    expect(validateValue(field({ type: 'TEXT', required: true }), ' ')).toBe('REQUIRED');
    expect(validateValue(field({ type: 'TEXT' }), '')).toBeNull();
    expect(validateValue(field({ type: 'CHECKBOX', required: true }), false)).toBe('REQUIRED');
    expect(validateValue(field({ type: 'CHECKBOX', required: true }), true)).toBeNull();
    expect(
      validateValue(field({ type: 'TEXT', required: true }), '', { enforceRequired: false }),
    ).toBeNull();
  });

  test('number bounds, decimals and numeric strings', () => {
    const number = field({ type: 'NUMBER', min: 1, max: 10.5 });

    expect(validateValue(number, 1)).toBeNull();
    expect(validateValue(number, '10.5')).toBeNull();
    expect(validateValue(number, 0.99)).toBe('OUT_OF_RANGE');
    expect(validateValue(number, 11)).toBe('OUT_OF_RANGE');
    expect(validateValue(number, 'abc')).toBe('INVALID');
    expect(validateValue(field({ type: 'NUMBER' }), -1e9)).toBeNull();
  });

  test('text length: bounds, default and hard caps', () => {
    expect(validateValue(field({ type: 'TEXT', min: 3 }), 'ab')).toBe('TOO_SHORT');
    expect(validateValue(field({ type: 'TEXT', max: 3 }), ' abcd ')).toBe('TOO_LONG');
    expect(validateValue(field({ type: 'TEXT', max: 3 }), ' abc ')).toBeNull();
    expect(validateValue(field({ type: 'TEXT' }), 'a'.repeat(200))).toBeNull();
    expect(validateValue(field({ type: 'TEXT' }), 'a'.repeat(201))).toBe('TOO_LONG');
    expect(validateValue(field({ type: 'TEXTAREA' }), 'a'.repeat(2001))).toBe('TOO_LONG');
    expect(validateValue(field({ type: 'TEXT', max: 9999 }), 'a'.repeat(501))).toBe('TOO_LONG');
  });

  test('dates must be real', () => {
    const date = field({ type: 'DATE' });

    expect(validateValue(date, '2026-02-28')).toBeNull();
    expect(validateValue(date, '2028-02-29')).toBeNull();
    expect(validateValue(date, '2026-02-30')).toBe('INVALID');
    expect(validateValue(date, '2026-13-01')).toBe('INVALID');
    expect(validateValue(date, '26-1-1')).toBe('INVALID');
  });

  test('e-mail and URL', () => {
    const email = field({ type: 'EMAIL' });
    const url = field({ type: 'URL' });

    expect(validateValue(email, 'steve@example.com')).toBeNull();
    expect(validateValue(email, 'steve@example')).toBe('INVALID');
    expect(validateValue(email, 'st eve@example.com')).toBe('INVALID');
    expect(validateValue(email, 'a'.repeat(250) + '@x.io')).toBe('TOO_LONG');

    expect(validateValue(url, 'https://example.com/a?b=1')).toBeNull();
    expect(validateValue(url, 'http://example.com')).toBeNull();
    expect(validateValue(url, 'ftp://example.com')).toBe('INVALID');
    expect(validateValue(url, 'javascript:alert(1)')).toBe('INVALID');
    expect(validateValue(url, 'example.com')).toBe('INVALID');
    expect(validateValue(url, 'https://example.com/' + 'a'.repeat(500))).toBe('TOO_LONG');
  });

  test('options', () => {
    const select = field({ type: 'SELECT', options: topicOptions });
    const multi = field({ type: 'MULTISELECT', options: topicOptions });

    expect(validateValue(select, 'bug')).toBeNull();
    expect(validateValue(select, 'other')).toBe('UNKNOWN_OPTION');
    expect(validateValue(multi, ['bug', 'appeal'])).toBeNull();
    expect(validateValue(multi, ['bug', 'bug'])).toBe('INVALID');
    expect(validateValue(multi, ['bug', 'other'])).toBe('UNKNOWN_OPTION');
    expect(validateValue(field({ type: 'CHECKBOX' }), 'yes')).toBe('INVALID');
  });
});

describe('display', () => {
  const t = (key) => ({ 'buttons.yes': 'Yes', 'buttons.no': 'No' })[key] ?? key;

  test('readable values', () => {
    expect(displayValue({ type: 'CHECKBOX', value: true }, t, 'en-US')).toBe('Yes');
    expect(displayValue({ type: 'CHECKBOX', value: false }, t, 'en-US')).toBe('No');
    expect(displayValue({ type: 'CHECKBOX', value: null }, t, 'en-US')).toBe('');
    expect(displayValue({ type: 'TEXT', value: null, display: '' }, t, 'en-US')).toBe('');
    expect(displayValue({ type: 'DATE', value: '2026-03-01' }, t, 'en-US')).toBe('Mar 1, 2026');
    expect(
      displayValue({ type: 'MULTISELECT', value: ['appeal', 'bug'], options: topicOptions }, t),
    ).toBe('Ban appeal, Bug report');
    expect(displayValue({ type: 'SELECT', value: 'bug', display: 'Bug report' }, t)).toBe(
      'Bug report',
    );
    expect(displayValue({ type: 'NUMBER', value: 0, display: '0' }, t)).toBe('0');
  });

  test('links only for http(s) and e-mail', () => {
    expect(fieldLink({ type: 'URL', value: 'https://a.io' })).toBe('https://a.io');
    expect(fieldLink({ type: 'URL', value: 'javascript:alert(1)' })).toBeNull();
    expect(fieldLink({ type: 'EMAIL', value: 'a@b.io' })).toBe('mailto:a@b.io');
    expect(fieldLink({ type: 'TEXT', value: 'https://a.io' })).toBeNull();
  });
});

describe('keys', () => {
  test('slugs from labels', () => {
    expect(slugKey('Ban number')).toBe('ban-number');
    expect(slugKey('  Şikâyet  İçeriği! ')).toBe('sikayet-icerigi');
    expect(slugKey('Номер')).toBe('');
    expect(slugKey('a'.repeat(39) + ' b')).toBe('a'.repeat(39));
    expect(uniqueKey('topic', ['topic', 'topic-2'])).toBe('topic-3');
    expect(uniqueKey('', [])).toBe('field');
  });
});

describe('definitions', () => {
  test('a valid list has no errors', () => {
    const fields = [
      field({ key: 'topic', label: 'Topic', type: 'SELECT', options: topicOptions }),
      field({
        key: 'ban-id',
        label: 'Ban number',
        type: 'NUMBER',
        min: 1,
        conditions: when('ALL', rule('topic', 'EQUALS', 'appeal')),
      }),
    ];

    expect(validateDefinitions(fields)).toEqual({});
  });

  test('keys, labels, options, bounds and rules are checked', () => {
    const fields = [
      field({ key: 'Bad Key', label: '' }),
      field({ key: 'a', label: 'A', type: 'SELECT', options: [{ value: 'x', label: '' }] }),
      field({ key: 'a', label: 'A2', type: 'MULTISELECT', options: [] }),
      field({ key: 'n', label: 'N', type: 'NUMBER', min: 5, max: 1 }),
      field({ key: 't', label: 'T', type: 'TEXT', max: 501 }),
      field({
        key: 'c',
        label: 'C',
        conditions: when(
          'ALL',
          rule('later', 'FILLED'),
          rule('a', 'EQUALS', 'nope'),
          rule('n', 'EQUALS', ''),
        ),
      }),
      field({ key: 'later', label: 'L' }),
    ];

    expect(validateDefinitions(fields)).toEqual({
      'fields.0.key': 'INVALID',
      'fields.0.label': 'REQUIRED',
      'fields.1.options.0.label': 'REQUIRED',
      'fields.2.key': 'DUPLICATE',
      'fields.2.options': 'REQUIRED',
      'fields.3.min': 'OUT_OF_RANGE',
      'fields.4.max': 'OUT_OF_RANGE',
      'fields.5.conditions.rules.0.field': 'UNKNOWN_FIELD',
      'fields.5.conditions.rules.1.value': 'INVALID',
      'fields.5.conditions.rules.2.value': 'REQUIRED',
    });
  });

  test('more than 30 fields', () => {
    const fields = Array.from({ length: 31 }, (_, index) =>
      field({ key: 'f' + index, label: 'F' + index }),
    );

    expect(validateDefinitions(fields).fields).toBe('TOO_MANY');
  });

  test('normalised for sending', () => {
    const [sent] = normalizeDefinitions([
      field({
        key: ' a ',
        label: ' A ',
        type: 'CHECKBOX',
        placeholder: 'x',
        min: 1,
        options: topicOptions,
        conditions: { match: 'ALL', rules: [] },
      }),
    ]);

    expect(sent).toEqual({ ...newField('a'), label: 'A', type: 'CHECKBOX' });
  });
});
