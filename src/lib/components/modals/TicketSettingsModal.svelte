<!-- What an admin decides about tickets as a whole. Opened by the gear on the Tickets page. -->
<div class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">{$_('components.modals.ticket-settings.title')}</h5>
        <button
          aria-label={$_('buttons.close')}
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          on:click={hide}></button>
      </div>
      <form on:submit|preventDefault={onSubmit}>
        <div class="modal-body">
          {#if $loading}
            <div class="d-flex justify-content-center py-3">
              <div class="spinner-border text-primary" role="status"></div>
            </div>
          {:else if $loadFailed}
            <div class="alert alert-danger mb-0" role="alert">
              {$_('components.modals.ticket-settings.load-failed')}
            </div>
          {:else}
            <div class="form-check form-switch">
              <input
                class="form-check-input"
                type="checkbox"
                role="switch"
                id="ticketAllowNoCategory"
                autocomplete="off"
                bind:checked={$settings.allowNoCategory} />
              <label class="form-check-label" for="ticketAllowNoCategory">
                {$_('components.modals.ticket-settings.allow-no-category')}
              </label>
            </div>
            <div class="form-text">
              {$_('components.modals.ticket-settings.allow-no-category-hint')}
            </div>
          {/if}
        </div>
        <div class="modal-footer">
          <button
            class="btn btn-primary w-100"
            type="submit"
            disabled={$loading || $loadFailed || saving || !changed}>
            {$_('buttons.save')}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from 'svelte/store';

  import ApiUtil from '$lib/api.util';

  const modalElement = writable();
  const settings = writable({ allowNoCategory: true });
  /** What the server holds: Save is only on when the dialog differs from it. */
  const saved = writable({ allowNoCategory: true });
  const loading = writable(true);
  const loadFailed = writable(false);

  let modal;

  export function show() {
    void loadSettings();

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: 'static',
      keyboard: false,
    });
    modal.show();
  }

  export function hide() {
    modal?.hide();
  }

  async function loadSettings() {
    loading.set(true);
    loadFailed.set(false);

    const body = await ApiUtil.get({ path: '/panel/ticket/settings' }).catch(() => null);

    if (!body || body.error) {
      loadFailed.set(true);
    } else {
      settings.set({ allowNoCategory: body.allowNoCategory !== false });
      saved.set({ ...get(settings) });
    }

    loading.set(false);
  }
</script>

<script>
  import { _ } from 'svelte-i18n';

  import {
    showError as showErrorToast,
    showSuccess as showSuccessToast,
  } from '$lib/components/ToastContainer.svelte';

  let saving = false;

  $: changed = $settings.allowNoCategory !== $saved.allowNoCategory;

  async function onSubmit() {
    if (saving || !changed) {
      return;
    }

    saving = true;

    const body = await ApiUtil.put({
      path: '/panel/ticket/settings',
      body: { allowNoCategory: get(settings).allowNoCategory },
      handler: (result) => result,
    }).catch(() => null);

    saving = false;

    if (!body || body.error) {
      void showErrorToast('components.modals.ticket-settings.save-failed');

      return;
    }

    hide();

    void showSuccessToast('components.modals.ticket-settings.saved');
  }
</script>
