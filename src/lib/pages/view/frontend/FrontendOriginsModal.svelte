<FrontendOriginModal bind:this={addModal} {controller} />

<!-- The list of websites that may access this Pano: add a site address, remove one. -->
<div hidden data-modal-host>
  <div
    class="modal fade"
    use:portal
    bind:this={element}
    role="dialog"
    tabindex="-1"
    aria-hidden="true"
    data-sites-modal>
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" role="dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{$_('pages.frontend.origins.title')}</h5>
          <button type="button" class="btn-close" aria-label={$_('buttons.close')} onclick={hide}
          ></button>
        </div>
        <div class="modal-body vstack gap-3">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              {$_('pages.frontend.origins.table-title', {
                values: { count: $items.length, max: $max },
              })}
            </div>
            <button
              type="button"
              class="btn btn-sm btn-link"
              disabled={$full}
              data-add-origin
              onclick={() => addModal?.show()}>
              <i class="fa-solid fa-plus me-1" aria-hidden="true"></i>
              {$_('pages.frontend.origins.add.button')}
            </button>
          </div>

          {#if $items.length === 0}
            <NoContent icon="" text={$_('pages.frontend.origins.empty')} />
          {:else}
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead>
                  <tr>
                    <th class="align-middle text-nowrap" scope="col"></th>
                    <th class="align-middle text-nowrap" scope="col">
                      {$_('pages.frontend.origins.table.origin')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {#each $items as origin (origin)}
                    <tr data-origin-row={origin}>
                      <th scope="row" class="align-middle text-center">
                        <div class="dropdown position-static">
                          <button
                            type="button"
                            class="btn btn-link"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            title={$_('pages.frontend.origins.actions')}
                            aria-label={$_('pages.frontend.origins.actions')}>
                            <span class="fas fa-ellipsis-v"></span>
                          </button>
                          <div class="dropdown-menu dropdown-menu-start">
                            <button
                              type="button"
                              class="dropdown-item link-danger"
                              disabled={$removing === origin}
                              onclick={() => controller.requestRemove(origin)}>
                              <i class="fas fa-trash me-2"></i>
                              {$_('pages.frontend.origins.remove.button')}
                            </button>
                          </div>
                        </div>
                      </th>
                      <td class="align-middle text-break font-monospace">{origin}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary w-100" type="button" data-sites-done onclick={hide}>
            {$_('pages.frontend.origins.done')}
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
  import { _ } from 'svelte-i18n';

  import NoContent from '$lib/components/NoContent.svelte';
  import { portal, showStacked } from '$lib/modal-stack.util.js';

  import FrontendOriginModal from './FrontendOriginModal.svelte';

  /**
   * The list editor of the "Allow other websites" switch. Closing it with no site on the list turns
   * the switch back off. All state lives in the controller.
   * @type {{ controller: ReturnType<typeof import('./origins.controller.js').createOriginsController> }}
   */
  let { controller } = $props();

  // The controller is fixed for the life of the page.
  // svelte-ignore state_referenced_locally
  const { items, max, full, removing } = controller;

  let element = $state();
  let addModal = $state();
  let modal;

  export function show() {
    modal = new window.bootstrap.Modal(element, { backdrop: 'static', keyboard: false });
    element.addEventListener('hidden.bs.modal', () => controller.editorClosed(), { once: true });
    showStacked(modal, element);
  }

  export function hide() {
    modal?.hide();
  }
</script>
