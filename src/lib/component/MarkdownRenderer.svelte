<script>
  import { sanitize } from '@jill64/universal-sanitizer'
  import { marked } from "marked";

  import { browser } from "$app/environment";

  marked.use({
    gfm: true
  })

  export let content

  async function removeFirstPTag(html) {
    if (browser) { // CSR
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
    } else { // SSR
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

{#await removeFirstPTag(marked.parse(sanitize(content))) then content}
  {@html content}
{/await}