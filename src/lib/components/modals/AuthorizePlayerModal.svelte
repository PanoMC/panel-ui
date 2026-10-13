<!-- The groups one user is in and the user's own permission nodes, in the LuckPerms node model the
     permission editor uses (`group.<name>` is membership, any other node is a permission that is
     set to true or false). It saves this user's rows only; the editor page stays the place for
     groups, tracks, contexts and expiry. -->
<div class="modal fade" bind:this={$modalElement} tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">
          {$_('components.modals.authorize-player.title')}
          <span class="text-body-secondary fw-normal">{$player.username || ''}</span>
        </h5>
        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          aria-label={$_('buttons.close')}
          on:click={hide}></button>
      </div>
      <form style="display: contents;" on:submit|preventDefault={onSubmit}>
        <div class="modal-body vstack gap-3">
          {#if $loading}
            <div class="d-flex justify-content-center py-4">
              <div class="spinner-border text-primary" role="status"></div>
            </div>
          {:else if $loadFailed}
            <div class="alert alert-danger mb-0" role="alert">
              {$_('components.modals.authorize-player.load-failed')}
            </div>
          {:else}
            <!-- Groups -->
            <div class="vstack gap-2">
              <label for="authorizePlayerGroup">
                {$_('components.modals.authorize-player.permission-group-label')}
              </label>
              <div class="hstack gap-2 flex-wrap">
                {#each groupNodes as node (node.key)}
                  <span class="badge text-bg-primary d-inline-flex align-items-center gap-2">
                    {groupLabel(node.node)}
                    <button
                      type="button"
                      class="btn-close btn-close-white"
                      style="font-size: 0.6em;"
                      title={$_('buttons.remove')}
                      aria-label={$_('buttons.remove')}
                      on:click={() => removeNode(node)}></button>
                  </span>
                {:else}
                  <!-- Nobody is without a group: with no group node the user is in the default one. -->
                  <span class="badge text-bg-secondary"
                    >{groupLabel('group.' + $defaultGroup)}</span>
                {/each}
              </div>
              <select
                class="form-select"
                id="authorizePlayerGroup"
                bind:value={groupToAdd}
                on:change={addGroup}>
                <option value="">{$_('components.modals.authorize-player.select-group')}</option>
                {#each availableGroups as group (group.name)}
                  <option value={group.name}>{group.displayName || group.name}</option>
                {/each}
              </select>
            </div>

            <!-- The user's own nodes -->
            <div class="vstack gap-2">
              <label for="authorizePlayerNode">
                {$_('components.modals.authorize-player.permissions-label')}
              </label>
              <div class="input-group">
                <input
                  class="form-control font-monospace"
                  class:is-invalid={nodeInvalid}
                  id="authorizePlayerNode"
                  type="text"
                  list="authorizePlayerNodeOptions"
                  autocomplete="off"
                  maxlength="200"
                  placeholder={$_('components.modals.authorize-player.node-placeholder')}
                  bind:value={nodeToAdd}
                  on:input={() => (nodeInvalid = false)}
                  on:keydown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addNode();
                    }
                  }} />
                <button
                  type="button"
                  class="btn btn-secondary"
                  disabled={!nodeToAdd.trim()}
                  on:click={addNode}>
                  {$_('buttons.add')}
                </button>
              </div>
              <datalist id="authorizePlayerNodeOptions">
                {#each $knownNodes as known (known)}
                  <option value={known}></option>
                {/each}
              </datalist>

              {#if permissionNodes.length}
                <ul class="list-group">
                  {#each permissionNodes as node (node.key)}
                    <li class="list-group-item d-flex align-items-center gap-2">
                      <span class="font-monospace text-break flex-grow-1">
                        {node.node}
                        {#if node.scoped}
                          <span
                            class="badge text-bg-secondary ms-1 fw-normal"
                            title={$_('components.modals.authorize-player.scoped-hint')}>
                            {$_('components.modals.authorize-player.scoped')}
                          </span>
                        {/if}
                      </span>
                      <!-- On is `true`, off is `false`: a node set to false takes the permission away
                           even when a group gives it. -->
                      <div class="form-check form-switch m-0">
                        <input
                          class="form-check-input"
                          type="checkbox"
                          role="switch"
                          autocomplete="off"
                          aria-label={node.node}
                          checked={node.active}
                          on:change={(event) => setActive(node, event.currentTarget.checked)} />
                      </div>
                      <button
                        type="button"
                        class="btn btn-link link-danger p-1"
                        title={$_('buttons.remove')}
                        aria-label={$_('buttons.remove')}
                        on:click={() => removeNode(node)}>
                        <i class="fas fa-trash"></i>
                      </button>
                    </li>
                  {/each}
                </ul>
              {/if}
            </div>

            {#if $error}
              <div class="alert alert-danger mb-0" role="alert">
                {$_('errors.' + $error, {
                  default: $_('components.modals.authorize-player.save-failed'),
                })}
              </div>
            {/if}
          {/if}
        </div>
        <div class="modal-footer">
          <button
            type="submit"
            class="btn btn-primary w-100"
            disabled={$loading || $loadFailed || $submitLoading}>
            {$_('buttons.save')}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from 'svelte/store';

  import ApiUtil from '$lib/api.util';

  const modalElement = writable();
  const player = writable({});
  const loading = writable(true);
  const loadFailed = writable(false);
  const submitLoading = writable(false);
  const error = writable(null);

  /** Every permission group: `{ name, displayName }`. */
  const groups = writable([]);
  const defaultGroup = writable('default');
  /** The user's nodes as edited here: `{ key, node, active, context, expiresAt, createdAt, scoped }`. */
  const nodes = writable([]);
  /** Node names Pano and its plugins register, for the suggestions of the input. */
  const knownNodes = writable([]);

  let modal;
  let keySeq = 0;

  /**
   * @param {{ id: number, username: string }} target the user whose permissions are edited.
   */
  export function show(target) {
    player.set({ ...target });
    error.set(null);
    submitLoading.set(false);

    void loadData(target);

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: 'static',
      keyboard: false,
    });
    modal.show();
  }

  export function hide() {
    modal?.hide();
  }

  function toRow(node) {
    const context = node.context && typeof node.context === 'object' ? node.context : {};

    return {
      key: ++keySeq,
      node: node.node,
      active: node.active !== false,
      context,
      expiresAt: node.expiresAt ?? null,
      createdAt: node.createdAt ?? null,
      // Limited to servers or to a time: made on the permissions page and kept as it is here.
      scoped: Object.keys(context).length > 0 || node.expiresAt != null,
    };
  }

  /** The editor's own snapshot is the source: its groups, and the rows that belong to this user. */
  async function loadData(target) {
    loading.set(true);
    loadFailed.set(false);
    nodes.set([]);

    try {
      const [snapshot, registered] = await Promise.all([
        ApiUtil.get({ path: '/panel/permission/snapshot' }),
        ApiUtil.get({ path: '/panel/permission/registered' }),
      ]);

      if (!snapshot || snapshot.error) {
        loadFailed.set(true);

        return;
      }

      groups.set(
        (snapshot.groups || []).map((group) => ({
          name: group.name,
          displayName: group.displayName || group.name,
        })),
      );
      nodes.set(
        (snapshot.nodes || [])
          .filter(
            (node) => node.holderType === 'USER' && Number(node.holderId) === Number(target.id),
          )
          .map(toRow),
      );
      knownNodes.set(
        [
          ...new Set(
            Object.values(registered?.data || {})
              .flat()
              .map((permission) => permission?.node)
              .filter(Boolean),
          ),
        ].sort(),
      );
    } catch (e) {
      console.error('Loading the permissions failed', e);
      loadFailed.set(true);
    } finally {
      loading.set(false);
    }
  }
</script>

<script>
  import { _ } from 'svelte-i18n';

  import { invalidateAll } from '$app/navigation';

  import { showSuccess as showSuccessToast } from '$lib/components/ToastContainer.svelte';

  const GROUP_PREFIX = 'group.';

  let groupToAdd = '';
  let nodeToAdd = '';
  let nodeInvalid = false;

  // Membership is an active, unscoped `group.<name>` node. A group node that is set to false or
  // limited to a server or a time is shown with the other nodes, as the raw node it is.
  const isMembership = (node) => node.node.startsWith(GROUP_PREFIX) && node.active && !node.scoped;

  $: groupNodes = $nodes.filter(isMembership);
  $: permissionNodes = $nodes.filter((node) => !isMembership(node));
  $: memberOf = new Set(groupNodes.map((node) => node.node.slice(GROUP_PREFIX.length)));
  $: availableGroups = $groups.filter(
    (group) => group.name !== $defaultGroup && !memberOf.has(group.name),
  );

  function groupLabel(node) {
    const name = node.slice(GROUP_PREFIX.length);

    return $groups.find((group) => group.name === name)?.displayName || name;
  }

  function addGroup() {
    if (!groupToAdd) {
      return;
    }

    $nodes = [...$nodes, toRow({ node: GROUP_PREFIX + groupToAdd, active: true })];
    groupToAdd = '';
  }

  function addNode() {
    const node = nodeToAdd.trim();

    if (!node) {
      return;
    }

    // A node has no spaces, and one that is already listed is switched there, not added twice.
    if (/\s/.test(node) || $nodes.some((row) => row.node === node && !row.scoped)) {
      nodeInvalid = true;

      return;
    }

    $nodes = [...$nodes, toRow({ node, active: true })];
    nodeToAdd = '';
  }

  function removeNode(node) {
    $nodes = $nodes.filter((row) => row.key !== node.key);
  }

  function setActive(node, active) {
    $nodes = $nodes.map((row) => (row.key === node.key ? { ...row, active } : row));
  }

  async function onSubmit() {
    if (get(submitLoading) || get(loading) || get(loadFailed)) {
      return;
    }

    submitLoading.set(true);
    error.set(null);

    /** @type {any} */
    let body = null;

    try {
      body = await ApiUtil.put({
        path: `/panel/players/${get(player).id}/permissions`,
        body: {
          nodes: get(nodes).map(({ node, active, context, expiresAt, createdAt }) => ({
            node,
            active,
            context,
            ...(expiresAt != null ? { expiresAt } : {}),
            ...(createdAt != null ? { createdAt } : {}),
          })),
        },
        handler: (result) => result,
      });
    } catch (e) {
      console.error('Saving the permissions failed', e);
    }

    submitLoading.set(false);

    if (!body || body.error) {
      error.set(body?.error?.code || 'UNKNOWN');

      return;
    }

    hide();

    void showSuccessToast('components.toasts.player-authorized-success');

    // The lists show the group of every user: read them again.
    await invalidateAll();
  }
</script>
