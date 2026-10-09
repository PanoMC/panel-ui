<!-- Authorize Player Modal -->
<div class="modal fade" bind:this={$modalElement} tabindex="-1" aria-hidden="true">
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
            aria-label={$_('buttons.close')}
            on:click={hide}></button>
        </div>
        <div class="modal-body">
          <div class="vstack gap-2">
            <label for="authorizePlayerPermGroup"
              >{$_('components.modals.authorize-player.permission-group-label')}</label>
            <div class="hstack gap-2">
              <select
                class="form-control"
                id="authorizePlayerPermGroup"
                bind:value={$player.permissionGroup}>
                <option class="text-primary" value="-"
                  >{$_('components.modals.authorize-player.player')}</option>

                {#each $permissionGroups as permissionGroup, index (permissionGroup)}
                  <option value={permissionGroup.name}>{permissionGroup.name}</option>
                {/each}
              </select>

              <!-- Remove Button -->
              <button
                class="btn-close"
                aria-label={$_('buttons.remove')}
                title={$_('buttons.remove')}></button>
            </div>
            <!-- Add Button -->
            <button class="btn btn-primary btn-sm">{$_('buttons.add')} 1/1 </button>

            <label for="authorizePlayerPermissions"
              >{$_('components.modals.authorize-player.permissions-label')}</label>
            <div class="list-group">
              <label
                for="example-permission"
                class="list-group-item list-group-item-action d-flex justify-content-between align-items-center pe-auto">
                <!--              TODO: Icon system-->
                <!--              <Icon-->
                <!--                data="{icon[convertIconName(permission.iconName)]}"-->
                <!--                class="text-primary d-block m-auto" />-->

                Example Permission

                <div class="form-check form-switch">
                  <input type="checkbox" class="form-check-input" id="example-permission" />
                </div>
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-primary w-100"
            class:disabled={$submitLoading}
            on:click={onSubmit}>{$_('buttons.save')}</button>
        </div>
      {/if}
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from 'svelte/store';

  const modalElement = writable();
  const player = writable({});
  const loading = writable(true);
  const permissionGroups = writable([]);
  const defaultErrors = {
    'LAST_ADMIN': false,
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

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: 'static',
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

  // The permission group endpoints this unfinished modal called were removed with the permission
  // group rework (the groups are managed through /panel/permission/snapshot now), and nothing
  // opens the modal. It makes no request until it is wired to the snapshot API.
  function initData() {
    permissionGroups.set([]);
    loading.set(false);
  }
</script>

<script>
  import { _ } from 'svelte-i18n';

  import { showSuccess as showSuccessToast } from '$lib/components/ToastContainer.svelte';

  // No request: see initData. Saving only reports the chosen group to the caller.
  async function onSubmit() {
    hide();

    await callback(get(player));

    await showSuccessToast('components.toasts.player-authorized-success');
  }
</script>
