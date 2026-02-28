<style>
  :global(.indicator-added) {
    border-left: 5px solid #198754 !important;
    padding-left: 0.75rem !important;
  }
  :global(.indicator-modified) {
    border-left: 5px solid #fd7e14 !important;
    padding-left: 0.75rem !important;
  }

  :global(.text-added) {
    color: #198754 !important;
  }
  :global(.text-modified) {
    color: #fd7e14 !important;
  }

  /* Table row indicators */
  :global(tr.indicator-added td:first-child) {
    box-shadow: inset 4px 0 0 0 #198754 !important;
  }
  :global(tr.indicator-modified td:first-child) {
    box-shadow: inset 4px 0 0 0 #fd7e14 !important;
  }
</style>

<div class="container vstack gap-3">
  {#if showLuckPermsAlert}
    <div class="alert alert-info d-flex align-items-center mb-0 alert-dismissible" role="alert">
      <i class="fas fa-info-circle me-3 fa-lg"></i>
      <div>
        {$_('pages.permissions.panel.luckperms-alert')}
        <a href="{PANO_WEBSITE_URL}/docs/platform/integrations/luckperms" target="_blank" class="alert-link ms-1">
          {$_('pages.permissions.panel.nodes.pano-only-alert-link')}
          <i class="fas fa-external-link-alt ms-1 small"></i>
        </a>
      </div>
      <button
        type="button"
        class="btn-close"
        on:click={dismissAlert}
        aria-label={$_('buttons.close')}></button>
    </div>
  {/if}
  <PageActions leftClasses="d-lg-flex d-none">
    <div slot="middle" class="hstack gap-2">
      <SearchInput
        showSpinner={false}
        placeholderKey="pages.permissions.panel.search.placeholder"
        ariaLabelKey="pages.permissions.panel.search.placeholder"
        debounceMs={250}
        on:change={(e) => (globalSearchQuery = e.detail.value)} />
    </div>
    <div slot="right" class="hstack gap-2">
      {#if hasChanges}
        <button
          type="button"
          use:tooltip={[$_('buttons.save'), { placement: 'bottom' }]}
          aria-label={$_('buttons.save')}
          class="btn btn-link"
          on:click={saveSnapshot}>
          <i class="fa fa-save"></i>
        </button>

        <button
          type="button"
          use:tooltip={[$_('buttons.reset'), { placement: 'bottom' }]}
          aria-label={$_('buttons.reset')}
          class="btn btn-link"
          on:click={showResetModal}>
          <i class="fa fa-undo"></i>
        </button>

      {/if}

      {#if showGroups}
        <button type="button" class="btn btn-secondary" on:click={createGroup}>
          <i class="fa fa-plus"></i>
          <span class="d-lg-inline d-none"
            >{$_('pages.permissions.panel.actions.create-group')}</span>
        </button>
      {:else if showTracks}
        <button type="button" class="btn btn-secondary" on:click={createTrack}>
          <i class="fa fa-plus"></i>
          <span class="d-lg-inline d-none"
            >{$_('pages.permissions.panel.actions.create-track')}</span>
        </button>
      {:else if showUsers}
        <button type="button" class="btn btn-secondary" on:click={openUserSearch}>
          <i class="fa fa-plus"></i>
          <span class="d-lg-inline d-none">{$_('pages.permissions.panel.actions.add-player')}</span>
        </button>
      {/if}
    </div>
  </PageActions>

  <div class="row g-3">
    <div class="col-lg-4">
      <div class="accordion" id="leftAccordion">
        <!-- Trackler -->
        <div
          class="accordion-item"
          role="button"
          tabindex="0"
          on:keydown={(e) => e.key === 'Enter' && alert('zaa')}>
          <h2 class="accordion-header" id="tracksHeading">
            <button
              class="accordion-button {showTracks ? '' : 'collapsed'}"
              type="button"
              aria-controls="tracksCollapse"
              on:click={() => {
                const collapse = document.getElementById('tracksCollapse');
                if (collapse) {
                  showTracks = !collapse.classList.contains('show');
                  showGroups = false;
                  showUsers = false;
                  const collapseInstance = window.bootstrap?.Collapse.getOrCreateInstance(collapse);
                  collapseInstance.toggle();
                }
              }}>
              <span class="me-2">{$_('pages.permissions.panel.accordions.tracks')}</span>
            </button>
          </h2>
          <div
            id="tracksCollapse"
            class="accordion-collapse collapse"
            aria-labelledby="tracksHeading"
            data-bs-parent="#leftAccordion">
            <div class="accordion-body p-0">
              <div style={listStyle(260)}>
                {#if Array.isArray(filteredTracks) && filteredTracks.length > 0}
                  <div class="accordion accordion-flush" id="tracksListAccordion">
                    {#each filteredTracks as track (track.id ?? track.name)}
                      <div class="accordion-item">
                        <h2
                          class="accordion-header"
                          id={'trackHeading-' + (track.id ?? track.name)}>
                          <button
                            type="button"
                            class="accordion-button collapsed py-2 {newTrackIds.has(
                              String(track.id),
                            )
                              ? 'indicator-added'
                              : trackIdsWithChangedGroups.has(String(track.id))
                                ? 'indicator-modified'
                                : ''}"
                            data-bs-toggle="collapse"
                            data-bs-target={'#trackCollapse-' + (track.id ?? track.name)}
                            aria-controls={'trackCollapse-' + (track.id ?? track.name)}
                            on:click={() => selectTrack(track)}>
                            <div class="d-flex flex-column text-start w-100">
                              <div
                                class="text-truncate {newTrackIds.has(String(track.id))
                                  ? 'text-added'
                                  : modifiedTrackIds.has(String(track.id)) ||
                                      trackIdsWithChangedGroups.has(String(track.id))
                                    ? 'text-modified'
                                    : ''}">
                                {track.name}
                              </div>
                              <small class=" text-truncate">{track.description}</small>
                            </div>
                          </button>
                        </h2>
                        <div
                          id={'trackCollapse-' + (track.id ?? track.name)}
                          class="accordion-collapse collapse"
                          aria-labelledby={'trackHeading-' + (track.id ?? track.name)}
                          data-bs-parent="#tracksListAccordion">
                          <div class="accordion-body py-2">
                            {#if Array.isArray(track.groupNames) && track.groupNames.length > 0}
                              <div class="list-group list-group-flush">
                                {#each track.groupNames as gname (gname)}
                                  <button
                                    type="button"
                                    class="list-group-item list-group-item-action py-1"
                                    on:click|stopPropagation={() => selectGroupByName(gname)}
                                    aria-label={$_('pages.permissions.panel.actions.go-to-group', { values: { name: gname } })}
                                    use:tooltip={[$_('pages.permissions.panel.actions.go-to-group', { values: { name: gname } })]}>
                                    {gname}
                                  </button>
                                {/each}
                              </div>
                            {:else}
                              <NoContent />
                            {/if}
                          </div>
                        </div>
                      </div>
                    {/each}
                  </div>
                {:else}
                  <NoContent />
                {/if}
              </div>
            </div>
          </div>
        </div>
        <!-- Gruplar -->
        <div
          class="accordion-item"
          role="button"
          tabindex="0"
          on:keydown={(e) => e.key === 'Enter' && alert('zaa')}>
          <h2 class="accordion-header" id="groupsHeading">
            <button
              class="accordion-button {showGroups ? '' : 'collapsed'}"
              type="button"
              aria-controls="groupsCollapse"
              on:click={() => {
                const collapse = document.getElementById('groupsCollapse');
                if (collapse) {
                  showGroups = !collapse.classList.contains('show');
                  showTracks = false;
                  showUsers = false;
                  const collapseInstance = window.bootstrap?.Collapse.getOrCreateInstance(collapse);
                  collapseInstance.toggle();
                }
              }}>
              <span class="me-2">{$_('pages.permissions.panel.accordions.groups')}</span>
            </button>
          </h2>
          <div
            id="groupsCollapse"
            class="accordion-collapse collapse"
            aria-labelledby="groupsHeading"
            data-bs-parent="#leftAccordion">
            <div class="accordion-body p-0">
              {#if Array.isArray(filteredGroups) && filteredGroups.length > 0}
                <div class="list-group list-group-flush" style={listStyle(320)}>
                  {#each filteredGroups as group (group.id ?? group.name)}
                    <button
                      type="button"
                      class="list-group-item list-group-item-action d-flex justify-content-between align-items-center {selectedGroup &&
                      selectedGroup.id === group.id
                        ? 'active'
                        : ''} {newGroupIds.has(String(group.id))
                        ? 'indicator-added'
                        : groupIdsWithChangedNodes.has(String(group.id))
                          ? 'indicator-modified'
                          : ''}"
                      on:click={() => selectGroup(group)}>
                      <div>
                        <div
                          class="fw-normal {newGroupIds.has(String(group.id))
                            ? 'text-added'
                            : modifiedGroupIds.has(String(group.id))
                              ? 'text-modified'
                              : ''}">
                          {group.displayName}
                        </div>
                        <small class="font-monospace">({group.name})</small>
                      </div>
                      <span class="badge bg-primary">{getGroupWeight(group, nodes)}</span>
                    </button>
                  {/each}
                </div>
              {:else}
                <div style={listStyle(320)}>
                  <NoContent />
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Kullanıcılar -->
        <div
          class="accordion-item"
          role="button"
          tabindex="0"
          on:keydown={(e) => e.key === 'Enter' && alert('zaa')}>
          <h2 class="accordion-header" id="usersHeading">
            <button
              class="accordion-button {showUsers ? '' : 'collapsed'}"
              type="button"
              aria-controls="usersCollapse"
              on:click={() => {
                const collapse = document.getElementById('usersCollapse');
                if (collapse) {
                  showUsers = !collapse.classList.contains('show');
                  showGroups = false;
                  showTracks = false;
                  const collapseInstance = window.bootstrap?.Collapse.getOrCreateInstance(collapse);
                  collapseInstance.toggle();
                }
              }}>
              <span class="me-2">{$_('pages.permissions.panel.accordions.users')}</span>
            </button>
          </h2>
          <div
            id="usersCollapse"
            class="accordion-collapse collapse"
            aria-labelledby="usersHeading"
            data-bs-parent="#leftAccordion">
            <div class="accordion-body p-0">
              {#if Array.isArray(filteredUsers) && filteredUsers.length > 0}
                <div class="list-group list-group-flush" style={listStyle(320)}>
                  {#each filteredUsers as user, i (user.id ?? user.username)}
                    <div
                      class="list-group-item d-flex justify-content-between align-items-center {selectedUser &&
                      selectedUser.id === user.id
                        ? 'active'
                        : ''} {newUserIds.has(String(user.id))
                        ? 'indicator-added'
                        : userIdsWithChangedNodes.has(String(user.id))
                          ? 'indicator-modified'
                          : ''} {i === filteredUsers.length - 1 ? 'rounded-bottom' : ''}"
                      role="button"
                      tabindex="0"
                      on:click={() => selectUser(user)}
                      on:keydown={(e) => onActionKeydown(e, () => selectUser(user))}>
                      <div class="me-2 d-flex align-items-center overflow-hidden">
                        {#if user.username}
                          <img
                            src={`/api/profile/picture/${encodeURIComponent(user.username)}?${$avatarVersion}`}
                            alt={`${user.username}`}
                            width="24"
                            height="24"
                            class="rounded me-2 flex-shrink-0"
                            loading="lazy" />
                        {/if}
                        <div class="overflow-hidden">
                          <div class="fw-bold text-truncate">
                            {user.username}
                          </div>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              {:else}
                <div style={listStyle(320)} class="rounded-bottom">
                  <NoContent />
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="col-lg-8">
      {#if selectedGroup || selectedUser}
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            {#if selectedGroup}
              <div>
                <h5 class="mb-0">
                  {selectedGroup.displayName || selectedGroup.name}
                  <span class="font-monospace">{selectedGroup.name}</span>
                </h5>
                <small>
                  {$_('pages.permissions.panel.group.parents')}:
                  {#if selectedGroupParents.length === 0}
                    -
                  {:else}
                    {#each selectedGroupParents as pg (pg.name)}
                      <button
                        type="button"
                        class="badge text-bg-secondary rounded-pill btn btn-sm btn-link text-decoration-none focus-ring me-1"
                        style="cursor: pointer;"
                        on:click={() => selectGroupByName(pg.name)}
                        aria-label={$_('pages.permissions.panel.actions.go-to-parent-group', { values: { name: pg.name } })}
                        use:tooltip={[$_('pages.permissions.panel.actions.go-to-parent-group', { values: { name: pg.name } })]}>
                        {pg.name}
                      </button>
                    {/each}
                  {/if}
                </small>
                <small class="d-block"
                  >{$_('pages.permissions.panel.group.weight')}: {getGroupWeight(
                    selectedGroup,
                    nodes,
                  )}</small>
              </div>
              <div class="hstack gap-2">
                <button
                  type="button"
                  class="btn btn-link"
                  on:click={editSelectedGroup}
                  aria-label={$_('buttons.edit')}
                  use:tooltip={[$_('buttons.edit')]}>
                  <i class="fa fa-pen"></i>
                </button>
                <button
                  type="button"
                  class="btn btn-link"
                  disabled={selectedGroup?.name === 'default'}
                  on:click={() => selectedGroup?.name !== 'default' && showRemoveGroupModal()}
                  aria-disabled={selectedGroup?.name === 'default'}
                  aria-label={$_('buttons.delete')}
                  use:tooltip={[$_('buttons.delete')]}>
                  <i class="fa fa-trash"></i>
                </button>
                <button
                  type="button"
                  class="btn btn-primary"
                  on:click={() => addNode('GROUP')}>
                  <i class="fa fa-plus"></i><span class="d-lg-inline d-none ms-2"
                    >{$_('pages.permissions.panel.nodes.add-node')}</span>
                </button>
              </div>
            {:else}
              <div>
                <h5 class="mb-0 d-flex align-items-center">
                  {#if selectedUser.username}
                    <img
                      src={`/api/profile/picture/${encodeURIComponent(selectedUser.username)}?${$avatarVersion}`}
                      alt={`${selectedUser.username} avatar`}
                      width="28"
                      height="28"
                      class="rounded me-2 flex-shrink-0"
                      loading="lazy" />
                  {/if}
                  <span>{selectedUser.username}</span>
                </h5>
                <div class="small">
                  {$_('pages.permissions.panel.user.groups')}:
                  {#if getUserDirectGroupNames(selectedUser, nodes).length === 0}
                    -
                  {:else}
                    {#each getUserDirectGroupNames(selectedUser, nodes) as gname (gname)}
                      <button
                        type="button"
                        class="badge text-bg-secondary ms-1 border-0"
                        style="cursor: pointer;"
                        on:click={() => selectGroupByName(gname)}
                        aria-label={$_('pages.permissions.panel.actions.go-to-group', { values: { name: gname } })}
                        use:tooltip={[$_('pages.permissions.panel.actions.go-to-group', { values: { name: gname } })]}>
                        {gname}
                      </button>
                    {/each}
                  {/if}
                </div>
              </div>

              <div class="hstack gap-2">
                <button class="btn btn-primary" on:click={() => addNode('USER')}>
                  <i class="fa fa-plus"></i><span class="d-lg-inline d-none ms-2"
                    >{$_('pages.permissions.panel.nodes.add-node')}</span>
                </button>
                {#if !isSelfUser(selectedUser)}
                  <button
                    type="button"
                    class="btn btn-link"
                    aria-label={$_('pages.permissions.panel.user.delete')}
                    use:tooltip={[$_('pages.permissions.panel.user.delete')]}
                    on:click={() => showRemoveUserModal(selectedUser)}>
                    <i class="fa fa-trash me-1"></i>
                  </button>
                {/if}
              </div>
            {/if}
          </div>

          {#if currentNodes.length === 0}
            <NoContent text={$_('pages.permissions.panel.empty.no-nodes')} />
          {:else}
            <div class="table-responsive">
              <table class="table align-middle">
                <thead>
                  <tr>
                    <th></th>
                    <th class="align-middle text-nowrap"
                      >{$_('pages.permissions.panel.nodes.node')}</th>
                    <th class="align-middle text-nowrap"
                      >{$_('pages.permissions.panel.nodes.active')}</th>
                    <th class="align-middle text-nowrap"
                      >{$_('pages.permissions.panel.nodes.expiry')}</th>
                  </tr>
                </thead>
                <tbody>
                  {#each filteredCurrentNodes as node (node.id ?? `${node.holderType}:${node.holderId}:${node.node}:${node.createdAt}`)}
                    <tr
                      class={newNodeIds.has(String(node.id))
                        ? 'indicator-added'
                        : modifiedNodeIds.has(String(node.id))
                          ? 'indicator-modified'
                          : ''}>
                      <td class="d-table-cell text-center hstack gap-2 text-nowrap">
                        <button
                          class="btn btn-link"
                          on:click={() => editNode(node)}
                          aria-label={nodeActionLabels.edit}
                          use:tooltip={[nodeActionLabels.edit]}>
                          <i class="fa fa-pen"></i>
                        </button>
                        <button
                          class="btn btn-link"
                          on:click={() => removeNode(node)}
                          aria-label={nodeActionLabels.delete}
                          use:tooltip={[nodeActionLabels.delete]}>
                          <i class="fa fa-eraser"></i>
                        </button>
                      </td>
                      <td>
                        <div class="text-truncate font-monospace">
                          {node.node}
                        </div>
                        {#each formatNodeContext(node.context) as c (c)}
                          <span class="badge text-bg-primary me-2">{c}</span>
                        {/each}
                      </td>
                      <td>
                        <div class="form-check form-switch">
                          <input
                            class="form-check-input"
                            type="checkbox"
                            checked={!!node.active}
                            on:change={() => toggleNode(node)} />
                        </div>
                      </td>
                      <td class="small">
                        {#if node.expiresAt}
                          {new Date(node.expiresAt).toLocaleString()}
                        {:else}
                          -
                        {/if}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </div>
      {:else if selectedTrack}
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <div>
              <h5 class="mb-0">{selectedTrack.name}</h5>
              <small>{selectedTrack.description}</small>
            </div>
            <div class="hstack gap-2">
              <button
                class="btn btn-link"
                use:tooltip={[$_('buttons.edit')]}
                aria-label={$_('buttons.edit')}
                on:click={() => {
                  selectedTrackForEdit = selectedTrack;
                  showEditTrackModal();
                }}>
                <i class="fa fa-pen"></i>
              </button>
              <button
                class="btn btn-link"
                use:tooltip={[$_('buttons.remove')]}
                aria-label={$_('buttons.remove')}
                on:click={() => {
                  selectedTrackForEdit = selectedTrack;
                  showRemoveTrackModal();
                }}>
                <i class="fa fa-trash"></i>
              </button>
            </div>
          </div>
          <div class="card-body">
            {#if Array.isArray(selectedTrack.groupNames) && selectedTrack.groupNames.length > 0}
              <div class="list-group list-group-flush">
                {#each selectedTrack.groupNames as gname (gname)}
                  <button
                    type="button"
                    class="list-group-item list-group-item-action py-1"
                    on:click={() => selectGroupByName(gname)}
                    aria-label={$_('pages.permissions.panel.actions.go-to-group', { values: { name: gname } })}
                    use:tooltip={[$_('pages.permissions.panel.actions.go-to-group', { values: { name: gname } })]}>
                    {gname}
                  </button>
                {/each}
              </div>
            {:else}
              <div>-</div>
            {/if}
          </div>
        </div>
      {:else}
        <div class="card d-flex align-items center justify-content-center h-100">
          <NoContent text={$_('pages.permissions.panel.empty.select-something')} />
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Modals -->
<CreatePermissionGroupModal />
<EditPermissionNodeModal />
<SearchPlayerModal />
<EditPermTrackModal />
<ConfirmRemovePermTrackModal />
<ConfirmRemovePermGroupModal />
<ConfirmRemovePermUserModal />
<ConfirmResetPermissionsModal />

<script context="module">
  import { error } from '@sveltejs/kit';
  import ApiUtilModule from '$lib/api.util.js';

  /** @type {import('@sveltejs/kit').PageLoad} */
  export async function load(event) {
    const res = await ApiUtilModule.get({
      path: '/api/panel/permission/snapshot',
      request: event,
    });
    if (res?.error) {
      throw error(500, res.error);
    }
    return { snapshot: res };
  }
</script>

<script>
  import { getContext, onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { beforeNavigate } from '$app/navigation';
  import { _ } from 'svelte-i18n';
  import tooltip from '$lib/tooltip.util';

  import ApiUtil from '$lib/api.util.js';
  import { show as showToast } from '$lib/components/ToastContainer.svelte';
  import CreatePermissionGroupModal, {
    show as showCreatePermissionGroupModal,
    setCallback as setCreatePermissionGroupModalCallback,
  } from '$lib/components/modals/CreatePermissionGroupModal.svelte';
  import EditPermTrackModal, {
    show as showEditPermTrackModal,
    setCallback as setEditPermTrackModalCallback,
  } from '$lib/components/modals/EditPermTrackModal.svelte';
  import EditPermissionNodeModal, {
    show as showEditPermissionNodeModal,
    setCallback as setEditPermissionNodeModalCallback,
  } from '$lib/components/modals/EditPermissionNodeModal.svelte';
  import ConfirmRemovePermTrackModal, {
    show as showConfirmRemovePermTrackModal,
    setCallback as setConfirmRemovePermTrackModalCallback,
  } from '$lib/components/modals/ConfirmRemovePermTrackModal.svelte';
  import ConfirmRemovePermGroupModal, {
    show as showConfirmRemovePermGroupModal,
    setCallback as setConfirmRemovePermGroupModalCallback,
  } from '$lib/components/modals/ConfirmRemovePermGroupModal.svelte';
  import { avatarVersion } from '$lib/Store';
  import ConfirmRemovePermUserModal, {
    show as showConfirmRemovePermUserModal,
    setCallback as setConfirmRemovePermUserModalCallback,
  } from '$lib/components/modals/ConfirmRemovePermUserModal.svelte';
  import ConfirmResetPermissionsModal, {
    show as showConfirmResetPermissionsModal,
    setCallback as setConfirmResetPermissionsModalCallback,
  } from '$lib/components/modals/ConfirmResetPermissionsModal.svelte';
  import SearchPlayerModal, {
    show as showSearchPlayerModal,
    setCallback as setSearchPlayerModalCallback,
  } from '$lib/components/modals/SearchPlayerModal.svelte';
  import PageActions from '$lib/components/PageActions.svelte';
  import NoContent from '$lib/components/NoContent.svelte';
  import SearchInput from '$lib/components/SearchInput.svelte';
  import { currentLanguage } from '$lib/language.util.js';
  import { PANO_WEBSITE_URL } from '$lib/variables.js';

  export let data;

  const pageTitle = getContext('pageTitle');
  const currentUser = getContext('user');

  pageTitle.set('pages.permissions.title');

  let showLuckPermsAlert = browser ? localStorage.getItem('hide_luckperms_alert') !== 'true' : true;

  function dismissAlert() {
    showLuckPermsAlert = false;
    if (browser) {
      localStorage.setItem('hide_luckperms_alert', 'true');
    }
  }

  // Variables for editor functionality
  let selectedGroup = null;
  let selectedUser = null;
  let selectedTrack = null;

  // Snapshot state (server shape: groups/tracks/nodes/users)
  let snapshot = JSON.parse(JSON.stringify(data?.snapshot || {}));
  let permissionGroups = snapshot.groups || [];
  let tracks = snapshot.tracks || [];
  let nodes = snapshot.nodes || [];
  let users = snapshot.users || [];

  let filteredGroups = permissionGroups;
  let filteredTracks = tracks;
  let filteredUsers = users;
  let currentNodes = [];
  let filteredCurrentNodes = [];
  let selectedGroupParents = [];
  $: nodeActionLabels = { edit: $_('buttons.edit'), delete: $_('buttons.delete') };
  $: hasChanges = (function () {
    const normalize = (gs, ts, ns) => {
      const sortedGroups = [...(gs || [])]
        .map((g) => ({
          name: g.name,
          displayName: g.displayName || g.name,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      const sortedTracks = [...(ts || [])]
        .map((t) => ({
          name: t.name,
          description: t.description || '',
          groupNames: [...(t.groupNames || [])],
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      const sortedNodes = [...(ns || [])]
        .filter((n) => {
          // Skip the default active group node for users because server often treats it as implicit or strips it
          if (
            n.holderType === 'USER' &&
            n.node === 'group.default' &&
            (n.active === true || n.active === undefined)
          ) {
            return false;
          }
          return true;
        })
        .map((n) => {
          // Stable context normalization
          const ctx = n.context || {};
          const sortedCtx = Object.keys(ctx)
            .sort()
            .reduce((acc, key) => {
              acc[key] = ctx[key];
              return acc;
            }, {});

          return {
            holderType: n.holderType,
            // For groups, name is the key. For users, ID is the key.
            holderKey: n.holderType === 'GROUP' ? n.holderName : n.holderId,
            node: n.node,
            active: n.active !== false, // default true
            context: JSON.stringify(sortedCtx),
            expiresAt: n.expiresAt || null,
          };
        })
        .sort((a, b) => {
          const keyA = `${a.holderType}:${a.holderKey}:${a.node}:${a.active}:${a.context}`;
          const keyB = `${b.holderType}:${b.holderKey}:${b.node}:${b.active}:${b.context}`;
          return keyA.localeCompare(keyB);
        });

      return JSON.stringify({
        groups: sortedGroups,
        tracks: sortedTracks,
        nodes: sortedNodes,
      });
    };

    return (
      normalize(permissionGroups, tracks, nodes) !==
      normalize(snapshot.groups, snapshot.tracks, snapshot.nodes)
    );
  })();

  $: newGroupIds = new Set(
    (permissionGroups || [])
      .filter((g) => g.id && !snapshot.groups?.some((og) => String(og.id) === String(g.id)))
      .map((g) => String(g.id)),
  );
  $: modifiedGroupIds = new Set(
    (permissionGroups || [])
      .filter((g) => {
        if (!g.id) return false;
        const og = snapshot.groups?.find((x) => String(x.id) === String(g.id));
        return og && (og.name !== g.name || og.displayName !== g.displayName);
      })
      .map((g) => String(g.id)),
  );
  $: groupIdsWithChangedNodes = new Set(
    (permissionGroups || [])
      .filter((g) => {
        const gid = String(g.id);
        const hasNew = (nodes || []).some(
          (n) =>
            n.holderType === 'GROUP' && String(n.holderId) === gid && newNodeIds.has(String(n.id)),
        );
        const hasModified = (nodes || []).some(
          (n) =>
            n.holderType === 'GROUP' &&
            String(n.holderId) === gid &&
            modifiedNodeIds.has(String(n.id)),
        );
        const hasRemoved = (snapshot.nodes || []).some(
          (sn) =>
            sn.holderType === 'GROUP' &&
            String(sn.holderId) === gid &&
            !(nodes || []).some((n) => String(n.id) === String(sn.id)),
        );
        return hasNew || hasModified || hasRemoved;
      })
      .map((g) => String(g.id)),
  );
  $: newTrackIds = new Set(
    (tracks || [])
      .filter((t) => t.id && !snapshot.tracks?.some((ot) => String(ot.id) === String(t.id)))
      .map((t) => String(t.id)),
  );
  $: modifiedTrackIds = new Set(
    (tracks || [])
      .filter((t) => {
        if (!t.id) return false;
        const ot = snapshot.tracks?.find((x) => String(x.id) === String(t.id));
        return (
          ot && (norm(ot.name) !== norm(t.name) || (ot.description || '') !== (t.description || ''))
        );
      })
      .map((t) => String(t.id)),
  );
  $: trackIdsWithChangedGroups = new Set(
    (tracks || [])
      .filter((t) => {
        if (!t.id) return false;
        const ot = snapshot.tracks?.find((x) => String(x.id) === String(t.id));
        if (!ot) return false;
        const oldG = JSON.stringify(Array.isArray(ot.groupNames) ? ot.groupNames : []);
        const newG = JSON.stringify(Array.isArray(t.groupNames) ? t.groupNames : []);
        return oldG !== newG;
      })
      .map((t) => String(t.id)),
  );
  $: newUserIds = new Set(
    (users || [])
      .filter((u) => u.id && !snapshot.users?.some((ou) => String(ou.id) === String(u.id)))
      .map((u) => String(u.id)),
  );
  $: userIdsWithChangedNodes = new Set(
    (users || [])
      .filter((u) => {
        const uid = String(u.id);
        const hasNew = (nodes || []).some(
          (n) =>
            n.holderType === 'USER' && String(n.holderId) === uid && newNodeIds.has(String(n.id)),
        );
        const hasModified = (nodes || []).some(
          (n) =>
            n.holderType === 'USER' &&
            String(n.holderId) === uid &&
            modifiedNodeIds.has(String(n.id)),
        );
        const hasRemoved = (snapshot.nodes || []).some(
          (sn) =>
            sn.holderType === 'USER' &&
            String(sn.holderId) === uid &&
            !(nodes || []).some((n) => String(n.id) === String(sn.id)),
        );
        return hasNew || hasModified || hasRemoved;
      })
      .map((u) => String(u.id)),
  );
  $: newNodeIds = new Set(
    (nodes || [])
      .filter((n) => n.id && !snapshot.nodes?.some((on) => String(on.id) === String(n.id)))
      .map((n) => String(n.id)),
  );
  $: modifiedNodeIds = new Set(
    (nodes || [])
      .filter((n) => {
        if (!n.id) return false;
        const on = snapshot.nodes?.find((x) => String(x.id) === String(n.id));
        return (
          on &&
          (on.node !== n.node ||
            on.active !== n.active ||
            on.expiresAt !== n.expiresAt ||
            JSON.stringify(on.context || {}) !== JSON.stringify(n.context || {}))
        );
      })
      .map((n) => String(n.id)),
  );

  beforeNavigate((navigation) => {
    if (hasChanges) {
      if (!confirm($_('pages.translations.unsaved-changes-alert-text'))) {
        navigation.cancel();
      }
    }
  });

  onMount(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  });

  let showGroups = false;
  let showTracks = false;
  let showUsers = false;

  function listStyle(maxHeight) {
    return `max-height: ${maxHeight}px; overflow-y: auto;`;
  }

  function onActionKeydown(e, action) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action?.();
    }
  }

  function formatUserGroups(user, currentNodesList, currentGroupList) {
    // IMPORTANT: For the UI we want ONLY direct group assignments from USER-held nodes:
    // - node: "group.<name>"
    // - holderType: "USER"
    // - holderId: user.id
    // No inherited/parent groups should be listed here.
    if (!user?.id) return '-';

    const directGroupNames = (currentNodesList || [])
      .filter(
        (n) =>
          n?.holderType === 'USER' &&
          n?.holderId === user.id &&
          n?.active !== false &&
          typeof n?.node === 'string' &&
          n.node.startsWith('group.'),
      )
      .map((n) => n.node.slice('group.'.length))
      .map((x) => String(x || '').trim())
      .filter(Boolean);

    const unique = Array.from(new Set(directGroupNames));
    if (unique.length === 0) return '-';

    const byName = new Map((currentGroupList || []).map((g) => [g.name, g]));
    return unique
      .map((name) => {
        const g = byName.get(name);
        return (g?.displayName || name || '').trim();
      })
      .filter(Boolean)
      .join(', ');
  }

  function getUserDirectGroupNames(user, currentNodesList) {
    if (!user?.id) return [];
    const activeGroupNames = (currentNodesList || [])
      .filter(
        (n) =>
          n?.holderType === 'USER' &&
          n?.holderId === user.id &&
          n?.active !== false &&
          typeof n?.node === 'string' &&
          n.node.startsWith('group.'),
      )
      .map((n) => String(n.node).slice('group.'.length))
      .map((x) => String(x || '').trim())
      .filter(Boolean);

    const uniqueActive = Array.from(new Set(activeGroupNames));
    return uniqueActive;
  }



  function formatNodeContext(ctx) {
    if (!ctx || typeof ctx !== 'object') return [];
    const entries = [];
    for (const [k, v] of Object.entries(ctx)) {
      if (!k) continue;
      if (Array.isArray(v)) {
        for (const vv of v) entries.push(`${k}: ${vv}`);
        continue;
      }
      if (v === null || v === undefined) continue;
      entries.push(`${k}: ${v}`);
    }
    const uniq = Array.from(new Set(entries.map((x) => String(x))));
    return uniq.length ? uniq.sort((a, b) => a.localeCompare(b)) : [];
  }

  // Variables for tracks functionality
  let selectedTrackForEdit = null;
  let globalSearchQuery = '';

  // Modal variables
  let selectedNodeForEdit = null;
  let editingGroupId = null;
  let newGroup = emptyGroupForm();

  // Functions for editor functionality
  function selectGroup(group) {
    selectedGroup = group;
    selectedUser = null;
    selectedTrack = null;
    refreshCurrentNodes();
  }

  function selectGroupByName(name) {
    const g = (permissionGroups || []).find((grp) => grp.name === name);
    if (!g) return;
    selectGroup(g);
  }

  function selectUser(user) {
    selectedUser = user;
    selectedGroup = null;
    selectedTrack = null;
    refreshCurrentNodes();
  }

  function selectTrack(track) {
    selectedTrack = track;
    selectedGroup = null;
    selectedUser = null;
    refreshCurrentNodes();
  }



  const normalizeWeight = (raw) => {
    const n = parseInt(raw);
    if (isNaN(n)) return 0;
    return n;
  };

  function upsertGroupDisplayNameNode({ groupId, groupName, displayName, now }) {
    const dn = String(displayName ?? '').trim();
    const nodeValue = `displayname.${dn || groupName || ''}`;

    // Find existing displayname.* nodes for this group
    const idxs = [];
    for (let i = 0; i < (nodes || []).length; i++) {
      const n = nodes[i];
      if (
        n?.holderType === 'GROUP' &&
        String(n?.holderId) === String(groupId) &&
        typeof n?.node === 'string' &&
        n.node.startsWith('displayname.')
      ) {
        idxs.push(i);
      }
    }

    // If there are multiple, update the first and remove/deactivate the rest to keep deterministic state.
    if (idxs.length > 0) {
      const firstIdx = idxs[0];
      const idxSet = new Set(idxs);
      nodes = (nodes || []).map((n, i) => {
        if (!idxSet.has(i)) return n;
        if (i === firstIdx) {
          return {
            ...n,
            holderName: groupName ?? n.holderName,
            node: nodeValue,
            active: true,
            updatedAt: now,
          };
        }
        // keep extra nodes but make them deterministic/inactive
        return { ...n, active: false, updatedAt: now };
      });
      return;
    }

    // Create new node
    nodes = [
      ...(nodes || []),
      makeNode({
        id: now + 3,
        holderType: 'GROUP',
        holderId: groupId,
        holderName: groupName,
        node: nodeValue,
        active: true,
        context: {},
        expiresAt: null,
        createdAt: now,
        updatedAt: now,
      }),
    ];
  }

  function getGroupWeight(group, currentNodesList) {
    if (!group) return 0;
    const weightNodes = (currentNodesList || []).filter(
      (n) =>
        n.holderType === 'GROUP' &&
        n.holderId === group.id &&
        n.active !== false &&
        typeof n.node === 'string' &&
        n.node.startsWith('weight.'),
    );

    if (weightNodes.length === 0) return 0;

    const weights = weightNodes
      .map((n) => parseInt(n.node.slice('weight.'.length)))
      .filter((w) => !isNaN(w));

    return weights.length > 0 ? Math.max(...weights) : 0;
  }

  function upsertGroupWeightNode({ groupId, groupName, weight, now }) {
    const w = normalizeWeight(weight);

    const idxs = [];
    for (let i = 0; i < (nodes || []).length; i++) {
      const n = nodes[i];
      if (
        n?.holderType === 'GROUP' &&
        String(n?.holderId) === String(groupId) &&
        typeof n?.node === 'string' &&
        n.node.startsWith('weight.')
      ) {
        idxs.push(i);
      }
    }

    // If there are multiple, update the first and deactivate the rest to keep the result deterministic.
    if (idxs.length > 0) {
      const firstIdx = idxs[0];
      const idxSet = new Set(idxs);
      nodes = (nodes || []).map((n, i) => {
        if (!idxSet.has(i)) return n;
        if (i === firstIdx) {
          return {
            ...n,
            holderName: groupName ?? n.holderName,
            node: `weight.${w}`,
            active: true,
            updatedAt: now,
          };
        }
        return { ...n, updatedAt: now };
      });
      return;
    }

    nodes = [
      ...(nodes || []),
      makeNode({
        id: now + 2,
        holderType: 'GROUP',
        holderId: groupId,
        holderName: groupName,
        node: `weight.${w}`,
        active: true,
        context: {},
        expiresAt: null,
        createdAt: now,
        updatedAt: now,
      }),
    ];
  }

  function groupNodesCount(groupId) {
    return (nodes || []).filter((n) => n.holderType === 'GROUP' && n.holderId === groupId).length;
  }

  function computeSelectedGroupParents(group, currentNodesList) {
    if (!group) return [];

    const directParentNames = (currentNodesList || [])
      .filter(
        (n) =>
          n?.holderType === 'GROUP' &&
          n?.holderId === group.id &&
          n?.active !== false &&
          typeof n?.node === 'string' &&
          n.node.startsWith('group.'),
      )
      .map((n) => n.node.slice('group.'.length))
      .filter((name) => name && name !== group.name);

    // except for the default group itself (default cannot have default as parent).

    const unique = Array.from(new Set([...directParentNames]));
    const byName = new Map((permissionGroups || []).map((g) => [g.name, g]));

    return unique
      .map((name) => {
        const g = byName.get(name);
        return {
          name,
          displayName: g?.displayName || name,
          weight: getGroupWeight(g, currentNodesList),
        };
      })
      .sort((a, b) => b.weight - a.weight || a.name.localeCompare(b.name));
  }

  $: selectedGroupParents = selectedGroup ? computeSelectedGroupParents(selectedGroup, nodes) : [];

  function refreshCurrentNodes() {
    if (selectedGroup) {
      const real = (nodes || []).filter(
        (n) => n.holderType === 'GROUP' && n.holderId === selectedGroup.id,
      );

      currentNodes = [...real];
      return;
    }
    if (selectedUser) {
      currentNodes = (nodes || []).filter(
        (n) => n.holderType === 'USER' && n.holderId === selectedUser.id,
      );
      return;
    }
    currentNodes = [];
  }

  function addNode(holderType) {
    const now = Date.now();
    if (holderType === 'GROUP' && selectedGroup) {
      // Use edit modal for creating a new node
      selectedNodeForEdit = {
        id: now, // temporary id for UI; server will remap on snapshot save
        holderType: 'GROUP',
        holderId: selectedGroup.id,
        holderName: selectedGroup.name,
        node: '',
        active: true,
        context: { pano: true },
        expiresAt: null,
        createdAt: now,
        updatedAt: now,
      };
      showEditPermissionNodeModal({
        node: selectedNodeForEdit,
        permissionGroups,
        isAdd: true,
      });
      return;
    }
    if (holderType === 'USER' && selectedUser) {
      selectedNodeForEdit = {
        id: now,
        holderType: 'USER',
        holderId: selectedUser.id,
        holderName: null,
        node: '',
        active: true,
        context: { pano: true },
        expiresAt: null,
        createdAt: now,
        updatedAt: now,
      };
      showEditPermissionNodeModal({
        node: selectedNodeForEdit,
        permissionGroups,
        isAdd: true,
      });
    }
  }

  function toggleNode(node) {
    nodes = (nodes || []).map((n) =>
      n.id === node.id ? { ...n, active: !n.active, updatedAt: Date.now() } : n,
    );
    // Keep group.displayName in sync when displayname node is toggled.
    if (
      node?.holderType === 'GROUP' &&
      typeof node?.node === 'string' &&
      node.node.startsWith('displayname.')
    ) {
      syncGroupDisplayNameFromNodes(node.holderId);
    }
    refreshCurrentNodes();
  }

  function removeNode(node) {
    nodes = (nodes || []).filter((n) => n.id !== node.id);
    // Keep group.displayName in sync when displayname node is removed.
    if (
      node?.holderType === 'GROUP' &&
      typeof node?.node === 'string' &&
      node.node.startsWith('displayname.')
    ) {
      syncGroupDisplayNameFromNodes(node.holderId);
    }
    refreshCurrentNodes();
  }

  function editNode(node) {
    selectedNodeForEdit = node;
    showEditPermissionNodeModal({ node, permissionGroups });
  }

  function parseGroupDisplayNameNodeValue(nodeStr) {
    if (typeof nodeStr !== 'string') return null;
    if (!nodeStr.startsWith('displayname.')) return null;
    const v = String(nodeStr.slice('displayname.'.length) || '').trim();
    return v || null;
  }

  function syncGroupDisplayNameFromNodes(groupId) {
    if (!groupId) return;

    const group = (permissionGroups || []).find((g) => g?.id === groupId);
    if (!group) return;

    // Pick the first ACTIVE displayname node if present.
    const dnNode = (nodes || []).find(
      (n) =>
        n?.holderType === 'GROUP' &&
        n?.holderId === groupId &&
        n?.active !== false &&
        typeof n?.node === 'string' &&
        n.node.startsWith('displayname.'),
    );

    const dn = dnNode ? parseGroupDisplayNameNodeValue(dnNode.node) : null;
    const newDisplayName = (dn || group.name || '').trim();

    permissionGroups = (permissionGroups || []).map((g) =>
      g?.id === groupId ? { ...g, displayName: newDisplayName, updatedAt: Date.now() } : g,
    );

    if (selectedGroup?.id === groupId) {
      selectedGroup = {
        ...selectedGroup,
        displayName: newDisplayName,
        updatedAt: Date.now(),
      };
    }
  }

  // Modal callbacks are wired once below via setCallback(...)

  async function loadSnapshot() {
    const prevGroupId = selectedGroup?.id;
    const prevGroupName = selectedGroup?.name;
    const prevTrackId = selectedTrack?.id;
    const prevTrackName = selectedTrack?.name;
    const prevUserId = selectedUser?.id;
    const prevUserName = selectedUser?.username;

    const res = await ApiUtil.get({ path: '/api/panel/permission/snapshot' });
    if (res?.error) {
      console.error('Failed to load snapshot:', res.error);
      return;
    }
    snapshot = JSON.parse(JSON.stringify(res || {}));
    permissionGroups = snapshot.groups || [];
    tracks = snapshot.tracks || [];
    nodes = snapshot.nodes || [];
    users = snapshot.users || [];

    // Re-select previous items if they still exist
    if (prevGroupId || prevGroupName) {
      selectedGroup =
        permissionGroups.find(
          (g) =>
            (prevGroupId != null && g.id === prevGroupId) ||
            (prevGroupName != null && g.name === prevGroupName),
        ) || null;
    }
    if (prevTrackId || prevTrackName) {
      selectedTrack =
        tracks.find(
          (t) =>
            (prevTrackId != null && t.id === prevTrackId) ||
            (prevTrackName != null && t.name === prevTrackName),
        ) || null;
    }
    if (prevUserId || prevUserName) {
      selectedUser =
        users.find(
          (u) =>
            (prevUserId != null && u.id === prevUserId) ||
            (prevUserName != null && u.username === prevUserName),
        ) || null;
    }

    refreshCurrentNodes();
  }

  async function saveSnapshot() {
    // Ensure group displayName is also tracked as a node (LuckPerms-like)
    // - node: "displayname.<value>"
    // - holderType: "GROUP"
    // - holderId: group.id
    // This keeps snapshot consistent even if the UI edits displayName only on the group object.
    const now = Date.now();
    let i = 0;
    for (const g of permissionGroups || []) {
      if (!g?.id) continue;
      const dn = String(g.displayName || g.name || '').trim();
      upsertGroupDisplayNameNode({
        groupId: g.id,
        groupName: g.name,
        displayName: dn,
        now: now + i++, // Ensure unique prefix for potential new IDs
      });
    }

    const body = {
      groups: permissionGroups,
      tracks,
      nodes,
    };
    const res = await ApiUtil.post({
      path: '/api/panel/permission/snapshot',
      body,
    });
    if (res?.error) {
      console.error('Failed to save snapshot:', res.error);
      await showToast('components.toasts.settings-save-error', {
        errorCode: $_('errors.' + res.error),
      });
      return;
    }
    await loadSnapshot();
    await showToast('components.toasts.settings-save-success');
  }

  function showResetModal() {
    showConfirmResetPermissionsModal();
  }

  function resetChanges() {
    permissionGroups = JSON.parse(JSON.stringify(snapshot.groups || []));
    tracks = JSON.parse(JSON.stringify(snapshot.tracks || []));
    nodes = JSON.parse(JSON.stringify(snapshot.nodes || []));
    users = JSON.parse(JSON.stringify(snapshot.users || []));
    refreshCurrentNodes();
  }

  function createGroup() {
    editingGroupId = null;
    newGroup = emptyGroupForm();
    showCreatePermissionGroupModal({
      allGroups: permissionGroups,
      newGroup,
    });
  }

  function editSelectedGroup() {
    if (!selectedGroup) return;

    editingGroupId = selectedGroup.id;

    // Pre-fill the modal form based on the selected group and its meta nodes.
    const parentNames = (nodes || [])
      .filter(
        (n) =>
          n?.holderType === 'GROUP' &&
          n?.holderId === selectedGroup.id &&
          n?.active !== false &&
          typeof n?.node === 'string' &&
          n.node.startsWith('group.'),
      )
      .map((n) => n.node.slice('group.'.length))
      .filter(Boolean);

    newGroup = {
      name: selectedGroup.name || '',
      weight: getGroupWeight(selectedGroup, nodes),
      displayName: selectedGroup.displayName || '',
      parents: Array.from(new Set(parentNames)),
    };

    showCreatePermissionGroupModal({
      allGroups: permissionGroups,
      newGroup,
    });
  }

  function createTrack() {
    selectedTrackForEdit = null;
    showEditPermTrackModal({ permissionGroups });
  }

  function openUserSearch() {
    showSearchPlayerModal({
      localPlayers: users,
      allGroups: permissionGroups,
      nodes,
      existingUserIds: (users || []).map((u) => u.id),
    });
  }

  function handleUserSelected(u) {
    if (!u) return;
    const existing = (users || []).find((ex) => ex.id === u.id);
    if (!existing) {
      users = [...(users || []), u];
      selectedUser = u;

      // When adding a new user to the local list, ensure they start with a default group assignment node.
      // This is a USER-held node like: "group.default"
      const hasAnyDirectGroupNode = (nodes || []).some(
        (n) =>
          n?.holderType === 'USER' &&
          n?.holderId === u.id &&
          n?.active !== false &&
          typeof n?.node === 'string' &&
          n.node.startsWith('group.'),
      );

      const hasDefaultGroupNode = (nodes || []).some(
        (n) =>
          n?.holderType === 'USER' &&
          n?.holderId === u.id &&
          typeof n?.node === 'string' &&
          n.node === 'group.default' &&
          n?.active !== false,
      );

      if (!hasAnyDirectGroupNode && !hasDefaultGroupNode) {
        const now = Date.now();
        let tempId = now;
        while ((nodes || []).some((n) => n?.id === tempId)) tempId++;

        nodes = [
          ...(nodes || []),
          makeNode({
            id: tempId,
            holderType: 'USER',
            holderId: u.id,
            holderName: null,
            node: 'group.default',
            active: true,
            context: { pano: true },
            expiresAt: null,
            createdAt: now,
            updatedAt: now,
          }),
        ];
      }
    } else {
      selectedUser = existing;
    }
    selectedGroup = null;
    selectedTrack = null;
    refreshCurrentNodes();
  }

  function isSelfUser(u) {
    const me = $currentUser;
    return !!me?.username && !!u?.username && me.username === u.username;
  }

  async function removeUserFromList(u) {
    // deprecated: keep for backwards compatibility, but route to modal
    if (!u) return;
    showRemoveUserModal(u);
  }

  async function showRemoveUserModal(u) {
    if (!u) return;
    if (isSelfUser(u)) {
      await showToast('components.toasts.settings-save-error', {
        errorCode: "You can't remove yourself.",
      });
      return;
    }
    showConfirmRemovePermUserModal(u);
  }

  function removeUserConfirmed(u) {
    if (!u) return;

    users = (users || []).filter((x) => x.id !== u.id);
    nodes = (nodes || []).filter((n) => !(n.holderType === 'USER' && n.holderId === u.id));

    if (selectedUser && selectedUser.id === u.id) {
      selectedUser = null;
      refreshCurrentNodes();
    }
  }

  function removeSelectedGroup() {
    // confirmed removal (called after modal confirmation)
    if (!selectedGroup) return;
    removeGroupConfirmed(selectedGroup);
  }

  function showRemoveGroupModal() {
    if (!selectedGroup) return;
    if (selectedGroup.name === 'default') return;
    showConfirmRemovePermGroupModal(selectedGroup, nodes);
  }

  function removeGroupConfirmed(groupToRemove) {
    if (!groupToRemove) return;
    if (groupToRemove.name === 'default') return;

    const removedName = groupToRemove.name;
    const removedId = groupToRemove.id;

    // Remove group from source list
    permissionGroups = (permissionGroups || []).filter((g) => g.id !== removedId);

    // Remove group-held nodes
    nodes = (nodes || []).filter((n) => !(n.holderType === 'GROUP' && n.holderId === removedId));

    // Remove from tracks membership lists
    tracks = (tracks || []).map((t) => ({
      ...t,
      groupNames: (t.groupNames || []).filter((gn) => gn !== removedName),
    }));

    if (selectedGroup && selectedGroup.id === removedId) {
      selectedGroup = null;
    }
    refreshCurrentNodes();
  }

  function emptyGroupForm() {
    return {
      name: '',
      weight: 0,
      displayName: '',
      parents: [],
    };
  }

  function makeNode({
    id,
    holderType,
    holderId,
    holderName,
    node,
    active = true,
    context = {},
    expiresAt = null,
    createdAt,
    updatedAt,
  }) {
    return {
      id,
      holderType,
      holderId,
      holderName,
      node,
      active,
      context,
      expiresAt,
      createdAt,
      updatedAt,
    };
  }

  function groupMetaNodes({ now, groupId, groupName, parents }) {
    const out = [];
    const ps = Array.isArray(parents) ? parents : [];
    for (let i = 0; i < ps.length; i++) {
      const parent = ps[i];
      if (!parent) continue;
      out.push(
        makeNode({
          id: now + 100 + i,
          holderType: 'GROUP',
          holderId: groupId,
          holderName: groupName,
          node: `group.${parent}`,
          context: {},
          createdAt: now,
          updatedAt: now,
        }),
      );
    }
    return out;
  }

  const norm = (v) => String(v || '').toLocaleLowerCase($currentLanguage?.code);

  function nodeSearchText(n) {
    if (!n || typeof n !== 'object') return '';
    const parts = [
      n.holderType,
      n.holderName,
      n.node,
      // context can help searching for server/world/etc filters
      n.context ? JSON.stringify(n.context) : '',
    ];
    return norm(parts.filter(Boolean).join(' '));
  }

  function nodeMatchesQuery(n, q) {
    if (!q) return true;
    return nodeSearchText(n).includes(q);
  }
  const sortGroups = (gs, currentNodesList) =>
    [...(gs || [])].sort(
      (a, b) =>
        getGroupWeight(b, currentNodesList) - getGroupWeight(a, currentNodesList) ||
        String(a?.name ?? '').localeCompare(String(b?.name ?? ''), undefined, {
          sensitivity: 'base',
        }),
    );

  // Track modal open helpers
  function showEditTrackModal() {
    if (!selectedTrackForEdit) return;
    showEditPermTrackModal({ track: selectedTrackForEdit, permissionGroups });
  }

  function showRemoveTrackModal() {
    if (!selectedTrackForEdit) return;
    showConfirmRemovePermTrackModal(selectedTrackForEdit);
  }

  // Modal callbacks are wired once below via setCallback(...)

  async function handleCreateGroup(groupData) {
    try {
      const now = Date.now();

      // Edit existing group
      if (editingGroupId != null) {
        const existing = (permissionGroups || []).find((g) => g.id === editingGroupId);
        if (!existing) {
          editingGroupId = null;
          return;
        }

        const oldName = existing.name;
        const weight = normalizeWeight(groupData.weight);
        const parents = Array.from(new Set([...(groupData.parents || [])].filter(Boolean)));
        const updatedGroup = {
          ...existing,
          name: groupData.name,
          weight,
          displayName: groupData.displayName || groupData.name,
          updatedAt: now,
        };

        permissionGroups = (permissionGroups || []).map((g) =>
          g.id === editingGroupId ? updatedGroup : g,
        );

        // Update holderName for remaining group-held nodes and sync parents
        const oldParentNodes = (nodes || []).filter(
          (n) =>
            n.holderType === 'GROUP' &&
            String(n.holderId) === String(editingGroupId) &&
            typeof n.node === 'string' &&
            n.node.startsWith('group.'),
        );

        const currentParentNodes = groupMetaNodes({
          now,
          groupId: editingGroupId,
          groupName: updatedGroup.name,
          parents,
        });

        // 1. Remove old parents
        nodes = (nodes || []).filter(
          (n) =>
            !(
              n.holderType === 'GROUP' &&
              String(n.holderId) === String(editingGroupId) &&
              typeof n.node === 'string' &&
              n.node.startsWith('group.')
            ),
        );

        // 2. Update existing nodes holderName
        nodes = (nodes || []).map((n) =>
          n.holderType === 'GROUP' && String(n.holderId) === String(editingGroupId)
            ? { ...n, holderName: updatedGroup.name }
            : n,
        );

        // 3. Keep old parent nodes if they match (to preserve IDs) or add new ones
        const finalParentNodes = [];
        for (const newNode of currentParentNodes) {
          const matchingOld = oldParentNodes.find((on) => on.node === newNode.node);
          if (matchingOld) {
            finalParentNodes.push({ ...matchingOld, holderName: updatedGroup.name });
          } else {
            finalParentNodes.push(newNode);
          }
        }

        nodes = [...(nodes || []), ...finalParentNodes];

        upsertGroupWeightNode({
          groupId: editingGroupId,
          groupName: updatedGroup.name,
          weight,
          now,
        });

        upsertGroupDisplayNameNode({
          groupId: editingGroupId,
          groupName: updatedGroup.name,
          displayName: updatedGroup.displayName,
          now,
        });

        // Update track references if the group name changed
        if (oldName && oldName !== updatedGroup.name) {
          tracks = (tracks || []).map((t) => ({
            ...t,
            groupNames: (t.groupNames || []).map((gn) => (gn === oldName ? updatedGroup.name : gn)),
          }));
        }

        selectedGroup = updatedGroup;
        editingGroupId = null;
        refreshCurrentNodes();
        return;
      }

      const weight = normalizeWeight(groupData.weight);
      const parents = (() => {
        const base = Array.from(new Set([...(groupData.parents || [])].filter(Boolean)));
        // Ensure every newly created group inherits from default (except the default group itself).
        if (groupData?.name !== 'default' && !base.includes('default')) base.push('default');
        return base;
      })();
      const newGroupData = {
        id: now, // Temporary ID (will be remapped server-side on save snapshot)
        name: groupData.name,
        weight,
        displayName: groupData.displayName || groupData.name,
        createdAt: now,
        updatedAt: now,
      };

      permissionGroups = [...permissionGroups, newGroupData];

      // LuckPerms-like: apply parent inheritance as permission nodes.
      // Parent is expressed as a group-held node: "group.<parentName>"
      nodes = [
        ...(nodes || []),
        ...groupMetaNodes({
          now,
          groupId: newGroupData.id,
          groupName: newGroupData.name,
          parents,
        }),
      ];

      upsertGroupWeightNode({
        groupId: newGroupData.id,
        groupName: newGroupData.name,
        weight,
        now,
      });

      upsertGroupDisplayNameNode({
        groupId: newGroupData.id,
        groupName: newGroupData.name,
        displayName: newGroupData.displayName,
        now,
      });

      // Auto-select newly created group
      showGroups = true;
      showTracks = false;
      showUsers = false;
      selectGroup(newGroupData);
    } catch (error) {
      console.error('Error creating group:', error);
    }
  }

  function handlecreateTrackFromModal(trackData) {
    if (!trackData) return;
    const now = Date.now();
    const newTrack = {
      id: now,
      name: trackData.name,
      description: trackData.description || '',
      groupNames: Array.isArray(trackData.groupNames) ? trackData.groupNames : [],
      createdAt: now,
      updatedAt: now,
    };
    tracks = [...(tracks || []), newTrack];

    // Auto-select newly created track
    showTracks = true;
    showGroups = false;
    showUsers = false;
    selectedTrackForEdit = newTrack;
    selectTrack(newTrack);
  }

  function handleEditTrackFromModal(trackData) {
    if (!trackData) return;
    const now = Date.now();
    const updated = { ...trackData, updatedAt: now };
    tracks = (tracks || []).map((tr) => (tr.id === updated.id ? updated : tr));
    if (selectedTrack && selectedTrack.id === updated.id) {
      selectedTrack = updated;
    }
  }

  function handleEditPermissionNodeFromModal(updatedNode) {
    if (!updatedNode) return;
    const idx = (nodes || []).findIndex((n) => n.id === updatedNode.id);
    if (idx === -1) {
      nodes = [...(nodes || []), updatedNode];
    } else {
      nodes = (nodes || []).map((n) => (n.id === updatedNode.id ? updatedNode : n));
    }

    // If a group displayname node changed, update the group's displayName immediately.
    if (
      updatedNode?.holderType === 'GROUP' &&
      typeof updatedNode?.node === 'string' &&
      updatedNode.node.startsWith('displayname.')
    ) {
      syncGroupDisplayNameFromNodes(updatedNode.holderId);
    }

    refreshCurrentNodes();
  }

  // Wire modal callbacks (Bootstrap modal pattern) to page handlers.
  setCreatePermissionGroupModalCallback(handleCreateGroup);
  setEditPermTrackModalCallback((trackData) => {
    // unified track modal callback:
    // - create mode returns { name, description, groupNames }
    // - edit mode returns { ...track, id, ... }
    if (trackData?.id != null) {
      handleEditTrackFromModal(trackData);
    } else {
      handlecreateTrackFromModal(trackData);
    }
  });
  setEditPermissionNodeModalCallback(handleEditPermissionNodeFromModal);
  setSearchPlayerModalCallback(handleUserSelected);
  setConfirmRemovePermTrackModalCallback((removedTrack) => {
    if (!removedTrack) return;
    const rid = removedTrack.id;
    const rname = removedTrack.name;

    tracks = (tracks || []).filter((t) => {
      if (rid != null) return t.id !== rid;
      return t?.name !== rname;
    });

    if (
      selectedTrack &&
      ((rid != null && selectedTrack.id === rid) || (rid == null && selectedTrack.name === rname))
    ) {
      selectedTrack = null;
    }
    if (
      selectedTrackForEdit &&
      ((rid != null && selectedTrackForEdit.id === rid) ||
        (rid == null && selectedTrackForEdit.name === rname))
    ) {
      selectedTrackForEdit = null;
    }
  });
  setConfirmRemovePermGroupModalCallback((removedGroup) => {
    removeGroupConfirmed(removedGroup);
  });
  setConfirmRemovePermUserModalCallback((removedUser) => {
    removeUserConfirmed(removedUser);
  });
  setConfirmResetPermissionsModalCallback(resetChanges);

  // Initialize and update filtered groups and tracks reactively
  $: {
    const q = norm(globalSearchQuery);
    const hasQ = !!q;
    const groupDisplayByName = new Map(
      (permissionGroups || []).map((g) => [
        String(g?.name || '').trim(),
        norm(g?.displayName || g?.name),
      ]),
    );

    filteredGroups = sortGroups(
      hasQ
        ? (permissionGroups || []).filter((g) => {
            const gid = g?.id;
            const groupText = `${norm(g?.name)} ${norm(g?.displayName)}`;
            if (groupText.includes(q)) return true;
            if (gid == null) return false;
            return (nodes || []).some(
              (n) => n?.holderType === 'GROUP' && n?.holderId === gid && nodeMatchesQuery(n, q),
            );
          })
        : permissionGroups,
      nodes,
    );

    filteredTracks = hasQ
      ? (tracks || []).filter((t) => {
          const base = `${norm(t?.name)} ${norm(t?.description)}`;
          if (base.includes(q)) return true;

          if (!Array.isArray(t?.groupNames) || t.groupNames.length === 0) return false;

          // match by group name OR group displayName
          return t.groupNames.some((gn) => {
            const name = String(gn || '').trim();
            if (!name) return false;
            if (norm(name).includes(q)) return true;
            const display = groupDisplayByName.get(name) || '';
            return !!display && display.includes(q);
          });
        })
      : tracks || [];

    filteredUsers = hasQ
      ? (users || []).filter((u) => {
          const uid = u?.id;
          const base = norm(u?.username);
          if (base.includes(q)) return true;
          if (Array.isArray(u?.groups) && u.groups.some((g) => norm(g).includes(q))) return true;
          if (uid == null) return false;
          return (nodes || []).some(
            (n) => n?.holderType === 'USER' && n?.holderId === uid && nodeMatchesQuery(n, q),
          );
        })
      : users || [];

    refreshCurrentNodes();
    filteredCurrentNodes = hasQ
      ? (currentNodes || []).filter((n) => nodeMatchesQuery(n, q))
      : currentNodes;
  }
</script>
