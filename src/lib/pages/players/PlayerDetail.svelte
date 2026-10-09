{#if $usageMode !== UsageModes.SERVERS && hasPermission(Permissions.MANAGE_TICKETS)}
  <!-- Tickets (a website feature: none in SERVERS mode) -->
  <div class="card">
    <div class="card-header">
      {$_('pages.player-detail.last-tickets')}
    </div>
    {#if data.tickets.page.totalItems === 0}
      <NoContent />
    {:else}
      <div class="table-responsive">
        <table class="table table-hover">
          {#each data.tickets.items as ticket, index (ticket)}
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
          page={data.tickets.page}
          on:firstPageClick={() => onTicketsPageClick(1)}
          on:lastPageClick={() => onTicketsPageClick(pageCount(data.tickets.page))}
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
  {#if data.banHistory.page.totalItems === 0}
    <NoContent />
  {:else}
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th class="align-middle">{$_('pages.player-detail.ban-duration')}</th>
            <th class="align-middle">{$_('pages.player-detail.ban-reason')}</th>
            <th class="align-middle text-center">{$_('pages.player-detail.email-notification')}</th>
            <th class="align-middle">{$_('pages.player-detail.banned-by')}</th>
            <th class="align-middle">{$_('pages.player-detail.ban-source')}</th>
            <th class="align-middle">{$_('pages.player-detail.banned-at')}</th>
          </tr>
        </thead>
        <tbody>
          {#each data.banHistory.items as banHistory, index (banHistory)}
            <BanHistoryRow {banHistory} />
          {/each}
        </tbody>
      </table>
    </div>
    <div class="card-footer">
      <!-- Pagination -->
      <Pagination
        page={data.banHistory.page}
        on:firstPageClick={() => onBanHistoryPageClick(1)}
        on:lastPageClick={() => onBanHistoryPageClick(pageCount(data.banHistory.page))}
        on:pageLinkClick={(event) => onBanHistoryPageClick(event.detail.page)} />
    </div>
  {/if}
</div>

<Hook name="panel:player-detail:bottom" playerData={data} />

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { goto } from '$app/navigation';
  import { base } from '$app/paths';

  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import { buildQueryParams } from '$lib/api.util';
  import { UsageModes } from '$lib/navigation.util.js';

  import TicketStatusBadge from '$lib/components/badges/TicketStatusBadge.svelte';
  import DateComponent from '$lib/components/Date.svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import { pageCount } from '$lib/components/pagination.util.js';

  import NoContent from '$lib/components/NoContent.svelte';
  import BanHistoryRow from '$lib/components/rows/BanHistoryRow.svelte';
  import Hook from '$lib/components/Hook.svelte';

  let { data = $bindable() } = $props();

  const usageMode = getContext('usageMode');

  async function refreshData(ticketsPage, banHistoryPage) {
    const queryParams = buildQueryParams({
      ticketsPage,
      banHistoryPage,
    });

    await goto(queryParams);
  }

  async function onTicketsPageClick(ticketsPage) {
    await refreshData(ticketsPage, data.banHistory.page.number);
  }

  async function onBanHistoryPageClick(banHistoryPage) {
    await refreshData(data.tickets?.page.number, banHistoryPage);
  }
</script>
