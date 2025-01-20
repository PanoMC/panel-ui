<!-- Action Menu -->
<div class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions>
    <a class="btn btn-link" role="button" href="{base}/players" slot="left">
      <i class="fas fa-arrow-left me-2"></i>
      {$_("pages.permission-groups.players")}
    </a>
    <a
      href="{base}/players/perm-groups/create"
      class="btn btn-secondary"
      slot="right">
      <i class="fas fa-plus me-2"></i>
      {$_("pages.permission-groups.create-permission-group-button")}
    </a>
  </PageActions>

  <div class="card">
    <div class="card-body">
      <!-- Permissions Table -->
      <CardHeader>
        <h5 class="card-title" slot="left">
          {$_("pages.permission-groups.card-title", {
            values: { count: data.permissionGroupCount },
          })}
        </h5>
      </CardHeader>

      <div class="table-responsive">
        <table class="table table-hover mb-0">
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
          on:firstPageClick="{() => reloadData(1)}"
          on:lastPageClick="{() => reloadData(data.totalPage)}"
          on:pageLinkClick="{(event) => reloadData(event.detail.page)}" />
        <!-- Pagination End -->
      </div>
    </div>
  </div>
</div>

<ConfirmDeletePermissionGroupModal />

<script context="module">
  import ApiUtil from "$lib/api.util.js";
  import { showNetworkErrorOnCatch } from "$lib/Store.js";
  import { error } from "@sveltejs/kit";

  async function loadData({ request, page }) {
    return new Promise((resolve, reject) => {
      ApiUtil.get({
        path: `/api/panel/permissionGroups?page=${page}`,
        request,
      }).then((body) => {
        if (body.result === "ok") {
          body.page = parseInt(page);

          resolve(body);
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
      permissions: [],
      permissionGroups: [],
      permissionGroupCount: 0,
      permissionGroupPerms: {},
      totalPage: 1,
      page: 1,
    };

    if (parentData.NETWORK_ERROR) {
      return data;
    }

    await loadData({ request: event, page: event.params.page || 1 })
      .then((body) => {
        data = { ...data, ...body };
      })
      .catch((body) => {
        if (body.error) {
          if (body.error === "PAGE_NOT_FOUND") {
            throw error(404, body.error);
          }

          throw error(500, body.error);
        }
      });

    return data;
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

  function reloadData(page = data.page) {
    showNetworkErrorOnCatch((resolve, reject) => {
      loadData({ page })
        .then((loadedData) => {
          resolve();

          if (page !== data.page) {
            goto(base + "/players/perm-groups/" + page);
          } else {
            data = loadedData;
          }
        })
        .catch((body) => {
          if (body.error === "PAGE_NOT_FOUND") {
            resolve();

            reloadData(page - 1);
          } else {
            reject();
          }
        });
    });
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

    reloadData();
  });
</script>
