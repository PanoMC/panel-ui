import { describe, expect, test } from 'bun:test';

import {
  TEST_PING,
  blankModel,
  cleanTemplates,
  colorToHex,
  coveredEvents,
  discordMarkdown,
  hexToColor,
  modelToTemplate,
  parseModel,
  templateCatalogue,
  templateInfoFor,
} from './discord.util.js';

const CATALOGUE = [
  { source: 'core', events: [{ name: 'core.ticket.created' }, { name: 'core.user.registered' }] },
  { source: 'market', events: [{ name: 'market.order.paid' }] },
];

describe('catalogue', () => {
  test('editor data of every event, the test ping included', () => {
    const info = templateCatalogue({
      items: [
        {
          source: 'core',
          events: [
            {
              name: 'core.test.ping',
              subscribable: false,
              discord: {
                defaultTemplate: '{"content":"x"}',
                tokens: [{ name: 'site.name', sample: 'S' }],
              },
            },
            { name: 'core.user.registered', discord: null },
          ],
        },
      ],
    });

    expect(info['core.test.ping']).toMatchObject({
      defaultTemplate: '{"content":"x"}',
      tokens: [{ name: 'site.name', sample: 'S' }],
    });
    expect(info['core.user.registered']).toMatchObject({ defaultTemplate: null, tokens: [] });
  });

  test('the editor data of a format: Discord its own, the others from templates', () => {
    const info = templateCatalogue({
      items: [
        {
          source: 'core',
          events: [
            {
              name: 'core.user.registered',
              discord: { defaultTemplate: '{"content":"d"}', tokens: [] },
              templates: { SLACK: '{"text":"s"}', TEAMS: null },
              tokens: [{ name: 'url', sample: 'https://x' }],
            },
          ],
        },
      ],
    })['core.user.registered'];

    expect(templateInfoFor(info, 'DISCORD').defaultTemplate).toBe('{"content":"d"}');
    expect(templateInfoFor(info, 'SLACK')).toEqual({
      defaultTemplate: '{"text":"s"}',
      tokens: [{ name: 'url', sample: 'https://x' }],
    });
    expect(templateInfoFor(info, 'TEAMS').defaultTemplate).toBeNull();
    expect(templateInfoFor(undefined, 'SLACK')).toBeNull();
  });

  test('covered events follow the subscription, the test ping last', () => {
    expect(coveredEvents({ allEvents: true, events: [] }, CATALOGUE)).toEqual([
      'core.ticket.created',
      'core.user.registered',
      'market.order.paid',
      TEST_PING,
    ]);
    expect(
      coveredEvents(
        { allEvents: false, events: ['market.*', 'core.user.registered', 'gone.event'] },
        CATALOGUE,
      ),
    ).toEqual(['core.user.registered', 'market.order.paid', 'gone.event', TEST_PING]);
  });

  test('blank templates are not sent', () => {
    expect(cleanTemplates({ a: ' ', b: 'x' })).toEqual({ b: 'x' });
  });
});

describe('visual model', () => {
  test('a model and its template go back and forth', () => {
    const model = {
      ...blankModel(),
      username: 'Pano',
      title: 'New ticket: {data.title}',
      color: '#57F287',
      fields: [{ name: 'Player', value: '{data.username}', inline: true }],
    };
    const template = modelToTemplate(model);
    const parsed = JSON.parse(template);

    expect(parsed.embeds[0]).toMatchObject({
      title: 'New ticket: {data.title}',
      color: 0x57f287,
      timestamp: '{event.iso}',
    });
    expect(parsed.embeds[0].footer).toEqual({ text: '{site.name}' });
    expect(parseModel(template)).toEqual(model);
  });

  test('what the visual editor cannot show is refused', () => {
    expect(parseModel('{"embeds":[{"color":{event.color}}]}')).toBeNull();
    expect(parseModel('{"embeds":[{},{}]}')).toBeNull();
    expect(parseModel('{"embeds":[{"video":{}}]}')).toBeNull();
    expect(parseModel('{"content":"hi"}')).toMatchObject({ content: 'hi', hasEmbed: false });
  });

  test('colours', () => {
    expect(colorToHex(0x5865f2)).toBe('#5865F2');
    expect(hexToColor('#57f287')).toBe(0x57f287);
    expect(hexToColor('nope')).toBe(0x5865f2);
  });
});

describe('markdown preview', () => {
  test('marks are rendered, HTML never', () => {
    expect(discordMarkdown('**a** <b>x</b>')).toBe('<strong>a</strong> &lt;b&gt;x&lt;/b&gt;');
    expect(discordMarkdown('`**x**`')).toBe('<code class="discord-code">**x**</code>');
    expect(discordMarkdown('```json\n{"a":1}\n```')).toContain(
      '<pre class="discord-code-block"><code>{&quot;a&quot;:1}</code></pre>',
    );
    expect(discordMarkdown('[site](https://a.example) [bad](javascript:alert(1))')).toBe(
      '<a href="https://a.example" target="_blank" rel="noopener noreferrer">site</a> [bad](javascript:alert(1))',
    );
    expect(discordMarkdown('a\nb')).toBe('a<br>b');
  });
});
