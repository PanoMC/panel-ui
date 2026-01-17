<!-- All Players Page -->
<div class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions leftClasses="d-lg-flex d-none">
    <!-- Submenu -->
    <CardMenu slot="middle">
      <CardMenuItem href="/players" active={data.pageType === "ALL"}>
        {$_('buttons.players')}</CardMenuItem>
      <CardMenuItem href="/players?pageType=BANNED" matchingList={['/players?pageType=BANNED']}>
        {$_('buttons.bans')}</CardMenuItem>
    </CardMenu>
    <div slot="right">
      <a href="{base}/settings/migration" class="btn btn-secondary">
        <i class="fa fa-file-import"></i>
        <span class="d-lg-inline d-none ms-2">İçe Aktar</span>
      </a>
    </div>
  </PageActions>

  <!-- All Players -->
  <div class="card">
    <CardHeader>
      <div slot="left">
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
      </div>

      <!-- Filters -->
      <div slot="middle" style="width: 250px;">
        <SearchInput
          initialValue={search}
          showSpinner={false}
          debounceMs={500}
          on:change={onSearchInput} />
      </div>

      <!-- Filters -->
      <CardFilters slot="right">
        {#if !data.permissionGroup}
          <!-- Filters -->
          <CardFiltersItem href="/players" active={data.pageType === PageTypes.ALL}>
            {$_('pages.players.all')}
          </CardFiltersItem>
          <CardFiltersItem
            href="/players?pageType=HAS_PERM"
            active={data.pageType === PageTypes.HAS_PERM}>
            {$_('pages.players.authorized')}
          </CardFiltersItem>
        {/if}
      </CardFilters>
    </CardHeader>

    <!-- No Players -->
    {#if data.playerCount === 0}
      <NoContent />
    {:else}
      <!-- Players Table -->
      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              <th class="align-middle text-nowrap" scope="col"></th>
              <Hook name="panel:players:table:header:start" tag="th" class="align-middle text-nowrap" scope="col" />
              <th class="align-middle text-nowrap" scope="col">{$_('pages.players.table.name')}</th>
              <Hook name="panel:players:table:header:after-name" tag="th" class="align-middle text-nowrap" scope="col" />
              <th
                class="align-middle text-nowrap"
                scope="col"
                class:table-active={data.permissionGroup}
                >{$_('pages.players.table.perm-group')}</th>
              <Hook name="panel:players:table:header:after-perm-group" tag="th" class="align-middle text-nowrap" scope="col" />
              <th class="align-middle text-nowrap" scope="col"
                >{$_('pages.players.table.status')}</th>
              <Hook name="panel:players:table:header:after-status" tag="th" class="align-middle text-nowrap" scope="col" />
              <th class="align-middle text-nowrap" scope="col"
                >{$_('pages.players.table.last-login')}</th>
              <Hook name="panel:players:table:header:after-last-login" tag="th" class="align-middle text-nowrap" scope="col" />
              <th class="align-middle text-nowrap" scope="col"
                >{$_('pages.players.table.register-date')}</th>
              <Hook name="panel:players:table:header:end" tag="th" class="align-middle text-nowrap" scope="col" />
            </tr>
          </thead>
          <tbody>
            {#each data.players as player, index (player)}
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
  </div>
</div>

<script context="module">
  import { error } from '@sveltejs/kit';

  import ApiUtil, { buildQueryParams } from '$lib/api.util';

  export const PageTypes = Object.freeze({
    ALL: 'ALL',
    HAS_PERM: 'HAS_PERM',
    BANNED: 'BANNED',
  });

  export const DefaultPageType = PageTypes.ALL;

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
    const pageType = searchParams.get('pageType') || DefaultPageType;
    const search = searchParams.get('search');

    if (!Object.values(PageTypes).includes(pageType)) {
      throw error(404, 'PAGE_NOT_FOUND');
    }

    const queryParams = buildQueryParams({
      page,
      status: pageType,
      permissionGroup,
      search,
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

    return body;
  }
</script>

<script>
  import { getContext, onDestroy, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { goto } from '$app/navigation';
  import { base } from '$app/paths';

  import Pagination from '$lib/component/Pagination.svelte';

  import {
    show as showEditPlayerModal,
    setCallback as setEditPlayerModalCallback,
    onHide as onEditPlayerModalHide,
  } from '$lib/component/modals/EditPlayerModal.svelte';
  import {
    show as showConfirmBanPlayerModal,
    setCallback as setConfirmBanPlayerModalCallback,
    onHide as onConfirmBanPlayerModalHide,
  } from '$lib/component/modals/ConfirmBanPlayerModal.svelte';
  import {
    show as showUnbanPlayerModal,
    setCallback as setUnbanPlayerModalCallback,
    onHide as onUnbanPlayerModalHide,
  } from '$lib/component/modals/UnbanPlayerModal.svelte';

  import PlayerRow from '$lib/component/rows/PlayerRow.svelte';
  import Hook from '$lib/component/Hook.svelte';

  import NoContent from '$lib/component/NoContent.svelte';
  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import PageActions from '$lib/component/PageActions.svelte';
  import CardHeader from '$lib/component/CardHeader.svelte';
  import CardFiltersItem from '$lib/component/CardFiltersItem.svelte';
  import CardFilters from '$lib/component/CardFilters.svelte';
  import CardMenu from '$lib/component/CardMenu.svelte';
  import CardMenuItem from '$lib/component/CardMenuItem.svelte';
  import SearchInput from '$lib/component/SearchInput.svelte';
  import { page } from "$app/stores";

  export let data;
  let search = data.search || '';
  let searchTimeout;

  let checkTime = 0;
  let interval;

  const pageTitle = getContext('pageTitle');

  $: search = data.search || '';

  $: {
    pageTitle.set(
      data.permissionGroup
        ? $_('pages.players.by-perm-group-title', {
            values: {
              permissionGroupName: data.permissionGroup.displayName || data.permissionGroup.name,
            },
          })
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
    const queryParams = buildQueryParams({
      page: data.page,
      permissionGroup: data.permissionGroup?.name,
      pageType: data.pageType,
      search: search || undefined,
    });

    await goto(queryParams, { invalidateAll: true });
  }

  async function onPageClick(page) {
    data.page = page;

    await refreshData();
  }

  function onShowEditPlayerModalClick(player) {
    data.players[data.players.indexOf(player)].selected = true;

    showEditPlayerModal(player);
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

  onMount(() => {
    interval = setInterval(() => {
      checkTime += 1;
    }, 1000);
  });

  onDestroy(() => {
    clearInterval(interval);
  });
</script>
