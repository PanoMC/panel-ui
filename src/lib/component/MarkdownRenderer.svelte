<script>
  import { sanitize } from '@jill64/universal-sanitizer'
  import { marked } from "marked";

  marked.use({
    gfm: true
  })

  export let content

  function removeFirstPTag(html) {
    const container = document.createElement('div');
    container.innerHTML = html;

    const firstChild = container.firstElementChild;
    if (firstChild && firstChild.tagName === 'P') {
      // Replace the <p> with its children
      const fragment = document.createDocumentFragment();
      while (firstChild.firstChild) {
        fragment.appendChild(firstChild.firstChild);
      }
      container.replaceChild(fragment, firstChild);
    }

    return container.innerHTML;
  }
</script>

{@html removeFirstPTag(marked.parse(sanitize(content)))}