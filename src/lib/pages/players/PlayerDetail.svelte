<div class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions middleClasses="d-lg-flex d-none">
    <!-- Submenu -->
    <a slot="left" class="btn btn-link" role="button" href="{base}/players">
      <i class="fas fa-arrow-left"></i>
      <span class="d-lg-inline d-none ms-2">{$_('buttons.players')}</span>
    </a>

    <div slot="right" class="hstack gap-2">
      {#if hasPermission(Permissions.MANAGE_PLAYERS)}
        <button
          aria-label={$_('buttons.delete')}
          title={$_('buttons.delete')}
          class="btn btn-link"
          use:tooltip={[$_('buttons.delete'), { placement: 'bottom' }]}
          on:click={() => showConfirmDeletePlayerModal(data.player)}
          class:disabled={$user.username === data.player.username ||
            (data.player.permissionGroup === 'admin' && !$user.admin)}>
          <i class="fas fa-trash"></i>
        </button>
        {#if data.player.isBanned}
          <button
            aria-label={$_('pages.player-detail.un-ban')}
            title={$_('pages.player-detail.un-ban')}
            class="btn btn-link"
            use:tooltip={[$_('pages.player-detail.un-ban'), { placement: 'bottom' }]}
            on:click={() => showUnbanPlayerModal(data.player)}
            class:disabled={$user.username === data.player.username ||
              (data.player.permissionGroup === 'admin' && !$user.admin)}>
            <i class="fas fa-gavel"></i>
          </button>
        {:else}
          <button
            <button
            aria-label={$_('pages.player-detail.un-ban')}
            title={$_('pages.player-detail.un-ban')}
            class="btn btn-link"
            on:click={() => showConfirmBanPlayerModal(data.player)}
            class:disabled={$user.username === data.player.username ||
              (data.player.permissionGroup === 'admin' && !$user.admin)}>
            <i class="fas fa-gavel"></i>
          </button>
        {/if}
        {#if !data.player.isEmailVerified}
          <button
            aria-label={$_('pages.player-detail.send-verification-mail')}
            title={$_('pages.player-detail.send-verification-mail')}
            class="btn btn-link"
            on:click={sendVerification}
            class:disabled={sendingVerificationMail ||
              $user.username === data.player.username ||
              (data.player.permissionGroup === 'admin' && !$user.admin) ||
              !$siteInfo.emailEnabled}>
            <i class="fas fa-envelope"></i>
            {#if sendingVerificationMail}
              <span class="spinner-border spinner-border-sm ms-2" role="status" aria-hidden="true"
              ></span>
            {/if}
          </button>
        {/if}

        <a
          href="{base}/permissions"
          aria-label={$_('pages.player-detail.authorize')}
          title={$_('pages.player-detail.authorize')}
          class="btn btn-link"
          class:disabled={$user.username === data.player.username ||
            (data.player.permissionGroup === 'admin' && !$user.admin)}>
          <i class="fas fa-user-circle"></i>
        </a>
      {/if}
      {#if hasPermission(Permissions.MANAGE_PLAYERS) || $user.username === data.player.username}
        <button
          class="btn btn-secondary"
          on:click={() => showEditPlayerModal(data.player)}
          class:disabled={data.player.permissionGroup === 'admin' && !$user.admin}>
          <i class="fas fa-pencil-alt"></i>
          <span class="d-lg-inline d-none ms-2"> {$_('buttons.edit')}</span>
        </button>
      {/if}
    </div>
  </PageActions>

  <div class="row g-3">
    <div class="col-lg-3">
      <div class="card h-100">
        <div class="card-header">
          {data.player.username}
        </div>
        <div
          class="card-body d-flex flex-column
          align-items-center vstack gap-3">
          <img
            alt={data.player.username}
            class="img-thumbnail rounded animate__animated animate__zoomIn"
            width="128"
            height="128"
            class:border={isOnline || data.player.isBanned}
            class:border-3={isOnline || data.player.isBanned}
            class:border-success={!data.player.isBanned && isOnline}
            class:border-danger={data.player.isBanned}
            src="https://minotar.net/avatar/{data.player.username}"
            use:tooltip={!data.player.isBanned && [
              isOnline
                ? $_('pages.player-detail.online-text', {
                    values: {
                      whereOnline: data.player.inGame
                        ? $_('pages.player-detail.in-game')
                        : $_('pages.player-detail.in-website'),
                    },
                  })
                : getOfflineRelativeDateText(checkTime, locales[$currentLanguage.dateFnsCode]),
              { placement: 'bottom' },
            ]} />

          {#if data.player.isBanned}
            <div class="badge text-bg-danger">
              {$_('pages.player-detail.banned')}
            </div>
          {:else}
            <PlayerPermissionBadge permissionGroup={data.player.permissionGroup} />
          {/if}
        </div>
        <table class="table">
          <tbody>
            <tr>
              <td>{$_('pages.player-detail.email')}</td>
              <td>
                {#if data.player.isEmailVerified}
                  {$_('pages.player-detail.email-verified')}
                {:else}
                  {$_('pages.player-detail.email-not-verified')}
                {/if}
              </td>
            </tr>
            <tr>
              <td>{$_('pages.player-detail.last-entrance')}</td>
              <td><DateComponent time={data.player.lastLoginDate} /></td>
            </tr>
            <tr>
              <td>{$_('pages.player-detail.register-date')}</td>
              <td><DateComponent time={data.player.registerDate} /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="col-lg-9 vstack gap-3">
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
    </div>
  </div>
</div>

<script context="module">
  import ApiUtil, { buildQueryParams } from '$lib/api.util';
  import { error } from '@sveltejs/kit';

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const {
      parent,
      url: { searchParams },
    } = event;
    await parent();

    const username = event.params.username;
    const ticketsPage = searchParams.get('ticketsPage') || 1;
    const banHistoryPage = searchParams.get('banHistoryPage') || 1;

    const queryParams = buildQueryParams({
      ticketsPage,
      banHistoryPage,
    });

    const body = await ApiUtil.get({
      path: `/api/panel/players/${username}` + queryParams,
      request: event,
    });

    if (body.error) {
      if (body.error === 'NOT_EXISTS' || body.error === 'PAGE_NOT_FOUND') {
        throw error(404, body.error);
      }

      throw error(500, body.error);
    }

    body.username = username;
    body.ticketsPage = parseInt(ticketsPage);
    body.banHistoryPage = parseInt(banHistoryPage);

    return body;
  }
</script>

<script>
  import { formatRelative } from 'date-fns';
  import { getContext, onDestroy, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import * as locales from 'date-fns/locale';

  import { goto, invalidate } from '$app/navigation';
  import { base } from '$app/paths';

  import tooltip from '$lib/tooltip.util';
  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import { currentLanguage } from '$lib/language.util.js';

  import {
    show as showEditPlayerModal,
    setCallback as setEditPlayerModalCallback,
  } from '$lib/component/modals/EditPlayerModal.svelte';
  import {
    show as showConfirmBanPlayerModal,
    setCallback as setConfirmBanPlayerModalCallback,
  } from '$lib/component/modals/ConfirmBanPlayerModal.svelte';
  import {
    show as showUnbanPlayerModal,
    setCallback as setUnbanPlayerModalCallback,
  } from '$lib/component/modals/UnbanPlayerModal.svelte';
  import { show as showConfirmDeletePlayerModal } from '$lib/component/modals/ConfirmDeletePlayerModal.svelte';

  import TicketStatusBadge from '$lib/component/badges/TicketStatusBadge.svelte';
  import DateComponent from '$lib/component/Date.svelte';
  import Pagination from '$lib/component/Pagination.svelte';
  import { show as showToast } from '$lib/component/ToastContainer.svelte';

  import NoContent from '$lib/component/NoContent.svelte';
  import PlayerPermissionBadge from '$lib/component/badges/PlayerPermissionBadge.svelte';
  import PageActions from '$lib/component/PageActions.svelte';
  import BanHistoryRow from '$lib/component/rows/BanHistoryRow.svelte';
  import CardMenu from '$lib/component/CardMenu.svelte';
  import CardMenuItem from '$lib/component/CardMenuItem.svelte';

  export let data;

  const pageTitle = getContext('pageTitle');
  const user = getContext('user');
  const siteInfo = getContext('siteInfo');

  pageTitle.set(data.username);

  let sendingVerificationMail;

  let checkTime = 0;
  let interval;

  $: isOnline = data.player.lastActivityTime > Date.now() - 5 * 60 * 1000 || data.player.inGame;

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

  function sendVerification() {
    sendingVerificationMail = true;

    ApiUtil.post({
      path: `/api/panel/players/${data.player.username}/verificationMail`,
      handler: async (body, reject) => {
        sendingVerificationMail = false;

        if (body.result === 'ok') {
          await showToast('components.toasts.verification-email-sent-successful', {
            username: data.player.username,
          });

          return;
        }

        await showToast('components.toasts.verification-email-sent-error', {
          username: data.player.username,
          errorCode: $_('errors.' + body.error),
        });
      },
    });
  }

  setEditPlayerModalCallback((newPlayer) => {
    if (data.player.username !== newPlayer.username) {
      goto(base + '/players/detail/' + newPlayer.username);

      return;
    }

    data.player = newPlayer;
  });

  setConfirmBanPlayerModalCallback(async () => {
    await invalidate((_) => true);
  });

  setUnbanPlayerModalCallback(() => {
    data.player.isBanned = false;
  });

  function getOfflineRelativeDateText(checkTime, locale) {
    return formatRelative(new Date(parseInt(data.player.lastActivityTime)), new Date(), {
      locale,
    }).capitalize();
  }

  onMount(() => {
    interval = setInterval(() => {
      checkTime += 1;
    }, 1000);
  });

  onDestroy(() => {
    clearInterval(interval);
  });
</script>
