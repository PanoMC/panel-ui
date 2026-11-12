import { describe, expect, test } from 'bun:test';

import {
  blankModel,
  cardOf,
  modelToTemplate,
  parseModel,
  teamsColor,
  teamsMarkdown,
} from './teams.js';

const SCHEMA = 'http://adaptivecards.io/schemas/adaptive-card.json';
const CARD_TYPE = 'application/vnd.microsoft.card.adaptive';

/** The shape `TeamsFormat.template(spec)` of the backend writes. */
function builtIn({ description, code, fields = [], url } = {}) {
  const body = [
    {
      type: 'TextBlock',
      text: 'New ticket',
      size: 'Large',
      weight: 'Bolder',
      color: 'Good',
      wrap: true,
    },
  ];

  if (description) body.push({ type: 'TextBlock', text: description, wrap: true });
  if (code) body.push({ type: 'TextBlock', text: code, fontType: 'Monospace', wrap: true });
  if (fields.length > 0) {
    body.push({ type: 'FactSet', facts: fields.map(([title, value]) => ({ title, value })) });
  }

  body.push({ type: 'TextBlock', text: '{site.name}', isSubtle: true, size: 'Small', wrap: true });

  const card = { $schema: SCHEMA, type: 'AdaptiveCard', version: '1.4', body };

  if (url) card.actions = [{ type: 'Action.OpenUrl', title: 'Open', url }];

  return JSON.stringify({
    type: 'message',
    attachments: [{ contentType: CARD_TYPE, content: card }],
  });
}

const card = (extra) =>
  JSON.stringify({
    type: 'message',
    attachments: [{ contentType: CARD_TYPE, content: { type: 'AdaptiveCard', ...extra } }],
  });

describe('teams parseModel', () => {
  test('reads the full built-in shape', () => {
    const model = parseModel(
      builtIn({
        description: '{data.title}',
        code: '{data.message}',
        fields: [['User', '{data.username}']],
        url: '{url}',
      }),
    );

    expect(model).toEqual({
      title: 'New ticket',
      color: 'Good',
      text: '{data.title}',
      code: '{data.message}',
      image: '',
      facts: [{ title: 'User', value: '{data.username}' }],
      footer: '{site.name}',
      buttons: [{ title: 'Open', url: '{url}' }],
    });
  });

  test('reads every reduced built-in shape', () => {
    expect(parseModel(builtIn())).not.toBeNull();
    expect(parseModel(builtIn({ description: 'x' }))).not.toBeNull();
    expect(parseModel(builtIn({ fields: [['a', 'b']] }))).not.toBeNull();
    expect(parseModel(builtIn({ url: '{url}' }))).not.toBeNull();
    expect(parseModel(builtIn({ code: 'x' }))?.code).toBe('x');
  });

  test('refuses what the editor cannot show', () => {
    expect(parseModel('nope')).toBeNull();
    expect(parseModel('{"type":"message","attachments":[]}')).toBeNull();
    expect(parseModel('{"text":"hi"}')).toBeNull();
    expect(parseModel(card({ body: [{ type: 'ColumnSet', columns: [] }] }))).toBeNull();
    expect(parseModel(card({ msteams: { width: 'Full' } }))).toBeNull();
    expect(parseModel(card({ version: '1.5' }))).toBeNull();
    expect(parseModel(card({ actions: [{ type: 'Action.Submit', title: 'x' }] }))).toBeNull();
    // Two text blocks: there is only one text input.
    expect(
      parseModel(
        card({
          body: [
            { type: 'TextBlock', text: 'a', wrap: true },
            { type: 'TextBlock', text: 'b', wrap: true },
          ],
        }),
      ),
    ).toBeNull();
    // The footer before the facts is another order than the editor writes.
    expect(
      parseModel(
        card({
          body: [
            { type: 'TextBlock', text: 'f', isSubtle: true, size: 'Small' },
            { type: 'FactSet', facts: [] },
          ],
        }),
      ),
    ).toBeNull();
  });
});

describe('teams modelToTemplate', () => {
  test('round-trips a full model', () => {
    const model = {
      title: '{title}',
      color: 'Attention',
      text: '**Hi** {data.username}',
      code: '{data.code}',
      image: 'https://example.com/a.png',
      facts: [
        { title: 'User', value: '{data.username}' },
        { title: 'Id', value: '{data.id}' },
      ],
      footer: '{site.name}',
      buttons: [
        { title: 'Open', url: '{url}' },
        { title: 'Site', url: '{site.url}' },
      ],
    };

    expect(parseModel(modelToTemplate(model))).toEqual(model);
  });

  test('round-trips the blank model and an empty title with a colour', () => {
    expect(parseModel(modelToTemplate(blankModel()))).toEqual(blankModel());

    const model = { ...blankModel(), title: '', color: 'Warning', footer: '' };

    expect(parseModel(modelToTemplate(model))).toEqual(model);
  });

  test('writes the built-in template back as it was', () => {
    const text = builtIn({ description: 'd', fields: [['a', 'b']], url: '{url}' });

    expect(JSON.parse(modelToTemplate(parseModel(text)))).toEqual(JSON.parse(text));
  });

  test('leaves empty rows out', () => {
    const content = JSON.parse(
      modelToTemplate({
        ...blankModel(),
        facts: [{ title: '', value: '' }],
        buttons: [{ title: '', url: '' }],
      }),
    ).attachments[0].content;

    expect(content.actions).toBeUndefined();
    expect(content.body.some((block) => block.type === 'FactSet')).toBe(false);
  });
});

describe('teams preview helpers', () => {
  test('escapes before marking up', () => {
    expect(teamsMarkdown('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
    expect(teamsMarkdown('**a** _b_\nc')).toBe('<strong>a</strong> <em>b</em><br>c');
    expect(teamsMarkdown('[x](https://a.b/c?d=1&e=2)')).toBe(
      '<a href="https://a.b/c?d=1&amp;e=2" target="_blank" rel="noopener noreferrer">x</a>',
    );
    expect(teamsMarkdown('[x](javascript:alert(1))')).not.toContain('<a');
    expect(teamsMarkdown('[x](https://a.b/"onmouseover=1)')).not.toContain('"onmouseover');
    expect(teamsMarkdown('snake_case_name')).toBe('snake_case_name');
  });

  test('colours and card lookup', () => {
    expect(teamsColor('Good')).toBe('#13a10e');
    expect(teamsColor('nope')).toBe('#242424');
    expect(cardOf(null)).toBeNull();
    expect(cardOf(JSON.parse(builtIn()))?.type).toBe('AdaptiveCard');
  });
});
