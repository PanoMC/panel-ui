<!-- All Players Page -->
<div class="container">
  <!-- Action Menu -->
  <PageActions>
    <a class="btn btn-link" role="button" href="{base}/players" slot="left">
      <i class="fas fa-arrow-left me-2"></i>
      {$_('pages.players-by-permission-group.players')}
    </a>
  </PageActions>

  <!-- All Players -->
  <div class="card">
    <div class="card-body">
      <CardHeader>
        <h5 class="card-title" slot="left">
          {$_('pages.players-by-permission-group.table-title', {values: {count: data.playerCount}})}
        </h5>
      </CardHeader>

      <!-- No Players -->
      {#if data.playerCount === 0}
        <NoContent />
      {:else}
        <!-- Players Table -->
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th class="align-middle text-nowrap" scope="col"></th>
                <th class="align-middle text-nowrap" scope="col">{$_('pages.players-by-permission-group.table.player')}</th>
                <th class="align-middle text-nowrap table-primary" scope="col"
                  >{$_('pages.players-by-permission-group.table.permission-group')}</th>
                <th class="align-middle text-nowrap" scope="col">{$_('pages.players-by-permission-group.table.status')}</th>
                <th class="align-middle text-nowrap" scope="col">{$_('pages.players-by-permission-group.table.last-login')}</th>
                <th class="align-middle text-nowrap" scope="col">{$_('pages.players-by-permission-group.table.register-date')}</th>
              </tr>
            </thead>
            <tbody>
              {#each data.players as player, index (player)}
                <PlayerRow
                  player="{player}"
                  on:showAuthorizePlayerModalClick="{(event) =>
                    onShowAuthorizePlayerModalClick(event.detail.player)}"
                  on:showEditPlayerModalClick="{(event) =>
                    onShowEditPlayerModalClick(event.detail.player)}" />
              {/each}
            </tbody>
          </table>
        </div>
      {/if}

      <!-- Pagination -->
      <Pagination
        page="{data.page}"
        totalPage="{data.totalPage}"
        on:firstPageClick="{() => onPageClick(1)}"
        on:lastPageClick="{() => onPageClick(data.totalPage)}"
        on:pageLinkClick="{(event) => onPageClick(event.detail.page)}" />
    </div>
  </div>
</div>

<script context="module">
  import ApiUtil, { buildQueryParams } from "$lib/api.util";
  import { error } from "@sveltejs/kit";

  /**
   * @type {import("@sveltejs/kit").Load}
   */
  export async function load(event) {
    const { parent, url: {searchParams} } = event;
    await parent();


    const page = searchParams.get("page") || 1;
    const permissionGroup = event.params.permissionGroup;

    const queryParams = buildQueryParams({
      page,
      permissionGroup
    });

    const body = await ApiUtil.get({
      path: `/api/panel/players` + queryParams,
      request: event,
    })

    if (body.error) {
      if (body.error === "NOT_EXISTS" || body.error === "PAGE_NOT_FOUND") {
        throw error(404, body.error);
      }

      throw error(500, body.error);
    }

    body.page = parseInt(page);

    return body;
  }
</script>

<script>
  import { getContext } from "svelte";
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

  import PlayerRow from "$lib/component/rows/PlayerRow.svelte";
  import NoContent from "$lib/component/NoContent.svelte";
  import PageActions from "$lib/component/PageActions.svelte";
  import CardHeader from "$lib/component/CardHeader.svelte";

  export let data;

  const pageTitle = getContext("pageTitle");

  pageTitle.set($_('pages.players-by-permission-group.title', {values: {permissionGroupName: data.permissionGroup.name === "-" ? $_('pages.players-by-permission-group.player') : data.permissionGroup.name}}));

  async function refreshData() {
    const queryParams = buildQueryParams({
      page: data.page,
    });

    await goto(queryParams);
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

  setAuthorizePlayerModalCallback((newPlayer) => {
    data.players.forEach((player) => {
      if (player.id === newPlayer.id) {
        player.permissionGroup = newPlayer.permissionGroup;
        player.selected = false;
      }
    });

    data.players = data.players;
  });

  setEditPlayerModalCallback((newPlayer) => {
    data.players.forEach((player) => {
      if (player.id === newPlayer.id) {
        player.username = newPlayer.username;
        player.email = newPlayer.email;
        player.selected = false;
      }
    });

    data.players = data.players;
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
</script>
