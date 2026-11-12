import { describe, expect, test } from 'bun:test';

import {
  blankModel,
  format,
  modelToTemplate,
  parseModel,
  slackDecode,
  slackMarkdown,
} from './slack.js';

const plain = (text) => ({ type: 'plain_text', text, emoji: true });
const mrkdwn = (text) => ({ type: 'mrkdwn', text });
const button = (url) => ({
  type: 'actions',
  elements: [{ type: 'button', text: plain('Open'), url }],
});
const context = { type: 'context', elements: [mrkdwn('{site.name}')] };

// The shapes of SlackFormat.template (pano-web-platform MessageFormats.kt) for the core events.
const BUILT_IN = {
  'user.registered': {
    text: 'New player registered',
    blocks: [
      { type: 'header', text: plain('New player registered') },
      { type: 'section', text: mrkdwn('*{data.username}* joined {site.name}.') },
      { type: 'section', fields: [mrkdwn('*Player*\n{data.username}')] },
      button('{url}'),
      context,
    ],
  },
  'user.deleted': {
    text: 'Player deleted',
    blocks: [
      { type: 'header', text: plain('Player deleted') },
      { type: 'section', text: mrkdwn('The account of *{data.username}* was deleted.') },
      { type: 'section', fields: [mrkdwn('*Player*\n{data.username}')] },
      context,
    ],
  },
  'ticket.created': {
    text: 'New ticket: {data.title}',
    blocks: [
      { type: 'header', text: plain('New ticket: {data.title}') },
      { type: 'section', text: mrkdwn('*{data.username}* opened a new support ticket.') },
      {
        type: 'section',
        fields: [mrkdwn('*Player*\n{data.username}'), mrkdwn('*Ticket*\n#{data.id}')],
      },
      button('{url}'),
      context,
    ],
  },
  'post.published': {
    text: '{data.title}',
    blocks: [
      { type: 'header', text: plain('{data.title}') },
      { type: 'section', text: mrkdwn('A new post was published on {site.name}.') },
      button('{url}'),
      context,
    ],
  },
  'test.ping': {
    text: 'Test message',
    blocks: [
      { type: 'header', text: plain('Test message') },
      {
        type: 'section',
        text: mrkdwn('This webhook works. Messages from {site.name} will look like this.'),
      },
      context,
    ],
  },
  // an event nobody wrote a message for: no description, only the data as code
  unknown: {
    text: '{event}',
    blocks: [
      { type: 'header', text: plain('{event}') },
      { type: 'section', text: mrkdwn('```{data}```') },
      context,
    ],
  },
};

const FULL = {
  text: 'Hello {data.username}',
  username: 'Pano',
  iconUrl: 'https://example.com/icon.png',
  header: 'New player',
  body: '*{data.username}* joined.\n_welcome_',
  fields: [
    { name: 'Player', value: '{data.username}' },
    { name: 'Site', value: '{site.name}' },
  ],
  image: 'https://example.com/banner.png',
  buttonText: 'Open',
  buttonUrl: '{url}',
  footer: '{site.name}',
};

describe('model', () => {
  test('format name', () => {
    expect(format).toBe('SLACK');
  });

  test('a full model round-trips', () => {
    expect(parseModel(modelToTemplate(FULL))).toEqual(FULL);
  });

  test('the blank model round-trips', () => {
    expect(parseModel(modelToTemplate(blankModel()))).toEqual(blankModel());
  });

  test('empty parts are left out', () => {
    const body = JSON.parse(modelToTemplate({ ...blankModel(), header: 'Hi', footer: '' }));

    expect(body).toEqual({ blocks: [{ type: 'header', text: plain('Hi') }] });
  });

  test('fields, image and button are written the way Slack takes them', () => {
    const body = JSON.parse(modelToTemplate(FULL));

    expect(body.text).toBe(FULL.text);
    expect(body.icon_url).toBe(FULL.iconUrl);
    expect(body.blocks).toContainEqual({
      type: 'section',
      fields: [mrkdwn('*Player*\n{data.username}'), mrkdwn('*Site*\n{site.name}')],
    });
    expect(body.blocks).toContainEqual({
      type: 'image',
      image_url: FULL.image,
      alt_text: 'New player',
    });
    expect(body.blocks).toContainEqual(button('{url}'));
  });

  test('an image without a header still has an alt text', () => {
    const body = JSON.parse(modelToTemplate({ ...blankModel(), image: 'https://x.test/a.png' }));

    expect(body.blocks[0].alt_text).toBe('image');
  });

  for (const [event, template] of Object.entries(BUILT_IN)) {
    test(`the built-in template of ${event} parses and round-trips`, () => {
      const model = parseModel(JSON.stringify(template, null, 2));

      expect(model).not.toBeNull();
      expect(model.text).toBe(template.text);
      expect(model.header).toBe(template.blocks[0].text.text);
      expect(model.footer).toBe('{site.name}');
      expect(parseModel(modelToTemplate(model))).toEqual(model);
    });
  }

  test('the built-in parts land in the right inputs', () => {
    const created = parseModel(JSON.stringify(BUILT_IN['ticket.created']));

    expect(created.body).toBe('*{data.username}* opened a new support ticket.');
    expect(created.fields).toEqual([
      { name: 'Player', value: '{data.username}' },
      { name: 'Ticket', value: '#{data.id}' },
    ]);
    expect(created.buttonText).toBe('Open');
    expect(created.buttonUrl).toBe('{url}');

    const deleted = parseModel(JSON.stringify(BUILT_IN['user.deleted']));

    expect(deleted.buttonText).toBe('');
    expect(deleted.buttonUrl).toBe('');

    expect(parseModel(JSON.stringify(BUILT_IN['post.published'])).fields).toEqual([]);
  });

  test('a field without a bold name is all value', () => {
    const model = parseModel(
      JSON.stringify({ blocks: [{ type: 'section', fields: [mrkdwn('just text')] }] }),
    );

    expect(model.fields).toEqual([{ name: '', value: 'just text' }]);
    expect(parseModel(modelToTemplate(model))).toEqual(model);
  });
});

