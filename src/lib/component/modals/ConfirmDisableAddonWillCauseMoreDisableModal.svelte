<!-- Post Category Delete Confirmation Modal -->
<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-body text-center">
        <div class="pb-3">
          <i class="fas fa-question-circle fa-3x d-block m-auto text-gray"></i>
        </div>
        {$_('components.modals.confirm-disable-addon-will-cause-more-disable.title', {
          values: { pluginId: $plugin.id },
        })}
        <div class="mt-3 alert alert-warning text-left">
          {$_('components.modals.confirm-disable-addon-will-cause-more-disable.description', {
            values: { pluginId: $plugin.id },
          })}
          <br />
          <br />
          {#each $plugin.dependents as addon, index (addon)}
            <a
              class="badge bg-warning rounded-pill"
              href="{base}/addons/detail/{addon}"
              target="_blank">
              {addon}
            </a>
          {/each}
        </div>
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

<script context="module">
  import { writable, get } from 'svelte/store';

  const modalElement = writable();
  const plugin = writable({ dependents: [] });

  let callback = (plugin) => {};
  let hideCallback = (plugin) => {};
  let modal;

  export function show(newPlugin) {
    plugin.set(newPlugin);

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: 'static',
      keyboard: false,
    });

    modal.show();
  }

  export function setCallback(newCallback) {
    callback = newCallback;
  }

  export function hide() {
    hideCallback(get(plugin));

    modal.hide();
  }

  export function onHide(newCallback) {
    hideCallback = newCallback;
  }
</script>

<script>
  import { base } from '$app/paths';
  import { _ } from 'svelte-i18n';

  let loading = false;

  function refreshBrowserPage() {
    location.reload();
  }

  const hideMethod = () => {
    hide();
    loading = false;
  };

  async function onYesClick() {
    loading = true;

    callback(get(plugin), hideMethod);
  }
</script>
