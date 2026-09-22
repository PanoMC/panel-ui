<!-- "Update the Pano plugin" next to any sentence that asks for it. The node or the plugin does it
     when either can, after the admin confirms (SM-77); otherwise the hand-update steps open. What
     the update does next is the server's own `activeTask`, which the header shows to everyone.
     Hidden without the plugins permission and for software that has no Pano plugin at all. -->
{#if visible}
  <button
    type="button"
    class="btn btn-sm btn-outline-warning text-nowrap {className}"
    disabled={busy}
    onclick={() => void run()}>
    {#if busy}
      <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
    {:else}
      <i class="fa-solid fa-download me-1" aria-hidden="true"></i>
    {/if}
    {$_(label)}
  </button>
{/if}

<script>
  import { _ } from 'svelte-i18n';

  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import { getServerDisplayName, isPluginConnected } from '$lib/servers.util.js';
  import { confirmPanoPluginUpdate } from '$lib/components/modals/ConfirmUpdateModal.svelte';
  import {
    show as showPanoPluginUpdateModal,
    updatePanoPlugin,
  } from '$lib/components/modals/PanoPluginUpdateModal.svelte';

  /** Software that runs no Pano plugin, so there is nothing to update. */
  const NO_PLUGIN = ['VANILLA'];

  /**
   * @type {{ server: Record<string, any> | null, latestVersion?: string | null,
   *   label?: string, class?: string }}
   */
  let {
    server,
    latestVersion = null,
    label = 'components.pano-plugin-update-button.label',
    class: className = '',
  } = $props();

  let busy = $state(false);

  const visible = $derived(
    !!server &&
      server.id != null &&
      !NO_PLUGIN.includes(String(server.type || '').toUpperCase()) &&
      hasPermission(Permissions.MANAGE_SERVER_PLUGINS),
  );

  async function run() {
    if (busy || !server) {
      return;
    }

    const plan = server.panoPluginUpdate ?? null;
    const latest = latestVersion ?? plan?.latestVersion ?? null;

    // Only the admin can do it (too old to update itself, or not connected): nothing runs from
    // here, so there is nothing to confirm — the steps open straight away.
    if (plan?.manual === true && !plan.mode) {
      showPanoPluginUpdateModal(server, {
        latestVersion: latest,
        reason: isPluginConnected(server) ? 'PLUGIN_TOO_OLD' : 'SERVER_OFFLINE',
      });

      return;
    }

    const confirmed = await confirmPanoPluginUpdate({
      name: getServerDisplayName(server),
      current: server.pluginVersion ?? null,
      latest,
    });

    if (!confirmed) {
      return;
    }

    busy = true;

    try {
      await updatePanoPlugin(server, { latestVersion: latest });
    } finally {
      busy = false;
    }
  }
</script>
