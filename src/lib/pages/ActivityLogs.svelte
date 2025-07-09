<div class="container vstack gap-3">
  <div class="card">
    <div class="card-header">{$_('pages.activity-logs.title')} ({data.meta.totalCount})</div>
    <div class="card-body">
      {#if data.meta.totalCount === 0}
        <NoContent />
      {:else}
        <div class="list-group">
          {#each data.logs as log, index (log)}
            <ActivityLogRow log="{log}" on:click={onShowViewActivityLogModalClick}/>
          {/each}
        </div>
      {/if}
    </div>
    <div class="card-footer">
      <!-- Pagination -->
      <Pagination
        page={data.meta.page}
        totalPage={data.meta.totalPage}
        on:firstPageClick={() => onPageClick(1)}
        on:lastPageClick={() => onPageClick(data.meta.totalPage)}
        on:pageLinkClick={(event) => onPageClick(event.detail.page)} />
    </div>
  </div>
</div>

<ViewActivityLogModal/>

<script context="module">
  import ApiUtil from "$lib/api.util.js";
  import { error } from "@sveltejs/kit";

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

    const queryParams = buildQueryParams({
      page,
    });

    const body = await ApiUtil.get({
      path: `/api/panel/logs/activity` + queryParams,
      request: event,
    });

    if (body.error) {
      if (body.error === "PAGE_NOT_FOUND") {
        throw error(404, body.error);
      }

      throw error(500, body.error);
    }

    return { logs: body.data, meta: { ...body.meta, page } };
  }
</script>

<script>
  import { getContext } from "svelte";
  import { _ } from "svelte-i18n";

  import { goto } from "$app/navigation";

  import { buildQueryParams } from "$lib/api.util.js";

  import Pagination from "$lib/component/Pagination.svelte";
  import NoContent from "$lib/component/NoContent.svelte";
  import ActivityLogRow from "$lib/component/rows/ActivityLogRow.svelte";
  import ViewActivityLogModal, {
    show as showViewActivityLogModal,
    onHide as onViewActivityLogModalHide,
  } from "$lib/component/modals/ViewActivityLogModal.svelte";

  export let data;

  const pageTitle = getContext("pageTitle");

  pageTitle.set("pages.activity-logs.title");

  async function refreshData() {
    const queryParams = buildQueryParams({
      page: data.page,
    });

    await goto(queryParams, { invalidateAll: true });
  }

  async function onPageClick(page) {
    data.page = page;

    await refreshData();
  }

  function onShowViewActivityLogModalClick(event) {
    const log = event.detail.log

    log.selected = true;

    data.logs = data.logs

    showViewActivityLogModal(log);
  }

  onViewActivityLogModalHide((log) => {
    const _log = data.logs.find((_log) => _log.id === log.id)

    _log.selected = false;

    data.logs = data.logs
  });
</script>
