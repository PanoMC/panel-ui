<FrontendUrlModal bind:this={modal} {controller} />

<div hidden data-modal-host>
  <div
    class="modal fade"
    use:portal
    bind:this={element}
    role="dialog"
    tabindex="-1"
    aria-hidden="true"
    data-urls-modal>
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl" role="dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{$_('pages.frontend.urls.title')}</h5>
          <button type="button" class="btn-close" aria-label={$_('buttons.close')} onclick={hide}
          ></button>
        </div>
        <div class="modal-body vstack gap-3">
          <div class="text-body-secondary">{$_('pages.frontend.urls.description')}</div>

          {#if loading}
            <div class="text-center py-5" data-urls-loading>
              <span class="spinner-border" aria-hidden="true"></span>
            </div>
          {:else if loadFailed}
            <div class="alert alert-danger d-flex align-items-center mb-0" role="alert">
              <i class="fa-solid fa-circle-exclamation me-3" aria-hidden="true"></i>
              <div class="flex-grow-1">{$_('pages.frontend.load-failed')}</div>
              <button
                type="button"
                title={$_('buttons.try-again')}
                aria-label={$_('buttons.try-again')}
                class="btn alert-btn ms-3"
                onclick={() => load()}>
                <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>
              </button>
            </div>
          {:else}
            <div class="card">
              <CardHeader>
                <div slot="left">
                  {$_('pages.frontend.urls.table-title', { values: { count: $rows.length } })}
                </div>
              </CardHeader>

              {#if $rows.length === 0}
                <NoContent icon="" text={$_('pages.frontend.urls.empty')} />
              {:else}
                <div class="table-responsive">
                  <table class="table table-hover">
                    <thead>
                      <tr>
                        <th class="align-middle text-nowrap" scope="col"></th>
                        <th class="align-middle text-nowrap text-capitalize" scope="col">
                          {$_('pages.frontend.urls.table.target')}
                        </th>
                        <th class="align-middle text-nowrap text-capitalize" scope="col">
                          {$_('pages.frontend.urls.table.owner')}
                        </th>
                        <th class="align-middle text-nowrap text-capitalize" scope="col">
                          {$_('pages.frontend.urls.table.source')}
                        </th>
                        <th class="align-middle text-nowrap text-capitalize" scope="col">
                          {$_('pages.frontend.urls.table.path')}
                        </th>
                        <th class="align-middle text-nowrap text-capitalize" scope="col">
                          {$_('pages.frontend.urls.table.override')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {#each $rows as row (row.id)}
                        <tr data-target-row={row.id}>
                          <th scope="row" class="align-middle text-center">
                            <div class="dropdown position-static">
                              <button
                                type="button"
                                class="btn btn-link"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                                title={$_('pages.frontend.urls.actions')}
                                aria-label={$_('pages.frontend.urls.actions')}>
                                <span class="fas fa-ellipsis-v"></span>
                              </button>
                              <div class="dropdown-menu dropdown-menu-start">
                                <button
                                  type="button"
                                  class="dropdown-item text-capitalize"
                                  onclick={() => modal?.show(row)}>
                                  <i class="fas fa-pen me-2"></i>
                                  {$_('pages.frontend.urls.override.button')}
                                </button>
                                {#if row.override !== null}
                                  <button
                                    type="button"
                                    class="dropdown-item link-danger text-capitalize"
                                    disabled={$saving === row.id}
                                    onclick={() => controller.removeOverride(row.id)}>
                                    <i class="fas fa-trash me-2"></i>
                                    {$_('pages.frontend.urls.override.remove')}
                                  </button>
                                {/if}
                              </div>
                            </div>
                          </th>
                          <td class="align-middle text-nowrap">
                            <span class="font-monospace">{row.id}</span>
                            {#if row.neededForServerSide}
                              <span class="badge text-bg-warning ms-2" data-needed-for-server>
                                {$_('pages.frontend.urls.needed-for-server')}
                              </span>
                            {/if}
                          </td>
                          <td class="align-middle text-nowrap">
                            {row.owner === 'core'
                              ? $_('pages.frontend.urls.owner-core')
                              : row.owner}
                          </td>
                          <td class="align-middle text-nowrap" data-source={row.source ?? 'NONE'}>
                            {$_(sourceKey(row.source))}
                          </td>
                          <td class="align-middle text-nowrap font-monospace">
                            {#if row.path !== null}{row.path}{:else}<span
                                class="text-body-secondary">-</span
                              >{/if}
                          </td>
                          <td class="align-middle text-nowrap font-monospace">
                            {#if row.override !== null}{row.override}{:else}<span
                                class="text-body-secondary">-</span
                              >{/if}
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

<script>
  import { writable } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import ApiUtil from '$lib/api.util';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';
  import { portal, showStacked } from '$lib/modal-stack.util.js';

  import CardHeader from '$lib/components/CardHeader.svelte';
  import NoContent from '$lib/components/NoContent.svelte';

  import FrontendUrlModal from './FrontendUrlModal.svelte';
  import { createFrontendApi } from './frontend.api.js';
  import { createUrlsController, sourceKey } from './urls.controller.js';

  /**
   * The Link targets modal: every page the platform links to (mails, redirects, returns) with where it
   * points now, and the admin's override per row.
   * @type {{ controller?: ReturnType<typeof import('./urls.controller.js').createUrlsController>, api?: ReturnType<typeof createFrontendApi>, notify?: { success: (key: string, values?: object) => any, error: (key: string, values?: object) => any } }}
   */
  let {
    controller: providedController = undefined,
    api = createFrontendApi(ApiUtil),
    notify = {
      success: (key, values) => showSuccess(key, values),
      error: (key, values) => showError(key, values),
    },
  } = $props();

  const hasKey = writable(false);
  const controller =
    providedController ?? createUrlsController({ api, notify, initial: {}, hasKey });

  // The controller is fixed for the life of the page.
  // svelte-ignore state_referenced_locally
  const { rows, saving } = controller;

  let element = $state();
  let modal = $state();
  let dialog;
  let loading = $state(false);
  let loadFailed = $state(false);

  async function load() {
    loading = true;
    loadFailed = false;

    try {
      if (!(await controller.refresh())) {
        loadFailed = true;

        return false;
      }

      const keys = await api.listKeys();

      if (keys.ok) {
        hasKey.set(keys.body?.items?.length > 0);
      } else {
        const { key, values } = describeError(keys.error);

        notify.error(key, values);
        hasKey.set(false);
      }

      return true;
    } finally {
      loading = false;
    }
  }

  export function show() {
    if (!element || !window.bootstrap?.Modal || element.classList.contains('show') || loading)
      return;
    dialog = new window.bootstrap.Modal(element, { backdrop: 'static', keyboard: false });
    showStacked(dialog, element);

    if (!providedController) void load();
  }

  export function hide() {
    dialog?.hide();
  }
</script>
