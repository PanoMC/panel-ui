<!-- Permission Group Delete Confirmation Modal -->
<div
  aria-hidden="true"
  class="modal fade"
  bind:this={$modalElement}
  role="dialog"
  tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-body text-center">
        <div class="pb-3">
          <i class="fas fa-question-circle fa-3x d-block m-auto text-gray"></i>
        </div>
        {$_("components.modals.confirm-delete-permission-group.title")}

        {#if $permissionGroup.userCount > 0}
          <div class="mt-3 alert alert-warning">
            {$_(
              "components.modals.confirm-delete-permission-group.description",
            )}
            <br />
            <br />
            <span class="badge bg-warning rounded-pill mr-1">
              {$permissionGroup.name}
            </span>
            <div
              class="d-flex flex-row flex-row-reverse justify-content-center align-items-center mt-3 mr-3">
              {#if $permissionGroup.userCount > 3}
                <small class="pl-1">+{$permissionGroup.userCount - 3}</small>
              {/if}

              {#each $permissionGroup.users as user, index (user)}
                <span
                  class="overlapping-avatar"
                  use:tooltip={[user, { placement: "bottom" }]}>
                  <a href="{base}/players/player/{user}">
                    <img
                      src="https://minotar.net/avatar/{user}"
                      width="32"
                      height="32"
                      alt={user} />
                  </a>
                </span>
              {/each}
            </div>
          </div>
        {/if}
      </div>
      <div class="modal-footer">
        <button
          class="btn btn-link"
          type="button"
          class:disabled={loading}
          on:click={hide}>
          {$_("buttons.cancel")}
        </button>
        <button
          class="btn btn-danger"
          type="button"
          class:disabled={loading}
          on:click={onYesClick}>
          {$_("buttons.yes")}
        </button>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from "svelte/store";

  const modalElement = writable();
  const permissionGroup = writable({
    id: -1,
    name: "",
    users: [],
    userCount: 0,
  });

  let callback = (permissionGroup) => {};
  let hideCallback = (permissionGroup) => {};
  let modal;

  export function show(newPermissionGroup) {
    permissionGroup.set(newPermissionGroup);

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: "static",
      keyboard: false,
    });
    modal.show();
  }

  export function setCallback(newCallback) {
    callback = newCallback;
  }

  export function hide() {
    hideCallback(get(permissionGroup));

    modal.hide();
  }

  export function onHide(newCallback) {
    hideCallback = newCallback;
  }
</script>

<script>
  import { base } from "$app/paths";

  import ApiUtil from "$lib/api.util";
  import tooltip from "$lib/tooltip.util";
  import { _ } from "svelte-i18n";

  let loading = false;

  function refreshBrowserPage() {
    location.reload();
  }

  function onYesClick() {
    loading = true;

    ApiUtil.delete({
      path: `/api/panel/permissions/${get(permissionGroup).id}`,
      handler: (body, reject) => {
        if (body.error) {
          refreshBrowserPage();
          return;
        }

        loading = false;

        hide();

        //TODO TOAST

        callback(get(permissionGroup));
      },
    });
  }
</script>
