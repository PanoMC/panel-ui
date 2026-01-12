<!-- Edit Permission Node Modal -->
<div class="modal fade" bind:this={$modalElement} tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content" style="overflow: visible;">
      <div class="modal-header">
        <h5 class="modal-title">{$_('components.modals.edit-permission-node.title')}</h5>
        <button
          type="button"
          class="btn-close"
          aria-label={$_('buttons.close')}
          title={$_('buttons.close')}
          on:click={hide}></button>
      </div>
      <div class="modal-body" style="overflow: visible;">
        {#if !$node}
          <p class="mb-0">{$_('components.modals.edit-permission-node.states.no-node-selected')}</p>
        {:else}
          {#if $draft.contexts.some((ctx) => ctx.key?.trim() === 'pano' && ctx.value
                ?.toString()
                .trim() === 'true')}
            <div
              class="alert alert-warning alert-dismissible fade show mb-3 p-2 small"
              role="alert">
              <i class="fa fa-info-circle me-1"></i>
              {$_('pages.permissions.panel.nodes.pano-only-alert')}
              <a href="https://docs.panomc.com" target="_blank" class="alert-link ms-1">
                {$_('pages.permissions.panel.nodes.pano-only-alert-link')}
                <i class="fa fa-external-link-alt ms-1 small"></i>
              </a>
            </div>
          {:else if $draft.contexts.some((ctx) => ctx.key?.trim() === 'pano' && ctx.value
                ?.toString()
                .trim() === 'false')}
            <div class="alert alert-info alert-dismissible fade show mb-3 p-2 small" role="alert">
              <i class="fa fa-info-circle me-1"></i>
              {$_('pages.permissions.panel.nodes.game-only-alert')}
              <a href="https://docs.panomc.com" target="_blank" class="alert-link ms-1">
                {$_('pages.permissions.panel.nodes.pano-only-alert-link')}
                <i class="fa fa-external-link-alt ms-1 small"></i>
              </a>
            </div>
          {/if}

          <div class="mb-3">
            <label class="form-label" for="nodeValue"
              >{$_('components.modals.edit-permission-node.form.node')}</label>

            <div class="position-relative">
              <input
                id="nodeValue"
                class="form-control form-control-lg font-monospace"
                type="text"
                bind:value={$draft.nodeValue}
                placeholder={$_('components.modals.edit-permission-node.form.node-placeholder')}
                autocomplete="off"
                on:focus={() => (showNodeSuggestions = true)}
                on:keydown={(e) => {
                  // Tab selects the first suggestion (LuckPerms-like), then allow focus to move on.
                  if (e.key === 'Tab' && showNodeSuggestions && filteredPanelNodes.length > 0) {
                    const first = filteredPanelNodes[0];
                    if (first?.node) {
                      draft.update((d) => ({ ...d, nodeValue: first.node }));
                    }
                    showNodeSuggestions = false;
                  }
                }}
                on:blur={() => {
                  // allow click on suggestion before closing
                  setTimeout(() => (showNodeSuggestions = false), 120);
                }} />

              {#if showNodeSuggestions && filteredPanelNodes.length > 0}
                <div
                  class="list-group position-absolute w-100"
                  style="z-index: 2000; max-height: 280px; overflow: auto; top: calc(100% + 4px);">
                  {#each filteredPanelNodes as p (p.key)}
                    <button
                      type="button"
                      class="list-group-item list-group-item-action"
                      on:click={() => {
                        draft.update((d) => ({ ...d, nodeValue: p.node }));
                        showNodeSuggestions = false;
                      }}>
                        <div class="overflow-hidden vstack gap-1">
                          <p class="fw-bold text-truncate mb-0">
                            <i class="fa {p.icon || 'fa-key'} me-2 opacity-75"></i>
                            {#if p.type === 'panel' || p.type === 'plugin'}
                              {$_(p.titleKey)}
                            {:else}
                              {p.title}
                            {/if}
                            {#if p.type === 'plugin'}
                              <span class="badge text-bg-secondary ms-2 small" style="font-size: 0.7em;">
                                {$_(`plugins.${p.pluginId}.title`) !== `plugins.${p.pluginId}.title`
                                  ? $_(`plugins.${p.pluginId}.title`)
                                  : p.pluginId}
                              </span>
                            {/if}
                          </p>
                          <div class="text-truncate font-monospace small opacity-75">
                            {p.node}
                          </div>
                          {#if (p.type === 'panel' || p.type === 'plugin') ? $_(p.descKey) : p.desc}
                            <small class="mb-0 opacity-75">
                              {p.type === 'panel' || p.type === 'plugin' ? $_(p.descKey) : p.desc}
                            </small>
                          {/if}
                        </div>
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          </div>

          <div class="mb-3">
            <div class="form-check form-switch">
              <input
                id="nodeActive"
                class="form-check-input"
                type="checkbox"
                role="switch"
                bind:checked={$draft.active} />
              <label class="form-check-label" for="nodeActive"
                >{$_('components.modals.edit-permission-node.form.active')}</label>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label" for="permExpiry"
              >{$_('components.modals.edit-permission-node.form.expiry')}</label>
            <div
              id="permExpiry"
              class="btn-group w-100"
              role="group"
              aria-label={$_('components.modals.edit-permission-node.form.expiry-aria')}>
              <input
                type="radio"
                class="btn-check"
                name="expiry-option-edit"
                id="expiry-never-edit"
                autocomplete="off"
                bind:group={$draft.expiryType}
                value="never" />

              <label class="btn btn-outline-primary" for="expiry-never-edit"
                >{$_('components.modals.edit-permission-node.form.expiry-never')}</label>
              <input
                type="radio"
                class="btn-check"
                name="expiry-option-edit"
                id="expiry-date-edit"
                autocomplete="off"
                bind:group={$draft.expiryType}
                value="date" />
              <label class="btn btn-outline-primary" for="expiry-date-edit"
                >{$_('components.modals.edit-permission-node.form.expiry-date')}</label>
            </div>
            {#if $draft.expiryType === 'date'}
              <input
                type="datetime-local"
                class="form-control mt-2"
                bind:value={$draft.expiryDate} />
            {/if}
          </div>

          <div>
            <label class="form-label" for=""
              >{$_('components.modals.edit-permission-node.contexts.title')}</label>

            {#if $draft.contexts.length === 0}
              <NoContent />
            {:else}
              {#each $draft.contexts as ctx, index (index)}
                <div class="hstack gap-2 mb-2">
                  <div class="input-group">
                    <input
                      class="form-control {ctx.key?.trim() === 'pano' &&
                      ctx.value?.toString().trim() === 'true'
                        ? 'border-warning'
                        : ctx.key?.trim() === 'pano' && ctx.value?.toString().trim() === 'false'
                          ? 'border-info'
                          : ''}"
                      type="text"
                      placeholder={$_(
                        'components.modals.edit-permission-node.contexts.key-placeholder',
                      )}
                      bind:value={ctx.key} />
                    <input
                      class="form-control {ctx.key?.trim() === 'pano' &&
                      ctx.value?.toString().trim() === 'true'
                        ? 'border-warning'
                        : ctx.key?.trim() === 'pano' && ctx.value?.toString().trim() === 'false'
                          ? 'border-info'
                          : ''}"
                      type="text"
                      placeholder={$_(
                        'components.modals.edit-permission-node.contexts.value-placeholder',
                      )}
                      bind:value={ctx.value} />
                  </div>
                  <button
                    class="btn-close"
                    type="button"
                    on:click={() => removeContext(index)}
                    aria-label={$_('buttons.remove')}
                    title={$_('buttons.remove')}>
                  </button>
                </div>
              {/each}
            {/if}

            <button class="btn btn-sm btn-primary w-100" type="button" on:click={addContext}>
              <i class="fa fa-plus me-2"></i>{$_('buttons.add')}
            </button>
          </div>
        {/if}
      </div>
      <div class="modal-footer">
        <button
          type="button"
          class="btn btn-primary w-100"
          on:click={handleSave}
          disabled={!$node || !$draft.nodeValue.trim()}>
          {$_('buttons.save')}
        </button>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from 'svelte/store';

  const modalElement = writable();
  const node = writable(null);
  const permissionGroups = writable([]);
  const registeredPermissions = writable({});
  const draft = writable({
    nodeValue: '',
    active: true,
    expiryType: 'never',
    expiryDate: '',
    contexts: [],
  });

  let callback = (node) => {};
  let hideCallback = () => {};
  let modal;

  export function show(payload) {
    // Backwards compatible:
    // - show(node)
    // - show({ node, permissionGroups })
    const n = payload?.node ?? payload ?? null;
    node.set(n);
    permissionGroups.set(payload?.permissionGroups ?? []);

    const toLocalDatetime = (ms) => {
      if (!ms) return '';
      const d = new Date(ms);
      const pad = (x) => String(x).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const obj = n?.context || {};
    draft.set({
      nodeValue: n?.node || '',
      active: !!n?.active,
      expiryType: n?.expiresAt ? 'date' : 'never',
      expiryDate: n?.expiresAt ? toLocalDatetime(n.expiresAt) : '',
      contexts: Object.keys(obj).map((k) => ({ key: k, value: String(obj[k]) })),
    });

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: 'static',
      keyboard: false,
    });
    modal.show();

    fetchRegisteredPermissions();
  }

  function fetchRegisteredPermissions() {
    import('$lib/api.util').then(({ default: ApiUtil }) => {
      ApiUtil.get({
        path: '/api/panel/permission/registered',
        handler: (body) => {
          if (body.result === 'ok') {
            registeredPermissions.set(body.data || {});
          }
        },
      });
    });
  }

  export function hide() {
    hideCallback(get(node));
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
  import { _, dictionary, locale } from 'svelte-i18n';
  import NoContent from '$lib/component/NoContent.svelte';

  $: permsMap = $registeredPermissions || {};

  $: panelNodes = (permsMap.platform || []).map((p) => ({
    key: `PLATFORM:${p.node}`,
    permKey: p.key,
    node: p.node,
    icon: p.icon,
    titleKey: `permissions.${p.key}.title`,
    descKey: `permissions.${p.key}.description`,
    type: 'panel',
  }));

  $: pluginNodes = Object.entries(permsMap).flatMap(([pluginId, perms]) => {
    if (pluginId === 'platform') return [];
    return (perms || []).map((p) => ({
      key: `PLUGIN:${pluginId}:${p.node}`,
      permKey: p.key,
      node: p.node,
      icon: p.icon,
      titleKey: `plugins.${pluginId}.permissions.${p.key}.title`,
      descKey: `plugins.${pluginId}.permissions.${p.key}.description`,
      pluginId,
      type: 'plugin',
    }));
  });

  $: fallbackPanelNodes =
    panelNodes.length === 0
      ? Object.keys($dictionary[$locale]?.permissions || {}).map((key) => ({
          key: `FALLBACK:${key}`,
          permKey: key,
          node: `pano.panel.${key.toLowerCase().replaceAll('_', '.')}`,
          titleKey: `permissions.${key}.title`,
          descKey: `permissions.${key}.description`,
          type: 'panel',
        }))
      : [];

  const groupNodes = (groups) =>
    (groups || []).map((g) => ({
      key: `GROUP:${g.name}`,
      node: `group.${g.name}`,
      title: g.displayName || g.name,
      desc: `(${g.name})`,
      type: 'group',
    }));

  let showNodeSuggestions = false;
  $: nodeQuery = ($draft?.nodeValue || '').trim().toLowerCase();
  $: suggestions = showNodeSuggestions
    ? [
        ...(panelNodes.length > 0 ? panelNodes : fallbackPanelNodes),
        ...pluginNodes,
        ...groupNodes($permissionGroups),
      ]
    : [];

  $: filteredPanelNodes = suggestions
    .filter((s) => {
      // If no query, show everything up to limit
      if (!nodeQuery) return true;

      const searchableFields = [
        s.node,
        s.permKey,
        s.key,
        s.type,
        s.source,
        s.pluginId,
        s.type === 'panel' || s.type === 'plugin' ? $_(s.titleKey) : s.title,
        s.type === 'panel' || s.type === 'plugin' ? $_(s.descKey) : s.desc,
        s.type === 'plugin' ? $_(`plugins.${s.pluginId}.title`) : '',
      ].map((f) => String(f || '').toLowerCase());

      return searchableFields.some((f) => f.includes(nodeQuery));
    })
    .slice(0, 15);

  function addContext() {
    const d = get(draft);
    draft.set({ ...d, contexts: [...(d.contexts || []), { key: '', value: '' }] });
  }

  function removeContext(index) {
    const d = get(draft);
    draft.set({ ...d, contexts: (d.contexts || []).filter((_, i) => i !== index) });
  }

  function handleSave() {
    const n = get(node);
    if (!n) return;

    const d = get(draft);
    if (!d.nodeValue?.trim()) return;

    const contextObj = {};
    (d.contexts || []).forEach((c) => {
      const key = (c.key || '').trim();
      if (!key) return;
      const value = (c.value ?? '').toString().trim();
      if (!value) return;
      contextObj[key] = value;
    });

    const expiresAt =
      d.expiryType === 'date' && d.expiryDate ? new Date(d.expiryDate).getTime() : null;

    const updated = {
      ...n,
      node: d.nodeValue.trim(),
      active: !!d.active,
      context: contextObj,
      expiresAt,
      updatedAt: Date.now(),
    };

    hide();
    callback(updated);
  }
</script>
