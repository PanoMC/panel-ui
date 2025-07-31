<!-- All Players Page -->
<div class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions leftClasses="d-lg-flex d-none" rightClasses="d-lg-flex d-none">
    <!-- Submenu -->
    <CardMenu slot="middle">
      {#if !data.categoryUrl}
        <CardMenuItem href="/players" startsWith>
          {$_("buttons.players")}</CardMenuItem>
        <CardMenuItem href="/players/perm-groups" startsWith>
          {$_("pages.players.perm-groups")}</CardMenuItem>
      {/if}
    </CardMenu>
  </PageActions>

  <!-- All Players -->
  <div class="card">
    <CardHeader>
      <div slot="left">
        {$_("pages.players.table-title", {
          values: {
            playerCount: data.playerCount,
            pageType:
              data.pageType === PageTypes.HAS_PERM
                ? $_("pages.players.authorized") + " "
                : data.pageType === PageTypes.BANNED
                  ? $_("pages.players.banned") + " "
                  : "",
          },
        })}
      </div>

      <!-- Filters -->
      <CardFilters slot="right">
        {#if !data.permissionGroup}
          <!-- Filters -->
          <CardFiltersItem
            href="/players"
            active={data.pageType === PageTypes.ALL}>
            {$_("pages.players.all")}
          </CardFiltersItem>
          <CardFiltersItem
            href="/players?pageType=HAS_PERM"
            active={data.pageType === PageTypes.HAS_PERM}>
            {$_("pages.players.authorized")}
          </CardFiltersItem>
          <CardFiltersItem
            href="/players?pageType=BANNED"
            active={data.pageType === PageTypes.BANNED}>
            {$_("pages.players.banned")}
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
              <th class="align-middle text-nowrap" scope="col"
                >{$_("pages.players.table.name")}</th>
              <th
                class="align-middle text-nowrap"
                scope="col"
                class:table-primary={data.permissionGroup}
                >{$_("pages.players.table.perm-group")}</th>
              <th class="align-middle text-nowrap" scope="col"
                >{$_("pages.players.table.status")}</th>
              <th class="align-middle text-nowrap" scope="col"
                >{$_("pages.players.table.last-login")}</th>
              <th class="align-middle text-nowrap" scope="col"
                >{$_("pages.players.table.register-date")}</th>
            </tr>
          </thead>
          <tbody>
            {#each data.players as player, index (player)}
              <PlayerRow
                player={player}
                checkTime={checkTime}
                on:showAuthorizePlayerModalClick={(event) =>
                  onShowAuthorizePlayerModalClick(event.detail.player)}
                on:showEditPlayerModalClick={(event) =>
                  onShowEditPlayerModalClick(event.detail.player)}
                on:showBanPlayerModalClick={(event) =>
                  showBanPlayerModalClick(event.detail.player)}
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
  import { error } from "@sveltejs/kit";

  import ApiUtil, { buildQueryParams } from "$lib/api.util";

  export const PageTypes = Object.freeze({
    ALL: "ALL",
    HAS_PERM: "HAS_PERM",
    BANNED: "BANNED",
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

    const page = parseInt(searchParams.get("page")) || 1;
    const permissionGroup = searchParams.get("permissionGroup");
    const pageType = searchParams.get("pageType") || DefaultPageType;

    if (!Object.values(PageTypes).includes(pageType)) {
      throw error(404, "PAGE_NOT_FOUND");
    }

    const queryParams = buildQueryParams({
      page,
      status: pageType,
      permissionGroup,
    });

    const body = await ApiUtil.get({
      path: `/api/panel/players` + queryParams,
      request: event,
    });

    if (body.error) {
      if (body.error === "PAGE_NOT_FOUND") {
        throw error(404, body.error);
      }

      throw error(500, body.error);
    }

    body.page = page;
    body.pageType = pageType;
    body.permissionGroup = permissionGroup;

    return body;
  }
</script>

<script>
  import { getContext, onDestroy, onMount } from "svelte";
  import { _ } from "svelte-i18n";

  import { goto } from "$app/navigation";
  import { base } from "$app/paths";

  import Pagination from "$lib/component/Pagination.svelte";

  import {
    show as showAuthorizePlayerModal,
    setCallback as setAuthorizePlayerModalCallback,
    onHide as onAuthorizePlayerModalHide,
  } from "$lib/component/modals/AuthorizePlayerModal.svelte";
  import {
    show as showEditPlayerModal,
    setCallback as setEditPlayerModalCallback,
    onHide as onEditPlayerModalHide,
  } from "$lib/component/modals/EditPlayerModal.svelte";
  import {
    show as showConfirmBanPlayerModal,
    setCallback as setConfirmBanPlayerModalCallback,
    onHide as onConfirmBanPlayerModalHide,
  } from "$lib/component/modals/ConfirmBanPlayerModal.svelte";
  import {
    show as showUnbanPlayerModal,
    setCallback as setUnbanPlayerModalCallback,
    onHide as onUnbanPlayerModalHide,
  } from "$lib/component/modals/UnbanPlayerModal.svelte";

  import PlayerRow from "$lib/component/rows/PlayerRow.svelte";

  import NoContent from "$lib/component/NoContent.svelte";
  import { hasPermission, Permissions } from "$lib/auth.util.js";
  import PageActions from "$lib/component/PageActions.svelte";
  import CardHeader from "$lib/component/CardHeader.svelte";
  import CardFiltersItem from "$lib/component/CardFiltersItem.svelte";
  import CardFilters from "$lib/component/CardFilters.svelte";
  import CardMenu from "$lib/component/CardMenu.svelte";
  import CardMenuItem from "$lib/component/CardMenuItem.svelte";

  export let data;

  let checkTime = 0;
  let interval;

  const pageTitle = getContext("pageTitle");

  $: {
    pageTitle.set(
      data.permissionGroup
        ? $_("pages.players.by-perm-group-title", {
            values: {
              permissionGroupName:
                data.permissionGroup === "-"
                  ? $_("pages.players.player")
                  : data.permissionGroup,
            },
          })
        : $_("pages.players.title", {
            values: {
              pageType:
                data.pageType === PageTypes.HAS_PERM
                  ? $_("pages.players.authorized") + " "
                  : data.pageType === PageTypes.BANNED
                    ? $_("pages.players.banned") + " "
                    : "",
            },
          }),
    );
  }

  async function refreshData() {
    const queryParams = buildQueryParams({
      page: data.page,
      permissionGroup: data.permissionGroup,
      pageType: data.pageType,
    });

    await goto(queryParams, { invalidateAll: true });
  }

  async function onPageClick(page) {
    data.page = page;

    await refreshData();
  }

  function onShowAuthorizePlayerModalClick(player) {
    data.players[data.players.indexOf(player)].selected = true;

    showAuthorizePlayerModal(player);
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

  setAuthorizePlayerModalCallback(async (newPlayer) => {
    await refreshData();
  });

  setEditPlayerModalCallback(async (newPlayer) => {
    await refreshData();
  });

  onAuthorizePlayerModalHide((newPlayer) => {
    data.players.forEach((player) => {
      if (player.id === newPlayer.id) {
        player.selected = false;
      }
    });

    data.players = data.players;
  });

  onEditPlayerModalHide((newPlayer) => {
    data.players.forEach((player) => {
      if (player.id === newPlayer.id) {
        player.selected = false;
      }
    });

    data.players = data.players;
  });

  onConfirmBanPlayerModalHide((newPlayer) => {
    data.players.forEach((player) => {
      if (player.id === newPlayer.id) {
        player.selected = false;
      }
    });

    data.players = data.players;
  });

  onUnbanPlayerModalHide((newPlayer) => {
    data.players.forEach((player) => {
      if (player.id === newPlayer.id) {
        player.selected = false;
      }
    });

    data.players = data.players;
  });

  setConfirmBanPlayerModalCallback((newPlayer) => {
    data.players.forEach((player) => {
      if (player.id === newPlayer.id) {
        player.selected = false;
      }
    });

    data.players = data.players;

    refreshData();
  });

  setUnbanPlayerModalCallback((newPlayer) => {
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
