<div class="col">
  <div
    class="card h-100 server-card position-relative"
    class:is-selecting={selectingServerId === server.id}
    class:border-primary={$selectedServer?.id === server.id}
    class:border-2={$selectedServer?.id === server.id}
    class:shadow-sm={$selectedServer?.id === server.id}
    class:opacity-50={selectingServerId != null && selectingServerId !== server.id}
    on:click={() => {
      if (!selectingServerId) onSelectCard(server);
    }}
    on:keydown={onKeyDown}
    use:tooltip={[
      $selectedServer?.id !== server.id
        ? $_('components.modals.servers.select-server-tooltip')
        : '',
      { placement: 'bottom' },
    ]}
    tabindex="0"
    role="button"
    aria-busy={selectingServerId === server.id ? 'true' : undefined}>
    {#if selectingServerId === server.id}
      <div class="selecting-overlay">
        <div class="d-flex flex-column align-items-center gap-2 px-2 text-center text-primary">
          <div
            class="spinner-border"
            style="width: 2.25rem; height: 2.25rem;"
            role="status">
            <span class="visually-hidden"
              >{$_('components.modals.servers.selecting-server')}</span>
          </div>
          <span class="small fw-semibold text-body"
            >{$_('components.modals.servers.selecting-server')}</span>
        </div>
      </div>
    {/if}
    {#if $mainServer && server.id === $mainServer.id}
      <div
        class="position-absolute top-0 end-0 p-2 text-warning"
        use:tooltip={[$_('components.modals.servers.main-server')]}>
        <i class="fa-solid fa-crown"></i>
      </div>
    {/if}

    <div class="card-body d-flex flex-column flex-grow-1 align-items-center text-center p-3 min-w-0">
      <img
        src={sanitizeImageSrc(
          server.favicon ? server.favicon : base + '/assets/img/server-icon.png',
          base + '/assets/img/server-icon.png'
        )}
        class="rounded border mb-2"
        height="32"
        width="32"
        alt={server.customName || server.name} />

      <div class="fw-bold text-break w-100 mb-1 px-1 server-name">
        {server.customName || server.name}
      </div>

      <div class="small w-100 mb-1 px-1 server-ip text-break">
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <code
          class="user-select-all cursor-pointer text-break d-inline-block"
          on:click|stopPropagation={onCodeClick}
          on:keydown|stopPropagation={(e) => e.key === 'Enter' && onCodeClick(e)}
          tabindex="0"
          use:tooltip={[
            copiedId === server.id
              ? $_('components.modals.connect-server.copied')
              : $_('buttons.copy'),
            { placement: 'top', hideOnClick: false },
          ]}>{server.host}:{server.port}</code>
      </div>

      <div class="mt-auto w-100">
        <div
          class="badge rounded-pill mb-1"
          class:text-bg-success={server.status === 'ONLINE'}
          class:text-bg-danger={server.status !== 'ONLINE'}>
          {server.type}
        </div>
        <div class="player-count">
          {server.playerCount}/{server.maxPlayerCount}
        </div>
      </div>
    </div>

    {#if $selectedServer?.id === server.id}
      <div class="card-footer bg-primary text-white text-center py-1 small">
        <i class="fas fa-check-circle me-1"></i> {$_('buttons.selected') || 'Selected'}
      </div>
    {/if}
  </div>
</div>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { base } from '$app/paths';
  import { sanitizeImageSrc } from '$lib/security.util.js';
  import tooltip from '$lib/tooltip.util';

  export let server;

  /** @type {import('svelte/store').Readable<unknown> | null} */
  const selectedServer = getContext('selectedServer');
  const mainServer = getContext('mainServer');

  export let selectingServerId;
  export let copiedId;
  export let onSelectCard;
  export let onCopy;

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectingServerId == null) onSelectCard(server);
    }
  }

  function onCodeClick(e) {
    e.stopPropagation();
    onCopy(e, server);
  }
</script>

<style>
  .server-card {
    transition: all 0.2s ease-in-out;
    cursor: pointer;
    overflow-x: clip;
    overflow-y: visible;
  }

  :global(.server-card .card-body) {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 0;
    padding: 1rem;
  }

  @media (min-width: 576px) {
    :global(.server-card .card-body) {
      padding: 0.75rem !important;
    }
  }

  .server-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    border-color: var(--bs-primary);
  }

  .server-card .server-ip {
    font-size: 0.75rem;
  }

  .server-card :global(.badge) {
    font-size: 0.7rem;
    padding: 0.25rem 0.5rem;
  }

  .server-card .player-count {
    font-size: 0.7rem;
  }

  .server-card.is-selecting {
    pointer-events: none;
  }

  .selecting-overlay {
    position: absolute;
    inset: 0;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--bs-border-radius);
    background: color-mix(in srgb, var(--bs-body-bg) 78%, transparent);
    backdrop-filter: blur(2px);
    animation: selecting-pulse 1.1s ease-in-out infinite;
  }

  @keyframes selecting-pulse {
    0%,
    100% {
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--bs-primary) 45%, transparent);
    }
    50% {
      box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--bs-primary) 70%, transparent);
    }
  }
</style>
