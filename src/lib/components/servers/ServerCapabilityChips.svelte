<div class="d-flex flex-wrap gap-1 {classes}">
  {#each capabilities as capability (capability)}
    <span class="badge rounded-pill text-bg-light border fw-normal">
      <i
        class="{SERVER_CAPABILITY_ICONS[capability] || 'fa-solid fa-circle'} me-1"
        aria-hidden="true"></i>
      {$_('pages.servers.capabilities.' + capability)}
    </span>
  {/each}
</div>

<script>
  import { _ } from 'svelte-i18n';

  import { SERVER_CAPABILITY_ICONS, SERVER_CAPABILITY_ORDER } from '$lib/servers.util.js';

  export let server;
  export let classes = '';

  // Capabilities Pano does not know (a plugin newer than this panel) are dropped rather than
  // rendered as a missing translation key.
  $: capabilities = SERVER_CAPABILITY_ORDER.filter((capability) =>
    (Array.isArray(server?.capabilities) ? server.capabilities : []).includes(capability),
  );
</script>
