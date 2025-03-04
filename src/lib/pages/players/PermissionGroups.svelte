<!-- Action Menu -->
<div class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions>
    <a
      href="{base}/players/perm-groups/create"
      class="btn btn-secondary"
      slot="right">
      <i class="fas fa-plus me-2"></i>
      {$_("pages.permission-groups.create-permission-group-button")}
    </a>
  </PageActions>

  <div class="card">
      <div class="card-header">
        {$_("pages.permission-groups.card-title", {
          values: { count: data.permissionGroupCount },
        })}
      </div>
    <div class="card-body">
      <!-- Permissions Table -->

      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              <th class="align-middle text-nowrap" scope="col"></th>
              <th class="align-middle text-nowrap" scope="col"
                >{$_("pages.permission-groups.name")}</th>
              <th class="align-middle text-nowrap" scope="col"
                >{$_("pages.permission-groups.permission-amount")}</th>
              <th class="align-middle text-nowrap" scope="col"
                >{$_("pages.permission-groups.player-amount")}</th>
            </tr>
          </thead>
          <tbody>
            {#each data.permissionGroups as permissionGroup, index (permissionGroup)}
              <PermissionGroupRow
                permissionGroup="{permissionGroup}"
                on:deleteClick="{(event) =>
                  onShowDeletePermissionGroupModalClick(
                    event.detail.permissionGroup,
                  )}" />
            {/each}
          </tbody>
        </table>
        <!-- Pagination -->
        <Pagination
          page="{data.page}"
          totalPage="{data.totalPage}"
          on:firstPageClick="{() => onPageClick(1)}"
          on:lastPageClick="{() => onPageClick(data.totalPage)}"
          on:pageLinkClick="{(event) => onPageClick(event.detail.page)}" />
        <!-- Pagination End -->
      </div>
    </div>
  </div>
</div>

<ConfirmDeletePermissionGroupModal />

<script context="module">
  import ApiUtil, { buildQueryParams } from "$lib/api.util.js";
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

    const page = searchParams.get("page") || 1;

    const queryParams = buildQueryParams({
      page,
    });
    const body = await ApiUtil.get({
      path: `/api/panel/permissionGroups` + queryParams,
      request: event,
    });

    if (body.error) {
      if (body.error === "PAGE_NOT_FOUND") {
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

  import { base } from "$app/paths";
  import { goto } from "$app/navigation";

  import ConfirmDeletePermissionGroupModal, {
    setCallback as setDeletePermissionGroupModalCallback,
    show as showDeletePermissionGroupModal,
    onHide as onDeletePermissionGroupModalHide,
  } from "$lib/component/modals/ConfirmDeletePermissionGroupModal.svelte";

  import Pagination from "$lib/component/Pagination.svelte";
  import PermissionGroupRow from "$lib/component/rows/PermissionGroupRow.svelte";
  import PageActions from "$lib/component/PageActions.svelte";
  import CardHeader from "$lib/component/CardHeader.svelte";

  export let data;

  const pageTitle = getContext("pageTitle");

  pageTitle.set("pages.permission-groups.title");

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

  onDeletePermissionGroupModalHide((newPermissionGroup) => {
    data.permissionGroups.forEach((permissionGroup) => {
      if (permissionGroup.id === newPermissionGroup.id) {
        permissionGroup.selected = false;
      }
    });

    data.permissionGroups = data.permissionGroups;
  });

  function onShowDeletePermissionGroupModalClick(permissionGroup) {
    data.permissionGroups[
      data.permissionGroups.indexOf(permissionGroup)
    ].selected = true;
    showDeletePermissionGroupModal(permissionGroup);
  }

  setDeletePermissionGroupModalCallback((newPermissionGroup) => {
    data.permissionGroups.forEach((permissionGroup) => {
      if (permissionGroup.id === newPermissionGroup.id) {
        permissionGroup.selected = false;
      }
    });

    data.permissionGroups = data.permissionGroups;

    refreshData();
  });
</script>
