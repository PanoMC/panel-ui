<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered modal-sm" role="dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">{$_('components.pagination.jump-to-page')}</h5>
        <button
          type="button"
          class="btn-close"
          aria-label={$_('buttons.close')}
          onclick={hide}></button>
      </div>
      <div class="modal-body">
        <div class="mb-3">
          <label for="pageInput" class="form-label">{$_('components.pagination.enter-page-number')}</label>
          <input
            type="number"
            class="form-control"
            id="pageInput"
            bind:value={$targetPage}
            min="1"
            max={$maxPage}
            onkeydown={(e) => e.key === 'Enter' && submit()}
          />
        </div>
      </div>
      <div class="modal-footer flex-nowrap">
        <button type="button" class="btn btn-link col-6 m-0 text-decoration-none" onclick={hide}>
          {$_('buttons.cancel')}
        </button>
        <button type="button" class="btn btn-primary col-6 m-0" onclick={submit}>
          {$_('buttons.go')}
        </button>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { get, writable } from 'svelte/store';

  const modalElement = writable();
  const targetPage = writable(1);
  const maxPage = writable(1);
  let modal;
  let onConfirm;

  export function show(current, max, callback) {
    targetPage.set(current);
    maxPage.set(max);
    onConfirm = callback;

    const el = get(modalElement);
    if (!el) return;

    modal = new window.bootstrap.Modal(el);

    const onShown = () => {
      el.querySelector('input')?.focus();
      el.querySelector('input')?.select();
    };

    el.addEventListener('shown.bs.modal', onShown, { once: true });

    modal.show();
  }

  export function hide() {
    if (modal) {
      modal.hide();
    }
  }

  function submit() {
    const page = get(targetPage);
    const max = get(maxPage);
    if (page >= 1 && page <= max) {
      if (onConfirm) onConfirm(page);
      hide();
    }
  }
</script>

<script>
  import { _ } from 'svelte-i18n';
</script>
