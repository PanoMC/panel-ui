<!-- A Bootstrap modal shell the Pano Backup pages open with `show()` / close with `hide()`. -->
<div class="modal fade" tabindex="-1" aria-hidden="true" bind:this={element}>
  <div class="modal-dialog modal-dialog-centered {size}">
    <div class="modal-content">
      {@render children()}
    </div>
  </div>
</div>

<script>
  /** @type {{ children: import('svelte').Snippet, size?: string, onhidden?: () => void }} */
  let { children, size = '', onhidden } = $props();

  /** @type {HTMLDivElement | undefined} */
  let element = $state();

  function instance() {
    return element && window.bootstrap?.Modal
      ? window.bootstrap.Modal.getOrCreateInstance(element)
      : null;
  }

  export function show() {
    instance()?.show();
  }

  export function hide() {
    instance()?.hide();
  }

  $effect(() => {
    const el = element;

    if (!el) {
      return;
    }

    const handler = () => onhidden?.();

    el.addEventListener('hidden.bs.modal', handler);

    return () => el.removeEventListener('hidden.bs.modal', handler);
  });
</script>
