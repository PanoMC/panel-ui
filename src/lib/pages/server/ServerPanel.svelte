<style>
  .server-card {
    transition: all 0.2s ease-in-out;
    width: 100%;
    max-width: 100%;
  }

  .server-card :global(.card-body) {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    padding: 1rem;
  }

  .server-card .server-local-ip {
    font-size: 0.85rem;
  }
</style>

<div class="container vstack gap-3">
  <!-- Single full-width card: masonry columns were squeezing this into 1/grid column -->
  <div class="card server-card">
    <CardHeader truncateLeftSlot={false} leftClasses="pe-sm-2">
      <svelte:fragment slot="left">{$_('components.navbar.selected-server')}</svelte:fragment>
      <svelte:fragment slot="right">
        <ViewAllLink on:click={showServersModal} />
      </svelte:fragment>
    </CardHeader>

    <div class="card-body d-flex flex-column align-items-center text-center p-3">
      {#if $selectedServer}
        <img
          src={sanitizeImageSrc(
            $selectedServer.favicon
              ? $selectedServer.favicon
              : base + '/assets/img/server-icon.png',
            base + '/assets/img/server-icon.png',
          )}
          class="rounded border mb-2"
          height="64"
          width="64"
          alt={$selectedServer.customName || $selectedServer.name} />

        <div class="fw-bold text-break w-100 mb-1 px-1 server-name">
          {$selectedServer.customName || $selectedServer.name}
        </div>

        <div class="w-100 mb-1 server-ip px-1">
          <button
            type="button"
            class="bg-transparent border-0 p-0 focus-ring w-100 text-break"
            on:click={(e) => onCopy(e, $selectedServer)}
            use:tooltip={[
              copiedId === $selectedServer.id
                ? $_('components.modals.connect-server.copied')
                : $_('buttons.copy'),
              { placement: 'bottom', hideOnClick: false },
            ]}>
            <code class="user-select-all cursor-pointer text-break d-inline-block"
              >{getPrimaryAddress($selectedServer)}</code
            >
          </button>
        </div>

        <div class="w-100 mb-1 px-1 server-local-ip text-body-secondary text-break">
          {$_('buttons.local')}: <span class="font-monospace user-select-all"
            >{getLocalAddress($selectedServer)}</span>
        </div>

        <div class="mt-2 w-100">
          <div
            class="badge rounded-pill mb-1"
            class:text-bg-success={$selectedServer.status === 'ONLINE'}
            class:text-bg-danger={$selectedServer.status !== 'ONLINE'}>
            {$selectedServer.type}
          </div>
          <div class="player-count">
            {$selectedServer.playerCount}/{$selectedServer.maxPlayerCount}
          </div>
        </div>
      {:else}
        <NoContent />
      {/if}
    </div>
  </div>
</div>

<script context="module">
  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const { parent } = event;
    await parent();

    return {};
  }
</script>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { base } from '$app/paths';

  import tooltip from '$lib/tooltip.util';

  import { sanitizeImageSrc } from '$lib/security.util.js';
  import copy from 'copy-to-clipboard';

  import NoContent from '$lib/components/NoContent.svelte';
  import CardHeader from '$lib/components/CardHeader.svelte';
  import ViewAllLink from '$lib/components/ViewAllLink.svelte';
  import { show as showServersModal } from '$lib/components/modals/ServersModal.svelte';

  const selectedServer = getContext('selectedServer');

  const pageTitle = getContext('pageTitle');

  pageTitle.set('components.site-navigation-menu.panel');

  let copiedId = null;
  let copiedTimeout;

  function onCopy(e, server) {
    e.stopPropagation();
    copy(getPrimaryAddress(server));

    copiedId = server.id;
    if (copiedTimeout) clearTimeout(copiedTimeout);
    copiedTimeout = setTimeout(() => {
      copiedId = null;
    }, 2000);
  }

  function getPrimaryAddress(server) {
    const remoteAddress = String(server?.remoteAddress || '').trim();
    return remoteAddress || server?.host || '';
  }

  function getLocalAddress(server) {
    return `${server?.host || ''}:${server?.port ?? ''}`;
  }
</script>
