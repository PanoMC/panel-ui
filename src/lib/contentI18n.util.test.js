import { describe, expect, test } from 'bun:test';

import {
  countTranslations,
  errorLocales,
  fieldI18nForSave,
  flattenTranslations,
  hasErrorsWith,
  isBlankHtml,
  localized,
  localizedDisplay,
  localizedOption,
  nestTranslations,
  pruneI18n,
  prunePostI18n,
  toEditableField,
} from './contentI18n.util.js';
import { newField, normalizeDefinitions } from './ticketFields.util.js';

const i18n = {
  'en-US': { label: 'Topic', options: { appeal: 'Ban appeal' } },
  tr: { label: 'Konu', options: { appeal: 'Ban itirazı', other: '  ' } },
  ru: { label: '   ' },
};

describe('localized', () => {
  test('exact locale code', () => {
    expect(localized('Default', i18n, 'en-US', 'label')).toBe('Topic');
  });

  test('language part of the locale', () => {
    expect(localized('Default', i18n, 'tr-TR', 'label')).toBe('Konu');
    expect(localized('Default', i18n, 'tr_TR', 'label')).toBe('Konu');
  });

  test('default text when nothing fits', () => {
    expect(localized('Default', i18n, 'ja', 'label')).toBe('Default');
    expect(localized('Default', i18n, 'en-GB', 'label')).toBe('Default');
    expect(localized('Default', i18n, 'en-US', 'help')).toBe('Default');
  });

  test('blank translations fall back', () => {
    expect(localized('Default', i18n, 'ru', 'label')).toBe('Default');
    expect(
      localized('Default', { 'tr-TR': { label: ' ' }, tr: { label: 'Dil' } }, 'tr-TR', 'label'),
    ).toBe('Dil');
  });

  test('no i18n or no locale', () => {
    expect(localized('Default', undefined, 'en-US', 'label')).toBe('Default');
    expect(localized('Default', null, null, 'label')).toBe('Default');
    expect(localized('Default', i18n, '', 'label')).toBe('Default');
  });
});

describe('localizedOption', () => {
  const option = { value: 'appeal', label: 'İtiraz' };

  test('translated label', () => {
    expect(localizedOption(option, i18n, 'en-US')).toBe('Ban appeal');
    expect(localizedOption(option, i18n, 'tr-TR')).toBe('Ban itirazı');
  });

  test('own label as fallback, value when it has none', () => {
    expect(localizedOption(option, i18n, 'ja')).toBe('İtiraz');
    expect(localizedOption({ value: 'other', label: 'Diğer' }, i18n, 'tr')).toBe('Diğer');
    expect(localizedOption({ value: 'gone' }, i18n, 'en-US')).toBe('gone');
  });
});

describe('localizedDisplay', () => {
  const options = [
    { value: 'appeal', label: 'İtiraz' },
    { value: 'bug', label: 'Hata' },
  ];
  const entryI18n = {
    'en-US': { options: { appeal: 'Appeal', bug: 'Bug' } },
    ja: { options: { bug: 'バグ' } },
  };

  test('SELECT is rebuilt from the value', () => {
    const entry = { type: 'SELECT', options, value: 'appeal', display: 'İtiraz', i18n: entryI18n };

    expect(localizedDisplay(entry, 'en-US')).toBe('Appeal');
    expect(localizedDisplay(entry, 'ja')).toBe('İtiraz');
  });

  test('MULTISELECT joined with ", "', () => {
    const entry = { type: 'MULTISELECT', options, value: ['appeal', 'bug'], i18n: entryI18n };

    expect(localizedDisplay(entry, 'en-US')).toBe('Appeal, Bug');
    expect(localizedDisplay(entry, 'ja')).toBe('İtiraz, バグ');
    expect(localizedDisplay({ ...entry, value: ['bug', 'removed'] }, 'ja')).toBe('バグ, removed');
  });

  test('empty option values', () => {
    expect(localizedDisplay({ type: 'SELECT', options, value: null, display: '' }, 'en-US')).toBe(
      '',
    );
    expect(localizedDisplay({ type: 'MULTISELECT', options, value: [] }, 'en-US')).toBe('');
  });

  test('other types use display', () => {
    expect(localizedDisplay({ type: 'TEXT', value: 'x', display: 'x' }, 'en-US')).toBe('x');
    expect(localizedDisplay({ type: 'NUMBER', value: 3 }, 'en-US')).toBe('');
  });
});

describe('countTranslations', () => {
  test('counts non-blank props', () => {
    expect(countTranslations(i18n, 'label')).toBe(2);
    expect(countTranslations(i18n, 'help')).toBe(0);
    expect(countTranslations(undefined, 'label')).toBe(0);
  });

  test('skips the platform locale', () => {
    expect(countTranslations(i18n, 'label', undefined, 'tr')).toBe(1);
  });

  test('options', () => {
    expect(countTranslations(i18n, 'options', 'appeal')).toBe(2);
    expect(countTranslations(i18n, 'options', 'other')).toBe(0);
  });
});

describe('pruneI18n', () => {
  test('keeps only non-blank listed props, trimmed', () => {
    expect(
      pruneI18n(
        { 'en-US': { title: ' Bugs ', description: '', other: 'x' }, ru: { title: '  ' } },
        ['title', 'description'],
      ),
    ).toEqual({ 'en-US': { title: 'Bugs' } });
  });
});

