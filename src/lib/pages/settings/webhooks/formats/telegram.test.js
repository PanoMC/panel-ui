import { describe, expect, test } from 'bun:test';

import {
  blankModel,
  format,
  keyboardOf,
  modelToTemplate,
  parseModel,
  telegramHtml,
} from './telegram.js';

// The shapes TelegramFormat.template() builds for the core events (MessageFormats.kt).
const WITH_BUTTON = JSON.stringify({
  text: '<b>New user registered</b>\n\n<b>{data.username}</b> joined.\n\n<b>Email:</b> {data.email}\n\n<i>{site.name}</i>',
  parse_mode: 'HTML',
  link_preview_options: { is_disabled: true },
  reply_markup: { inline_keyboard: [[{ text: 'Open in panel', url: '{url}' }]] },
});

const WITHOUT_BUTTON = JSON.stringify({
  text: '<b>Test ping</b>\n\nThis is a test.\n\n<pre>{data.payload}</pre>\n\n<i>{site.name}</i>',
  parse_mode: 'HTML',
  link_preview_options: { is_disabled: true },
});

describe('telegram format', () => {
  test('format id', () => {
    expect(format).toBe('TELEGRAM');
  });

  test('blank model round-trips', () => {
    const model = blankModel();

    expect(parseModel(modelToTemplate(model))).toEqual(model);
  });

  test('a full model round-trips', () => {
    const model = {
      text: '<b>{data.username}</b>\n<a href="{url}">open</a>',
      disablePreview: false,
      silent: true,
      buttons: [
        { text: 'Open', url: '{url}' },
        { text: 'Site', url: 'https://example.com' },
      ],
    };

    expect(parseModel(modelToTemplate(model))).toEqual(model);
  });

  test('template keeps parse_mode HTML and drops empty buttons', () => {
    const body = JSON.parse(
      modelToTemplate({
        text: 'x',
        disablePreview: true,
        silent: false,
        buttons: [{ text: '', url: '' }],
      }),
    );

    expect(body).toEqual({
      text: 'x',
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
    });
  });

  test('built-in template with a button parses and round-trips', () => {
    const model = parseModel(WITH_BUTTON);

    expect(model).toEqual({
      text: JSON.parse(WITH_BUTTON).text,
      disablePreview: true,
      silent: false,
      buttons: [{ text: 'Open in panel', url: '{url}' }],
    });
    expect(JSON.parse(modelToTemplate(model))).toEqual(JSON.parse(WITH_BUTTON));
  });

  test('built-in template without a button parses and round-trips', () => {
    const model = parseModel(WITHOUT_BUTTON);

    expect(model?.buttons).toEqual([]);
    expect(model?.disablePreview).toBe(true);
    expect(JSON.parse(modelToTemplate(model))).toEqual(JSON.parse(WITHOUT_BUTTON));
  });

  test('refuses what the visual editor cannot show', () => {
    const base = { text: 'x', parse_mode: 'HTML' };
    const refuse = (value) => expect(parseModel(JSON.stringify(value))).toBeNull();

    expect(parseModel('not json')).toBeNull();
    expect(parseModel('{"text": {data.x}}')).toBeNull();
    refuse([]);
    refuse({ text: 'x' });
    refuse({ ...base, parse_mode: 'MarkdownV2' });
    refuse({ ...base, chat_id: '1' });
    refuse({ ...base, text: 1 });
    refuse({ ...base, disable_notification: 'yes' });
    refuse({ ...base, link_preview_options: { is_disabled: true, url: 'https://x' } });
    refuse({ ...base, reply_markup: { keyboard: [] } });
    refuse({
      ...base,
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'a', url: 'u' },
            { text: 'b', url: 'u' },
          ],
        ],
      },
    });
    refuse({ ...base, reply_markup: { inline_keyboard: [[{ text: 'a', callback_data: 'x' }]] } });
    refuse({ ...base, reply_markup: { inline_keyboard: [[]] } });
  });
});

describe('telegramHtml', () => {
  test('keeps allowed tags', () => {
    expect(telegramHtml('<b>a</b><i>b</i><u>c</u><s>d</s><strike>e</strike>')).toBe(
      '<b>a</b><i>b</i><u>c</u><s>d</s><s>e</s>',
    );
    expect(telegramHtml('<code>x</code>')).toBe('<code class="telegram-code">x</code>');
    expect(telegramHtml('<pre>x</pre>')).toBe('<pre class="telegram-pre">x</pre>');
    expect(telegramHtml('<tg-spoiler>s</tg-spoiler>')).toBe(
      '<span class="telegram-spoiler">s</span>',
    );
    expect(telegramHtml('<span class="tg-spoiler">s</span>')).toBe(
      '<span class="telegram-spoiler">s</span>',
    );
    expect(telegramHtml('<a href="https://example.com/?a=1&amp;b=2">x</a>')).toBe(
      '<a href="https://example.com/?a=1&amp;b=2" target="_blank" rel="noopener noreferrer">x</a>',
    );
  });

  test('newlines become <br>', () => {
    expect(telegramHtml('a\nb')).toBe('a<br>b');
  });

  test('keeps entities, escapes stray ampersands', () => {
    expect(telegramHtml('&lt;b&gt; &amp; & x')).toBe('&lt;b&gt; &amp; &amp; x');
  });

  test('scripts and handlers stay inert', () => {
    const out = telegramHtml('<script>alert(1)</script><img src=x onerror=alert(1)>');

    expect(out).not.toContain('<script');
    expect(out).not.toContain('<img');
    expect(out).toBe('&lt;script&gt;alert(1)&lt;/script&gt;&lt;img src=x onerror=alert(1)&gt;');
  });

  test('attributes on allowed tags are dropped', () => {
    expect(telegramHtml('<b onclick="alert(1)">x</b>')).toBe('<b>x</b>');
    expect(telegramHtml('<a href="https://x.y" onmouseover="alert(1)">x</a>')).not.toContain(
      'onmouseover',
    );
  });

  test('javascript: links lose their href', () => {
    expect(telegramHtml('<a href="javascript:alert(1)">x</a>')).toBe('<a>x</a>');
    expect(telegramHtml('<a href="&#106;avascript:alert(1)">x</a>')).toBe('<a>x</a>');
    expect(telegramHtml('<a href=" JAVASCRIPT:alert(1)">x</a>')).toBe('<a>x</a>');
  });

  test('closes open tags, keeps stray closing tags as text', () => {
    expect(telegramHtml('<b>x')).toBe('<b>x</b>');
    expect(telegramHtml('x</b>')).toBe('x&lt;/b&gt;');
    expect(telegramHtml('<span>x</span>')).toBe('&lt;span&gt;x&lt;/span&gt;');
  });
});

describe('keyboardOf', () => {
  test('keeps buttons with text and only http(s) links', () => {
    expect(
      keyboardOf({
        reply_markup: {
          inline_keyboard: [
            [{ text: 'a', url: 'https://x.y' }],
            [{ text: '', url: 'https://x.y' }],
            [{ text: 'b', url: 'javascript:alert(1)' }],
          ],
        },
      }),
    ).toEqual([[{ text: 'a', url: 'https://x.y' }], [{ text: 'b', url: '' }]]);
    expect(keyboardOf({})).toEqual([]);
  });
});
