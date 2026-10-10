<FrontendKeyModal bind:this={modal} {controller} {notify} />

<div hidden data-modal-host>
  <div
    class="modal fade"
    use:portal
    bind:this={element}
    role="dialog"
    tabindex="-1"
    aria-hidden="true"
    data-keys-modal>
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl" role="dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{$_('pages.frontend.keys.title')}</h5>
          <button type="button" class="btn-close" aria-label={$_('buttons.close')} onclick={hide}
          ></button>
        </div>
        <div class="modal-body vstack gap-3">
          <div class="text-body-secondary">{$_('pages.frontend.keys.description')}</div>

          <div class="card">
            <CardHeader>
              <div slot="left">
                {$_('pages.frontend.keys.table-title', {
                  values: { count: $items.length, max: $max },
                })}
              </div>
              <button
                slot="right"
                type="button"
                class="btn btn-sm btn-link"
                disabled={$full}
                data-create-key
                onclick={() => modal?.show()}>
                <i class="fa-solid fa-plus me-1" aria-hidden="true"></i>
                {$_('pages.frontend.keys.create.button')}
              </button>
            </CardHeader>

            {#if $items.length === 0}
              <NoContent icon="" text={$_('pages.frontend.keys.empty')} />
            {:else}
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th class="align-middle text-nowrap" scope="col"></th>
                      <th class="align-middle text-nowrap" scope="col">
                        {$_('pages.frontend.keys.table.name')}
                      </th>
                      <th class="align-middle text-nowrap" scope="col">
                        {$_('pages.frontend.keys.table.key')}
                      </th>
                      <th class="align-middle text-nowrap" scope="col">
                        {$_('pages.frontend.keys.table.created')}
                      </th>
                      <th class="align-middle text-nowrap" scope="col">
                        {$_('pages.frontend.keys.table.last-used')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each $items as item (item.id)}
                      <tr data-key-row={item.id}>
                        <th scope="row" class="align-middle text-center">
                          <div class="dropdown position-static">
                            <button
                              type="button"
                              class="btn btn-link"
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                              title={$_('pages.frontend.keys.actions')}
                              aria-label={$_('pages.frontend.keys.actions')}>
                              <span class="fas fa-ellipsis-v"></span>
                            </button>
                            <div class="dropdown-menu dropdown-menu-start">
                              <button
                                type="button"
                                class="dropdown-item link-danger"
                                disabled={$revoking === item.id}
                                onclick={() => controller.requestRevoke(item)}>
                                <i class="fas fa-trash me-2"></i>
                                {$_('pages.frontend.keys.revoke.button')}
                              </button>
                            </div>
                          </div>
                        </th>
                        <td class="align-middle text-break">{item.name}</td>
                        <td class="align-middle text-nowrap font-monospace"
                          >{maskKey(item.hint)}</td>
                        <td class="align-middle text-nowrap">
                          {#if item.createdAt}
                            <DateText time={item.createdAt} fullFormat />
                          {/if}
                        </td>
                        <td class="align-middle text-nowrap">
                          {#if item.lastUsedAt}
                            <DateText time={item.lastUsedAt} fullFormat />
                          {:else}
                            <span class="text-body-secondary"
                              >{$_('pages.frontend.keys.never-used')}</span>
                          {/if}
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
  import DateText from '$lib/components/Date.svelte';
  import NoContent from '$lib/components/NoContent.svelte';

  import FrontendKeyModal from './FrontendKeyModal.svelte';
  import { maskKey } from './frontend.util.js';

  /**
   * The "Connect your own site" block of the Mode tab: the site connection keys with their last use, a
   * create dialog that shows the key once, and revoke. It is shown only while the saved mode is not
   * Theme. All state lives in the controller.
   * @type {{ controller: ReturnType<typeof import('./keys.controller.js').createKeysController>, notify?: any }}
   */
  let { controller, notify = undefined } = $props();

  // The controller is fixed for the life of the page.
  // svelte-ignore state_referenced_locally
  const { items, max, full, revoking } = controller;

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
