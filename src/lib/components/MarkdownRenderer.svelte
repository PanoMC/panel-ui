{#await removeFirstPTag(sanitizeRichText(marked.parse(String(content ?? '')))) then content}
  {@html content}
{/await}

<script>
  import { marked } from 'marked';
  import { escapeHtml } from '@panomc/sdk/core/js/html.util.js';
  import { safeHref, sanitizeRichText } from '$lib/html-sanitize.util.js';
  import { browser } from '$app/env';

  export let content;

  // Add target="_blank" to links in Markdown
  const renderer = {
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
      return `<a href="${escapeHtml(safeHref(href))}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
    },
  };

  marked.use({
    gfm: true,
    renderer,
  });

  async function removeFirstPTag(html) {
    if (browser) {
      // CSR
      const container = document.createElement('div');
      container.innerHTML = html;
      const firstChild = container.firstElementChild;

      if (firstChild && firstChild.tagName === 'P') {
        const fragment = document.createDocumentFragment();
        while (firstChild.firstChild) {
          fragment.appendChild(firstChild.firstChild);
        }
        container.replaceChild(fragment, firstChild);
      }

      return container.innerHTML;
    } else {
      // SSR
      const cheerio = await import('cheerio');
      const $ = cheerio.load(html);
      const p = $('body').children().first();

      if (p.is('p')) {
        return p.html();
      }
      return html;
    }
  }
</script>
