<!-- Player Detail Page -->
<div class="container">
  <!-- Action Menu -->
  <div
    class="row justify-content-between mb-3 animate__animated animate__slideInUp">
    <div class="col-auto">
      {#if hasPermission(Permissions.MANAGE_PLAYERS)}
        <a class="btn btn-link" role="button" href="{base}/players">
          <i class="fas fa-arrow-left me-2"></i>
          {$_("pages.player-detail.players")}
        </a>
      {/if}
    </div>
    <div class="col-auto">
      {#if hasPermission(Permissions.MANAGE_PLAYERS)}
        <button
          class="btn btn-link link-danger"
          use:tooltip="{[
            $_('pages.player-detail.delete'),
            { placement: 'bottom' },
          ]}"
          on:click="{() => showConfirmDeletePlayerModal(data.player)}"
          class:disabled="{$user.username === data.player.username ||
            (data.player.permissionGroup === 'admin' && !$user.admin)}">
          <i class="fas fa-trash"></i>
        </button>
        {#if data.player.isBanned}
          <button
            class="btn btn-link link-danger"
            use:tooltip="{[
              $_('pages.player-detail.un-ban'),
              { placement: 'bottom' },
            ]}"
            on:click="{() => showUnbanPlayerModal(data.player)}"
            class:disabled="{$user.username === data.player.username ||
              (data.player.permissionGroup === 'admin' && !$user.admin)}">
            <i class="fas fa-gavel"></i>
          </button>
        {:else}
          <button
            class="btn btn-link link-danger"
            use:tooltip="{[
              $_('pages.player-detail.ban'),
              { placement: 'bottom' },
            ]}"
            on:click="{() => showConfirmBanPlayerModal(data.player)}"
            class:disabled="{$user.username === data.player.username ||
              (data.player.permissionGroup === 'admin' && !$user.admin)}">
            <i class="fas fa-gavel"></i>
          </button>
        {/if}
        {#if !data.player.isEmailVerified}
          <button
            class="btn btn-link"
            use:tooltip="{[
              $_('pages.player-detail.send-verification-mail'),
              { placement: 'bottom' },
            ]}"
            on:click="{sendVerification}"
            class:disabled="{sendingVerificationMail ||
              $user.username === data.player.username ||
              (data.player.permissionGroup === 'admin' && !$user.admin)}">
            <i class="fas fa-envelope"></i>
          </button>
        {/if}

        <button
          class="btn btn-link"
          use:tooltip="{[
            $_('pages.player-detail.authorize'),
            { placement: 'bottom' },
          ]}"
          on:click="{() => showAuthorizePlayerModal(data.player)}"
          class:disabled="{$user.username === data.player.username ||
            (data.player.permissionGroup === 'admin' && !$user.admin)}">
          <i class="fas fa-user-circle"></i>
        </button>
      {/if}
      {#if hasPermission(Permissions.MANAGE_PLAYERS) || $user.username === data.player.username}
        <button
          class="btn btn-primary"
          on:click="{() => showEditPlayerModal(data.player)}"
          class:disabled="{data.player.permissionGroup === 'admin' &&
            !$user.admin}">
          <i class="fas fa-pencil-alt me-2"></i>
          {$_("pages.player-detail.edit")}
        </button>
      {/if}
    </div>
  </div>

  <div class="row g-3">
    <div class="col-lg-3">
      <div class="card">
        <div
          class="card-body d-flex flex-column justify-content-center
          align-items-center">
          <img
            alt="{data.player.username}"
            class="mb-3 rounded-circle animate__animated animate__zoomIn"
            width="128"
            height="128"
            class:border="{isOnline}"
            class:border-5="{isOnline}"
            class:border-success="{isOnline}"
            src="https://minotar.net/avatar/{data.player.username}"
            use:tooltip="{[
              isOnline
                ? $_('pages.player-detail.online-text', {
                    values: {
                      whereOnline: data.player.inGame
                        ? $_('pages.player-detail.in-game')
                        : $_('pages.player-detail.in-website'),
                    },
                  })
                : getOfflineRelativeDateText(
                    checkTime,
                    locales[$currentLanguage['date-fns-code']],
                  ),
              { placement: 'bottom' },
            ]}" />

          <h3 class="card-title">{data.player.username}</h3>
          <h6 class="text-muted">{data.player.email}</h6>

          {#if data.player.isBanned}
            <div class="text-danger">{$_("pages.player-detail.banned")}</div>
          {:else}
            <PlayerPermissionBadge
              permissionGroup="{data.player.permissionGroup}" />
          {/if}
        </div>
      </div>
    </div>
    <div class="col-lg-9 vstack gap-3">
      {#if hasPermission(Permissions.MANAGE_TICKETS)}
        <!-- Tickets -->
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">{$_("pages.player-detail.last-tickets")}</h5>

            {#if data.ticketCount === 0}
              <NoContent />
            {:else}
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  {#each data.tickets as ticket, index (ticket)}
                    <tbody>
                      <tr>
                        <td class="align-middle text-nowrap">
                          <a
                            href="{base}/tickets/ticket/{ticket.id}"
                            title="{$_('pages.player-detail.view')}"
                            >#{ticket.id} {ticket.title}</a>
                        </td>
                        <td class="align-middle text-nowrap">
                          <a
                            title="{$_('pages.player-detail.filter')}"
                            href="{base}/tickets/category/{ticket.category
                              .url}">
                            {ticket.category.title === "-"
                              ? $_("pages.player-detail.no-category")
                              : ticket.category.title}
                          </a>
                        </td>
                        <td class="align-middle text-nowrap">
                          <TicketStatusBadge status="{ticket.status}" />
                        </td>
                        <td class="align-middle text-nowrap"
                          ><span
                            ><DateComponent time="{ticket.lastUpdate}" /></span
                          ></td>
                      </tr>
                    </tbody>
                  {/each}
                </table>
              </div>
            {/if}

            <!-- Pagination -->
            <Pagination
              page="{data.page}"
              totalPage="{data.ticketTotalPage}"
              on:firstPageClick="{() => reloadData(1)}"
              on:lastPageClick="{() => reloadData(data.ticketTotalPage)}"
              on:pageLinkClick="{(event) => reloadData(event.detail.page)}" />
          </div>
        </div>
      {/if}
      <!-- Statistics -->
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">{$_("pages.player-detail.statistics")}</h5>
          <table class="table mb-0">
            <tbody>
              <tr>
                <td>{$_("pages.player-detail.email")}</td>
                <td>
                  {#if data.player.isEmailVerified}
                    {$_("pages.player-detail.email-verified")}
                  {:else}
                    {$_("pages.player-detail.email-not-verified")}
                  {/if}
                </td>
              </tr>
              <tr>
                <td>{$_("pages.player-detail.last-entrance")}</td>
                <td><DateComponent time="{data.player.lastLoginDate}" /></td>
              </tr>
              <tr>
                <td>{$_("pages.player-detail.register-date")}</td>
                <td><DateComponent time="{data.player.registerDate}" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import ApiUtil from "$lib/api.util";
  import { showNetworkErrorOnCatch } from "$lib/Store";
  import { error } from "@sveltejs/kit";

  async function loadData({ username, page, request }) {
    return new Promise((resolve, reject) => {
      ApiUtil.get({
        path: `/api/panel/players/${username}?page=${page}`,
        request,
      }).then((body) => {
        if (body.result === "ok") {
          const data = body;

          data.username = username;
          data.page = parseInt(page);

          resolve(data);
        } else {
          reject(body);
        }
      });
    });
  }

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const { parent } = event;
    const parentData = await parent();

    let data = {
      player: {
        username: "",
        isBanned: false,
        registerDate: 0,
        lastLoginDate: 0,
        permissionGroup: "",
        lastActivityTime: 0,
        inGame: false,
      },
      tickets: [],
      ticketCount: 0,
      ticketTotalPage: 1,
    };

    if (parentData.NETWORK_ERROR) {
      return data;
    }

    await loadData({
      username: event.params.username,
      page: event.params.page || 1,
      request: event,
    })
      .then((body) => {
        data = { ...data, ...body };
      })
      .catch((body) => {
        if (body.error) {
          if (body.error === "NOT_EXISTS" || body.error === "PAGE_NOT_FOUND") {
            throw error(404, body.error);
          }

          throw error(500, body.error);
        }
      });

    return data;
  }
</script>

<script>
  import { formatRelative } from "date-fns";
  import { getContext, onDestroy, onMount } from "svelte";
  import { _ } from "svelte-i18n";
  import * as locales from "date-fns/locale";

  import { goto } from "$app/navigation";
  import { base } from "$app/paths";

  import tooltip from "$lib/tooltip.util";
  import { hasPermission, Permissions } from "$lib/auth.util.js";
  import { currentLanguage } from "$lib/language.util.js";

  import {
    show as showEditPlayerModal,
    setCallback as setEditPlayerModalCallback,
  } from "$lib/component/modals/EditPlayerModal.svelte";
  import {
    show as showAuthorizePlayerModal,
    setCallback as setAuthorizePlayerModalCallback,
  } from "$lib/component/modals/AuthorizePlayerModal.svelte";
  import {
    show as showConfirmBanPlayerModal,
    setCallback as setConfirmBanPlayerModalCallback,
  } from "$lib/component/modals/ConfirmBanPlayerModal.svelte";
  import {
    show as showUnbanPlayerModal,
    setCallback as setUnbanPlayerModalCallback,
  } from "$lib/component/modals/UnbanPlayerModal.svelte";
  import { show as showConfirmDeletePlayerModal } from "$lib/component/modals/ConfirmDeletePlayerModal.svelte";

  import TicketStatusBadge from "$lib/component/badges/TicketStatusBadge.svelte";
  import DateComponent from "$lib/component/Date.svelte";
  import Pagination from "$lib/component/Pagination.svelte";
  import { show as showToast } from "$lib/component/ToastContainer.svelte";

  import VerificationEmailSentSuccessfulToast from "$lib/component/toasts/VerificationEmailSentSuccessfulToast.svelte";
  import VerificationEmailSentErrorToast from "$lib/component/toasts/VerificationEmailSentErrorToast.svelte";

  import NoContent from "$lib/component/NoContent.svelte";
  import PlayerPermissionBadge from "$lib/component/badges/PlayerPermissionBadge.svelte";

  export let data;

  const pageTitle = getContext("pageTitle");
  const user = getContext("user");

  pageTitle.set(data.username);

  let sendingVerificationMail;

  let checkTime = 0;
  let interval;

  $: isOnline =
    data.player.lastActivityTime > Date.now() - 5 * 60 * 1000 ||
    data.player.inGame;

  function reloadData(page = data.page) {
    showNetworkErrorOnCatch((resolve, reject) => {
      loadData({
        username: data.player.username,
        page,
      })
        .then((loadedData) => {
          resolve();

          if (page !== data.page) {
            goto(base + "/players/player/" + data.player.username + "/" + page);
          } else {
            data = loadedData;
          }
        })
        .catch((body) => {
          if (body.error === "NOT_EXISTS" || body.error === "PAGE_NOT_FOUND") {
            resolve();

            reloadData(page - 1);
          } else {
            reject();
          }
        });
    });
  }

  function sendVerification() {
    sendingVerificationMail = true;

    showNetworkErrorOnCatch((resolve, reject) => {
      ApiUtil.post({
        path: `/api/panel/players/${data.player.username}/verificationMail`,
      })
        .then((body) => {
          sendingVerificationMail = false;

          if (body.result === "ok") {
            showToast(VerificationEmailSentSuccessfulToast, {
              username: data.player.username,
            });

            return;
          }

          showToast(VerificationEmailSentErrorToast, {
            username: data.player.username,
            errorCode: body.error,
          });
        })
        .catch(() => {
          reject();
        });
    });
  }

  setAuthorizePlayerModalCallback((newPlayer) => {
    data.player.permissionGroup = newPlayer.permissionGroup;
  });

  setEditPlayerModalCallback((newPlayer) => {
    if (data.player.username !== newPlayer.username) {
      goto(base + "/players/player/" + newPlayer.username + "/" + data.page);

      return;
    }

    data.player = newPlayer;
  });

  setConfirmBanPlayerModalCallback(() => {
    data.player.isBanned = true;
  });

  setUnbanPlayerModalCallback(() => {
    data.player.isBanned = false;
  });

  function getOfflineRelativeDateText(checkTime, locale) {
    return formatRelative(
      new Date(parseInt(data.player.lastActivityTime)),
      new Date(),
      { locale },
    ).capitalize();
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
