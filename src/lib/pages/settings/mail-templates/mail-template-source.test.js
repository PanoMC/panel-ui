import { describe, expect, test } from 'bun:test';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  checkTemplateSyntax,
  classifyMustache,
  minifyTemplate,
  prettifyTemplate,
  tokenizeTemplate,
} from './mail-template-source.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixtureDir = join(here, '__fixtures__');

// The real templates: the copied fixtures (the layout and two bundled mail bodies), plus the
// platform checkout's layout and every bundled mail body when it sits next to this repo (the
// umbrella workspace), so a template change there is covered too.
const resources = join(here, '../../../../../../pano-web-platform/Pano/src/main/resources');

const templates = new Map();

/** A bundled mail file without its front matter (`---` … `---`). */
const bodyOf = (text) => text.replace(/^---\n[\s\S]*?\n---\n/, '');

function collect(dir, prefix, recursive) {
  if (!existsSync(dir)) return;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);

    if (entry.isDirectory() && recursive) {
      collect(path, `${prefix}${entry.name}/`, true);
    } else if (entry.name.endsWith('.hbs')) {
      templates.set(`${prefix}${entry.name}`, bodyOf(readFileSync(path, 'utf8')));
    }
  }
}

collect(fixtureDir, 'fixture:', false);
collect(join(resources, 'mail'), 'platform:', false);
collect(join(resources, 'mail-templates'), 'platform:', true);

/** What decides the rendering: the tag / comment / Handlebars sequence and the text, whitespace-collapsed. */
function renderShape(source) {
  const { tokens, errors } = tokenizeTemplate(source);

  expect(errors).toEqual([]);

  return {
    markup: tokens.filter((t) => t.type !== 'text').map((t) => t.text),
    text: tokens.filter((t) => t.type === 'text').map((t) => t.text.replace(/[ \t\n\r\f]+/g, ' ')),
  };
}

