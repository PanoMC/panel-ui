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
                      <th class="align-middle text-nowrap" scope="col">
                        {$_('pages.frontend.urls.table.target')}
                      </th>
                      <th class="align-middle text-nowrap" scope="col">
                        {$_('pages.frontend.urls.table.owner')}
                      </th>
                      <th class="align-middle text-nowrap" scope="col">
                        {$_('pages.frontend.urls.table.source')}
                      </th>
                      <th class="align-middle text-nowrap" scope="col">
                        {$_('pages.frontend.urls.table.path')}
                      </th>
                      <th class="align-middle text-nowrap" scope="col">
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
                                class="dropdown-item"
                                onclick={() => modal?.show(row)}>
                                <i class="fas fa-pen me-2"></i>
                                {$_('pages.frontend.urls.override.button')}
                              </button>
                              {#if row.override !== null}
                                <button
                                  type="button"
                                  class="dropdown-item link-danger"
                                  disabled={$saving === row.id}
                                  onclick={() => controller.removeOverride(row.id)}>
                                  <i class="fas fa-trash me-2"></i>
                                  {$_('pages.frontend.urls.override.remove')}
                                </button>
                              {/if}
                            </div>
                          </div>
                        </th>
                        <td class="align-middle text-break">
                          <span class="font-monospace">{row.id}</span>
                          {#if row.neededForServerSide}
                            <span class="badge text-bg-warning ms-2" data-needed-for-server>
                              {$_('pages.frontend.urls.needed-for-server')}
                            </span>
                          {/if}
                        </td>
                        <td class="align-middle text-nowrap">
                          {row.owner === 'core' ? $_('pages.frontend.urls.owner-core') : row.owner}
                        </td>
                        <td class="align-middle text-nowrap" data-source={row.source ?? 'NONE'}>
                          {$_(sourceKey(row.source))}
                        </td>
                        <td class="align-middle text-break font-monospace">
                          {#if row.path !== null}{row.path}{:else}<span class="text-body-secondary"
                              >-</span
                            >{/if}
                        </td>
                        <td class="align-middle text-break font-monospace">
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
        </div>
      </div>
    </div>
  </div>
</div>

<script>
  import { _ } from 'svelte-i18n';

  import { portal, showStacked } from '$lib/modal-stack.util.js';

  import CardHeader from '$lib/components/CardHeader.svelte';
  import NoContent from '$lib/components/NoContent.svelte';

  import FrontendUrlModal from './FrontendUrlModal.svelte';
  import { sourceKey } from './urls.controller.js';

  /**
   * The Link targets tab: every page the platform links to (mails, redirects, returns) with where it
   * points now, and the admin's override per row.
   * @type {{ controller: ReturnType<typeof import('./urls.controller.js').createUrlsController> }}
   */
  let { controller } = $props();

  // The controller is fixed for the life of the page.
  // svelte-ignore state_referenced_locally
  const { rows, saving } = controller;

  let element = $state();
  let modal = $state();
  let dialog;

  export function show() {
    dialog = new window.bootstrap.Modal(element, { backdrop: 'static', keyboard: false });
    showStacked(dialog, element);
  }

  export function hide() {
    dialog?.hide();
  }
</script>
