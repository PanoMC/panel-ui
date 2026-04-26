<!-- All Players Page -->
<div class="container vstack gap-3">
  <PageActions>
    <PageNav slot="left">
      <PageNavItem
        href="/players?view={Views.PLAYERS}"
        active={data.view === Views.PLAYERS}>
        {$_('buttons.players')}</PageNavItem>
      <PageNavItem
        href="/players?view={Views.BANS}"
        active={data.view === Views.BANS}>
        {$_('pages.players.bans-history-title')}</PageNavItem>
      <PageNavItem
        href="/players?view={Views.IP_BANS}"
        active={data.view === Views.IP_BANS}>
        {$_('pages.players.ip-bans-title')}</PageNavItem>
    </PageNav>
    <div slot="right" class="hstack gap-2">
      {#if data.view === Views.PLAYERS}
        <a href="{base}/migration" class="btn btn-secondary">
          <i class="fa fa-file-import"></i>
          <span class="d-lg-inline d-none ms-2">{$_('buttons.import')}</span>
        </a>
      {/if}
      {#if data.view === Views.BANS}
        <button
          type="button"
          class="btn btn-danger"
          use:tooltip={[$_('pages.player-detail.ban'), { placement: 'bottom' }]}
          aria-label={$_('pages.player-detail.ban')}
          on:click={openBanWithPlayerSearch}>
          <i class="fas fa-gavel"></i>
          <span class="d-lg-inline d-none ms-2">{$_('pages.player-detail.ban')}</span>
        </button>
      {:else if data.view === Views.IP_BANS}
        <button
          type="button"
          class="btn btn-danger"
          use:tooltip={[$_('pages.ip-bans.add-ban'), { placement: 'bottom' }]}
          aria-label={$_('pages.ip-bans.add-ban')}
          on:click={() => showConfirmBanIpModal()}>
          <i class="fas fa-network-wired"></i>
          <span class="d-lg-inline d-none ms-2">{$_('pages.ip-bans.add-ban')}</span>
        </button>
      {/if}
    </div>
  </PageActions>

  <div class="card">
    <CardHeader>
      <div slot="left">
        {#if data.view === Views.PLAYERS}
          {$_('pages.players.table-title', {
            values: {
              playerCount: data.playerCount,
              pageType:
                data.pageType === PageTypes.HAS_PERM
                  ? $_('pages.players.authorized') + ' '
                  : data.pageType === PageTypes.BANNED
                    ? $_('pages.players.banned') + ' '
                    : '',
            },
          })}
        {:else if data.view === Views.BANS}
          {$_('pages.players.bans-history-title')}
        {:else}
          {$_('pages.players.ip-bans-title')}
        {/if}
      </div>

      <!-- Filters -->
      <div slot="middle" style="width: 250px;">
        <SearchInput
          initialValue={search}
          searching={isSearching}
          debounceMs={500}
          on:change={onSearchInput} />
      </div>

      <CardFilters slot="right">
        {#if data.view === Views.PLAYERS && !data.permissionGroup}
          <CardFiltersItem href="/players" active={data.pageType === PageTypes.ALL}>
            {$_('pages.players.all')}
          </CardFiltersItem>
          <CardFiltersItem
            href="/players?pageType=HAS_PERM"
            active={data.pageType === PageTypes.HAS_PERM}>
            {$_('pages.players.authorized')}
          </CardFiltersItem>
          <CardFiltersItem
            href="/players?pageType=BANNED"
            active={data.pageType === PageTypes.BANNED}>
            {$_('pages.players.banned')}
          </CardFiltersItem>
        {:else if data.view === Views.IP_BANS}
          <CardFiltersItem
            href="/players{ipBansFilterQuery('ACTIVE')}"
            active={data.ipBanStatus === 'ACTIVE'}>
            {$_('pages.ip-bans.filter-active')}
          </CardFiltersItem>
          <CardFiltersItem
            href="/players{ipBansFilterQuery('HISTORY')}"
            active={data.ipBanStatus === 'HISTORY'}>
            {$_('pages.ip-bans.filter-history')}
          </CardFiltersItem>
        {/if}
      </CardFilters>
    </CardHeader>

    <!-- No Players -->
    {#if data.playerCount === 0}
      <NoContent />
    {:else}
      {#if data.view === Views.BANS}
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th class="align-middle text-nowrap" scope="col">{$_('pages.players.table.name')}</th>
                <th class="align-middle text-nowrap" scope="col">{$_('pages.player-detail.ban-duration')}</th>
                <th class="align-middle text-nowrap" scope="col">{$_('pages.player-detail.ban-reason')}</th>
                <th class="align-middle text-nowrap text-center" scope="col"
                  >{$_('pages.player-detail.email-notification')}</th>
                <th class="align-middle text-nowrap" scope="col">{$_('pages.player-detail.banned-by')}</th>
                <th class="align-middle text-nowrap" scope="col">{$_('pages.player-detail.ban-source')}</th>
                <th class="align-middle text-nowrap" scope="col">{$_('pages.player-detail.banned-at')}</th>
              </tr>
            </thead>
            <tbody>
              {#each data.players as banHistory, index (banHistory.banHistoryId ??
                `${banHistory.username}-${banHistory.bannedAt}-${index}`)}
                <BanHistoryRow {banHistory} showBannedPlayer={true} />
              {/each}
            </tbody>
          </table>
        </div>
      {:else if data.view === Views.IP_BANS}
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th class="align-middle text-nowrap" scope="col"></th>
                <th class="align-middle text-nowrap" scope="col">{$_('pages.ip-bans.ip')}</th>
                <th class="align-middle text-nowrap" scope="col">{$_('pages.player-detail.ban-duration')}</th>
                <th class="align-middle text-nowrap" scope="col">{$_('pages.player-detail.ban-reason')}</th>
                <th class="align-middle text-nowrap" scope="col">{$_('pages.player-detail.ban-source')}</th>
                <th class="align-middle text-nowrap" scope="col">{$_('pages.player-detail.banned-by')}</th>
                <th class="align-middle text-nowrap" scope="col">{$_('pages.player-detail.banned-at')}</th>
              </tr>
            </thead>
            <tbody>
              {#each data.players as bannedIp (bannedIp.id)}
                <IpBanRow {bannedIp} on:unban={(e) => onUnbanIp(e.detail.bannedIp)} />
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <!-- Players Table -->
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th class="align-middle text-nowrap" scope="col"></th>
                <Hook
                  name="panel:players:table:header:start"
                  tag="th"
                  class="align-middle text-nowrap"
                  scope="col" />
                <th class="align-middle text-nowrap" scope="col">{$_('pages.players.table.name')}</th>
                <Hook
                  name="panel:players:table:header:after-name"
                  tag="th"
                  class="align-middle text-nowrap"
                  scope="col" />
                <th
                  class="align-middle text-nowrap"
                  scope="col"
                  class:table-active={data.permissionGroup}
                  >{$_('pages.players.table.perm-group')}</th>
                <Hook
                  name="panel:players:table:header:after-perm-group"
                  tag="th"
                  class="align-middle text-nowrap"
                  scope="col" />
                <th class="align-middle text-nowrap" scope="col">{$_('pages.players.table.status')}</th>
                <Hook
                  name="panel:players:table:header:after-status"
                  tag="th"
                  class="align-middle text-nowrap"
                  scope="col" />
                <th class="align-middle text-nowrap" scope="col">{$_('pages.players.table.last-login')}</th>
                <Hook
                  name="panel:players:table:header:after-last-login"
                  tag="th"
                  class="align-middle text-nowrap"
                  scope="col" />
                <th class="align-middle text-nowrap" scope="col"
                  >{$_('pages.players.table.register-date')}</th>
                <Hook
                  name="panel:players:table:header:end"
                  tag="th"
                  class="align-middle text-nowrap"
                  scope="col" />
              </tr>
            </thead>
            <tbody>
              {#each data.players as player (player.username)}
                <PlayerRow
                  {player}
                  {checkTime}
                  on:showEditPlayerModalClick={(event) =>
                    onShowEditPlayerModalClick(event.detail.player)}
                  on:showBanPlayerModalClick={(event) => showBanPlayerModalClick(event.detail.player)}
                  on:showUnbanPlayerModalClick={(event) =>
                    showUnbanPlayerModalClick(event.detail.player)} />
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
      <div class="card-footer">
        <!-- Pagination -->
        <Pagination
          page={data.page}
          totalPage={data.totalPage}
          on:firstPageClick={() => onPageClick(1)}
          on:lastPageClick={() => onPageClick(data.totalPage)}
          on:pageLinkClick={(event) => onPageClick(event.detail.page)} />
      </div>
    {/if}
  </div>
</div>

<script context="module">
  import { error } from '@sveltejs/kit';

  import ApiUtil, { buildQueryParams } from '$lib/api.util';

  export const Views = Object.freeze({
    PLAYERS: 'PLAYERS',
    BANS: 'BANS',
    IP_BANS: 'IP_BANS',
  });

  export const PageTypes = Object.freeze({
    ALL: 'ALL',
    HAS_PERM: 'HAS_PERM',
    BANNED: 'BANNED',
  });

  export const DefaultPageType = PageTypes.ALL;

  export const IpBanStatuses = Object.freeze({
    ACTIVE: 'ACTIVE',
    HISTORY: 'HISTORY',
  });

  export const DefaultIpBanStatus = IpBanStatuses.ACTIVE;

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const {
      parent,
      url: { searchParams },
    } = event;
    await parent();

    const page = parseInt(searchParams.get('page')) || 1;
    const permissionGroup = searchParams.get('permissionGroup');
    const view = searchParams.get('view') || Views.PLAYERS;
    const pageType = view === Views.BANS ? PageTypes.BANNED : (searchParams.get('pageType') || DefaultPageType);
    const search = searchParams.get('search');
    const ipBanParam = searchParams.get('ipBanStatus')?.toUpperCase();
    const ipBanStatus =
      view === Views.IP_BANS && Object.values(IpBanStatuses).includes(ipBanParam)
        ? ipBanParam
        : DefaultIpBanStatus;

    if (!Object.values(PageTypes).includes(pageType)) {
      throw error(404, 'PAGE_NOT_FOUND');
    }

    const queryParams = buildQueryParams({
      page,
      status: pageType,
      view,
      permissionGroup,
      search,
      ipBanStatus: view === Views.IP_BANS ? ipBanStatus : undefined,
    });

    const body = await ApiUtil.get({
      path: `/api/panel/players` + queryParams,
      request: event,
    });

    if (body.error) {
      if (body.error === 'PAGE_NOT_FOUND') {
        throw error(404, body.error);
      }

      throw error(500, body.error);
    }

    body.page = page;
    body.pageType = pageType;
    body.search = search;
    body.view = view;
    body.ipBanStatus = view === Views.IP_BANS ? ipBanStatus : undefined;

    return body;
  }
</script>

<script>
  import { getContext, onDestroy, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import { goto } from '$app/navigation';
  import { base } from '$app/paths';

  import Pagination from '$lib/components/Pagination.svelte';

  import {
    show as showEditPlayerModal,
    setCallback as setEditPlayerModalCallback,
    onHide as onEditPlayerModalHide,
  } from '$lib/components/modals/EditPlayerModal.svelte';
  import {
    show as showConfirmBanPlayerModal,
    setCallback as setConfirmBanPlayerModalCallback,
    onHide as onConfirmBanPlayerModalHide,
  } from '$lib/components/modals/ConfirmBanPlayerModal.svelte';
  import {
    show as showConfirmBanIpModal,
    setCallback as setConfirmBanIpModalCallback,
  } from '$lib/components/modals/ConfirmBanIpModal.svelte';
  import {
    show as showSearchPlayerModal,
    setCallback as setSearchPlayerModalCallback,
  } from '$lib/components/modals/SearchPlayerModal.svelte';
  import {
    show as showUnbanPlayerModal,
    setCallback as setUnbanPlayerModalCallback,
    onHide as onUnbanPlayerModalHide,
  } from '$lib/components/modals/UnbanPlayerModal.svelte';
  import {
    show as showUnbanIpModal,
    setCallback as setUnbanIpModalCallback,
  } from '$lib/components/modals/UnbanIpModal.svelte';

  import PlayerRow from '$lib/components/rows/PlayerRow.svelte';
  import BanHistoryRow from '$lib/components/rows/BanHistoryRow.svelte';
  import IpBanRow from '$lib/components/rows/IpBanRow.svelte';
  import Hook from '$lib/components/Hook.svelte';

  import NoContent from '$lib/components/NoContent.svelte';
  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import PageActions from '$lib/components/PageActions.svelte';
  import CardHeader from '$lib/components/CardHeader.svelte';
  import CardFiltersItem from '$lib/components/CardFiltersItem.svelte';
  import CardFilters from '$lib/components/CardFilters.svelte';
  import PageNav from '$lib/components/PageNav.svelte';
  import PageNavItem from '$lib/components/PageNavItem.svelte';
  import SearchInput from '$lib/components/SearchInput.svelte';
  import { show as showToast } from '$lib/components/ToastContainer.svelte';
  import tooltip from '$lib/tooltip.util';

  export let data;
  let search = data.search || '';
  let searchTimeout;
  let isSearching = false;

  let checkTime = 0;
  let interval;

  const pageTitle = getContext('pageTitle');
  const currentUser = getContext('user');

  function onPlayerSelectedForBanFromHistory(u) {
    if (!u) return;
    if (get(currentUser)?.username === u.username) {
      showToast('errors.CANT_BAN_YOURSELF');
      return;
    }
    showConfirmBanPlayerModal(u);
  }

  function openBanWithPlayerSearch() {
    setSearchPlayerModalCallback(onPlayerSelectedForBanFromHistory);
    showSearchPlayerModal({
      localPlayers: data.view === Views.BANS && Array.isArray(data.players) ? data.players : null,
      selectOnlyBadge: true,
    });
  }

  /**
   * @param {'ACTIVE' | 'HISTORY'} status
   */
  function ipBansFilterQuery(status) {
    return buildQueryParams({
      view: 'IP_BANS',
      ipBanStatus: status,
      page: 1,
      search: search || undefined,
    });
  }

  $: search = data.search || '';

  $: {
    pageTitle.set(
      data.permissionGroup
        ? $_('pages.players.by-perm-group-title', {
            values: {
              permissionGroupName: data.permissionGroup.displayName || data.permissionGroup.name,
            },
          })
        : data.view === Views.BANS
          ? $_('pages.players.bans-history-title')
          : data.view === Views.IP_BANS
            ? $_('pages.players.ip-bans-title')
            : $_('pages.players.title', {
                values: {
                  pageType:
                    data.pageType === PageTypes.HAS_PERM
                      ? $_('pages.players.authorized') + ' '
                      : data.pageType === PageTypes.BANNED
                        ? $_('pages.players.banned') + ' '
                        : '',
                },
              }),
    );
  }

  function onSearchInput(event) {
    search = event.detail.value;

    data.page = 1;
    refreshData();
  }

  async function refreshData() {
    isSearching = true;
    const queryParams = buildQueryParams({
      page: data.page,
      permissionGroup: data.permissionGroup?.name,
      pageType: data.pageType,
      view: data.view,
      search: search || undefined,
      ipBanStatus:
        data.view === 'IP_BANS' ? data.ipBanStatus || DefaultIpBanStatus : undefined,
    });

    await goto(queryParams, { invalidateAll: true, keepFocus: true });
    isSearching = false;
  }

  async function onPageClick(page) {
    data.page = page;

    await refreshData();
  }

  function onShowEditPlayerModalClick(player) {
    data.players[data.players.indexOf(player)].selected = true;

    showEditPlayerModal(player);
  }

  function onUnbanIp(bannedIp) {
    if (!bannedIp?.id) {
      return;
    }

    showUnbanIpModal(bannedIp);
  }

  function showBanPlayerModalClick(player) {
    data.players[data.players.indexOf(player)].selected = true;

    showConfirmBanPlayerModal(player);
  }

  function showUnbanPlayerModalClick(player) {
    data.players[data.players.indexOf(player)].selected = true;

    showUnbanPlayerModal(player);
  }

  setEditPlayerModalCallback(async (newPlayer) => {
    await refreshData();
  });

  onEditPlayerModalHide((newPlayer) => {
    if (!data.players) {
      return;
    }

    data.players.forEach((player) => {
      if (player.id === newPlayer.id) {
        player.selected = false;
      }
    });

    data.players = data.players;
  });

  onConfirmBanPlayerModalHide((newPlayer) => {
    if (!data.players) {
      return;
    }

    data.players.forEach((player) => {
      if (player.id === newPlayer.id) {
        player.selected = false;
      }
    });

    data.players = data.players;
  });

  onUnbanPlayerModalHide((newPlayer) => {
    if (!data.players) {
      return;
    }

    data.players.forEach((player) => {
      if (player.id === newPlayer.id) {
        player.selected = false;
      }
    });

    data.players = data.players;
  });

  setConfirmBanPlayerModalCallback((newPlayer) => {
    if (!data.players) {
      return;
    }

    data.players.forEach((player) => {
      if (player.id === newPlayer.id) {
        player.selected = false;
      }
    });

    data.players = data.players;

    refreshData();
  });

  setConfirmBanIpModalCallback(() => {
    refreshData();
  });

  setUnbanPlayerModalCallback((newPlayer) => {
    if (!data.players) {
      return;
    }

    data.players.forEach((player) => {
      if (player.id === newPlayer.id) {
        player.selected = false;
      }
    });

    data.players = data.players;

    refreshData();
  });

  setUnbanIpModalCallback(() => {
    refreshData();
  });

  onMount(() => {
    setSearchPlayerModalCallback(() => {});

    interval = setInterval(() => {
      checkTime += 1;
    }, 1000);
  });

  onDestroy(() => {
    // Do not clear SearchPlayerModal callback here. The next route (e.g. /permissions) sets
    // its own handler; destroying after mount would overwrite the new page's callback
    // because the modal module is global.
    clearInterval(interval);
  });
</script>
