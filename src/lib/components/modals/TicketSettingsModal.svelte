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
            <!-- The ready reply of tickets opened without a category; off while such tickets are not
                 allowed. None chosen, the default auto-reply below is sent. -->
            <label class="form-label mt-3 mb-1" for="ticketNoCategoryAutoReply">
              {$_('components.modals.ticket-settings.no-category-auto-reply')}
            </label>
            <select
              class="form-select"
              id="ticketNoCategoryAutoReply"
              disabled={!$settings.allowNoCategory}
              value={$settings.noCategoryAutoReplyTemplateId}
              on:change={(event) =>
                ($settings.noCategoryAutoReplyTemplateId = Number(event.currentTarget.value))}>
              <option value={-1}
                >{$_('components.modals.ticket-settings.use-default-auto-reply')}</option>
              {#each $templates as template (template.id)}
                <option value={template.id}>{template.title}</option>
              {/each}
            </select>
            <!-- The ready reply sent by itself to every new ticket; a category with its own auto-reply
                 sends that one instead. -->
            <label class="form-label mt-3 mb-1" for="ticketDefaultAutoReply">
              {$_('components.modals.ticket-settings.default-auto-reply')}
            </label>
            <select
              class="form-select"
              id="ticketDefaultAutoReply"
              value={$settings.defaultAutoReplyTemplateId}
              on:change={(event) =>
                ($settings.defaultAutoReplyTemplateId = Number(event.currentTarget.value))}>
              <option value={-1}>{$_('components.modals.ticket-settings.no-auto-reply')}</option>
              {#each $templates as template (template.id)}
                <option value={template.id}>{template.title}</option>
              {/each}
            </select>
            <div class="form-text">
              {$_('components.modals.ticket-settings.default-auto-reply-hint')}
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
  import { loadAllTicketTemplates } from '$lib/ticketTemplates.util.js';

  const modalElement = writable();
  const settings = writable({
    allowNoCategory: true,
    defaultAutoReplyTemplateId: -1,
    noCategoryAutoReplyTemplateId: -1,
  });
  /** What the server holds: Save is only on when the dialog differs from it. */
  const saved = writable({
    allowNoCategory: true,
    defaultAutoReplyTemplateId: -1,
    noCategoryAutoReplyTemplateId: -1,
  });
  /** The ready replies new tickets may get as their auto-reply. */
  const templates = writable([]);
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

    const [body, templateItems] = await Promise.all([
      ApiUtil.get({ path: '/panel/ticket/settings' }).catch(() => null),
      loadAllTicketTemplates(),
    ]);

    templates.set(templateItems);

    if (!body || body.error) {
      loadFailed.set(true);
    } else {
      settings.set({
        allowNoCategory: body.allowNoCategory !== false,
        defaultAutoReplyTemplateId: body.defaultAutoReplyTemplateId ?? -1,
        noCategoryAutoReplyTemplateId: body.noCategoryAutoReplyTemplateId ?? -1,
      });
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

  $: changed =
    $settings.allowNoCategory !== $saved.allowNoCategory ||
    $settings.defaultAutoReplyTemplateId !== $saved.defaultAutoReplyTemplateId ||
    $settings.noCategoryAutoReplyTemplateId !== $saved.noCategoryAutoReplyTemplateId;

  async function onSubmit() {
    if (saving || !changed) {
      return;
    }

    saving = true;

    const body = await ApiUtil.put({
      path: '/panel/ticket/settings',
      body: {
        allowNoCategory: get(settings).allowNoCategory,
        defaultAutoReplyTemplateId: get(settings).defaultAutoReplyTemplateId,
        noCategoryAutoReplyTemplateId: get(settings).noCategoryAutoReplyTemplateId,
      },
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
