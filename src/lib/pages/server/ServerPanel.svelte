<style>
  .server-card {
    transition: all 0.2s ease-in-out;
    overflow: hidden;
    max-width: 320px;
  }

  .server-card :global(.card-body) {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    padding: 1rem;
  }
</style>

<div class="container vstack gap-3">
  <!-- Masonry Layout for Cards -->
  <masonry-layout cols={$mansoryLayoutCols} gap="16">
    <!-- Selected Server Card -->
    <div class="ratio ratio-1x1">
      <div class="card server-card">
        <CardHeader>
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

            <div class="fw-bold text-truncate w-100 mb-1 server-name">
              {$selectedServer.customName || $selectedServer.name}
            </div>

            <div class="text-truncate w-100 mb-1 server-ip">
              <button
                type="button"
                class="bg-transparent border-0 p-0 focus-ring w-100 text-truncate"
                on:click={(e) => onCopy(e, $selectedServer)}
                use:tooltip={[
                  copiedId === $selectedServer.id
                    ? $_('components.modals.connect-server.copied')
                    : $_('buttons.copy'),
                  { placement: 'bottom', hideOnClick: false },
                ]}>
                <code class="user-select-all cursor-pointer"
                  >{$selectedServer.host}:{$selectedServer.port}</code
                >
              </button>
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
  </masonry-layout>
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
  import { getContext, onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { writable } from 'svelte/store';

  import { base } from '$app/paths';

  import tooltip from '$lib/tooltip.util';

  import { sanitizeImageSrc } from '$lib/security.util.js';
  import copy from 'copy-to-clipboard';

  import NoContent from '$lib/components/NoContent.svelte';
  import CardHeader from '$lib/components/CardHeader.svelte';
  import ViewAllLink from '$lib/components/ViewAllLink.svelte';
  import { show as showServersModal } from '$lib/components/modals/ServersModal.svelte';

  export let data;

  const selectedServer = getContext('selectedServer');

  const pageTitle = getContext('pageTitle');

  pageTitle.set('components.site-navigation-menu.panel');

  let copiedId = null;
  let copiedTimeout;

  function onCopy(e, server) {
    e.stopPropagation();
    const text = `${server.host}:${server.port}`;
    copy(text);

    copiedId = server.id;
    if (copiedTimeout) clearTimeout(copiedTimeout);
    copiedTimeout = setTimeout(() => {
      copiedId = null;
    }, 2000);
  }

  const mansoryLayoutCols = writable(2);

  function checkMobile() {
    if (window.innerWidth >= 1200) {
      mansoryLayoutCols.set(4);
    } else if (window.innerWidth >= 992) {
      mansoryLayoutCols.set(3);
    } else if (window.innerWidth >= 768) {
      mansoryLayoutCols.set(2);
    } else {
      mansoryLayoutCols.set(1);
    }
  }

  onMount(() => {
    checkMobile();

    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  });
</script>
