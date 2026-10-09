import { beforeAll, describe, expect, test } from 'bun:test';

// Importing the test kit first registers the Svelte loader for `.svelte` files.
import { renderHtml, textOf, useLocale } from '../../pages/view/frontend/testkit.js';

const {
  default: SchemaForm,
  buildSettings,
  chosenUploads,
  colorInputValue,
  initialFiles,
  initialValues,
  lookupText,
  resolveText,
  tabsOf,
  FIELD_TYPES,
} = await import('../SchemaForm.svelte');

beforeAll(() => useLocale('en-US'));

/** One field of each of the eight types of doc 05 section 9. */
const SCHEMA = {
  fields: {
    title: { type: 'text', label: 'Site title', help: 'Shown in the browser tab', max: 40 },
    about: { type: 'textarea', label: 'About' },
    compact: { type: 'boolean', label: 'Compact layout' },
    columns: { type: 'number', label: 'Columns', min: 1, max: 6, default: 3 },
    layout: {
      type: 'select',
      label: 'Layout',
      default: 'wide',
      options: [
        { value: 'wide', label: 'Wide' },
        { value: 'narrow', label: 'Narrow' },
      ],
    },
    accent: { type: 'color', label: 'Accent', default: '#336699' },
    docs: { type: 'url', label: 'Docs link' },
    logo: { type: 'image', label: 'Logo' },
  },
};

/** What the backend would answer after a write: the values it accepted, with the defaults filled in. */
function backend(schema, previous = {}) {
  let stored = { ...previous };

  return {
    write(payload) {
      const { files, 'remove-files': removed, ...values } = payload;

      stored = { ...stored, ...values };

      return {
        settings: Object.fromEntries(
          Object.entries(schema.fields)
            .filter(([, field]) => field.type !== 'image')
            .map(([key, field]) => [key, stored[key] ?? field.default])
            .filter(([, value]) => value !== undefined),
        ),
        files: files ?? {},
        removed: removed ?? [],
      };
    },
  };
}

/** The opening tag of the control of a field, so a test can ask for one attribute of that very element. */
const controlOf = (html, key, tag) =>
  html.match(new RegExp(`<${tag}[^>]*id="schema-form-${key}"[^>]*>`))?.[0] ?? '';

const render = (props = {}) => renderHtml(SchemaForm, { schema: SCHEMA, ...props });

