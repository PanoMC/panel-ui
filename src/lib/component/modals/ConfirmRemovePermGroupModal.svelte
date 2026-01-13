<script context="module">
  import { get, writable } from 'svelte/store';

  const modalElement = writable();
  const group = writable(null);
  const nodesStore = writable([]);

  let callback = (group) => {};
  let hideCallback = () => {};
  let modal;

  export function show(newGroup, nodes = []) {
    group.set(newGroup || null);
    nodesStore.set(nodes || []);

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: 'static',
      keyboard: false,
    });
    modal.show();
  }

  export function hide() {
    hideCallback();
    modal?.hide();
  }

  export function setCallback(newCallback) {
    callback = newCallback;
  }

  export function onHide(newCallback) {
    hideCallback = newCallback;
  }
</script>

<script>
  import { _ } from 'svelte-i18n';

  let loading = false;

  $: isAdminGroup = ($nodesStore || []).some(
    (n) => n.holderType === 'GROUP' && n.holderId === $group?.id && n.node === '*' && n.active !== false,
  );

  $: totalAdminGroups = ($nodesStore || [])
    .filter((n) => n.holderType === 'GROUP' && n.node === '*' && n.active !== false)
    .map((n) => n.holderId)
    .filter((v, i, a) => a.indexOf(v) === i).length;

  $: isOnlyAdminGroup = isAdminGroup && totalAdminGroups === 1;

  function onYesClick() {
    if (loading) return;
    loading = true;

    callback($group);
    hide();

    loading = false;
  }
</script>

<!-- Confirm Remove Permission Group Modal -->
<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-body text-center">
        <div class="pb-3">
          <i
            class="fas {isAdminGroup ? 'fa-exclamation-triangle text-warning' : 'fa-question-circle text-gray'} fa-3x d-block m-auto"></i>
        </div>
        <div class="mb-3">
          {$_('components.modals.confirm-remove-perm-group.title', {
            values: { groupName: $group?.displayName || $group?.name || '-' },
          })}
        </div>
        {#if isAdminGroup}
          <div class="alert {isOnlyAdminGroup ? 'alert-danger' : 'alert-warning'} py-2 small mb-0">
            <i class="fas fa-shield-alt me-2"></i>
            {isOnlyAdminGroup
              ? $_('pages.permissions.panel.nodes.admin-group-last-warning')
              : $_('pages.permissions.panel.nodes.admin-group-delete-warning')}
          </div>
        {/if}
      </div>
      <div class="modal-footer flex-nowrap">
        <button
          class="btn btn-link col-6 m-0"
          type="button"
          class:disabled={loading}
          on:click={hide}>
          {$_('buttons.cancel')}
        </button>
        <button
          class="btn btn-danger col-6 m-0"
          type="button"
          class:disabled={loading}
          on:click={onYesClick}>
          {$_('buttons.yes')}
        </button>
      </div>
    </div>
  </div>
</div>
