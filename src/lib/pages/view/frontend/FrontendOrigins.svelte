<FrontendOriginModal bind:this={modal} {controller} />

<div class="vstack gap-3">
  <div class="alert alert-info d-flex align-items-start mb-0" role="alert">
    <i class="fa-solid fa-circle-info me-3 mt-1" aria-hidden="true"></i>
    <div>{$_('pages.frontend.origins.description')}</div>
  </div>

  <div class="card">
    <CardHeader>
      <div slot="left">
        {$_('pages.frontend.origins.table-title', { values: { count: $items.length, max: $max } })}
      </div>
      <button
        slot="right"
        type="button"
        class="btn btn-sm btn-link"
        disabled={$full}
        data-add-origin
        onclick={() => modal?.show()}>
        <i class="fa-solid fa-plus me-1" aria-hidden="true"></i>
        {$_('pages.frontend.origins.add.button')}
      </button>
    </CardHeader>

    {#if $items.length === 0}
      <NoContent icon="" text={$_('pages.frontend.origins.empty')} />
    {:else}
      <div class="table-responsive">
        <table class="table table-hover">
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
</div>

<script>
  import { _ } from 'svelte-i18n';

  import CardHeader from '$lib/components/CardHeader.svelte';
  import NoContent from '$lib/components/NoContent.svelte';

  import FrontendOriginModal from './FrontendOriginModal.svelte';

  /**
   * The Allowed origins tab: the browser origins that may call the API with a visitor's cookie, an add
   * dialog and remove. All state lives in the controller.
   * @type {{ controller: ReturnType<typeof import('./origins.controller.js').createOriginsController> }}
   */
  let { controller } = $props();

  // The controller is fixed for the life of the page.
  // svelte-ignore state_referenced_locally
  const { items, max, full, removing } = controller;

  let modal = $state();
</script>
