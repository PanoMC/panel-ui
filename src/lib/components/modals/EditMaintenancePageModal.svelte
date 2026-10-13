<style>
  .maintenance-source {
    min-height: 260px;
    height: 34vh;
    tab-size: 2;
    white-space: pre;
    overflow-wrap: normal;
    overflow-x: auto;
  }

  .maintenance-preview {
    position: relative;
    height: 34vh;
    min-height: 260px;
    overflow: hidden;
    border-radius: var(--bs-border-radius);
    border: 1px solid var(--bs-border-color);
  }

  .maintenance-preview iframe {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
    background: #fff;
  }

  .maintenance-preview-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(var(--bs-body-bg-rgb), 0.65);
  }
</style>

<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" role="dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">
          {$_('pages.settings.platform.maintenance.modal.title')}
        </h5>
        <button
          aria-label={$_('buttons.close')}
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          onclick={hide}></button>
      </div>
      <form
        onsubmit={(event) => {
          event.preventDefault();
          apply();
        }}>
        <div class="modal-body">
          <ul class="nav nav-pills mb-3 flex-wrap">
            {#each TABS as tab (tab.key)}
              <li class="nav-item">
                <button
                  type="button"
                  class="nav-link"
                  class:active={$activeTab === tab.key}
                  onclick={() => activeTab.set(tab.key)}>
                  {$_(tab.label)}
                </button>
              </li>
            {/each}
            <!-- Only while a block differs from the design Pano ships. It changes the drafts only:
                 nothing is written until "Save". -->
            {#if $changedFromDefault}
              <li class="nav-item ms-auto">
                <button
                  type="button"
                  class="btn btn-link text-body text-decoration-none"
                  title={$_('pages.settings.platform.maintenance.modal.reset-page')}
                  aria-label={$_('pages.settings.platform.maintenance.modal.reset-page')}
                  disabled={$busy}
                  data-maintenance-reset
                  onclick={onResetClick}>
                  <i class="fa-regular fa-arrow-rotate-left" aria-hidden="true"></i>
                </button>
              </li>
            {/if}
          </ul>

          <textarea
            id="maintenanceSource"
            placeholder={$_('pages.settings.platform.maintenance.modal.source')}
            aria-label={$_('pages.settings.platform.maintenance.modal.source')}
            class="form-control font-monospace maintenance-source"
            spellcheck="false"
            autocomplete="off"
            autocapitalize="off"
            autocorrect="off"
            value={$templates[$activeTab] || ''}
            oninput={onSourceInput}></textarea>

          <div class="maintenance-preview mt-3">
            <!-- Rendered by the backend from these drafts, so the pane cannot drift from what
               visitors get. sandbox keeps the admin's own markup and CSS inert. -->
            <iframe
              title={$_('pages.settings.platform.maintenance.modal.preview')}
              sandbox=""
              srcdoc={$previewHtml}></iframe>

            {#if $previewLoading}
              <div class="maintenance-preview-overlay">
                <span class="spinner-border text-primary" role="status"></span>
              </div>
            {/if}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary w-100" type="submit" disabled={$busy}>
            {#if $busy}
              <span class="spinner-border spinner-border-sm me-1" role="status"></span>
            {/if}
            {$_('buttons.save')}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<svelte:options runes={true} />

<script module>
  import { derived, get, writable } from 'svelte/store';

  import ApiUtil from '$lib/api.util.js';
  import {
    showError as showErrorToast,
    showSuccess as showSuccessToast,
  } from '$lib/components/ToastContainer.svelte';

  /**
   * One tab per editable block. The keys are the backend's `PageTemplate` enum names, so the tab
   * list and the wire format cannot drift apart.
   */
  const TABS = [
    {
      key: 'PAGE',
      label: 'pages.settings.platform.maintenance.modal.tab-page',
      hint: 'pages.settings.platform.maintenance.modal.hint-page',
    },
    {
      key: 'LOGIN_FORM',
      label: 'pages.settings.platform.maintenance.modal.tab-login-form',
      hint: 'pages.settings.platform.maintenance.modal.hint-login-form',
    },
    {
      key: 'LOGIN_BUTTON',
      label: 'pages.settings.platform.maintenance.modal.tab-login-button',
      hint: 'pages.settings.platform.maintenance.modal.hint-login-button',
    },
    {
      key: 'SKIP',
      label: 'pages.settings.platform.maintenance.modal.tab-skip',
      hint: 'pages.settings.platform.maintenance.modal.hint-skip',
    },
    {
      key: 'NOTICE',
      label: 'pages.settings.platform.maintenance.modal.tab-notice',
      hint: 'pages.settings.platform.maintenance.modal.hint-notice',
    },
  ];

  /** Long enough that a burst of typing is one render, short enough to feel live. */
  const PREVIEW_DEBOUNCE_MS = 400;

  const modalElement = writable();
  const templates = writable({});
  /** Every block as Pano ships it (`defaults` of the page read); empty when the server does not say. */
  const defaults = writable({});
  /** True while a draft differs from its default: only then is there something to reset. */
  const changedFromDefault = derived([templates, defaults], ([$templates, $defaults]) =>
    Object.keys($defaults).some(
      (key) => $templates[key] !== undefined && $templates[key] !== $defaults[key],
    ),
  );
  const activeTab = writable(TABS[0].key);
  const previewHtml = writable('');
  const previewLoading = writable(false);
  const busy = writable(false);

  let modal;
  /** Guards the preview effect: the component is mounted on every page load, the modal is not. */
  let opened = false;
  /** Only affects the preview; the real page reads it from the settings card. */
  let showSiteLogo = true;

  export function show(current) {
    const element = get(modalElement);

    if (!element) {
      console.error('EditMaintenancePageModal is not mounted');

      return;
    }

    showSiteLogo = current?.showSiteLogo !== false;

    templates.set({});
    defaults.set({});
    previewHtml.set('');
    activeTab.set(TABS[0].key);
    busy.set(false);

    modal = new window.bootstrap.Modal(element, { backdrop: 'static', keyboard: true });
    modal.show();

    opened = true;

    load();
  }

  export function hide() {
    opened = false;

    modal?.hide();
  }

  function load() {
    previewLoading.set(true);

    ApiUtil.get({
      path: '/panel/maintenance/page',
      handler: async (body, reject) => {
        if (body.error) {
          previewLoading.set(false);
          reject();

          return;
        }

        templates.set(body.templates || {});
        defaults.set(body.defaults || {});

        refreshPreview(get(templates));
      },
    });
  }

  function onSourceInput(event) {
    const value = event.currentTarget.value;

    templates.update((current) => ({ ...current, [get(activeTab)]: value }));
  }

  /**
   * Rendered server-side in the page state the open tab's block actually appears in — the login
   * form tab shows the login page, the skip tab shows what a bypasser sees.
   */
  function refreshPreview(drafts) {
    previewLoading.set(true);

    ApiUtil.post({
      path: '/panel/maintenance/preview',
      body: { templates: drafts ?? get(templates), showSiteLogo, focus: get(activeTab) },
      handler: async (body, reject) => {
        previewLoading.set(false);

        if (body.error) {
          reject();

          return;
        }

        previewHtml.set(body.html || '');
      },
    });
  }

  function apply() {
    busy.set(true);

    ApiUtil.post({
      path: '/panel/maintenance/page',
      body: { templates: get(templates) },
      handler: async (body, reject) => {
        busy.set(false);

        if (body.error) {
          if (body.error?.code === 'BAD_REQUEST') {
            await showErrorToast('errors.BAD_REQUEST');

            return;
          }

          reject();

          return;
        }

        hide();

        await showSuccessToast('components.toasts.maintenance-save-success');
      },
    });
  }

  /** Puts the shipped design back into the drafts; "Save" writes it like any other edit. */
  function onResetClick() {
    templates.update((current) => ({ ...current, ...get(defaults) }));
  }
</script>

<script>
  import { _ } from 'svelte-i18n';

  // Keeps the pane on the current drafts and the open tab. Debounced because every render is a
  // request; switching tabs re-renders too, since the tab decides which page state is simulated.
  $effect(() => {
    const drafts = $templates;

    // Read so a tab switch re-runs this.
    void $activeTab;

    if (!opened || Object.keys(drafts).length === 0) {
      return;
    }

    const timer = setTimeout(() => refreshPreview(drafts), PREVIEW_DEBOUNCE_MS);

    // Another keystroke, or closing the modal, cancels the pending render.
    return () => clearTimeout(timer);
  });
</script>