describe('refusals', () => {
  const refuses = (body) => expect(parseModel(JSON.stringify(body))).toBeNull();

  test('no JSON or not an object', () => {
    expect(parseModel('{ "text": {data} }')).toBeNull();
    expect(parseModel('[]')).toBeNull();
    expect(parseModel('"text"')).toBeNull();
  });

  test('unknown top-level keys', () => {
    refuses({ text: 'x', icon_emoji: ':ghost:' });
    refuses({ text: 'x', attachments: [] });
  });

  test('unknown block types', () => {
    refuses({ blocks: [{ type: 'divider' }] });
    refuses({ blocks: [{ type: 'rich_text', elements: [] }] });
  });

  test('a section with an accessory or plain text', () => {
    refuses({
      blocks: [
        {
          type: 'section',
          text: mrkdwn('x'),
          accessory: { type: 'image', image_url: 'https://x.test/a.png', alt_text: 'a' },
        },
      ],
    });
    refuses({ blocks: [{ type: 'section', text: plain('x') }] });
  });

  test('a part given twice', () => {
    refuses({
      blocks: [
        { type: 'header', text: plain('a') },
        { type: 'header', text: plain('b') },
      ],
    });
    refuses({
      blocks: [
        { type: 'section', text: mrkdwn('a') },
        { type: 'section', text: mrkdwn('b') },
      ],
    });
  });

  test('several buttons or not a button', () => {
    refuses({
      blocks: [
        {
          type: 'actions',
          elements: [
            { type: 'button', text: plain('a'), url: 'https://a.test' },
            { type: 'button', text: plain('b'), url: 'https://b.test' },
          ],
        },
      ],
    });
    refuses({
      blocks: [{ type: 'actions', elements: [{ type: 'static_select', placeholder: plain('a') }] }],
    });
    refuses({
      blocks: [
        {
          type: 'actions',
          elements: [{ type: 'button', text: plain('a'), url: 'https://a.test', style: 'primary' }],
        },
      ],
    });
  });

  test('a context with several or image elements', () => {
    refuses({ blocks: [{ type: 'context', elements: [mrkdwn('a'), mrkdwn('b')] }] });
    refuses({
      blocks: [
        {
          type: 'context',
          elements: [{ type: 'image', image_url: 'https://x.test/a.png', alt_text: 'a' }],
        },
      ],
    });
  });

  test('an image block with a title', () => {
    refuses({
      blocks: [
        { type: 'image', image_url: 'https://x.test/a.png', alt_text: 'a', title: plain('t') },
      ],
    });
  });
});

describe('markdown', () => {
  test('marks', () => {
    expect(slackMarkdown('*bold* _it_ ~gone~ `code`')).toBe(
      '<strong>bold</strong> <em>it</em> <s>gone</s> <code class="slack-code">code</code>',
    );
    expect(slackMarkdown('a\nb')).toBe('a<br>b');
    expect(slackMarkdown('```x *y*```')).toBe(
      '<pre class="slack-code-block"><code>x *y*</code></pre>',
    );
  });

  test('links', () => {
    expect(slackMarkdown('<https://panomc.com|Pano>')).toBe(
      '<a href="https://panomc.com" target="_blank" rel="noopener noreferrer">Pano</a>',
    );
    expect(slackMarkdown('<https://panomc.com/a?b=1&amp;c=2>')).toBe(
      '<a href="https://panomc.com/a?b=1&amp;c=2" target="_blank" rel="noopener noreferrer">https://panomc.com/a?b=1&amp;c=2</a>',
    );
  });

  test('escaped values show as text', () => {
    expect(slackMarkdown('Tom &amp; Jerry &lt;3')).toBe('Tom &amp; Jerry &lt;3');
  });

  test('an injected script stays inert', () => {
    const raw = slackMarkdown('<script>alert(1)</script>');
    const escaped = slackMarkdown('&lt;script&gt;alert(1)&lt;/script&gt;');

    // raw `<...>` is Slack's link / mention syntax: not an http(s) link, so plain text
    expect(raw).toBe('scriptalert(1)/script');
    // a value the backend escaped shows as the text the player typed
    expect(escaped).not.toContain('<script');
    expect(escaped).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');

    expect(slackMarkdown('<img src=x onerror=alert(1)>')).not.toContain('<img');
  });

  test('a javascript: link is never a link', () => {
    for (const text of ['<javascript:alert(1)|click>', '<javascript:alert(1)>']) {
      const html = slackMarkdown(text);

      expect(html).not.toContain('<a');
      expect(html).not.toContain('href');
    }

    expect(slackMarkdown('<javascript:alert(1)|click>')).toBe('click');
  });

  test('a label cannot break out of the link', () => {
    const html = slackMarkdown('<https://x.test|"><b>x</b>>');

    expect(html).not.toContain('<b>');
  });

  test('mentions stay text', () => {
    expect(slackMarkdown('<!channel>')).toBe('!channel');
  });

  test('decode', () => {
    expect(slackDecode('&lt;b&gt; &amp;')).toBe('<b> &');
  });
});
