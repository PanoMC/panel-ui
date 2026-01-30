<style>
  .welcome-board {
    background-image:
      var(--welcome-gradient),
      url('/assets/img/MCV_SummerDrop_Hero_DotNet_Downloadable_Wallpaper_r1920x1080.png');
    background-size: cover;
    background-position: center;
    border: none;
    position: relative;
    overflow: hidden;
  }

  :global([data-bs-theme='light']) .welcome-board {
    --welcome-gradient: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.95) 20%,
      rgba(255, 255, 255, 0.5) 100%
    );
  }

  :global([data-bs-theme='dark']) .welcome-board,
  :global([data-bs-theme='copper']) .welcome-board {
    --welcome-gradient: linear-gradient(
      90deg,
      rgba(20, 22, 25, 0.95) 20%,
      rgba(20, 22, 25, 0.5) 100%
    );
  }

  @media (max-width: 991.98px) {
    .welcome-board {
      --welcome-gradient: linear-gradient(
        180deg,
        rgba(var(--bs-body-bg-rgb), 0.95) 40%,
        rgba(var(--bs-body-bg-rgb), 0.8) 100%
      ) !important;
    }
  }
</style>

<!-- Dashboard Page -->
<div class="container vstack gap-3">
  <!-- Welcome Alerts -->
  {#if true}
    <div
      class="alert alert-secondary alert-dismissible mb-0 animate__animated animate__zoomIn welcome-board border">
      <div class="row">
        <div class="mb-3">
          {@html $_('pages.dashboard.welcome-card.description')}
        </div>
        <div class="col-lg-4">
          <ul class="mb-0 list-unstyled">
            <li>
              <button
                type="button"
                class="btn btn-link alert-link p-0 border-0 text-start text-decoration-none"
                data-bs-target="#connectServer"
                data-bs-toggle="modal">
                <i class="fa-solid fa-gamepad me-2"></i>
                {$_('pages.dashboard.welcome-card.connect-server')}
              </button>
              <span class="d-block">
                {$_('pages.dashboard.welcome-card.connect-server-description')}
              </span>
            </li>
          </ul>
        </div>
        <div class="col-lg-4">
          <ul class="mb-0 list-unstyled">
            <li>
              <a class="alert-link" href="{base}/posts/create-post">
                <i class="fa-solid fa-pen me-2"></i>
                {$_('pages.dashboard.welcome-card.publish-your-first-post')}
              </a>
            </li>
            <li>
              <a class="alert-link" href="{base}/view">
                <i class="fa-solid fa-brush me-2"></i>
                {$_('pages.dashboard.welcome-card.change-theme')}
              </a>
            </li>
            <li>
              <a class="alert-link" href="{base}/addons">
                <i class="fa-solid fa-puzzle-piece me-2"></i>
                {$_('pages.dashboard.welcome-card.manage-addons')}
              </a>
            </li>
            <li>
              <a class="alert-link" href="{base}/players">
                <i class="fa-solid fa-user-cog me-2"></i>{$_(
                  'pages.dashboard.welcome-card.manage-players',
                )}
              </a>
            </li>
          </ul>
        </div>
        <div class="col-lg-4">
          <ul class="list-unstyled">
            <li>
              <a class="alert-link" href="{PANO_WEBSITE_URL}/addons" target="_blank">
                <i class="fa-solid fa-arrow-up-right-from-square me-2"></i>
                {$_('pages.dashboard.welcome-card.get-themes-and-extensions')}
              </a>
            </li>
            <li>
              <a class="alert-link" href="{PANO_WEBSITE_URL}/docs" target="_blank">
                <i class="fa-solid fa-arrow-up-right-from-square me-2"></i>
                {$_('pages.dashboard.welcome-card.documentations')}
              </a>
            </li>
            <li>
              <a class="alert-link" href={PANO_WEBSITE_URL} target="_blank">
                <i class="fa-solid fa-globe me-2"></i>
                {$_('pages.dashboard.welcome-card.website')}
              </a>
            </li>
            <li>
              <a class="alert-link" href="{PANO_WEBSITE_URL}/discord" target="_blank">
                <i class="fab fa-discord me-2"></i>
                {$_('pages.dashboard.welcome-card.discord')}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <button
        type="button"
        title={$_('buttons.close')}
        class="btn-close"
        data-bs-dismiss="alert"
        on:click={onCloseGettingStartedCard}>
      </button>
    </div>
  {/if}

  <!-- Masonry Layout for Cards -->
  <masonry-layout cols={$mansoryLayoutCols} gap="16">
    <!-- Latest Tickets Card -->
    {#if hasPermission(Permissions.MANAGE_TICKETS)}
      <div class="ratio ratio-1x1">
        <div class="card mb-3">
          <div class="card-header">
            {$_('pages.dashboard.last-tickets.title')}
          </div>

          <div class="card-body p-0 overflow-auto">
            {#if data.tickets.length === 0}
              <NoContent />
            {:else}
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  {#each data.tickets as ticket, index (ticket)}
                    <tbody>
                      <tr>
                        <td class="align-middle text-nowrap d-flex align-items-center">
                          <a
                            class="focus-ring rounded-circle d-inline-block me-2"
                            use:tooltip={[ticket.writer.username, { placement: 'bottom' }]}
                            href="{base}/players/detail/{ticket.writer.username}">
                            <img
                              src="https://minotar.net/avatar/{ticket.writer.username}/32"
                              alt={$_('pages.dashboard.last-tickets.player-name')}
                              class="rounded-circle animate__animated animate__zoomIn"
                              height="32"
                              width="32" />
                          </a>
                          <a
                            class="text-decoration-none w-100 rounded focus-ring d-block text-truncate p-1"
                            href="{base}/tickets/detail/{ticket.id}"
                            title={$_('buttons.view')}>
                            {ticket.title}
                          </a>
                        </td>
                        <td class="align-middle text-nowrap">
                          <TicketStatusBadge status={ticket.status} />
                        </td>
                      </tr>
                    </tbody>
                  {/each}
                </table>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}

    <!-- Latest Activity Logs Card -->
    <div class="ratio ratio-1x1">
      <div class="card mb-3">
        <div class="card-header">
          {$_('pages.dashboard.logs.title')}
        </div>
        <div class="card-body p-0 overflow-auto">
          <ul class="list-group list-group-flush">
            {#each data.activityLogs.data as log, index (log)}
              <ActivityLogRow {log} on:click={onShowViewActivityLogModalClick} />
            {:else}
              <NoContent />
            {/each}
          </ul>
        </div>
      </div>
    </div>

    <!-- Latest Registers Card -->
    {#if hasPermission(Permissions.MANAGE_PLAYERS)}
      <div class="ratio ratio-1x1">
        <div class="card mb-3">
          <div class="card-header">
            {$_('pages.dashboard.last-registers.title')}
          </div>

          <div class="card-body p-0 overflow-auto">
            {#if data.lastRegisters.length === 0}
              <NoContent />
            {:else}
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  {#each data.lastRegisters as player, index (player)}
                    <tbody>
                      <tr>
                        <td class="align-middle text-nowrap d-flex align-items-center">
                          <a
                            class="focus-ring rounded-circle d-inline-block me-2"
                            use:tooltip={[player.username, { placement: 'bottom' }]}
                            href="{base}/players/detail/{player.username}">
                            <img
                              alt={player.username}
                              class="rounded-circle animate__animated animate__zoomIn"
                              height="32"
                              width="32"
                              src="https://minotar.net/avatar/{player.username}" />
                          </a>
                          <a
                            class="text-decoration-none w-100 rounded focus-ring d-block text-truncate p-1"
                            title={$_('buttons.view')}
                            href="{base}/players/detail/{player.username}">
                            {player.username}
                          </a>
                        </td>
                        <td class="align-middle">
                          <PlayerStatusBadge
                            banned={player.banned}
                            lastActivityTime={player.lastActivityTime}
                            inGame={player.inGame}
                            checkTime={0} />
                        </td>
                      </tr>
                    </tbody>
                  {/each}
                </table>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </masonry-layout>
</div>

<ViewActivityLogModal />

<script context="module">
  import ApiUtil from '$lib/api.util.js';

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const { parent } = event;
    await parent();

    const [dashboard, activityLogs] = await Promise.all([
      ApiUtil.get({
        path: `/api/panel/dashboard`,
        request: event,
      }),
      ApiUtil.get({
        path: `/api/panel/logs/activity`,
        request: event,
      }),
    ]);

    return { ...dashboard, activityLogs };
  }
</script>

<script>
  import { getContext, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { writable } from 'svelte/store';

  import { base } from '$app/paths';

  import { hasPermission, Permissions } from '$lib/auth.util';
  import tooltip from '$lib/tooltip.util';

  import { PANO_WEBSITE_URL } from '$lib/variables.js';

  import NoContent from '$lib/component/NoContent.svelte';
  import TicketStatusBadge from '$lib/component/badges/TicketStatusBadge.svelte';
  import Date from '$lib/component/Date.svelte';

  import ActivityLogRow from '$lib/component/rows/ActivityLogRow.svelte';
  import ViewActivityLogModal, {
    show as showViewActivityLogModal,
    onHide as onViewActivityLogModalHide,
  } from '$lib/component/modals/ViewActivityLogModal.svelte';
  import CardHeader from '$lib/component/CardHeader.svelte';
  import PlayerStatusBadge from '$lib/component/badges/PlayerStatusBadge.svelte';
  import PlayerPermissionBadge from '$lib/component/badges/PlayerPermissionBadge.svelte';

  export let data;

  const pageTitle = getContext('pageTitle');

  pageTitle.set('pages.dashboard.title');

  function onCloseGettingStartedCard() {
    ApiUtil.post({
      path: '/api/panel/dashboard/closeGettingStartedCard',
      handler: () => {},
    });
  }

  function onShowViewActivityLogModalClick(event) {
    const log = event.detail.log;

    log.selected = true;

    data.activityLogs.data = data.activityLogs.data;

    showViewActivityLogModal(log);
  }

  onViewActivityLogModalHide((log) => {
    const _log = data.activityLogs.data.find((_log) => _log.id === log.id);

    _log.selected = false;

    data.activityLogs.data = data.activityLogs.data;
  });

  const mansoryLayoutCols = writable(2);

  function checkMobile() {
    if (window.innerWidth >= 992) {
      mansoryLayoutCols.set(3);
    } else if (window.innerWidth >= 768) {
      mansoryLayoutCols.set(2);
    } else {
      mansoryLayoutCols.set(1);
    }
  }

  onMount(() => {
    checkMobile();

    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  });
</script>
