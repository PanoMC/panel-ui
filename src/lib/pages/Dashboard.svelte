<!-- Dashboard Page -->
<div class="container vstack gap-3">
  <!-- Welcome Alerts -->
  {#if data.gettingStartedBlocks.welcomeBoard}
    <div
      class="alert alert-success alert-dismissible animate__animated animate__zoomIn">
      <div class="row">
        <h5 class="mb-3">
          {@html $_("pages.dashboard.welcome-card.description")}
        </h5>
        <div class="col-lg-4">
          <ul class="mb-0">
            <li>
              <a
                href="javascript:void(0)"
                class="alert-link"
                data-bs-target="#connectServer"
                data-bs-toggle="modal">
                <i class="fa-solid fa-gamepad me-2"></i>
                {$_("pages.dashboard.welcome-card.connect-server")}
              </a>
              <span class="d-block">
                {$_("pages.dashboard.welcome-card.connect-server-description")}
              </span>
            </li>
          </ul>
        </div>
        <div class="col-lg-4">
          <ul class="mb-0">
            <li>
              <a class="alert-link" href="{base}/posts/create-post">
                <i class="fa-solid fa-pen me-2"></i>
                {$_("pages.dashboard.welcome-card.publish-your-first-post")}
              </a>
            </li>
            <li>
              <a class="alert-link" href="{base}/view">
                <i class="fa-solid fa-brush me-2"></i>
                {$_("pages.dashboard.welcome-card.change-theme")}
              </a>
            </li>
            <li>
              <a class="alert-link" href="{base}/addons">
                <i class="fa-solid fa-puzzle-piece me-2"></i>
                {$_("pages.dashboard.welcome-card.manage-addons")}
              </a>
            </li>
            <li>
              <a class="alert-link" href="{base}/players">
                <i class="fa-solid fa-user-cog me-2"></i>{$_(
                  "pages.dashboard.welcome-card.manage-players",
                )}
              </a>
            </li>
          </ul>
        </div>
        <div class="col-lg-4">
          <ul>
            <li>
              <a
                class="alert-link"
                href="{PANO_WEBSITE_URL}/addons"
                target="_blank">
                <i class="fa-solid fa-arrow-up-right-from-square me-2"></i>
                {$_("pages.dashboard.welcome-card.get-themes-and-extensions")}
              </a>
            </li>
            <li>
              <a
                class="alert-link"
                href="{PANO_WEBSITE_URL}/docs"
                target="_blank">
                <i class="fa-solid fa-arrow-up-right-from-square me-2"></i>
                {$_("pages.dashboard.welcome-card.documentations")}
              </a>
            </li>
            <li>
              <a class="alert-link" href={PANO_WEBSITE_URL} target="_blank">
                <i class="fa-solid fa-globe me-2"></i>
                {$_("pages.dashboard.welcome-card.website")}
              </a>
            </li>
            <li>
              <a
                class="alert-link"
                href="{PANO_WEBSITE_URL}/discord"
                target="_blank">
                <i class="fab fa-discord me-2"></i>
                {$_("pages.dashboard.welcome-card.discord")}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <button
        type="button"
        title={$_("buttons.close")}
        class="btn-close"
        data-bs-dismiss="alert"
        on:click={onCloseGettingStartedCard}></button>
    </div>
  {/if}
  <div class="row g-3">
    <div class="col-lg-6">
      <!-- Latest Tickets -->
      {#if hasPermission(Permissions.MANAGE_TICKETS)}
        <div class="card">
          <div class="card-header">
            {$_("pages.dashboard.last-tickets.title")}
          </div>

          <div class="card-body">
            {#if data.tickets.length === 0}
              <NoContent />
            {:else}
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  {#each data.tickets as ticket, index (ticket)}
                    <tbody>
                      <tr>
                        <td class="align-middle">
                          <a
                            use:tooltip={[
                              ticket.writer.username,
                              { placement: "bottom" },
                            ]}
                            href="{base}/players/detail/{ticket.writer
                              .username}">
                            <img
                              src="https://minotar.net/avatar/{ticket.writer
                                .username}/32"
                              alt={$_(
                                "pages.dashboard.last-tickets.player-name",
                              )}
                              class="rounded-circle animate__animated animate__zoomIn"
                              height="32"
                              width="32" />
                          </a>
                        </td>
                        <td class="align-middle text-nowrap">
                          <a
                            href="{base}/tickets/detail/{ticket.id}"
                            title={$_("buttons.view")}
                            >#{ticket.id} {ticket.title}</a>
                        </td>
                        <td class="align-middle text-nowrap">
                          <TicketStatusBadge status={ticket.status} />
                        </td>
                        <td class="align-middle text-nowrap"
                          ><span><Date time={ticket.lastUpdate} /></span></td>
                      </tr>
                    </tbody>
                  {/each}
                </table>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
    <div class="col-lg-6">
      <div class="card">
        <CardHeader>
          <div slot="left">
            {$_("pages.dashboard.logs.title")}
          </div>
          <div slot="right">
            {#if data.activityLogs.meta.totalCount > 10}
              <a href="{base}/logs" class="btn btn-sm btn-outline-primary"
                >{$_("buttons.show-all")} ({data.activityLogs.meta
                  .totalCount})</a>
            {/if}
          </div>
        </CardHeader>
        <div class="card-body">
          <ul class="list-group mb-0">
            {#each data.activityLogs.data as log, index (log)}
              <ActivityLogRow
                log={log}
                on:click={onShowViewActivityLogModalClick} />
            {/each}
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>

<ViewActivityLogModal />

<script context="module">
  import ApiUtil from "$lib/api.util.js";

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
  import { getContext } from "svelte";
  import { _ } from "svelte-i18n";

  import { base } from "$app/paths";

  import { hasPermission, Permissions } from "$lib/auth.util";
  import tooltip from "$lib/tooltip.util";

  import { PANO_WEBSITE_URL } from "$lib/variables.js";

  import NoContent from "$lib/component/NoContent.svelte";
  import TicketStatusBadge from "$lib/component/badges/TicketStatusBadge.svelte";
  import Date from "$lib/component/Date.svelte";

  import ActivityLogRow from "$lib/component/rows/ActivityLogRow.svelte";
  import ViewActivityLogModal, {
    show as showViewActivityLogModal,
    onHide as onViewActivityLogModalHide,
  } from "$lib/component/modals/ViewActivityLogModal.svelte";
  import CardHeader from "$lib/component/CardHeader.svelte";

  export let data;

  const pageTitle = getContext("pageTitle");

  pageTitle.set("pages.dashboard.title");

  function onCloseGettingStartedCard() {
    ApiUtil.post({
      path: "/api/panel/dashboard/closeGettingStartedCard",
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
</script>
