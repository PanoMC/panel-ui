<!-- Updating the Pano plugin by hand, for the one case Pano cannot do it: a linked server whose
     plugin is too old to replace itself (or is not connected to be asked). The jar is the build
     Pano would have installed; once it runs, the next update is one click again. -->
<div
  class="modal fade"
  tabindex="-1"
  aria-hidden="true"
  aria-labelledby="panoPluginUpdateTitle"
  bind:this={modalElement}>
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title text-capitalize" id="panoPluginUpdateTitle">
          {$_('components.modals.pano-plugin-update.title')}
        </h5>
        <button type="button" class="btn-close" aria-label={$_('buttons.close')} onclick={hide}
        ></button>
      </div>

      <div class="modal-body">
        <ol class="list-group list-group-numbered">
          <li class="list-group-item">
            {$_('components.modals.pano-plugin-update.step-download')}
          </li>
          <li class="list-group-item">
            {$_('components.modals.pano-plugin-update.step-replace', {
              values: { folder: pluginFolder },
            })}
          </li>
          <li class="list-group-item">
            {$_('components.modals.pano-plugin-update.step-start')}
          </li>
        </ol>
      </div>

      <div class="modal-footer">
        <a class="btn btn-primary w-100 text-capitalize" href={jarUrl} download>
          <i class="fa-solid fa-download me-1" aria-hidden="true"></i>
          {latestVersion
            ? $_('components.modals.pano-plugin-update.download-version', {
                values: { version: latestVersion },
              })
            : $_('components.modals.pano-plugin-update.download')}
        </a>
      </div>
    </div>
  </div>
</div>

<script module>
  import { errorDetails } from '$lib/apiError.util.js';
  import ApiUtil from '$lib/api.util.js';
  import { getServerDisplayName, showServerActionError } from '$lib/servers.util.js';
  import { showSuccess } from '$lib/components/ToastContainer.svelte';

  /** @type {((server: object, options: { latestVersion?: string | null, reason?: string | null }) => void) | null} */
  let openModal = null;

  /**
   * Opens the hand-update steps for [server]. Registered by the mounted instance.
   *
   * @param {object} server
   * @param {{ latestVersion?: string | null, reason?: string | null }} [options]
   */
  export function show(server, options = {}) {
    openModal?.(server, options);
  }

  /**
   * Updates the Pano plugin on [server] the way it can be updated right now: the node or the
   * plugin itself when either can, otherwise — where only the admin can reach the `plugins/`
   * folder — the hand-update steps. Every "update the Pano plugin" in the panel goes through here.
   *
   * @param {object} server
   * @param {{ latestVersion?: string | null }} [options]
   * @returns {Promise<boolean>} whether an update was started.
   */
  export async function updatePanoPlugin(server, options = {}) {
    if (server?.id == null) {
      return false;
    }

    const body = await ApiUtil.post({
      path: `/panel/servers/${server.id}/pano-plugin/update`,
      handler: (response) => response,
    });

    if (!body) {
      return false;
    }

    if (body.error) {
      if (errorDetails(body).manual === true) {
        show(server, { latestVersion: options.latestVersion, reason: errorDetails(body).reason });
      } else {
        showServerActionError(body.error, body, { server });
      }

      return false;
    }

    // Nothing is said yet: the update shows as the server's running task, and "updated" is said
    // once it has really finished (the task listener below).
    return true;
  }
</script>

<script>
  import { onDestroy, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { onTaskProgress } from '$lib/panelRealtime.js';

  /** Software that loads the Pano plugin from `mods/` rather than `plugins/`. */
  const MOD_LOADERS = ['FABRIC', 'QUILT'];

  let modalElement = $state();
  let server = $state(/** @type {Record<string, any> | null} */ (null));
  let latestVersion = $state(/** @type {string | null} */ (null));

  let modal;

  const serverName = $derived(server ? getServerDisplayName(server) : '');
  const jarUrl = $derived(server ? `/api/v1/panel/servers/${server.id}/pano-plugin/jar` : '#');
  const pluginFolder = $derived(
    MOD_LOADERS.includes(String(server?.type || '').toUpperCase()) ? 'mods' : 'plugins',
  );

  function hide() {
    modal?.hide();
  }

  onMount(() => {
    modal = window.bootstrap?.Modal
      ? window.bootstrap.Modal.getOrCreateInstance(modalElement)
      : null;

    openModal = (target, options) => {
      server = target;
      latestVersion = options?.latestVersion ?? null;
      modal?.show();
    };
  });

  // A finished Pano plugin update is said once, wherever in the panel the admin is by then.
  /** @type {Set<string>} */
  const announced = new Set();

  const stopTaskListener = onTaskProgress((task) => {
    if (task?.panoPluginUpdate !== true || task.status !== 'DONE' || announced.has(task.taskId)) {
      return;
    }

    announced.add(task.taskId);

    void showSuccess('components.modals.pano-plugin-update.updated');
  });

  onDestroy(() => {
    openModal = null;
    stopTaskListener();
  });
</script>
