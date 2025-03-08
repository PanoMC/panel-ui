<div class="container vstack gap-3">
  <div class="card">
    <div class="card-body">
      <h5 class="card-title">Logs ({data.meta.totalCount})</h5>

      {#if data.meta.totalCount === 0}
        <NoContent />
      {:else}
        {#each data.data as log, index (log)}
          <ul>
            <li>{log.type}</li>
          </ul>
        {/each}
      {/if}

      <!-- Pagination -->
      <Pagination
        page="{data.meta.page}"
        totalPage="{data.meta.totalPage}"
        on:firstPageClick="{() => onPageClick(1)}"
        on:lastPageClick="{() => onPageClick(data.meta.totalPage)}"
        on:pageLinkClick="{(event) => onPageClick(event.detail.page)}" />
    </div>
  </div>
</div>

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
      page
    });

    const body = await ApiUtil.get({
      path: `/api/panel/logs/activity` + queryParams,
      request: event,
    })

    if (body.error) {
      if (body.error === "PAGE_NOT_FOUND") {
        throw error(404, body.error);
      }

      throw error(500, body.error);
    }

    body.meta.page = page;

    return { ...body };
  }
</script>

<script>
  import { getContext } from "svelte";
  import Pagination from "$lib/component/Pagination.svelte";
  import { buildQueryParams } from "../../pano-ui/js/api.util.js";
  import { goto } from "$app/navigation";
  import NoContent from "$lib/component/NoContent.svelte";

  export let data;

  const pageTitle = getContext("pageTitle");

  pageTitle.set("pages.logs.title");

  async function refreshData() {
    const queryParams = buildQueryParams({
      page: data.page
    });

    await goto(queryParams, { invalidateAll: true });
  }

  async function onPageClick(page) {
    data.page = page;

    await refreshData();
  }
</script>