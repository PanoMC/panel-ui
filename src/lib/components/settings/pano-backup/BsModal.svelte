<!-- A Bootstrap modal shell the Pano Backup pages open with `show()` / close with `hide()`. -->
<div class="modal fade" tabindex="-1" aria-hidden="true" bind:this={element}>
  <div class="modal-dialog modal-dialog-centered {size}">
    <div class="modal-content">
      {@render children()}
    </div>
  </div>
</div>

<script>
  /** @type {{ children: import('svelte').Snippet, size?: string, onhidden?: () => void, onshown?: () => void }} */
  let { children, size = '', onhidden, onshown } = $props();

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

    const hidden = () => onhidden?.();
    const shown = () => onshown?.();

    el.addEventListener('hidden.bs.modal', hidden);
    el.addEventListener('shown.bs.modal', shown);

    return () => {
      el.removeEventListener('hidden.bs.modal', hidden);
      el.removeEventListener('shown.bs.modal', shown);
    };
  });
</script>
