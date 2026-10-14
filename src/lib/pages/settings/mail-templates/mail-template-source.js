/**
 * Pure helpers for the HTML source of an e-mail template (Handlebars over HTML) in the admin editor
 * (source and advanced views, layout editor; ported from the panomc.com website): {@link prettifyTemplate} for reading, {@link minifyTemplate}
 * for saving / comparing, and {@link checkTemplateSyntax} for a live syntax check. No other imports, so
 * `bun test` (the test next to it) runs it as is.
 *
 * Both formatters only touch the whitespace BETWEEN tokens (tags, comments, Handlebars tokens, text)
 * plus whitespace runs inside text (collapsed to one space). Tags (attributes included), comments,
 * MSO conditional comments, Handlebars tokens and the content of `<pre>`, `<textarea>`, `<style>`
 * and `<script>` are copied byte for byte. A gap is dropped entirely only when both sides are
 * structural (block-level tags, the document edge; comments and Handlebars block tags are looked
 * through) and at least one direct neighbour is a real structural tag; any other gap that holds
 * whitespace becomes one space (minify) or a line break (prettify), and a gap without whitespace
 * stays empty. So `minify(prettify(x)) === minify(x)` holds by construction.
 *
 * Whitespace means ASCII space, tab, CR, LF and form feed only — never U+00A0 or the zero-width
 * characters e-mail preheaders are padded with (JS `\s` would match some of those).
 */

const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'keygen',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/** Elements whose content is copied verbatim (one token from the open to the close tag). */
const RAW_TAGS = new Set(['pre', 'textarea', 'style', 'script']);

/** Block-level / structural tags: whitespace between two of them never renders. */
const BLOCK_TAGS = new Set([
  'html',
  'head',
  'body',
  'title',
  'meta',
  'link',
  'base',
  'style',
  'script',
  'noscript',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'td',
  'th',
  'caption',
  'colgroup',
  'col',
  'div',
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'center',
  'ul',
  'ol',
  'li',
  'dl',
  'dt',
  'dd',
  'br',
  'hr',
  'pre',
  'blockquote',
  'section',
  'article',
  'header',
  'footer',
  'nav',
  'main',
  'aside',
  'figure',
  'figcaption',
  'address',
  'form',
]);

const isWs = (c) => c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f';

const WS_RUN = /[ \t\n\r\f]+/g;

/** 1-based line and column of an index. */
export function positionOf(source, index) {
  let line = 1;
  let lineStart = 0;

  for (let i = 0; i < index && i < source.length; i++) {
    if (source[i] === '\n') {
      line++;
      lineStart = i + 1;
    }
  }

  return { line, column: index - lineStart + 1 };
}

/* ------------------------------------------------------------------ Handlebars tokens */

/** The closer of a mustache starting at `i` (`{{{` → `}}}`, `{{!--` → `--}}`, else `}}`). */
function mustacheAt(source, i) {
  if (source.startsWith('{{{', i)) return { open: 3, close: '}}}' };
  if (/^\{\{~?!--/.test(source.slice(i, i + 6))) return { open: 2, close: '--}}' };

  return { open: 2, close: '}}' };
}

/**
 * Kind of a mustache: `open` / `close` (block, with `name`), `else`, `comment` or `value`.
 *
 * @param {string} text the whole mustache, braces included
 */
export function classifyMustache(text) {
  let inner = text.startsWith('{{{') ? text.slice(3, -3) : text.slice(2, -2);

  inner = inner.replace(/^~/, '').replace(/~$/, '').trim();

  if (inner.startsWith('!')) return { kind: 'comment' };

  if (inner.startsWith('#') || (inner.startsWith('^') && inner.length > 1)) {
    const name = inner
      .slice(1)
      .replace(/^[>*]/, '')
      .trim()
      .match(/^[^\s}~()]+/)?.[0];

    return { kind: 'open', name: name ?? '' };
  }

  if (inner === '^' || /^else(\s|$)/.test(inner)) return { kind: 'else' };

  if (inner.startsWith('/')) {
    return {
      kind: 'close',
      name:
        inner
          .slice(1)
          .trim()
          .match(/^[^\s}~]+/)?.[0] ?? '',
    };
  }

  return { kind: 'value' };
}

/* ------------------------------------------------------------------ tokenizer */

/**
 * Splits a template into tokens. `gaps[k]` is the whitespace before `tokens[k]`
 * (`gaps[tokens.length]` = trailing whitespace); text tokens carry no edge whitespace.
 *
 * Token types: `text`, `tag` (`name`, `closing`, `selfClosing`), `raw` (a whole pre / textarea /
 * style / script element), `comment`, `cond` (an MSO conditional comment, content included),
 * `doctype`, `hbs` (`kind`, `name`).
 *
 * @param {string} source
 * @returns {{tokens: object[], gaps: string[], errors: {code: string, index: number, values?: object}[]}}
 */
