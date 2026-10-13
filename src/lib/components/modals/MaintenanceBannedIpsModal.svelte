<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" role="dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">
          {$_('pages.settings.platform.maintenance.banned-ips.title')}
          {#if $count > 0}
            <span class="badge text-bg-danger ms-2">{$count}</span>
          {/if}
        </h5>
        <button
          aria-label={$_('buttons.close')}
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          onclick={hide}></button>
      </div>
      <div class="modal-body">
        {#if $loading}
          <div class="text-center py-5">
            <span class="spinner-border text-primary" role="status"></span>
          </div>
        {:else if $rows.length === 0}
          <NoContent
            icon="fa-solid fa-shield-halved fa-3x"
            text={$_('pages.settings.platform.maintenance.banned-ips.empty')} />
        {:else}
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th class="align-middle" scope="col"></th>
                  <th class="align-middle text-nowrap" scope="col"
                    >{$_('pages.settings.platform.maintenance.banned-ips.ip')}</th>
                  <th class="align-middle text-nowrap" scope="col"
                    >{$_('pages.settings.platform.maintenance.banned-ips.socket-peer')}</th>
                  <th class="align-middle text-nowrap" scope="col"
                    >{$_('pages.settings.platform.maintenance.banned-ips.attempts')}</th>
                  <th class="align-middle text-nowrap" scope="col"
                    >{$_('pages.settings.platform.maintenance.banned-ips.username-tried')}</th>
                  <th class="align-middle text-nowrap" scope="col"
                    >{$_('pages.settings.platform.maintenance.banned-ips.banned-at')}</th>
                </tr>
              </thead>
              <tbody>
                {#each $rows as bannedIp (bannedIp.ip)}
                  <tr>
                    <th scope="row" class="align-middle text-center">
                      <div class="dropdown position-static">
                        <button
                          type="button"
                          class="btn btn-link"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                          title={$_('pages.servers.nodes.column-actions')}
                          aria-label={$_('pages.servers.nodes.column-actions')}>
                          <span class="fas fa-ellipsis-v"></span>
                        </button>
                        <div class="dropdown-menu dropdown-menu-start">
                          <button
                            type="button"
                            class="dropdown-item link-danger text-capitalize"
                            disabled={$actionLoading}
                            onclick={() => onRemoveClick(bannedIp)}>
                            <i class="fas fa-trash me-2"></i>
                            {$_('pages.settings.platform.maintenance.banned-ips.remove')}
                          </button>
                        </div>
                      </div>
                    </th>
                    <td class="align-middle">
                      <code class="user-select-all">{bannedIp.ip}</code>
                    </td>
                    <td class="align-middle font-monospace small opacity-75">
                      {bannedIp.socketPeer || '-'}
                    </td>
                    <td class="align-middle text-nowrap">{bannedIp.attempts ?? '-'}</td>
                    <td class="align-middle">{bannedIp.lastUsernameTried || '-'}</td>
                    <td class="align-middle text-nowrap">
                      {#if bannedIp.bannedAt}
                        <DateComponent time={bannedIp.bannedAt} fullFormat />
                      {:else}
                        -
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

          {#if Number($page?.totalItems) > 0}
            <div class="mt-3">
              <Pagination
                page={$page}
                on:firstPageClick={() => load(1)}
                on:lastPageClick={() => load(pageCount($page))}
                on:pageLinkClick={(event) => load(event.detail.page)} />
            </div>
          {/if}
        {/if}
      </div>
      <div class="modal-footer">
        <button
          class="btn btn-danger w-100"
          type="button"
          disabled={$actionLoading || $rows.length === 0}
          onclick={onClearAllClick}>
          {#if $actionLoading}
            <span class="spinner-border spinner-border-sm me-1" role="status"></span>
          {/if}
          {$_('pages.settings.platform.maintenance.banned-ips.clear-all')}
        </button>
      </div>
    </div>
  </div>
</div>

<svelte:options runes={true} />

<script module>
  import { get, writable } from 'svelte/store';

  import ApiUtil, { buildQueryParams } from '$lib/api.util.js';
  import { show as showConfirmActionModal } from '$lib/components/modals/ConfirmActionModal.svelte';
  import { showSuccess as showSuccessToast } from '$lib/components/ToastContainer.svelte';
  import { pageCount, pageNumber } from '$lib/components/pagination.util.js';

  const modalElement = writable();
  const rows = writable([]);
  const count = writable(0);
  /** The page object of the list shown (`{ number, size, totalItems }` and more). */
  const page = writable({ number: 1 });
  const loading = writable(false);
  const actionLoading = writable(false);

  let modal;
  /** @type {(count: number) => void} */
  let onCountChange = () => {};

  /**
   * @param {number} initialCount badge value to show until the first page arrives
   * @param {(count: number) => void} [countCallback] called whenever the server count changes
   */
  export function show(initialCount = 0, countCallback) {
    const element = get(modalElement);

    if (!element) {
      console.error('MaintenanceBannedIpsModal is not mounted');

      return;
    }

    onCountChange = typeof countCallback === 'function' ? countCallback : () => {};

    count.set(initialCount || 0);
    rows.set([]);
    page.set({ number: 1 });
    actionLoading.set(false);

    modal = new window.bootstrap.Modal(element, { backdrop: 'static', keyboard: true });
    modal.show();

    load(1);
  }

  export function hide() {
    modal?.hide();
  }

  function setCount(value) {
    count.set(value);
    onCountChange(value);
  }

  function load(nextPage = pageNumber(get(page))) {
    loading.set(true);
    page.update((current) => ({ ...current, number: nextPage }));

    ApiUtil.get({
      path: '/panel/maintenance/banned-ips' + buildQueryParams({ page: nextPage }),
      handler: async (body, reject) => {
        if (body.error) {
          loading.set(false);
          reject();

          return;
        }

        const list = body.items || [];

        rows.set(list);
        page.set(body.page ?? { number: nextPage });
        loading.set(false);
        setCount(body.page?.totalItems ?? list.length);
      },
    });
  }

  function removeIps(ips) {
    actionLoading.set(true);

    ApiUtil.post({
      path: '/panel/maintenance/banned-ips/remove',
      body: { ips },
      handler: async (body, reject) => {
        actionLoading.set(false);

        if (body.error) {
          reject();

          return;
        }

        await showSuccessToast('components.toasts.maintenance-ban-removed');

        // Emptying the last page would otherwise leave the list on a page that no longer exists.
        const current = pageNumber(get(page));
        const nextPage = get(rows).length === ips.length && current > 1 ? current - 1 : current;

        load(nextPage);
      },
    });
  }

  function onRemoveClick(bannedIp) {
    showConfirmActionModal(
      {
        title: 'pages.settings.platform.maintenance.banned-ips.remove-title',
        description: 'pages.settings.platform.maintenance.banned-ips.remove-description',
        confirmLabel: 'buttons.remove-ban',
        variant: 'primary',
      },
      () => removeIps([bannedIp.ip]),
      { ip: bannedIp.ip },
    );
  }

  function onClearAllClick() {
    showConfirmActionModal(
      {
        title: 'pages.settings.platform.maintenance.banned-ips.clear-all-title',
        description: 'pages.settings.platform.maintenance.banned-ips.clear-all-description',
        confirmLabel: 'pages.settings.platform.maintenance.banned-ips.clear-all',
        variant: 'primary',
      },
      () => {
        actionLoading.set(true);

        ApiUtil.post({
          path: '/panel/maintenance/banned-ips/clear',
          body: {},
          handler: async (body, reject) => {
            actionLoading.set(false);

            if (body.error) {
              reject();

              return;
            }

            rows.set([]);
            page.set({ number: 1 });
            setCount(0);

            await showSuccessToast('components.toasts.maintenance-ban-removed');
          },
        });
      },
    );
  }
</script>

<script>
  import { _ } from 'svelte-i18n';

  import DateComponent from '$lib/components/Date.svelte';
  import NoContent from '$lib/components/NoContent.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
</script>
