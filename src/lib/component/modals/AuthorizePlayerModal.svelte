<!-- Authorize Player Modal -->
<div class="modal fade" id="{dialogID}" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      {#if $loading}
        <div class="modal-body">
          <div class="text-center">
            <div class="spinner-border text-primary" role="status"></div>
          </div>
        </div>
      {:else}
        <div class="modal-header">
          <h5 class="modal-title" id="exampleModalLabel">
            {$_('components.modals.authorize-player.title')}
          </h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="{$_('buttons.close')}"
            on:click="{hide}"></button>
        </div>
        <div class="modal-body">
          <select
            class="form-control"
            id="selectPermGroup"
            bind:value="{$player.permissionGroup}">
            <option class="text-primary" value="-">{$_('components.modals.authorize-player.player')}</option>

            {#each $permissionGroups as permissionGroup, index (permissionGroup)}
              <option value="{permissionGroup.name}"
                >{permissionGroup.name}</option>
            {/each}
          </select>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-primary w-100"
            class:disabled="{$submitLoading}"
            on:click="{onSubmit}">{$_('buttons.save')}</button>
        </div>
      {/if}
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from "svelte/store";

  import ApiUtil from "$lib/api.util";

  const dialogID = "authorizePlayerModal";
  const player = writable({});
  const loading = writable(true);
  const permissionGroups = writable([]);
  const defaultErrors = {
    "LAST_ADMIN": false,
  };
  const errors = writable(defaultErrors);
  const submitLoading = writable(false);

  let callback = async (player) => {};
  let hideCallback = (player) => {};
  let modal;

  export function show(newPlayer) {
    player.set(Object.assign({}, newPlayer));
    errors.set(defaultErrors);
    submitLoading.set(false);

    initData();

    modal = new window.bootstrap.Modal(document.getElementById(dialogID), {
      backdrop: "static",
      keyboard: false,
    });
    modal.show();
  }

  export function hide() {
    if (!get(loading)) {
      hideCallback(get(player));

      modal.hide();
    }
  }

  export function setCallback(newCallback) {
    callback = newCallback;
  }

  export function onHide(newCallback) {
    hideCallback = newCallback;
  }

  function initData() {
    loading.set(true);

    ApiUtil.get({
      path: "/api/panel/permissionGroups",
      handler: (body, reject) => {
        if (body.error) {
          reject()

          return;
        }

        permissionGroups.set(body.permissionGroups);
        loading.set(false);
      }
    })
  }
</script>

<script>
  import { _ } from "svelte-i18n";

  import { show as showToast } from "$lib/component/ToastContainer.svelte";

  function onSubmit() {
    submitLoading.set(true);

    ApiUtil.put({
      path: `/api/panel/players/${get(player).username}/permissionGroup`,
      body: {
        permissionGroup: get(player).permissionGroup,
      },
      handler: async (body, reject) => {
        if (body.result === "ok") {
          submitLoading.set(false);

          hide();

          await callback(get(player));

          await showToast('components.toasts.player-authorized-success');

          return;
        } else if (body.result === "NOT_EXISTS") {
          location.reload();

          return;
        } else if (body.errors) {
          errors.set(body.errors);

          return;
        } else if (body.error) {
          location.reload();

          return;
        }

        reject();
      }
    })
  }
</script>