export function tokenizeTemplate(source) {
  const src = String(source ?? '');
  const lower = src.toLowerCase();
  const tokens = [];
  const gaps = [''];
  const errors = [];
  let textStart = -1;

  const pushText = (end) => {
    if (textStart < 0) return;

    const text = src.slice(textStart, end);
    let a = 0;
    let b = text.length;

    while (a < b && isWs(text[a])) a++;
    while (b > a && isWs(text[b - 1])) b--;

    gaps[gaps.length - 1] += text.slice(0, a);

    if (a < b) {
      tokens.push({
        type: 'text',
        text: text.slice(a, b),
        start: textStart + a,
      });
      gaps.push(text.slice(b));
    }

    textStart = -1;
  };

  const push = (token) => {
    tokens.push(token);
    gaps.push('');
  };

  let i = 0;

  while (i < src.length) {
    if (src.startsWith('{{', i)) {
      const { open, close } = mustacheAt(src, i);
      const end = src.indexOf(close, i + open);

      if (end < 0) {
        errors.push({ code: 'UNCLOSED_MUSTACHE', index: i });
        break;
      }

      pushText(i);

      const text = src.slice(i, end + close.length);
      const info = classifyMustache(text);

      push({ type: 'hbs', text, start: i, kind: info.kind, name: info.name });
      i = end + close.length;
      continue;
    }

    if (src[i] === '<') {
      if (src.startsWith('<!--[if', i)) {
        const end = src.indexOf('<![endif]-->', i);

        if (end < 0) {
          errors.push({ code: 'UNCLOSED_COMMENT', index: i });
          break;
        }

        pushText(i);
        push({ type: 'cond', text: src.slice(i, end + 12), start: i });
        i = end + 12;
        continue;
      }

      if (src.startsWith('<!--', i)) {
        const end = src.indexOf('-->', i + 4);

        if (end < 0) {
          errors.push({ code: 'UNCLOSED_COMMENT', index: i });
          break;
        }

        pushText(i);
        push({ type: 'comment', text: src.slice(i, end + 3), start: i });
        i = end + 3;
        continue;
      }

      if (/^<[!?][a-zA-Z]/.test(src.slice(i, i + 3))) {
        const end = src.indexOf('>', i);

        if (end < 0) {
          errors.push({
            code: 'UNTERMINATED_TAG',
            index: i,
            values: { name: '!' },
          });
          break;
        }

        pushText(i);
        push({ type: 'doctype', text: src.slice(i, end + 1), start: i });
        i = end + 1;
        continue;
      }

      const nameMatch = /^<(\/?)([a-zA-Z][^\s/>{]*)/.exec(src.slice(i, i + 64));

      if (nameMatch) {
        const closing = nameMatch[1] === '/';
        const name = nameMatch[2].toLowerCase();
        let j = i + nameMatch[0].length;
        let quote = null;
        let end = -1;

        while (j < src.length) {
          if (src.startsWith('{{', j)) {
            const { open, close } = mustacheAt(src, j);
            const stop = src.indexOf(close, j + open);

            if (stop < 0) {
              j = -1;
              break;
            }

            j = stop + close.length;
            continue;
          }

          const c = src[j];

          if (quote) {
            if (c === quote) quote = null;
          } else if (c === '"' || c === "'") {
            quote = c;
          } else if (c === '>') {
            end = j;
            break;
          }

          j++;
        }

        if (j < 0) {
          errors.push({ code: 'UNCLOSED_MUSTACHE', index: i });
          break;
        }

        if (end < 0) {
          errors.push({ code: 'UNTERMINATED_TAG', index: i, values: { name } });
          break;
        }

        pushText(i);

        const text = src.slice(i, end + 1);
        const selfClosing = !closing && /\/\s*>$/.test(text);

        if (!closing && !selfClosing && RAW_TAGS.has(name)) {
          const closeAt = lower.indexOf(`</${name}`, end + 1);
          const closeEnd = closeAt < 0 ? -1 : src.indexOf('>', closeAt);

          if (closeEnd < 0) {
            errors.push({ code: 'UNCLOSED_TAG', index: i, values: { name } });
            break;
          }

          push({
            type: 'raw',
            text: src.slice(i, closeEnd + 1),
            start: i,
            name,
          });
          i = closeEnd + 1;
          continue;
        }

        push({ type: 'tag', text, start: i, name, closing, selfClosing });
        i = end + 1;
        continue;
      }
    }

    if (textStart < 0) textStart = i;
    i++;
  }

  if (errors.length) return { tokens, gaps, errors };

  pushText(src.length);

  return { tokens, gaps, errors };
}

/* ------------------------------------------------------------------ whitespace rules */

const isAlwaysTransparent = (t) =>
  t.type === 'comment' || (t.type === 'hbs' && t.kind === 'comment');

const isBlockHbs = (t) =>
  t.type === 'hbs' && (t.kind === 'open' || t.kind === 'close' || t.kind === 'else');

const isStructural = (t) =>
  !t || t.type === 'doctype' || ((t.type === 'tag' || t.type === 'raw') && BLOCK_TAGS.has(t.name));

/** Nearest token from `k` in `step` direction, skipping comments (and block Handlebars when `chain`). */
function neighbour(tokens, k, step, chain) {
  for (let i = k; i >= 0 && i < tokens.length; i += step) {
    const t = tokens[i];

    if (isAlwaysTransparent(t)) continue;
    if (chain && isBlockHbs(t)) continue;

    return t;
  }

  return null;
}

/** Whether the gap before `tokens[k]` can be removed entirely. */
function droppable(tokens, k) {
  const leftChain = neighbour(tokens, k - 1, -1, true);
  const rightChain = neighbour(tokens, k, 1, true);

  if (!isStructural(leftChain) || !isStructural(rightChain)) return false;

  return (
    isStructural(neighbour(tokens, k - 1, -1, false)) ||
    isStructural(neighbour(tokens, k, 1, false))
  );
}

const tokenText = (t) => (t.type === 'text' ? t.text.replace(WS_RUN, ' ') : t.text);

/**
 * The compact form that is saved and compared: whitespace between structural tags removed, other
 * whitespace runs collapsed to one space. A source the tokenizer cannot read comes back unchanged.
 *
 * @param {string} source
 * @returns {string}
 */
export function minifyTemplate(source) {
  const src = String(source ?? '');
  const { tokens, gaps, errors } = tokenizeTemplate(src);

  if (errors.length) return src;

  let out = '';

  for (let k = 0; k <= tokens.length; k++) {
    if (gaps[k] && !droppable(tokens, k)) out += ' ';
    if (k < tokens.length) out += tokenText(tokens[k]);
  }

  return out;
}

/**
 * The readable form shown in the editor: one structural token per line, indented by nesting.
 * Inline content without whitespace in between stays on one line (a line break there would add a
 * space to the mail). A source the tokenizer cannot read comes back unchanged.
 *
 * @param {string} source
 * @param {{indent?: string}} [options]
 * @returns {string}
 */
export function prettifyTemplate(source, { indent = '  ' } = {}) {
  const src = String(source ?? '');
  const { tokens, gaps, errors } = tokenizeTemplate(src);

  if (errors.length) return src;

  let out = '';
  let depth = 0;

  for (let k = 0; k <= tokens.length; k++) {
    const t = tokens[k];
    let before = depth;

    if (t) {
      const closes =
        (t.type === 'tag' && t.closing) ||
        (t.type === 'hbs' && (t.kind === 'close' || t.kind === 'else'));

      if (closes) before = Math.max(0, depth - 1);
    }

    const breakHere = droppable(tokens, k) || gaps[k].length > 0;

    if (breakHere && (k > 0 || gaps[k])) {
      out += k === 0 || !t ? '\n' : `\n${indent.repeat(before)}`;
    }

    if (!t) break;

    out += t.text;
    depth = before;

    if (
      (t.type === 'tag' && !t.closing && !t.selfClosing && !VOID_TAGS.has(t.name)) ||
      (t.type === 'hbs' && (t.kind === 'open' || t.kind === 'else'))
    ) {
      depth++;
    }
  }

  return out;
}

/* ------------------------------------------------------------------ syntax check */

const rangesOf = (tokens, names) =>
  tokens
    .filter((t) => t.type === 'raw' && names.has(t.name))
    .map((t) => [t.start, t.start + t.text.length]);

/** Handlebars pass over the whole source: unclosed / stray braces, block balance. */
function checkHandlebars(src, skipRanges) {
  const stack = [];
  let i = 0;

  const inSkip = (index) => skipRanges.some(([a, b]) => index >= a && index < b);

  while (i < src.length) {
    const open = src.indexOf('{{', i);
    const stray = src.indexOf('}}', i);

    if (stray >= 0 && (open < 0 || stray < open)) {
      if (!inSkip(stray)) return { code: 'STRAY_MUSTACHE_CLOSE', index: stray };

      i = stray + 2;
      continue;
    }

    if (open < 0) break;

    const { open: len, close } = mustacheAt(src, open);
    const end = src.indexOf(close, open + len);

    if (end < 0) return { code: 'UNCLOSED_MUSTACHE', index: open };

    const text = src.slice(open, end + close.length);
    const inner = text.slice(len, text.length - close.length);

    if (!text.startsWith('{{!') && !text.startsWith('{{~!') && inner.includes('{{')) {
      return { code: 'UNCLOSED_MUSTACHE', index: open };
    }

    const info = classifyMustache(text);

    if (info.kind === 'open') {
      stack.push({ name: info.name, index: open });
    } else if (info.kind === 'else') {
      if (!stack.length) return { code: 'ELSE_OUTSIDE_BLOCK', index: open };
    } else if (info.kind === 'close') {
      const top = stack.pop();

      if (!top) {
        return {
          code: 'UNMATCHED_BLOCK_CLOSE',
          index: open,
          values: { name: info.name },
        };
      }

      if (top.name !== info.name) {
        return {
          code: 'MISMATCHED_BLOCK_CLOSE',
          index: open,
          values: { name: info.name, expected: top.name },
        };
      }
    }

    i = end + close.length;
  }

  if (stack.length) {
    const top = stack[stack.length - 1];

    return {
      code: 'UNCLOSED_BLOCK',
      index: top.index,
      values: { name: top.name },
    };
  }

  return null;
}

const sameNames = (a, b) =>
  a.length === b.length && a.every((entry, i) => entry.name === b[i].name);

/** HTML pass over the tokens: balanced tags, every Handlebars branch leaving the same open tags. */
function checkHtml(tokens) {
  let stack = [];
  const frames = [];

  for (const t of tokens) {
    if (t.type === 'hbs') {
      if (t.kind === 'open') {
        frames.push({
          name: t.name,
          index: t.start,
          snapshot: stack.slice(),
          results: [],
        });
      } else if (t.kind === 'else' && frames.length) {
        const frame = frames[frames.length - 1];

        frame.results.push(stack);
        frame.hasElse = true;
        stack = frame.snapshot.slice();
      } else if (t.kind === 'close' && frames.length) {
        const frame = frames.pop();
        const results = [...frame.results, stack];

        // No else: the skipped (or zero times repeated) body leaves the stack as it was.
        if (!frame.hasElse) results.push(frame.snapshot);

        if (!results.every((r) => sameNames(r, results[0]))) {
          return {
            code: 'BRANCH_TAGS_DIFFER',
            index: frame.index,
            values: { name: frame.name },
          };
        }

        stack = results[0].slice();
      }

      continue;
    }

    if (t.type !== 'tag') continue;

    if (!t.closing) {
      if (!t.selfClosing && !VOID_TAGS.has(t.name)) {
        stack.push({ name: t.name, index: t.start });
      }

      continue;
    }

    if (VOID_TAGS.has(t.name)) {
      return {
        code: 'VOID_CLOSE_TAG',
        index: t.start,
        values: { name: t.name },
      };
    }

    const top = stack[stack.length - 1];

    if (top && top.name === t.name) {
      stack.pop();
      continue;
    }

    if (top && stack.some((entry) => entry.name === t.name)) {
      return {
        code: 'UNCLOSED_TAG',
        index: top.index,
        values: { name: top.name },
      };
    }

    return {
      code: 'UNMATCHED_CLOSE_TAG',
      index: t.start,
      values: { name: t.name },
    };
  }

  if (stack.length) {
    const top = stack[stack.length - 1];

    return {
      code: 'UNCLOSED_TAG',
      index: top.index,
      values: { name: top.name },
    };
  }

  return null;
}

/**
 * First syntax error of a template, `null` when it looks fine. Checks unclosed `{{` / `{{{` and
 * stray `}}` (outside `<style>` / `<script>`), Handlebars block balance (`#if` … `/if`, `else`
 * outside a block) and HTML tag balance (void elements, self-closing tags, comments, MSO
 * conditional comments, doctype; both branches of an `{{#if}}` must leave the same tags open).
 * The backend's own check stays the final word.
 *
 * @param {string} source
 * @returns {null | {code: string, index: number, line: number, column: number, values: Record<string, any>}}
 */
export function checkTemplateSyntax(source) {
  const src = String(source ?? '');
  const { tokens, errors } = tokenizeTemplate(src);
  const skip = rangesOf(tokens, new Set(['style', 'script']));
  const hbs = checkHandlebars(src, skip);
  const tokenError = errors[0] ?? null;

  let error = null;

  if (hbs && tokenError) error = hbs.index <= tokenError.index ? hbs : tokenError;
  else error = hbs ?? tokenError ?? checkHtml(tokens);

  if (!error) return null;

  return { values: {}, ...error, ...positionOf(src, error.index) };
}
