import { describe, expect, test } from 'bun:test';

import {
  blankModel,
  highlightJson,
  isRawValid,
  keyProblems,
  maskRawTokens,
  modelToTemplate,
  parseModel,
} from './custom.js';

/** `CustomFormat.TEMPLATE` of the backend. */
const BUILT_IN = `{
  "event": "{event}",
  "title": "{title}",
  "url": "{url}",
  "site": {
    "name": "{site.name}",
    "url": "{site.url}"
  },
  "createdAt": "{event.iso}",
  "data": {json.data}
}`;

describe('custom parseModel', () => {
  test('reads the built-in template', () => {
    expect(parseModel(BUILT_IN)).toEqual({
      rows: [
        { key: 'event', value: '{event}', raw: false },
        { key: 'title', value: '{title}', raw: false },
        { key: 'url', value: '{url}', raw: false },
        { key: 'site.name', value: '{site.name}', raw: false },
        { key: 'site.url', value: '{site.url}', raw: false },
        { key: 'createdAt', value: '{event.iso}', raw: false },
        { key: 'data', value: '{json.data}', raw: true },
      ],
    });
  });

  test('writes the built-in template back as it was', () => {
    expect(modelToTemplate(parseModel(BUILT_IN))).toBe(BUILT_IN);
  });

  test('non-string scalars, arrays and empty objects become raw rows', () => {
    expect(
      parseModel('{"n": 42, "b": true, "z": null, "a": [1, {json.x}], "e": {}, "s": "{x}"}'),
    ).toEqual({
      rows: [
        { key: 'n', value: '42', raw: true },
        { key: 'b', value: 'true', raw: true },
        { key: 'z', value: 'null', raw: true },
        { key: 'a', value: '[1,{json.x}]', raw: true },
        { key: 'e', value: '{}', raw: true },
        { key: 's', value: '{x}', raw: false },
      ],
    });
  });

  test('tokens inside strings are left alone', () => {
    const { text, raws } = maskRawTokens(String.raw`{"a": "x {json.data} \" {y}", "b": {json.b}}`);

    expect(raws).toEqual(['{json.b}']);
    expect(JSON.parse(text).a).toBe('x {json.data} " {y}');
  });

  test('refuses what the editor cannot show', () => {
    expect(parseModel('nope')).toBeNull();
    expect(parseModel('[1, 2]')).toBeNull();
    expect(parseModel('{json.data}')).toBeNull();
    expect(parseModel('{"a.b": 1}')).toBeNull();
    expect(parseModel('{"1": 1}')).toBeNull();
    expect(parseModel('{"": 1}')).toBeNull();
    expect(parseModel('{"a": {"b.c": 1}}')).toBeNull();
  });

  test('an empty object has no rows', () => {
    expect(parseModel('{}')).toEqual({ rows: [] });
  });
});

describe('custom modelToTemplate', () => {
  test('round-trips models', () => {
    const models = [
      blankModel(),
      { rows: [] },
      {
        rows: [
          { key: 'a.b.c', value: 'deep {data.x}', raw: false },
          { key: 'a.d', value: '{json.data}', raw: true },
          { key: 'n', value: '3.5', raw: true },
          { key: 'q', value: String.raw`with "quotes" and \ slash`, raw: false },
          { key: 'list', value: '[1,"a",{json.x}]', raw: true },
        ],
      },
    ];

    for (const model of models) expect(parseModel(modelToTemplate(model))).toEqual(model);
  });

  test('a raw object comes back as rows of its own', () => {
    const model = { rows: [{ key: 'obj', value: '{"k":1}', raw: true }] };

    expect(parseModel(modelToTemplate(model))).toEqual({
      rows: [{ key: 'obj.k', value: '1', raw: true }],
    });
  });

  test('builds nested objects with raw values in place', () => {
    const text = modelToTemplate({
      rows: [
        { key: 'site.name', value: '{site.name}', raw: false },
        { key: 'data', value: '{json.data}', raw: true },
      ],
    });

    expect(text).toBe('{\n  "site": {\n    "name": "{site.name}"\n  },\n  "data": {json.data}\n}');
  });

  test('skips blank and colliding keys, a blank raw value is null', () => {
    const rows = [
      { key: 'a', value: '1', raw: true },
      { key: 'a.b', value: 'x', raw: false },
      { key: '', value: 'x', raw: false },
      { key: 'c', value: '', raw: true },
      { key: 'd..e', value: 'x', raw: false },
    ];

    expect([...keyProblems(rows)].sort()).toEqual([0, 1, 4]);
    expect(JSON.parse(modelToTemplate({ rows }))).toEqual({ c: null });
  });

  test('duplicate keys are problems', () => {
    const rows = [
      { key: 'a', value: '', raw: false },
      { key: 'a', value: '', raw: false },
    ];

    expect([...keyProblems(rows)].sort()).toEqual([0, 1]);
  });
});

describe('custom helpers', () => {
  test('isRawValid', () => {
    expect(isRawValid('42')).toBe(true);
    expect(isRawValid('{json.data}')).toBe(true);
    expect(isRawValid('[{json.a}, true]')).toBe(true);
    expect(isRawValid('abc')).toBe(false);
    expect(isRawValid('')).toBe(false);
  });

  test('highlightJson escapes and colours', () => {
    const html = highlightJson({ a: '<b>&', n: 1, t: true });

    expect(html).not.toContain('<b>');
    expect(html).toContain('<span class="custom-json-key">"a"</span>:');
    expect(html).toContain('<span class="custom-json-string">"&lt;b&gt;&amp;"</span>');
    expect(html).toContain('<span class="custom-json-number">1</span>');
    expect(html).toContain('<span class="custom-json-literal">true</span>');
  });
});
