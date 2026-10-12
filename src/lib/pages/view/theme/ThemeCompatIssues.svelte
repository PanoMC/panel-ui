{#if rows.length > 0}
  <div class="alert alert-warning d-flex align-items-start mb-0" role="alert" data-compat-issues>
    <i class="fa-solid fa-triangle-exclamation me-3 mt-1" aria-hidden="true"></i>
    <div class="flex-grow-1 min-w-0">
      <h5 class="alert-heading mb-2">{$_('pages.theme-compat.title')}</h5>
      <div>{$_('pages.theme-compat.description')}</div>
    </div>
    <button
      type="button"
      class="btn alert-btn flex-shrink-0 ms-3"
      data-compat-show
      onclick={showIncompatibilities}>
      {$_('pages.theme-compat.show-incompatibilities')}
    </button>
  </div>

  <div aria-hidden="true" class="modal fade" bind:this={modalElement} role="dialog">
    <div class="modal-dialog modal-dialog-centered" role="dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{$_('pages.theme-compat.incompatibilities')}</h5>
          <button
            type="button"
            class="btn-close"
            aria-label={$_('buttons.close')}
            onclick={() => modal?.hide()}></button>
        </div>
        <div class="modal-body">
          <div class="table-responsive">
            <table class="table table-hover mb-0" data-compat-table>
              <thead>
                <tr>
                  <th class="align-middle text-nowrap" scope="col">
                    {$_('pages.theme-compat.table.addon')}
                  </th>
                  <th class="align-middle text-nowrap" scope="col">
                    {$_('pages.theme-compat.table.version')}
                  </th>
                  <th class="align-middle text-nowrap" scope="col">
                    {$_('pages.theme-compat.table.views')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {#each rows as row (row.name)}
                  <tr>
                    <td class="align-middle">{row.name ?? $_('pages.theme-compat.engine')}</td>
                    <td class="align-middle text-nowrap">{row.version ?? '-'}</td>
                    <td class="align-middle">{row.views.join(', ')}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            class="btn btn-secondary w-100 mt-3"
            data-compat-copy
            onclick={copyRows}>
            <i class="fa-solid fa-copy me-2" aria-hidden="true"></i>
            {$_('buttons.copy')}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<script>
  import { _ } from 'svelte-i18n';
  import copy from 'copy-to-clipboard';

  import {
    showError as showErrorToast,
    showSuccess as showSuccessToast,
  } from '$lib/components/ToastContainer.svelte';

  import { incompatibilities } from './compat.util.js';

  /**
   * The warning on the theme page while views of the theme are out of date for their plugin
   * (doc 01 section 7), and a dialog that lists them per plugin. Nothing is shown without one.
   * @type {{ report?: { issues: any[] } | null }}
   */
  let { report = null } = $props();

  const rows = $derived(incompatibilities(report));

  let modalElement = $state();
  let modal;

  /** The table as plain text, one line per row, to send to the theme's developer. */
  function copyRows() {
    const theme = report?.theme?.id
      ? [report.theme.id, report.theme.version].filter(Boolean).join(' ')
      : '';
    const lines = rows.map(
      (row) =>
        [row.name ?? $_('pages.theme-compat.engine'), row.version].filter(Boolean).join(' ') +
        ': ' +
        row.views.join(', '),
    );

    if (copy([theme, ...lines].filter(Boolean).join('\n'))) {
      void showSuccessToast('pages.theme-compat.copied');
    } else {
      void showErrorToast('pages.theme-compat.copy-failed');
    }
  }

  function showIncompatibilities() {
    modal = new window.bootstrap.Modal(modalElement);
    modal.show();
  }
</script>