describe('the eight field types', () => {
  test('the schema covers exactly the eight types', () => {
    expect([...new Set(Object.values(SCHEMA.fields).map((field) => field.type))].sort()).toEqual(
      [...FIELD_TYPES].sort(),
    );
  });

  test('text: round trip', () => {
    const values = initialValues(SCHEMA, { title: 'Pano' });
    const html = render({ values });

    expect(controlOf(html, 'title', 'input')).toContain('value="Pano"');
    expect(controlOf(html, 'title', 'input')).toContain('maxlength="40"');
    expect(textOf(html)).toContain('Site title');
    expect(textOf(html)).toContain('Shown in the browser tab');

    values.title = 'Pano Craft';

    const answer = backend(SCHEMA).write(buildSettings(SCHEMA, values));

    expect(initialValues(SCHEMA, answer.settings).title).toBe('Pano Craft');
  });

  test('textarea: round trip', () => {
    const values = initialValues(SCHEMA, { about: 'Line one\nLine two' });
    const html = render({ values });

    expect(html).toMatch(
      /<textarea[^>]*id="schema-form-about"[^>]*>Line one\nLine two<\/textarea>/,
    );

    values.about = 'Changed';

    const answer = backend(SCHEMA).write(buildSettings(SCHEMA, values));

    expect(initialValues(SCHEMA, answer.settings).about).toBe('Changed');
  });

  test('boolean: round trip, true and false', () => {
    const on = render({ values: initialValues(SCHEMA, { compact: true }) });
    const off = render({ values: initialValues(SCHEMA, { compact: false }) });

    expect(controlOf(on, 'compact', 'input')).toContain('checked');
    expect(controlOf(off, 'compact', 'input')).not.toContain('checked');
    expect(controlOf(on, 'compact', 'input')).toContain('role="switch"');

    const values = initialValues(SCHEMA, { compact: true });

    values.compact = false;

    const payload = buildSettings(SCHEMA, values);

    expect(payload.compact).toBe(false);
    expect(initialValues(SCHEMA, backend(SCHEMA).write(payload).settings).compact).toBe(false);
  });

  test('number: round trip, the default shows and an empty number is left out', () => {
    const fresh = initialValues(SCHEMA, {});

    expect(fresh.columns).toBe(3);

    const html = render({ values: initialValues(SCHEMA, { columns: 5 }) });

    expect(controlOf(html, 'columns', 'input')).toContain('value="5"');
    expect(controlOf(html, 'columns', 'input')).toContain('min="1"');
    expect(controlOf(html, 'columns', 'input')).toContain('max="6"');

    const values = initialValues(SCHEMA, { columns: 5 });

    values.columns = '4';

    const payload = buildSettings(SCHEMA, values);

    expect(payload.columns).toBe(4);
    expect(initialValues(SCHEMA, backend(SCHEMA).write(payload).settings).columns).toBe(4);

    values.columns = null;

    expect('columns' in buildSettings(SCHEMA, values)).toBe(false);
  });

  test('select: round trip, options are labelled and the stored one is chosen', () => {
    const html = render({ values: initialValues(SCHEMA, { layout: 'narrow' }) });

    expect(html).toMatch(/<option[^>]*value="narrow"[^>]*>Narrow<\/option>/);
    expect(html).toMatch(/<option[^>]*value="wide"[^>]*>Wide<\/option>/);
    expect(html).toMatch(
      /<option[^>]*selected[^>]*value="narrow"|<option[^>]*value="narrow"[^>]*selected/,
    );

    const values = initialValues(SCHEMA, { layout: 'narrow' });

    values.layout = 'wide';

    const payload = buildSettings(SCHEMA, values);

    expect(payload.layout).toBe('wide');
    expect(initialValues(SCHEMA, backend(SCHEMA).write(payload).settings).layout).toBe('wide');
  });

  test('select: with nothing stored and no default the first option is what the form holds', () => {
    const schema = {
      fields: {
        side: {
          type: 'select',
          label: 'Side',
          options: [
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
          ],
        },
      },
    };

    expect(initialValues(schema, {}).side).toBe('left');
    expect(buildSettings(schema, initialValues(schema, {})).side).toBe('left');
  });

  test('select: an option value that is a number keeps its type', () => {
    const schema = {
      fields: {
        size: {
          type: 'select',
          label: 'Size',
          options: [
            { value: 10, label: 'Ten' },
            { value: 20, label: 'Twenty' },
          ],
        },
      },
    };

    const values = initialValues(schema, { size: 20 });

    expect(buildSettings(schema, values).size).toBe(20);
  });

  test('color: round trip, both the swatch and the text show the value', () => {
    const html = render({ values: initialValues(SCHEMA, { accent: '#ff0000' }) });

    expect(html).toMatch(/<input[^>]*type="color"[^>]*value="#ff0000"/);
    expect(controlOf(html, 'accent', 'input')).toContain('value="#ff0000"');

    const values = initialValues(SCHEMA, {});

    expect(values.accent).toBe('#336699');

    values.accent = '#00ff00';

    const payload = buildSettings(SCHEMA, values);

    expect(initialValues(SCHEMA, backend(SCHEMA).write(payload).settings).accent).toBe('#00ff00');
  });

  test('color: the swatch falls back to black for a value it cannot show', () => {
    expect(colorInputValue('#abc')).toBe('#000000');
    expect(colorInputValue('')).toBe('#000000');
    expect(colorInputValue('#A1B2C3')).toBe('#A1B2C3');
  });

  test('url: round trip, a site path and an address', () => {
    for (const value of ['/shop', 'https://example.com/docs']) {
      const html = render({ values: initialValues(SCHEMA, { docs: value }) });

      expect(controlOf(html, 'docs', 'input')).toContain(`value="${value}"`);

      const values = initialValues(SCHEMA, { docs: value });

      values.docs = `${value}?x=1`;

      const payload = buildSettings(SCHEMA, values);

      expect(initialValues(SCHEMA, backend(SCHEMA).write(payload).settings).docs).toBe(
        `${value}?x=1`,
      );
    }
  });

  test('image: the stored file is listed, kept by name, and removing it names it in remove-files', () => {
    const files = initialFiles(SCHEMA, { logo: ['a1.png'] });
    const html = render({ values: initialValues(SCHEMA, {}), files });

    expect(textOf(html)).toContain('a1.png');
    expect(controlOf(html, 'logo', 'input')).toContain('type="file"');
    expect(controlOf(html, 'logo', 'input')).toContain('accept="image/*"');

    const kept = buildSettings(SCHEMA, initialValues(SCHEMA, {}), { files });

    expect(kept.files).toEqual({ logo: ['a1.png'] });
    expect('remove-files' in kept).toBe(false);

    const removed = buildSettings(SCHEMA, initialValues(SCHEMA, {}), {
      files: { logo: [] },
      removed: ['a1.png'],
    });

    expect('files' in removed).toBe(false);
    expect(removed['remove-files']).toEqual(['a1.png']);
  });

  test('image: a new file replaces the old one and travels as its own part', () => {
    const picture = new File(['x'], 'b2.png', { type: 'image/png' });
    const files = initialFiles(SCHEMA, { logo: ['a1.png'] });
    const payload = buildSettings(SCHEMA, initialValues(SCHEMA, {}), {
      files,
      uploads: { logo: picture },
    });

    expect(payload['remove-files']).toEqual(['a1.png']);
    expect('files' in payload).toBe(false);
    expect(chosenUploads(SCHEMA, { logo: picture, title: picture, about: null })).toEqual({
      logo: picture,
    });
  });

  test('an image field is never a value in settings', () => {
    expect('logo' in initialValues(SCHEMA, { logo: 'x' })).toBe(false);
    expect('logo' in buildSettings(SCHEMA, initialValues(SCHEMA, {}))).toBe(false);
  });
});