describe('editing a field', () => {
  const stored = () => ({
    ...newField('topic'),
    label: 'Konu',
    type: 'SELECT',
    placeholder: 'ignored',
    options: [
      { value: 'appeal', label: 'İtiraz' },
      { value: 'bug', label: 'Hata' },
    ],
    i18n: {
      'en-US': { label: 'Topic', help: 'Pick one', options: { appeal: 'Appeal', bug: 'Bug' } },
      ru: { label: 'Тема', placeholder: 'x' },
    },
  });

  test('options carry their own translations', () => {
    const field = toEditableField(stored());

    expect(field.options[0].i18n).toEqual({ 'en-US': { label: 'Appeal' } });
    expect(field.options[1].i18n).toEqual({ 'en-US': { label: 'Bug' } });
    expect(field.i18n['en-US']).toEqual({ label: 'Topic', help: 'Pick one' });
  });

  test('round trip', () => {
    const field = toEditableField(stored());
    const [normalized] = normalizeDefinitions([field]);

    expect(fieldI18nForSave(field, normalized)).toEqual({
      'en-US': { label: 'Topic', help: 'Pick one', options: { appeal: 'Appeal', bug: 'Bug' } },
      ru: { label: 'Тема' },
    });
  });

  test('renaming an option value moves its translations', () => {
    const field = toEditableField(stored());

    field.options[0].value = ' ban-appeal ';

    const [normalized] = normalizeDefinitions([field]);

    expect(fieldI18nForSave(field, normalized)['en-US'].options).toEqual({
      'ban-appeal': 'Appeal',
      bug: 'Bug',
    });
  });

  test('a removed option drops its translations', () => {
    const field = toEditableField(stored());

    field.options = field.options.slice(1);

    const [normalized] = normalizeDefinitions([field]);

    expect(fieldI18nForSave(field, normalized)['en-US'].options).toEqual({ bug: 'Bug' });
  });

  test('types without options or placeholder send none of them', () => {
    const field = toEditableField(stored());

    field.type = 'CHECKBOX';

    const [normalized] = normalizeDefinitions([field]);

    expect(fieldI18nForSave(field, normalized)).toEqual({
      'en-US': { label: 'Topic', help: 'Pick one' },
      ru: { label: 'Тема' },
    });

    field.type = 'TEXT';
    const [text] = normalizeDefinitions([field]);

    expect(fieldI18nForSave(field, text).ru).toEqual({ label: 'Тема', placeholder: 'x' });
  });
});

describe('hasErrorsWith', () => {
  test('prefix match', () => {
    expect(hasErrorsWith({ 'i18n.tr.title': 'TOO_LONG' }, 'i18n.tr.')).toBe(true);
    expect(hasErrorsWith({ 'i18n.tr.title': 'TOO_LONG' }, 'i18n.ru.')).toBe(false);
    expect(hasErrorsWith(undefined, 'x')).toBe(false);
  });
});

describe('flat translation maps', () => {
  test('nest and flatten', () => {
    const nested = nestTranslations({ 'en-US': '<p>Rules</p>', ru: 3 }, 'html');

    expect(nested).toEqual({ 'en-US': { html: '<p>Rules</p>' } });
    expect(
      flattenTranslations({ ...nested, tr: { html: '  ' }, ja: { html: ' <p>規約</p> ' } }, 'html'),
    ).toEqual({
      'en-US': '<p>Rules</p>',
      ja: '<p>規約</p>',
    });
    expect(flattenTranslations(undefined, 'html')).toEqual({});
  });
});

describe('post translations', () => {
  test('an empty editor document is blank', () => {
    expect(isBlankHtml(undefined)).toBe(true);
    expect(isBlankHtml('')).toBe(true);
    expect(isBlankHtml('<p></p>')).toBe(true);
    expect(isBlankHtml('<p> </p><p><br></p>')).toBe(true);
    expect(isBlankHtml('<p>Hi</p>')).toBe(false);
    expect(isBlankHtml('<img src="a.png">')).toBe(false);
  });

  test('pruning keeps filled titles and texts only', () => {
    expect(
      prunePostI18n({
        'en-US': { title: ' News ', text: '<p>Hello</p>' },
        ru: { title: '', text: '<p></p>' },
        ja: { title: 'ニュース', text: '<p></p>' },
        de: { text: '<p>Hallo</p>', other: 'x' },
      }),
    ).toEqual({
      'en-US': { title: 'News', text: '<p>Hello</p>' },
      ja: { title: 'ニュース' },
      de: { text: '<p>Hallo</p>' },
    });
    expect(prunePostI18n(undefined)).toEqual({});
  });

  test('error locales come from i18n keys, once each', () => {
    expect(
      errorLocales({
        title: 'TOO_LONG',
        'i18n.ru.text': 'INVALID',
        'i18n.en-US.title': 'TOO_LONG',
        'i18n.ru.title': 'TOO_LONG',
      }),
    ).toEqual(['ru', 'en-US']);
    expect(errorLocales(undefined)).toEqual([]);
  });
});
