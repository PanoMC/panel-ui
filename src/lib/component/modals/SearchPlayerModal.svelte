<!-- Search Player Modal -->
<div class="modal fade" bind:this={$modalElement} tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">{$_('components.modals.search-player.title')}</h5>
        <button
          type="button"
          class="btn-close"
          aria-label={$_('buttons.close')}
          title={$_('buttons.close')}
          on:click={hide}></button>
      </div>
      <div class="modal-body">
        <div class="vstack gap-2">
          <div class="position-relative">
            <input
              class="form-control form-control-lg"
              type="search"
              bind:value={$query}
              placeholder={$_('buttons.find')}
              on:keydown={(e) => {
                if (e.key === 'Escape') hide();
              }} />
            {#if $query.trim().length > 0}
              <button
                type="button"
                class="btn-close position-absolute top-50 end-0 translate-middle-y me-2"
                title={$_('buttons.clear')}
                on:click={() => query.set('')}>
              </button>
            {/if}
          </div>

          <small>
            {#if $loading}
              {$_('components.modals.search-player.states.loading')}
            {:else if $query.trim().length === 0}
              {$_('components.modals.search-player.states.start-typing')}
            {:else}
              {$_('components.modals.search-player.states.max-results')}
            {/if}
          </small>
        </div>

        {#if $errorText}
          <div class="alert alert-danger">{$errorText}</div>
        {/if}

        {#if $results.length > 0}
          <div class="list-group mt-3">
            {#each $results as u (u.id)}
              <button
                type="button"
                class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                on:click={() => selectUser(u)}>
                <div class="d-flex align-items-center overflow-hidden">
                  {#if minotarAvatarUrl(u.username, 24)}
                    <img
                      src={minotarAvatarUrl(u.username, 24)}
                      alt={`${u.username} avatar`}
                      width="24"
                      height="24"
                      class="rounded me-2 flex-shrink-0"
                      loading="lazy" />
                  {/if}
                  <div class="overflow-hidden">
                    <div class="fw-bold text-truncate">{u.username}</div>
                    <small class="d-block text-truncate">{formatGroups(u) || '-'}</small>
                  </div>
                </div>
                <span class="badge text-bg-primary">
                  {isExisting(u)
                    ? $_('components.modals.search-player.badges.select')
                    : $_('components.modals.search-player.badges.add')}
                </span>
              </button>
            {/each}
          </div>
        {/if}

        {#if $results.length === 0 && $query.trim().length > 0 && !$loading && !$errorText}
          <NoContent />
        {/if}
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from 'svelte/store';

  const modalElement = writable();
  const query = writable('');
  const loading = writable(false);
  const errorText = writable('');
  const results = writable([]);
  const localPlayers = writable(null);
  const allGroups = writable([]);
  const allNodes = writable([]);
  const existingUserIds = writable([]);

  let callback = (user) => {};
  let hideCallback = () => {};
  let modal;

  export function show(payload = {}) {
    query.set('');
    loading.set(false);
    errorText.set('');
    results.set([]);

    localPlayers.set(payload.localPlayers ?? null);
    allGroups.set(payload.allGroups ?? []);
    allNodes.set(payload.nodes ?? []);
    existingUserIds.set(payload.existingUserIds ?? []);

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
  import ApiUtil from '$lib/api.util';
  import NoContent from '$lib/component/NoContent.svelte';

  let debounceTimer;
  let activeSearchToken = 0;

  $: {
    const q = ($query || '').trim();
    clearTimeout(debounceTimer);
    if (!q) {
      results.set([]);
      errorText.set('');
      loading.set(false);
    } else {
      // Prevent "Sonuç yok." flashing during debounce: mark as loading immediately.
      loading.set(true);
      errorText.set('');
      const token = ++activeSearchToken;
      debounceTimer = setTimeout(() => search(q, token), 250);
    }
  }

  function formatGroups(user) {
    // IMPORTANT: show ONLY direct group assignments from USER-held nodes:
    // - node: "group.<name>"
    // - holderType: "USER"
    // No inherited/parent groups, and do NOT trust API-provided group fields.
    const userId = user?.id;
    if (userId == null) return '';

    const directGroupNames = ($allNodes || [])
      .filter(
        (n) =>
          n?.holderType === 'USER' &&
          n?.holderId === userId &&
          n?.active !== false &&
          typeof n?.node === 'string' &&
          n.node.startsWith('group.'),
      )
      .map((n) => String(n.node).slice('group.'.length))
      .map((x) => String(x || '').trim())
      .filter(Boolean);

    const unique = Array.from(new Set(directGroupNames));
    const groupNames = unique.length ? unique : ['default'];

    const byName = new Map(($allGroups || []).map((g) => [g.name, g]));
    return groupNames
      .map((name) => (byName.get(name)?.displayName || name || '').trim())
      .filter(Boolean)
      .join(', ');
  }

  function isExisting(user) {
    const id = user?.id;
    return id != null && ($existingUserIds || []).includes(id);
  }

  function minotarAvatarUrl(username, size = 24) {
    const u = String(username || '').trim();
    if (!u) return null;
    const encoded = encodeURIComponent(u);
    return `https://minotar.net/avatar/${encoded}/${size}`;
  }

  async function search(q, token) {
    // If a newer search started, ignore this one
    if (token !== activeSearchToken) return;
    errorText.set('');
    try {
      const qq = q.toLowerCase();
      const localResults =
        Array.isArray($localPlayers) && $localPlayers.length > 0
          ? $localPlayers.filter((p) => (p?.username || '').toLowerCase().includes(qq)).slice(0, 10)
          : [];

      // Show local matches immediately (fast UI), but still query the API to find users not in local list.
      if (localResults.length > 0) {
        results.set(localResults);
      }

      const res = await ApiUtil.get({
        path: `/api/panel/player/search?q=${encodeURIComponent(q)}`,
      });
      if (token !== activeSearchToken) return;

      if (res?.error) {
        errorText.set(res.error);
        // keep local results if we have any
        if (localResults.length === 0) results.set([]);
      } else {
        const apiPlayers = Array.isArray(res?.players) ? res.players : [];

        const seen = new Set();
        const merged = [];
        const pushUnique = (u) => {
          if (!u) return;
          const key = u.id != null ? `id:${u.id}` : `u:${String(u.username || '').toLowerCase()}`;
          if (!key || key === 'u:') return;
          if (seen.has(key)) return;
          seen.add(key);
          merged.push(u);
        };

        localResults.forEach(pushUnique);
        apiPlayers.forEach(pushUnique);

        results.set(merged.slice(0, 10));
      }
    } catch (e) {
      if (token !== activeSearchToken) return;
      errorText.set('SEARCH_FAILED');
      // keep local results if we have any
      if (!(Array.isArray($localPlayers) && $localPlayers.length > 0)) {
        results.set([]);
      }
    } finally {
      if (token === activeSearchToken) {
        loading.set(false);
      }
    }
  }

  function selectUser(u) {
    callback(u);
    hide();
  }
</script>