describe('real templates', () => {
  test('fixtures are there', () => {
    expect(templates.size).toBeGreaterThanOrEqual(3);
  });

  for (const [file, source] of templates) {
    test(`${file}: no syntax error`, () => {
      expect(checkTemplateSyntax(source)).toBeNull();
    });

    test(`${file}: minify(prettify(x)) === minify(x), stable both ways`, () => {
      const min = minifyTemplate(source);
      const pretty = prettifyTemplate(source);

      expect(minifyTemplate(pretty)).toBe(min);
      expect(minifyTemplate(min)).toBe(min);
      expect(prettifyTemplate(minifyTemplate(pretty))).toBe(prettifyTemplate(min));
      expect(checkTemplateSyntax(pretty)).toBeNull();
      // Pretty really is multi-line (for a whole document).
      if (source.length > 2000) expect(pretty.split('\n').length).toBeGreaterThan(20);
    });

    test(`${file}: tags, comments, Handlebars and text are unchanged`, () => {
      const original = renderShape(source);

      expect(renderShape(minifyTemplate(source))).toEqual(original);
      expect(renderShape(prettifyTemplate(source))).toEqual(original);
    });

    test(`${file}: MSO conditional comments survive verbatim`, () => {
      const conds = source.match(/<!--\[if[\s\S]*?<!\[endif\]-->/g) ?? [];

      for (const cond of conds) {
        expect(minifyTemplate(prettifyTemplate(source))).toContain(cond);
        expect(prettifyTemplate(source)).toContain(cond);
      }
    });
  }
});

describe('minify', () => {
  test('drops whitespace between block tags only', () => {
    // Next to text one space stays, even inside a cell (conservative).
    expect(minifyTemplate('<table>\n  <tr>\n    <td>\n Hi\n </td>\n  </tr>\n</table>\n')).toBe(
      '<table><tr><td> Hi </td></tr></table>',
    );
  });

  test('keeps one space next to inline elements and text', () => {
    expect(minifyTemplate('<p>Hello\n   <b>you</b>  <i>x</i></p>')).toBe(
      '<p>Hello <b>you</b> <i>x</i></p>',
    );
    expect(minifyTemplate('<p><span>a</span><span>b</span></p>')).toBe(
      '<p><span>a</span><span>b</span></p>',
    );
    expect(minifyTemplate('<td>a <img src=x> b</td>')).toBe('<td>a <img src=x> b</td>');
  });

  test('never touches raw content, attributes or Handlebars', () => {
    const pre = '<pre>  a\n   b  </pre>';
    const style = '<style>\n  a { color: red }\n</style>';
    expect(minifyTemplate(`<div>\n${pre}\n${style}\n</div>`)).toBe(`<div>${pre}${style}</div>`);
    expect(minifyTemplate('<a  href="{{url}}"\n  title="a   b">{{ label }}</a>')).toBe(
      '<a  href="{{url}}"\n  title="a   b">{{ label }}</a>',
    );
    expect(minifyTemplate('<p>{{#if a}} {{/if}}</p>')).toBe('<p>{{#if a}} {{/if}}</p>');
  });

  test('keeps the non-breaking / zero-width characters of preheaders', () => {
    const text = '<div> ‌​﻿</div>';
    expect(minifyTemplate(text)).toBe(text);
  });

  test('Handlebars block tags on their own line between block tags', () => {
    const pretty =
      '<table>\n  {{#each rows}}\n  <tr>\n    <td>{{this}}</td>\n  </tr>\n  {{/each}}\n</table>';
    expect(minifyTemplate(pretty)).toBe(
      '<table>{{#each rows}}<tr><td>{{this}}</td></tr>{{/each}}</table>',
    );
  });

  test('whitespace between two block Handlebars tags only collapses', () => {
    expect(
      minifyTemplate(
        '<span>a</span>{{#if x}}<p>b</p>{{/if}} {{#if y}}<p>c</p>{{/if}}<span>d</span>',
      ),
    ).toBe('<span>a</span>{{#if x}}<p>b</p>{{/if}} {{#if y}}<p>c</p>{{/if}}<span>d</span>');
  });

  test('a source it cannot read comes back unchanged', () => {
    expect(minifyTemplate('<p>{{oops</p>')).toBe('<p>{{oops</p>');
  });
});

describe('prettify', () => {
  test('indents structural tags and keeps inline content glued', () => {
    expect(
      prettifyTemplate(
        '<!DOCTYPE html><html><body><table><tr><td><b>a</b>{{#if x}}{{x}}{{else}}y{{/if}}</td></tr></table></body></html>',
      ),
    ).toBe(
      [
        '<!DOCTYPE html>',
        '<html>',
        '  <body>',
        '    <table>',
        '      <tr>',
        '        <td><b>a</b>{{#if x}}{{x}}{{else}}y{{/if}}</td>',
        '      </tr>',
        '    </table>',
        '  </body>',
        '</html>',
        '',
      ].join('\n'),
    );
  });

  test('block Handlebars between block tags get their own line', () => {
    expect(prettifyTemplate('<table>{{#each rows}}<tr><td>x</td></tr>{{/each}}</table>')).toBe(
      [
        '<table>',
        '  {{#each rows}}',
        '    <tr>',
        '      <td>x</td>',
        '    </tr>',
        '  {{/each}}',
        '</table>',
        '',
      ].join('\n'),
    );
  });
});

describe('classifyMustache', () => {
  test('kinds', () => {
    expect(classifyMustache('{{#if a}}')).toEqual({ kind: 'open', name: 'if' });
    expect(classifyMustache('{{~#each list~}}')).toEqual({
      kind: 'open',
      name: 'each',
    });
    expect(classifyMustache('{{^items}}')).toEqual({
      kind: 'open',
      name: 'items',
    });
    expect(classifyMustache('{{/if}}')).toEqual({ kind: 'close', name: 'if' });
    expect(classifyMustache('{{else}}')).toEqual({ kind: 'else' });
    expect(classifyMustache('{{else if b}}')).toEqual({ kind: 'else' });
    expect(classifyMustache('{{^}}')).toEqual({ kind: 'else' });
    expect(classifyMustache('{{!-- x --}}')).toEqual({ kind: 'comment' });
    expect(classifyMustache('{{{html}}}')).toEqual({ kind: 'value' });
    expect(classifyMustache('{{elsewhere}}')).toEqual({ kind: 'value' });
  });
});

describe('checkTemplateSyntax', () => {
  const code = (source) => checkTemplateSyntax(source)?.code ?? null;

  test('fine templates', () => {
    expect(code('<p>{{#if a}}x{{else}}y{{/if}}</p>')).toBeNull();
    expect(code('<br><img src=x><hr/><meta charset=utf-8 />')).toBeNull();
    expect(code('<!DOCTYPE html><!-- </p> --><p>a</p>')).toBeNull();
    expect(code('<!--[if mso]><i>&#8202;<![endif]--><p></p>')).toBeNull();
    expect(code('<style>@media(x){.a{b:c}}</style>')).toBeNull();
    expect(code('<a href="{{#if u}}{{u}}{{/if}}">{{{raw}}}</a>')).toBeNull();
    expect(code('{{#if a}}<a href=1>{{else}}<a href=2>{{/if}}x</a>')).toBeNull();
    expect(code('<p>a > b and a < b</p>')).toBeNull();
  });

  test('Handlebars errors with line and column', () => {
    expect(checkTemplateSyntax('<p>\n  {{name</p>')).toMatchObject({
      code: 'UNCLOSED_MUSTACHE',
      line: 2,
      column: 3,
    });
    expect(code('<p>{{{raw}}</p>')).toBe('UNCLOSED_MUSTACHE');
    expect(code('<p>name}}</p>')).toBe('STRAY_MUSTACHE_CLOSE');
    expect(checkTemplateSyntax('{{#if a}}\n{{#each b}}{{/if}}')).toMatchObject({
      code: 'MISMATCHED_BLOCK_CLOSE',
      values: { name: 'if', expected: 'each' },
      line: 2,
    });
    expect(code('{{#if a}}x')).toBe('UNCLOSED_BLOCK');
    expect(code('x{{/if}}')).toBe('UNMATCHED_BLOCK_CLOSE');
    expect(code('x{{else}}y')).toBe('ELSE_OUTSIDE_BLOCK');
  });

  test('HTML errors', () => {
    expect(checkTemplateSyntax('<div>\n<p>x</div>')).toMatchObject({
      code: 'UNCLOSED_TAG',
      values: { name: 'p' },
      line: 2,
      column: 1,
    });
    expect(code('<div></span></div>')).toBe('UNMATCHED_CLOSE_TAG');
    expect(code('<p>x')).toBe('UNCLOSED_TAG');
    expect(code('<br></br>')).toBe('VOID_CLOSE_TAG');
    expect(code('<p>x<!-- y</p>')).toBe('UNCLOSED_COMMENT');
    expect(code('<p class="a>x</p>')).toBe('UNTERMINATED_TAG');
    expect(code('<style>a{}')).toBe('UNCLOSED_TAG');
    expect(code('{{#if a}}<div>{{/if}}</div>')).toBe('BRANCH_TAGS_DIFFER');
  });
});