describe('labels', () => {
  test('a plain label is shown as written', () => {
    expect(resolveText('Site title', { 'Site title': 'x' })).toBe('Site title');
  });

  test('a dotted label resolves in the front-end texts, nested or flat', () => {
    const nested = { settings: { title: { label: 'Site Title (nested)' } } };
    const flat = { 'settings.title.label': 'Site Title (flat)' };

    expect(resolveText('settings.title.label', nested)).toBe('Site Title (nested)');
    expect(resolveText('settings.title.label', flat)).toBe('Site Title (flat)');
    expect(lookupText(nested, 'settings.title')).toBeNull();
  });

  test('a dotted label that does not resolve is shown as written', () => {
    expect(resolveText('Read the docs.', {})).toBe('Read the docs.');
    expect(resolveText('settings.missing', { settings: {} }, () => null)).toBe('settings.missing');
  });

  test("the panel's own texts are the second place to look", () => {
    expect(resolveText('buttons.save', {}, (key) => (key === 'buttons.save' ? 'Save' : null))).toBe(
      'Save',
    );
  });

  test('the form renders labels, help and options from the front-end texts', () => {
    const schema = {
      fields: {
        title: {
          type: 'text',
          label: 'settings.title.label',
          help: 'settings.title.help',
        },
        layout: {
          type: 'select',
          label: 'settings.layout',
          options: [{ value: 'a', label: 'settings.layout-a' }],
        },
      },
    };
    const messages = {
      settings: {
        title: { label: 'Naam van de site', help: 'Zichtbaar in het tabblad' },
        layout: 'Indeling',
        'layout-a': 'Breed',
      },
    };
    const text = textOf(
      renderHtml(SchemaForm, { schema, values: initialValues(schema, {}), messages }),
    );

    expect(text).toContain('Naam van de site');
    expect(text).toContain('Zichtbaar in het tabblad');
    expect(text).toContain('Indeling');
    expect(text).toContain('Breed');
  });
});

describe('tabs and errors', () => {
  const TABBED = {
    tabs: { general: ['title'], 'look.tab': ['accent', 'columns'] },
    defaultTab: 'look.tab',
    fields: SCHEMA.fields,
  };

  test('tabsOf lists the tabs in order, and one nameless tab without them', () => {
    expect(tabsOf(TABBED).map((tab) => tab.id)).toEqual(['general', 'look.tab']);
    expect(tabsOf(SCHEMA)).toEqual([{ id: '', keys: Object.keys(SCHEMA.fields) }]);
  });

  test('a schema with tabs shows the default tab only, with a nav for the rest', () => {
    const html = renderHtml(SchemaForm, { schema: TABBED, values: initialValues(TABBED, {}) });

    expect(html).toContain('data-schema-tab="general"');
    expect(html).toContain('data-schema-tab="look.tab"');
    expect(html).toContain('data-field="accent"');
    expect(html).toContain('data-field="columns"');
    expect(html).not.toContain('data-field="title"');
  });

  test('a schema without tabs has no nav and shows every field', () => {
    const html = render({ values: initialValues(SCHEMA, {}) });

    expect(html).not.toContain('data-schema-tab');

    for (const key of Object.keys(SCHEMA.fields)) {
      expect(html).toContain(`data-field="${key}"`);
    }
  });

  test('the reason of a refused field is shown under it, in words', () => {
    const html = render({ values: initialValues(SCHEMA, {}), errors: { title: 'TOO_LONG' } });

    expect(html).toContain('data-field-error="TOO_LONG"');
    expect(textOf(html)).toContain('The text is too long.');
    expect(controlOf(html, 'title', 'input')).toContain('is-invalid');
  });

  test('a reason without a message says so instead of showing the code', () => {
    const html = render({ values: initialValues(SCHEMA, {}), errors: { title: 'NOT_A_REASON' } });

    expect(textOf(html)).toContain('This value is not accepted.');
  });

  test('disabled disables every control', () => {
    const html = render({ values: initialValues(SCHEMA, {}), disabled: true });

    for (const key of ['title', 'compact', 'columns', 'layout', 'accent', 'docs', 'logo']) {
      expect(
        controlOf(html, key, key === 'about' ? 'textarea' : key === 'layout' ? 'select' : 'input'),
      ).toContain('disabled');
    }
  });

  test('a required field is marked', () => {
    const schema = { fields: { name: { type: 'text', label: 'Name', required: true } } };
    const html = renderHtml(SchemaForm, { schema, values: initialValues(schema, {}) });

    expect(controlOf(html, 'name', 'input')).toContain('required');
    expect(html).toContain('text-danger');
  });
});
