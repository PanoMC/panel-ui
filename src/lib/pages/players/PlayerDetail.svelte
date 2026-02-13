{#if hasPermission(Permissions.MANAGE_TICKETS)}
  <!-- Tickets -->
  <div class="card">
    <div class="card-header">
      {$_('pages.player-detail.last-tickets')}
    </div>
    {#if data.ticketCount === 0}
      <NoContent />
    {:else}
      <div class="table-responsive">
        <table class="table table-hover">
          {#each data.tickets as ticket, index (ticket)}
            <tbody>
              <tr>
                <td class="align-middle text-nowrap">
                  <code>#{ticket.id}</code>
                </td>
                <td class="align-middle text-nowrap">
                  <a href="{base}/tickets/detail/{ticket.id}" title={$_('buttons.view')}
                    >{ticket.title}</a>
                </td>
                <td class="align-middle text-nowrap">
                  <a
                    title={$_('pages.player-detail.filter')}
                    href="{base}/tickets?categoryUrl={ticket.category.url}">
                    {ticket.category.title === '-'
                      ? $_('pages.player-detail.no-category')
                      : ticket.category.title}
                  </a>
                </td>
                <td class="align-middle text-nowrap">
                  <TicketStatusBadge status={ticket.status} />
                </td>
                <td class="align-middle text-nowrap"
                  ><span><DateComponent time={ticket.lastUpdate} /></span></td>
              </tr>
            </tbody>
          {/each}
        </table>
      </div>
      <div class="card-footer">
        <!-- Pagination -->
        <Pagination
          page={data.ticketsPage}
          totalPage={data.ticketTotalPage}
          on:firstPageClick={() => onTicketsPageClick(1)}
          on:lastPageClick={() => onTicketsPageClick(data.ticketTotalPage)}
          on:pageLinkClick={(event) => onTicketsPageClick(event.detail.page)} />
      </div>
    {/if}
  </div>
{/if}

<!-- Ban History -->
<div class="card">
  <div class="card-header">
    {$_('pages.player-detail.ban-history')}
  </div>
  {#if data.banHistoryCount === 0}
    <NoContent />
  {:else}
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th class="align-middle">{$_('pages.player-detail.ban-duration')}</th>
            <th class="align-middle">{$_('pages.player-detail.ban-reason')}</th>
            <th class="align-middle text-center"
              >{$_('pages.player-detail.email-notification')}</th>
            <th class="align-middle">{$_('pages.player-detail.banned-by')}</th>
            <th class="align-middle">{$_('pages.player-detail.banned-at')}</th>
          </tr>
        </thead>
        <tbody>
          {#each data.banHistory as banHistory, index (banHistory)}
            <BanHistoryRow {banHistory} />
          {/each}
        </tbody>
      </table>
    </div>
    <div class="card-footer">
      <!-- Pagination -->
      <Pagination
        page={data.banHistoryPage}
        totalPage={data.banHistoryTotalPage}
        on:firstPageClick={() => onBanHistoryPageClick(1)}
        on:lastPageClick={() => onBanHistoryPageClick(data.banHistoryTotalPage)}
        on:pageLinkClick={(event) => onBanHistoryPageClick(event.detail.page)} />
    </div>
  {/if}
</div>

<Hook name="panel:player-detail:bottom" playerData={data} />

<script>
  import { _ } from 'svelte-i18n';

  import { goto } from '$app/navigation';
  import { base } from '$app/paths';

  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import { buildQueryParams } from '$lib/api.util';

  import TicketStatusBadge from '$lib/components/badges/TicketStatusBadge.svelte';
  import DateComponent from '$lib/components/Date.svelte';
  import Pagination from '$lib/components/Pagination.svelte';

  import NoContent from '$lib/components/NoContent.svelte';
  import BanHistoryRow from '$lib/components/rows/BanHistoryRow.svelte';
  import Hook from '$lib/components/Hook.svelte';

  let { data = $bindable() } = $props();

  async function refreshData() {
    const queryParams = buildQueryParams({
      ticketsPage: data.ticketsPage,
      banHistoryPage: data.banHistoryPage,
    });

    await goto(queryParams);
  }

  async function onTicketsPageClick(ticketsPage) {
    data.ticketsPage = ticketsPage;

    await refreshData();
  }

  async function onBanHistoryPageClick(banHistoryPage) {
    data.banHistoryPage = banHistoryPage;

    await refreshData();
  }
</script>
