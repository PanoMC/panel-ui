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
              class="alert alert-warning alert-dismissible fade show mb-3 p-2"
              role="alert">
              <i class="fa fa-info-circle me-1"></i>
              {$_('pages.permissions.panel.nodes.pano-only-alert')}
              <a href="{PANO_WEBSITE_URL}/docs/platform/integrations/luckperms/#%F0%9F%8C%90-pano-exclusive-permissions" target="_blank" class="alert-link ms-1">
                {$_('pages.permissions.panel.nodes.pano-only-alert-link')}
                <i class="fa fa-external-link-alt ms-1"></i>
              </a>
            </div>
          {:else if $draft.contexts.some((ctx) => ctx.key?.trim() === 'pano' && ctx.value
                ?.toString()
                .trim() === 'false')}
            <div class="alert alert-info alert-dismissible fade show mb-3 p-2" role="alert">
              <i class="fa fa-info-circle me-1"></i>
              {$_('pages.permissions.panel.nodes.game-only-alert')}
              <a href="{PANO_WEBSITE_URL}/docs/platform/integrations/luckperms/#%F0%9F%8C%90-pano-exclusive-permissions" target="_blank" class="alert-link ms-1">
                {$_('pages.permissions.panel.nodes.pano-only-alert-link')}
                <i class="fa fa-external-link-alt ms-1"></i>
              </a>
            </div>
          {/if}

          <div class="mb-3">
            <label class="form-label" for="nodeValue"
              >{$_('components.modals.edit-permission-node.form.node')}</label>

            {#if showDuplicateRowBanner && draftTrim}
              <div
                class="d-flex align-items-center gap-1 small text-success mb-2 user-select-none"
                role="status">
                <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
                <span>{$_('components.modals.edit-permission-node.node-already-on-holder')}</span>
              </div>
            {:else if $evaluationUserId != null && userEffectiveBannerInsight && draftTrim}
              <div
                class="d-flex align-items-center gap-1 small text-success mb-2 user-select-none"
                role="status">
                <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
                <span>{effectiveBannerLabel(userEffectiveBannerInsight)}</span>
              </div>
            {/if}

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
                            {#if showSuggestionTickForNode(p.node, permEvalCtx)}
                              <span
                                class="ms-2 text-success d-inline-flex align-items-center align-middle"
                                aria-hidden="true"
                                title={suggestionTickTitleForNode(p.node, permEvalCtx)}>
                                <i class="fa-solid fa-check small"></i>
                              </span>
                            {/if}
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
                    title={$_('buttons.remove')}>
                  </button>
                </div>
              {/each}
            {/if}

            <button class="btn btn-link text-decoration-none w-100" type="button" on:click={addContext}>
              <i class="fa fa-plus me-2"></i>{$_('buttons.add')}
            </button>
          </div>
        {/if}
      </div>
      <div class="modal-footer">
        {#if $isAddMode}
          <button
            type="button"
            class="btn btn-secondary w-100"
            on:click={handleSave}
            disabled={!$node || !$draft.nodeValue.trim() || duplicateBlocksSave}>
            {$_('buttons.add')}
          </button>
        {:else}
          <button
            type="button"
            class="btn btn-primary w-100"
            on:click={handleSave}
            disabled={!$node || !$draft.nodeValue.trim() || duplicateBlocksSave}>
            {$_('buttons.save')}
          </button>
        {/if}
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from 'svelte/store';

  const modalElement = writable();
  const node = writable(null);
  const permissionGroups = writable([]);
  /** Other permission rows for same holder (group/user), used to hint duplicates while searching. */
  const siblingNodes = writable([]);
  /** Full LuckPerms-style graph for transitive group checks when holder is USER. */
  const evaluationNodes = writable([]);
  /** Panel user id (holderId) — when set, ticks/banner reflect direct + inherited perms for this user. */
  const evaluationUserId = writable(null);
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
    siblingNodes.set(payload?.siblingNodes ?? []);
    evaluationNodes.set(payload?.evaluationNodes ?? []);
    evaluationUserId.set(
      payload?.evaluationUserId != null ? payload.evaluationUserId : null,
    );
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
  import NoContent from '$lib/components/NoContent.svelte';

  import { PANO_WEBSITE_URL } from "$lib/variables.js";

  /** LuckPerms graph edges stored as permission-looking nodes — not assignable grants in this UI. */
  const LP_META_EDGE_PREFIXES = ['group.', 'weight.', 'displayname.'];

  function evalSameHolderId(a, b) {
    if (a == null || b == null) return false;
    return String(a) === String(b);
  }

  function evalAssignableLuckNode(nodeStr) {
    const s = String(nodeStr || '').trim();
    if (!s) return false;
    return !LP_META_EDGE_PREFIXES.some((pre) => s.startsWith(pre));
  }

  /** Lightweight LP-style implication: equality, trailing .*, or * */
  function evalNodeImplies(candidateNodeStr, desiredPermTrim) {
    const c = String(candidateNodeStr || '').trim();
    const req = String(desiredPermTrim || '').trim();
    if (!c || !req) return false;
    if (c === req) return true;
    if (c === '*') return true;
    if (c.endsWith('.*')) {
      const base = c.slice(0, -2);
      return req === base || req.startsWith(`${base}.`);
    }
    return false;
  }

  function evalGroupIdByName(allGroups, name) {
    const g = (allGroups || []).find((x) => x?.name === name);
    return g?.id ?? null;
  }

  /** Transitive inheritance: USER-held group.<name> + GROUP-held group.<parent> edges */
  function evalExpandedGroupNames(userId, allNodes, allGroups) {
    const queue = [];
    const seen = new Set();

    for (const n of allNodes || []) {
      if (n?.holderType !== 'USER' || !evalSameHolderId(n?.holderId, userId)) continue;
      if (n.active === false) continue;
      if (typeof n.node !== 'string' || !n.node.startsWith('group.')) continue;
      queue.push(String(n.node.slice('group.'.length) || '').trim());
    }

    while (queue.length) {
      const name = queue.pop();
      if (!name || seen.has(name)) continue;
      seen.add(name);

      const gid = evalGroupIdByName(allGroups, name);
      if (gid == null) continue;

      for (const n of allNodes || []) {
        if (n?.holderType !== 'GROUP' || !evalSameHolderId(n?.holderId, gid)) continue;
        if (n.active === false) continue;
        if (typeof n.node !== 'string' || !n.node.startsWith('group.')) continue;
        const pname = String(n.node.slice('group.'.length) || '').trim();
        if (pname && !seen.has(pname)) queue.push(pname);
      }
    }
    return seen;
  }

  function evalIndirectGrantFromGroups(expandedGroupNames, permTrim, allNodes, allGroups) {
    const trimmed = String(permTrim || '').trim();
    if (!trimmed || !(expandedGroupNames instanceof Set) || expandedGroupNames.size === 0) return false;

    for (const gName of expandedGroupNames) {
      const gid = evalGroupIdByName(allGroups, gName);
      if (gid == null) continue;

      for (const n of allNodes || []) {
        if (n?.holderType !== 'GROUP' || !evalSameHolderId(n?.holderId, gid)) continue;
        if (n.active === false) continue;
        if (!evalAssignableLuckNode(n.node)) continue;
        if (evalNodeImplies(n.node, trimmed)) return true;
      }
    }
    return false;
  }

  /**
   * @param excludeDirectRowId — skip this USER-held permission row id (currently edited modal row)
   */
  function analyzeUserEffective(userId, permTrim, allNodes, allGroups, excludeDirectRowId = null) {
    const trimmed = String(permTrim || '').trim();
    if (!trimmed || userId == null) return { hasDirect: false, hasIndirect: false };

    let hasDirect = false;
    for (const n of allNodes || []) {
      if (n?.holderType !== 'USER' || !evalSameHolderId(n?.holderId, userId)) continue;
      if (n.active === false) continue;
      if (!evalAssignableLuckNode(n.node)) continue;
      if (!evalNodeImplies(n.node, trimmed)) continue;
      if (excludeDirectRowId != null && evalSameHolderId(n.id, excludeDirectRowId)) continue;
      hasDirect = true;
      break;
    }

    const expanded = evalExpandedGroupNames(userId, allNodes, allGroups);
    const hasIndirect = evalIndirectGrantFromGroups(expanded, trimmed, allNodes, allGroups);

    return { hasDirect, hasIndirect };
  }

  function effectiveBannerLabel(ins) {
    if (!ins) return '';
    if (ins.hasDirect && ins.hasIndirect)
      return $_('components.modals.edit-permission-node.user-already-has-both-banner');
    if (ins.hasDirect)
      return $_('components.modals.edit-permission-node.user-already-has-direct-banner');
    if (ins.hasIndirect)
      return $_('components.modals.edit-permission-node.user-already-has-indirect-banner');
    return '';
  }

  function effectiveTickTitle(ins) {
    if (!ins) return '';
    if (ins.hasDirect && ins.hasIndirect)
      return $_('components.modals.edit-permission-node.user-already-has-both-tooltip');
    if (ins.hasDirect)
      return $_('components.modals.edit-permission-node.user-already-has-direct-tooltip');
    if (ins.hasIndirect)
      return $_('components.modals.edit-permission-node.user-already-has-indirect-tooltip');
    return '';
  }

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
  /** Other rows on same holder excluding the row opened in this modal. */
  $: draftTrim = String($draft?.nodeValue || '').trim();
  $: holderNodeSelfId = $node?.id;
  $: otherHolderNodes = ($siblingNodes || []).filter(
    (sn) =>
      !(holderNodeSelfId != null && String(sn?.id ?? '') === String(holderNodeSelfId)),
  );

  /** Whether `draftTrim` conflicts with another row on this holder (not the row being edited). */
  $: duplicateNodeOnHolder =
    !!draftTrim &&
    otherHolderNodes.some(
      (sn) =>
        sn?.active !== false &&
        typeof sn?.node === 'string' &&
        String(sn.node).trim() === draftTrim,
    );

  $: showDuplicateRowBanner = duplicateNodeOnHolder;

  $: permEvalCtx = {
    uid: $evaluationUserId,
    nodes: $evaluationNodes ?? [],
    groups: $permissionGroups ?? [],
  };

  $: rawUserEffectiveBanner =
    !$node ||
    permEvalCtx.uid == null ||
    !draftTrim ||
    duplicateNodeOnHolder
      ? null
      : analyzeUserEffective(
          permEvalCtx.uid,
          draftTrim,
          permEvalCtx.nodes,
          permEvalCtx.groups,
          holderNodeSelfId ?? null,
        );

  $: userEffectiveBannerInsight =
    rawUserEffectiveBanner &&
    (rawUserEffectiveBanner.hasDirect || rawUserEffectiveBanner.hasIndirect)
      ? rawUserEffectiveBanner
      : null;

  /** Saving would overlap another permission row with the same node string on this holder. */
  $: duplicateBlocksSave = duplicateNodeOnHolder;

  /** Active assignable strings on sibling rows excluding self — for suggestion ticks. */
  $: siblingAssignedNodeTrimmedSet = new Set(
    otherHolderNodes
      .filter((sn) => sn?.active !== false && typeof sn?.node === 'string')
      .map((sn) => String(sn.node).trim())
      .filter(Boolean),
  );

  function showSuggestionTickForNode(canonicalNodeStr, ctx) {
    const t = String(canonicalNodeStr || '').trim();
    if (!t) return false;

    if (ctx?.uid != null) {
      const full = analyzeUserEffective(ctx.uid, t, ctx.nodes || [], ctx.groups || [], null);
      return full.hasDirect || full.hasIndirect;
    }

    return siblingAssignedNodeTrimmedSet.has(t);
  }

  function suggestionTickTitleForNode(canonicalNodeStr, ctx) {
    const t = String(canonicalNodeStr || '').trim();
    if (!t) return '';

    if (ctx?.uid != null) {
      const full = analyzeUserEffective(ctx.uid, t, ctx.nodes || [], ctx.groups || [], null);
      if (!(full.hasDirect || full.hasIndirect)) return '';
      return effectiveTickTitle(full);
    }

    if (siblingAssignedNodeTrimmedSet.has(t)) {
      return $_('components.modals.edit-permission-node.node-already-on-holder');
    }
    return '';
  }

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

    if (duplicateBlocksSave) {
      return;
    }

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
