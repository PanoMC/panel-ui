<!-- Edit Permission Node Modal -->
<div class="modal fade" bind:this={$modalElement} tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content" style="overflow: visible;">
      <div class="modal-header">
        <h5 class="modal-title">
          {$isAddMode
            ? $_('components.modals.edit-permission-node.add-title')
            : $_('components.modals.edit-permission-node.title')}
        </h5>
        <button
          type="button"
          class="btn-close"
          aria-label={$_('buttons.close')}
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
              <a href="{PANO_WEBSITE_URL}/docs/platform/integrations/luckperms/#%F0%9F%8C%90-pano-exclusive-permissions" target="_blank" class="alert-link ms-1">
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
              <a href="{PANO_WEBSITE_URL}/docs/platform/integrations/luckperms/#%F0%9F%8C%90-pano-exclusive-permissions" target="_blank" class="alert-link ms-1">
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
                    if (!showNodeSuggestions || filteredPanelNodes.length === 0) {
                      if (e.key === 'ArrowDown') showNodeSuggestions = true;
                      return;
                    }

                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      activeSuggestionIndex = (activeSuggestionIndex + 1) % filteredPanelNodes.length;
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      activeSuggestionIndex =
                        (activeSuggestionIndex - 1 + filteredPanelNodes.length) %
                        filteredPanelNodes.length;
                    } else if (e.key === 'Enter' || e.key === 'Tab') {
                      const selected = filteredPanelNodes[activeSuggestionIndex];
                      if (selected?.node) {
                        e.preventDefault();
                        draft.update((d) => ({ ...d, nodeValue: selected.node }));
                        showNodeSuggestions = false;
                      }
                    } else if (e.key === 'Escape') {
                      showNodeSuggestions = false;
                    }
                  }}
                  on:input={() => {
                    showNodeSuggestions = true;
                  }}
                  on:blur={() => {
                    // allow click on suggestion before closing
                    setTimeout(() => (showNodeSuggestions = false), 300);
                  }} />

              {#if showNodeSuggestions}
                <div
                  class="list-group position-absolute w-100 shadow-lg autocomplete-list"
                  on:mousedown|preventDefault
                  role="listbox"
                  style="z-index: 2000; max-height: calc(100vh - 340px); overflow: auto; top: calc(100% + 4px);">
                  {#if filteredPanelNodes.length > 0}
                    {#each filteredPanelNodes as p, i (p.key)}
                      <button
                        type="button"
                        role="option"
                        aria-selected={i === activeSuggestionIndex}
                        class="list-group-item list-group-item-action {i === activeSuggestionIndex ? 'active' : ''}"
                        on:mouseenter={() => (activeSuggestionIndex = i)}
                        on:click={() => {
                          draft.update((d) => ({ ...d, nodeValue: p.node }));
                          showNodeSuggestions = false;
                        }}>
                        <div class="overflow-hidden vstack gap-1">
                          <p class="fw-bold text-truncate mb-0">
                            <i class="fa {p.icon || 'fa-key'} me-2 opacity-75"></i>
                            {p.title}
                            {#if p.type === 'plugin'}
                              <span class="badge text-bg-secondary ms-2 small" style="font-size: 0.7em;">
                                {p.pluginTitle !== `plugins.${p.pluginId}.title` ? p.pluginTitle : p.pluginId}
                              </span>
                            {/if}
                          </p>
                          <div class="text-truncate font-monospace small opacity-75">
                            {p.node}
                          </div>
                          {#if p.desc}
                            <small class="mb-0 opacity-75">{p.desc}</small>
                          {/if}
                        </div>
                      </button>
                    {/each}
                  {:else if nodeQuery}
                    <div class="list-group-item disabled">
                      <NoContent />
                    </div>
                  {/if}
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
                    use:tooltip={[$_('buttons.remove')]}>
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
          {$isAddMode ? $_('buttons.add') : $_('buttons.save')}
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
  const isAddMode = writable(false);

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
    isAddMode.set(!!payload?.isAdd);

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
  import tooltip from '$lib/tooltip.util';
  import NoContent from '$lib/components/NoContent.svelte';

  import { PANO_WEBSITE_URL } from "$lib/variables.js";

  $: permsMap = $registeredPermissions || {};

  $: panelNodes = (permsMap.platform || []).map((p) => {
    const title = $_(`permissions.${p.key}.title`);
    const desc = $_(`permissions.${p.key}.description`);
    const node = p.node || '';
    const permKey = p.key || '';
    return {
      key: `PLATFORM:${node}`,
      permKey,
      node,
      icon: p.icon,
      title,
      desc,
      searchString: `${node} ${permKey} ${title} ${desc}`.toLowerCase(),
      type: 'panel',
    };
  });

  $: pluginNodes = Object.entries(permsMap).flatMap(([pluginId, perms]) => {
    if (pluginId === 'platform') return [];
    const pluginTitle = $_(`plugins.${pluginId}.title`);
    return (perms || []).map((p) => {
      const title = $_(`plugins.${pluginId}.permissions.${p.key}.title`);
      const desc = $_(`plugins.${pluginId}.permissions.${p.key}.description`);
      const node = p.node || '';
      const permKey = p.key || '';
      return {
        key: `PLUGIN:${pluginId}:${node}`,
        permKey,
        node,
        icon: p.icon,
        title,
        desc,
        pluginId,
        pluginTitle,
        searchString:
          `${node} ${permKey} ${title} ${desc} ${pluginId} ${pluginTitle}`.toLowerCase(),
        type: 'plugin',
      };
    });
  });

  $: fallbackPanelNodes =
    panelNodes.length === 0
      ? Object.keys($dictionary[$locale]?.permissions || {}).map((key) => {
          const title = $_(`permissions.${key}.title`);
          const desc = $_(`permissions.${key}.description`);
          const node = `pano.panel.${key.toLowerCase().replaceAll('_', '.')}`;
          return {
            key: `FALLBACK:${key}`,
            permKey: key,
            node,
            title,
            desc,
            searchString: `${node} ${key} ${title} ${desc}`.toLowerCase(),
            type: 'panel',
          };
        })
      : [];

  $: groupNodes = ($permissionGroups || []).map((g) => {
    const title = g.displayName || g.name;
    const desc = `(${g.name})`;
    const node = `group.${g.name}`;
    return {
      key: `GROUP:${g.name}`,
      node,
      title,
      desc,
      searchString: `${node} ${title} ${desc} group`.toLowerCase(),
      type: 'group',
    };
  });

  let showNodeSuggestions = false;
  let activeSuggestionIndex = 0;

  $: {
    nodeQuery;
    activeSuggestionIndex = 0;
  }
  $: nodeQuery = ($draft?.nodeValue || '').trim().toLowerCase();
  $: suggestions = showNodeSuggestions
    ? [...(panelNodes.length > 0 ? panelNodes : fallbackPanelNodes), ...pluginNodes, ...groupNodes]
    : [];

  $: filteredPanelNodes = suggestions
    .filter((s) => {
      // If no query, show everything up to limit
      if (!nodeQuery) return true;

      return s.searchString.includes(nodeQuery);
    })
    .slice(0, 50);

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
