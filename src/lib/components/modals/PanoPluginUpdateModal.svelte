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
        <h5 class="modal-title" id="panoPluginUpdateTitle">
          <i class="fa-solid fa-puzzle-piece me-2" aria-hidden="true"></i>
          {$_('components.modals.pano-plugin-update.title')}
        </h5>
        <button type="button" class="btn-close" aria-label={$_('buttons.close')} onclick={hide}
        ></button>
      </div>

      <div class="modal-body vstack gap-3">
        <p class="text-body-secondary small mb-0">
          {$_(
            reason === 'SERVER_OFFLINE'
              ? 'components.modals.pano-plugin-update.why-offline'
              : 'components.modals.pano-plugin-update.why-too-old',
            { values: { name: serverName } },
          )}
        </p>

        <div class="d-flex gap-2 align-items-start">
          <span class="badge rounded-pill text-bg-secondary mt-1">1</span>
          <div class="vstack gap-2">
            <span>{$_('components.modals.pano-plugin-update.step-download')}</span>
            <div>
              <a class="btn btn-primary btn-sm" href={jarUrl} download>
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

        <div class="d-flex gap-2 align-items-start">
          <span class="badge rounded-pill text-bg-secondary mt-1">2</span>
          <span>
            {$_('components.modals.pano-plugin-update.step-replace', {
              values: { folder: pluginFolder },
            })}
          </span>
        </div>

        <div class="d-flex gap-2 align-items-start">
          <span class="badge rounded-pill text-bg-secondary mt-1">3</span>
          <span>{$_('components.modals.pano-plugin-update.step-start')}</span>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-link m-0" onclick={hide}>
          {$_('buttons.close')}
        </button>
      </div>
    </div>
  </div>
</div>

<script module>
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
      path: `/api/panel/servers/${server.id}/pano-plugin/update`,
      handler: (response) => response,
    });

    if (!body) {
      return false;
    }

    if (body.error) {
      if (body.manual === true) {
        show(server, { latestVersion: options.latestVersion, reason: body.reason });
      } else {
        showServerActionError(body.error, body, { server });
      }

      return false;
    }

    void showSuccess('pages.servers.overview.info.plugin-update-started', {
      version: body.toVersion ?? options.latestVersion ?? '',
    });

    return true;
  }
</script>

<script>
  import { onDestroy, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  /** Software that loads the Pano plugin from `mods/` rather than `plugins/`. */
  const MOD_LOADERS = ['FABRIC', 'QUILT'];

  let modalElement = $state();
  let server = $state(/** @type {Record<string, any> | null} */ (null));
  let latestVersion = $state(/** @type {string | null} */ (null));
  let reason = $state(/** @type {string | null} */ (null));

  let modal;

  const serverName = $derived(server ? getServerDisplayName(server) : '');
  const jarUrl = $derived(server ? `/api/panel/servers/${server.id}/pano-plugin/jar` : '#');
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
      reason = options?.reason ?? null;
      modal?.show();
    };
  });

  onDestroy(() => {
    openModal = null;
  });
</script>
