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

  .welcome-board .alert-link {
    text-decoration: none;
  }

  .welcome-board li:not(:last-child) {
    margin-bottom: 0.5rem;
  }

  @media (max-width: 991.98px) {
    .welcome-board li:not(:last-child) {
      margin-bottom: 1rem;
    }

    .welcome-board ul:not(.mb-0) {
      margin-bottom: 1rem;
    }
  }
</style>

<!-- Dashboard Page -->
<div class="container vstack gap-3">
  <!-- Welcome Alerts -->
  {#if data.gettingStartedBlocks.welcomeBoard}
    <div class="alert alert-secondary welcome-board alert-dismissible mb-0 border">
      <div class="row">
        <div class="mb-3 lead">
          {@html $_('pages.dashboard.welcome-card.description')}
        </div>
        <div class="col-lg-4">
          <ul class="list-unstyled">
            <li>
              <button
                type="button"
                class="alert-link focus-ring rounded border-0 bg-transparent p-0"
                data-bs-target="#connectServer"
                data-bs-toggle="modal">
                <i class="fa-solid fa-gamepad me-2"></i>
                {$_('pages.dashboard.welcome-card.connect-server')}
              </button>
            </li>
            <li>
              <a class="alert-link focus-ring rounded" href="{base}/migration">
                <i class="fa-solid fa-file-import me-2"></i>
                {$_('pages.dashboard.welcome-card.import-data')}
              </a>
            </li>
          </ul>
        </div>
        <div class="col-lg-4">
          <ul class="list-unstyled">
            <li>
              <a class="alert-link focus-ring rounded" href="{base}/posts/create-post">
                <i class="fa-solid fa-pen me-2"></i>
                {$_('pages.dashboard.welcome-card.publish-your-first-post')}
              </a>
            </li>
            <li>
              <a class="alert-link focus-ring rounded" href="{base}/view">
                <i class="fa-solid fa-brush me-2"></i>
                {$_('pages.dashboard.welcome-card.change-theme')}
              </a>
            </li>
            <li>
              <a class="alert-link focus-ring rounded" href="{base}/addons">
                <i class="fa-solid fa-puzzle-piece me-2"></i>
                {$_('pages.dashboard.welcome-card.manage-addons')}
              </a>
            </li>
            <li>
              <a class="alert-link focus-ring rounded" href="{base}/players">
                <i class="fa-solid fa-user-cog me-2"></i>{$_(
                  'pages.dashboard.welcome-card.manage-players',
                )}
              </a>
            </li>
          </ul>
        </div>
        <div class="col-lg-4">
          <ul class="list-unstyled mb-0">
            <li>
              <a
                class="alert-link focus-ring rounded"
                href="{PANO_WEBSITE_URL}/addons"
                target="_blank">
                <i class="fa-solid fa-bag-shopping me-2"></i>
                {$_('pages.dashboard.welcome-card.get-themes-and-extensions')}
              </a>
            </li>
            <li>
              <a
                class="alert-link focus-ring rounded"
                href="{PANO_WEBSITE_URL}/docs"
                target="_blank">
                <i class="fa-solid fa-arrow-up-right-from-square me-2"></i>
                {$_('pages.dashboard.welcome-card.documentations')}
              </a>
            </li>
            <li>
              <a class="alert-link focus-ring rounded" href={PANO_WEBSITE_URL} target="_blank">
                <i class="fa-solid fa-globe me-2"></i>
                {$_('pages.dashboard.welcome-card.website')}
              </a>
            </li>
            <li>
              <a
                class="alert-link focus-ring rounded"
                href="{PANO_WEBSITE_URL}/discord"
                target="_blank">
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
    <!-- Latest Registers Card -->
    {#if hasPermission(Permissions.MANAGE_PLAYERS)}
      <div class="ratio ratio-1x1">
        <div class="card mb-3">
          <CardHeader>
            <svelte:fragment slot="left"
              >{$_('pages.dashboard.last-registers.title')}</svelte:fragment>
            <svelte:fragment slot="right">
              <ViewAllLink href="{base}/players" />
            </svelte:fragment>
          </CardHeader>

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
                              class="rounded-circle"
                              height="32"
                              width="32"
                              src="/api/profile/picture/{player.username}?{$avatarVersion}" />
                          </a>
                          <a
                            class="text-decoration-none w-100 rounded focus-ring d-block text-truncate p-1"
                            use:tooltip={[$_('buttons.view'), { placement: 'bottom' }]}
                            aria-label={$_('buttons.view')}
                            title={player.username}
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

    <!-- Latest Tickets Card -->
    {#if hasPermission(Permissions.MANAGE_TICKETS)}
      <div class="ratio ratio-1x1">
        <div class="card mb-3">
          <CardHeader>
            <svelte:fragment slot="left"
              >{$_('pages.dashboard.last-tickets.title')}</svelte:fragment>
            <svelte:fragment slot="right">
              <ViewAllLink href="{base}/tickets" />
            </svelte:fragment>
          </CardHeader>

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
                              src="/api/profile/picture/{ticket.writer.username}?{$avatarVersion}"
                              alt={$_('pages.dashboard.last-tickets.player-name')}
                              class="rounded-circle"
                              height="32"
                              width="32" />
                          </a>
                          <a
                            class="text-decoration-none w-100 rounded focus-ring d-block text-truncate p-1"
                            href="{base}/tickets/detail/{ticket.id}"
                            title={ticket.title}
                            use:tooltip={[$_('buttons.view'), { placement: 'bottom' }]}
                            aria-label={$_('buttons.view')}>
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
        <CardHeader>
          <svelte:fragment slot="left">{$_('pages.dashboard.logs.title')}</svelte:fragment>
          <svelte:fragment slot="right">
            <ViewAllLink href="{base}/logs" />
          </svelte:fragment>
        </CardHeader>
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

    <!-- Pano Platform Info Card -->
    <div class="ratio ratio-1x1">
      <div class="card mb-3">
        <CardHeader>
          <svelte:fragment slot="left">{$_('pages.settings.about.info')}</svelte:fragment>
          <svelte:fragment slot="right">
            <ViewAllLink href="{base}/settings/about" />
          </svelte:fragment>
        </CardHeader>

        <div class="card-body overflow-auto">
          <form>
            <div class="row">
              <label class="col-6 col-form-label" for="panoVersion">
                {$_('pages.settings.about.version')}
              </label>
              <div class="col-6 col-form-label">
                <span
                  class="user-select-all font-monospace"
                  aria-describedby="panoVersion"
                  id="panoVersion">{data.about?.platformVersion || '-'}</span>
              </div>
            </div>
            <div class="row">
              <label class="col-6 col-form-label" for="panoRelease">
                {$_('pages.settings.about.release')}
              </label>
              <div class="col-6 col-form-label">
                <span aria-describedby="panoRelease" id="panoRelease"
                  >{data.about?.platformStage || '-'}</span>
              </div>
            </div>
            <div class="row mb-0">
              <label class="col-6 col-form-label" for="panoWebsite">
                {$_('pages.settings.about.website')}
              </label>
              <div class="col-6 col-form-label">
                <a
                  class="btn btn-sm btn-link px-0"
                  aria-describedby="panoWebsite"
                  aria-label={$_('pages.settings.about.website')}
                  href={PANO_WEBSITE_URL}
                  id="panoWebsite"
                  use:tooltip={[$_('pages.settings.about.website'), { placement: 'bottom' }]}
                  target="_blank">
                  <i class="fa-solid fa-up-right-from-square"></i>
                </a>
              </div>
            </div>
            <div class="row mb-0">
              <label class="col-6 col-form-label" for="panoDiscord">
                {$_('pages.settings.about.discord')}
              </label>
              <div class="col-6 col-form-label">
                <a
                  class="btn btn-sm btn-link px-0 text-decoration-none"
                  aria-describedby="panoWebsite"
                  aria-label="Discord"
                  href="{PANO_WEBSITE_URL}/discord"
                  id="panoWebsite"
                  use:tooltip={['Discord', { placement: 'bottom' }]}
                  target="_blank">
                  <i class="fab fa-discord fa-lg"></i>
                </a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Support Alert Card -->
    <div class="ratio ratio-1x1">
      <a
        href="{PANO_WEBSITE_URL}/source-code"
        target="_blank"
        class="alert alert-primary h-100 mb-0 d-flex flex-column blocks text-decoration-none border-primary hover-shadow">
        <h5 class="alert-heading">{$_('pages.settings.about.support-pano')} ❤️</h5>
        <p class="mb-0">
          {$_('pages.settings.about.support-pano-text')}
        </p>
        <div class="mt-auto d-flex align-items-center justify-content-between border-top border-primary border-opacity-25 pt-2">
          <div class="d-flex align-items-center text-primary">
            <i class="fa-brands fa-github fa-2x me-2"></i>
            <span class="fw-bold">{$_('pages.settings.about.support-pano-button')}</span>
          </div>
          <i class="fa-solid fa-arrow-up-right-from-square text-primary"></i>
        </div>
      </a>
    </div>
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

    const [dashboardResult, activityLogsResult, aboutResult] = await Promise.all([
      ApiUtil.get({
        path: `/api/panel/dashboard`,
        request: event,
      }).catch(() => null),
      ApiUtil.get({
        path: `/api/panel/logs/activity`,
        request: event,
      }).catch(() => null),
      ApiUtil.get({
        path: `/api/panel/settings?type=ABOUT`,
        request: event,
      }).catch(() => null),
    ]);

    const dashboard = dashboardResult?.result === 'ok' ? dashboardResult : {};
    const activityLogs = activityLogsResult?.result === 'ok' ? activityLogsResult : { data: [] };
    const about = aboutResult?.data || aboutResult || {};

    return {
      ...dashboard,
      activityLogs,
      about,
    };
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

  import NoContent from '$lib/components/NoContent.svelte';
  import { avatarVersion } from '$lib/Store';
  import TicketStatusBadge from '$lib/components/badges/TicketStatusBadge.svelte';
  import Date from '$lib/components/Date.svelte';

  import ActivityLogRow from '$lib/components/rows/ActivityLogRow.svelte';
  import ViewActivityLogModal, {
    show as showViewActivityLogModal,
    onHide as onViewActivityLogModalHide,
  } from '$lib/components/modals/ViewActivityLogModal.svelte';
  import { show as showWhatsNewModal } from '$lib/components/modals/WhatsNewModal.svelte';
  import CardHeader from '$lib/components/CardHeader.svelte';
  import PlayerStatusBadge from '$lib/components/badges/PlayerStatusBadge.svelte';
  import PlayerPermissionBadge from '$lib/components/badges/PlayerPermissionBadge.svelte';
  import ViewAllLink from '$lib/components/ViewAllLink.svelte';

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
    if (window.innerWidth >= 1200) {
      mansoryLayoutCols.set(4);
    } else if (window.innerWidth >= 992) {
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

  function getDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return url.replace(/^https?:\/\//, '');
    }
  }
</script>
