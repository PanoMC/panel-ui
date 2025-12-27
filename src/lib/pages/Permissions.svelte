<div class="container vstack gap-3">
  <PageActions>
    <div slot="middle" class="hstack gap-2">
      <input
        type="text"
        class="form-control form-control-sm {String(globalSearchQuery || '').trim() ? 'border-secondary' : ''}"
        placeholder={$_("pages.permissions.panel.search.placeholder")}
        bind:value={globalSearchQuery} />
    </div>
    <div slot="right" class="hstack gap-2">
      <button type="button" class="btn btn-primary btn-sm" on:click={saveSnapshot}>
        <i class="fa fa-save me-1"></i>{$_("pages.permissions.panel.actions.save")}
      </button>

      {#if showGroups}
        <button type="button" class="btn btn-secondary btn-sm" on:click={addGroup}>
          <i class="fa fa-plus me-1"></i>{$_("pages.permissions.panel.actions.add-group")}
        </button>
      {:else if showTracks}
        <button type="button" class="btn btn-secondary btn-sm" on:click={addTrack}>
          <i class="fa fa-plus me-1"></i>{$_("pages.permissions.panel.actions.add-track")}
        </button>
      {:else if showUsers}
        <button type="button" class="btn btn-secondary btn-sm" on:click={openUserSearch}>
          <i class="fa fa-plus me-1"></i>{$_("pages.permissions.panel.actions.add-user")}
        </button>
      {/if}
    </div>
  </PageActions>

  <div class="row g-3">
    <div class="col-lg-4">
      <div class="accordion" id="leftAccordion">


        <!-- Trackler -->
        <div class="accordion-item"
             role="button"
             tabindex="0"
             on:keydown={(e) => e.key === 'Enter' && alert("zaa")}>
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
              <span class="me-2">{$_("pages.permissions.panel.accordions.tracks")}</span>
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
                        <h2 class="accordion-header" id={"trackHeading-" + (track.id ?? track.name)}>
                          <button
                            type="button"
                            class="accordion-button collapsed py-2"
                            data-bs-toggle="collapse"
                            data-bs-target={"#trackCollapse-" + (track.id ?? track.name)}
                            aria-controls={"trackCollapse-" + (track.id ?? track.name)}
                            on:click={() => selectTrack(track)}>
                            <div class="d-flex flex-column text-start w-100">
                              <div class="fw-bold text-truncate">{track.name}</div>
                              <small class="text-muted text-truncate">{track.description}</small>
                            </div>
                          </button>
                        </h2>
                        <div
                          id={"trackCollapse-" + (track.id ?? track.name)}
                          class="accordion-collapse collapse"
                          aria-labelledby={"trackHeading-" + (track.id ?? track.name)}
                          data-bs-parent="#tracksListAccordion">
                          <div class="accordion-body py-2">
                            {#if Array.isArray(track.groupNames) && track.groupNames.length > 0}
                              <div class="list-group list-group-flush">
                                {#each track.groupNames as gname (gname)}
                                  <button
                                    type="button"
                                    class="list-group-item list-group-item-action py-1"
                                    on:click|stopPropagation={() => selectGroupByName(gname)}
                                    aria-label={`Gruba git: ${gname}`}
                                    title={`Gruba git: ${gname}`}>
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
        <div class="accordion-item"
             role="button"
             tabindex="0"
             on:keydown={(e) => e.key === 'Enter' && alert("zaa")}>
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
              <span class="me-2">{$_("pages.permissions.panel.accordions.groups")}</span>
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
                      class="list-group-item list-group-item-action d-flex justify-content-between align-items-center {selectedGroup && selectedGroup.id === group.id ? 'active' : ''}"
                      on:click={() => selectGroup(group)}>
                      <div>
                        <div class="fw-bold">
                          {group.displayName}
                        </div>
                        <small>({group.name})</small>
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
        <div class="accordion-item"
             role="button"
             tabindex="0"
             on:keydown={(e) => e.key === 'Enter' && alert("zaa")}>
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
              <span class="me-2">{$_("pages.permissions.panel.accordions.users")}</span>
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
                  {#each filteredUsers as user (user.id ?? user.username)}
                    <div
                      class="list-group-item d-flex justify-content-between align-items-center {selectedUser && selectedUser.id === user.id ? 'active' : ''}"
                      role="button"
                      tabindex="0"
                      on:click={() => selectUser(user)}
                      on:keydown={(e) => onActionKeydown(e, () => selectUser(user))}>
                      <div class="me-2 d-flex align-items-center overflow-hidden">
                        {#if minotarAvatarUrl(user.username, 24)}
                          <img
                            src={minotarAvatarUrl(user.username, 24)}
                            alt={`${user.username} avatar`}
                            width="24"
                            height="24"
                            class="rounded me-2 flex-shrink-0"
                            loading="lazy" />
                        {/if}
                        <div class="overflow-hidden">
                          <div class="fw-bold text-truncate">{user.username}</div>
                          <small class="d-block text-truncate">{formatUserGroups(user, nodes, permissionGroups)}</small>
                        </div>
                      </div>
                    </div>
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
                  <span class="text-muted fw-normal ms-2">({selectedGroup.name})</span>
                </h5>
                <div class="small text-muted">
                  {$_("pages.permissions.panel.group.parents")}:
                  {#if selectedGroupParents.length === 0}
                    -
                  {:else}
                    {#each selectedGroupParents as pg (pg.name)}
                      <button
                        type="button"
                        class="badge text-bg-light ms-1 border-0"
                        style="cursor: pointer;"
                        on:click={() => selectGroupByName(pg.name)}
                        aria-label={`Üst gruba git: ${pg.name}`}
                        title={`Üst gruba git: ${pg.name}`}>
                        {pg.name}
                      </button>
                    {/each}
                  {/if}
                </div>
                <small>{$_("pages.permissions.panel.group.weight")}: {getGroupWeight(selectedGroup, nodes)}</small>
              </div>
              <div class="hstack gap-2">
                <button
                  type="button"
                  class="btn btn-sm btn-primary"
                  title={$_("pages.permissions.panel.nodes.add-node")}
                  aria-label={$_("pages.permissions.panel.nodes.add-node")}
                  on:click={() => addNode("GROUP")}>
                  <i class="fa fa-plus me-1"></i>{$_("pages.permissions.panel.nodes.node")}
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-primary"
                  on:click={editSelectedGroup}
                  aria-label={$_("pages.permissions.panel.actions.edit")}
                  title={$_("pages.permissions.panel.actions.edit")}>
                  <i class="fa fa-pen me-1"></i>{$_("pages.permissions.panel.actions.edit")}
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-danger"
                  disabled={selectedGroup?.name === "default"}
                  on:click={() => selectedGroup?.name !== "default" && showRemoveGroupModal()}
                  aria-disabled={selectedGroup?.name === "default"}
                  aria-label={$_("pages.permissions.panel.actions.delete")}
                  title={$_("pages.permissions.panel.actions.delete")}>
                  <i class="fa fa-trash me-1"></i>{$_("pages.permissions.panel.actions.delete")}
                </button>
              </div>
            {:else}
              <div>
                <h5 class="mb-0 d-flex align-items-center">
                  {#if minotarAvatarUrl(selectedUser.username, 28)}
                    <img
                      src={minotarAvatarUrl(selectedUser.username, 28)}
                      alt={`${selectedUser.username} avatar`}
                      width="28"
                      height="28"
                      class="rounded me-2 flex-shrink-0"
                      loading="lazy" />
                  {/if}
                  <span>{selectedUser.username}</span>
                </h5>
                <div class="small">
                  {$_("pages.permissions.panel.user.groups")}:
                  {#if getUserDirectGroupNames(selectedUser, nodes).length === 0}
                    -
                  {:else}
                    {#each getUserDirectGroupNames(selectedUser, nodes) as gname (gname)}
                      <button
                        type="button"
                        class="badge text-bg-light ms-1 border-0"
                        style="cursor: pointer;"
                        on:click={() => selectGroupByName(gname)}
                        aria-label={`Gruba git: ${gname}`}
                        title={`Gruba git: ${gname}`}>
                        {gname}
                      </button>
                    {/each}
                  {/if}
                </div>
              </div>

              <div class="hstack gap-2">
                <button class="btn btn-sm btn-primary" on:click={() => addNode("USER")}>
                  <i class="fa fa-plus me-1"></i>{$_("pages.permissions.panel.nodes.node")}
                </button>
                {#if !isSelfUser(selectedUser)}
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger"
                    aria-label={$_("pages.permissions.panel.user.delete")}
                    title={$_("pages.permissions.panel.user.delete")}
                    on:click={() => showRemoveUserModal(selectedUser)}>
                    <i class="fa fa-trash me-1"></i>{$_("pages.permissions.panel.actions.delete")}
                  </button>
                {/if}
              </div>
            {/if}
          </div>

          <div class="card-body">
            {#if currentNodes.length === 0}
              <NoContent text={$_("pages.permissions.panel.empty.no-nodes")} />
            {:else}
              <div class="table-responsive">
                <table class="table table-sm align-middle">
                  <thead>
                    <tr>
                      <th style="width: 45%;">{$_("pages.permissions.panel.nodes.node")}</th>
                      <th style="width: 15%;">{$_("pages.permissions.panel.nodes.active")}</th>
                      <th style="width: 25%;">{$_("pages.permissions.panel.nodes.expiry")}</th>
                      <th style="width: 15%;"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each filteredCurrentNodes as node (node.id ?? `${node.holderType}:${node.holderId}:${node.node}:${node.createdAt}`)}
                      <tr>
                        <td>
                          <div class="text-truncate">{node.node}</div>
                          <div class="small text-muted mt-1">
                            {#each formatNodeContext(node.context) as c (c)}
                              <span class="badge text-bg-light me-1 mb-1">{c}</span>
                            {/each}
                          </div>
                        </td>
                        <td>
                          <input
                            class="form-check-input"
                            type="checkbox"
                            checked={!!node.active}
                            on:change={() => toggleNode(node)} />
                        </td>
                        <td class="small">
                          {#if node.expiresAt}
                            {new Date(node.expiresAt).toLocaleString()}
                          {:else}
                            -
                          {/if}
                        </td>
                        <td class="text-end">
                          <button
                            class="btn btn-sm btn-outline-primary me-2"
                            on:click={() => editNode(node)}
                            aria-label={nodeActionLabels.edit}
                            title={nodeActionLabels.edit}>
                            <i class="fa fa-pen"></i>
                          </button>
                          <button
                            class="btn btn-sm btn-outline-danger"
                            on:click={() => removeNode(node)}
                            aria-label={nodeActionLabels.delete}
                            title={nodeActionLabels.delete}>
                            <i class="fa fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {/if}
          </div>
        </div>
      {:else if selectedTrack}
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <div>
              <h5 class="mb-0">{selectedTrack.name}</h5>
              <small>{selectedTrack.description}</small>
            </div>
            <div class="hstack gap-2">
              <button class="btn btn-sm btn-outline-primary" on:click={() => { selectedTrackForEdit = selectedTrack; showEditTrackModal(); }}>
                <i class="fa fa-pen me-1"></i>{$_("pages.permissions.panel.actions.edit")}
              </button>
              <button class="btn btn-sm btn-outline-danger" on:click={() => { selectedTrackForEdit = selectedTrack; showRemoveTrackModal(); }}>
                <i class="fa fa-trash me-1"></i>{$_("pages.permissions.panel.actions.remove")}
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
                    aria-label={`Gruba git: ${gname}`}
                    title={`Gruba git: ${gname}`}>
                    {gname}
                  </button>
                {/each}
              </div>
            {:else}
              <div class="text-muted small">-</div>
            {/if}
          </div>
        </div>
      {:else}
        <NoContent text={$_("pages.permissions.panel.empty.select-something")} />
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

<script context="module">
  import { error } from "@sveltejs/kit";
  import ApiUtilModule from "$lib/api.util.js";

  /** @type {import('@sveltejs/kit').PageLoad} */
  export async function load(event) {
    const res = await ApiUtilModule.get({ path: "/api/panel/permission/snapshot", request: event });
    if (res?.error) {
      throw error(500, res.error);
    }
    return { snapshot: res };
  }
</script>

<script>
  import { getContext } from "svelte";
  import { _ } from "svelte-i18n";

  import ApiUtil from "$lib/api.util.js";
  import { show as showToast } from "$lib/component/ToastContainer.svelte";
  import CreatePermissionGroupModal, {
    show as showCreatePermissionGroupModal,
    setCallback as setCreatePermissionGroupModalCallback,
  } from "$lib/component/modals/CreatePermissionGroupModal.svelte";
  import EditPermTrackModal, {
    show as showEditPermTrackModal,
    setCallback as setEditPermTrackModalCallback,
  } from "$lib/component/modals/EditPermTrackModal.svelte";
  import EditPermissionNodeModal, {
    show as showEditPermissionNodeModal,
    setCallback as setEditPermissionNodeModalCallback,
  } from "$lib/component/modals/EditPermissionNodeModal.svelte";
  import ConfirmRemovePermTrackModal, {
    show as showConfirmRemovePermTrackModal,
    setCallback as setConfirmRemovePermTrackModalCallback,
  } from "$lib/component/modals/ConfirmRemovePermTrackModal.svelte";
  import ConfirmRemovePermGroupModal, {
    show as showConfirmRemovePermGroupModal,
    setCallback as setConfirmRemovePermGroupModalCallback,
  } from "$lib/component/modals/ConfirmRemovePermGroupModal.svelte";
  import ConfirmRemovePermUserModal, {
    show as showConfirmRemovePermUserModal,
    setCallback as setConfirmRemovePermUserModalCallback,
  } from "$lib/component/modals/ConfirmRemovePermUserModal.svelte";
  import SearchPlayerModal, {
    show as showSearchPlayerModal,
    setCallback as setSearchPlayerModalCallback,
  } from "$lib/component/modals/SearchPlayerModal.svelte";
  import PageActions from "$lib/component/PageActions.svelte";
  import NoContent from "$lib/component/NoContent.svelte";

  export let data;

  const pageTitle = getContext("pageTitle");
  const currentUser = getContext("user");

  pageTitle.set("pages.permissions.title");

  // Variables for editor functionality
  let selectedGroup = null;
  let selectedUser = null;
  let selectedTrack = null;

  // Snapshot state (server shape: groups/tracks/nodes/users)
  let snapshot = data?.snapshot || {};
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
  let nodeActionLabels = { edit: "Düzenle", delete: "Sil" };

  let showGroups = false;
  let showTracks = false;
  let showUsers = false;

  function listStyle(maxHeight) {
    return `max-height: ${maxHeight}px; overflow-y: auto;`;
  }

  function onActionKeydown(e, action) {
    if (e.key === "Enter" || e.key === " ") {
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
    if (!user?.id) return "-";

    const directGroupNames = (currentNodesList || [])
      .filter(
        (n) =>
          n?.holderType === "USER" &&
          n?.holderId === user.id &&
          n?.active !== false &&
          typeof n?.node === "string" &&
          n.node.startsWith("group."),
      )
      .map((n) => n.node.slice("group.".length))
      .map((x) => String(x || "").trim())
      .filter(Boolean);

    const unique = Array.from(new Set(directGroupNames));
    if (unique.length === 0) return "-";

    const byName = new Map((currentGroupList || []).map((g) => [g.name, g]));
    return unique
      .map((name) => {
        const g = byName.get(name);
        return (g?.displayName || name || "").trim();
      })
      .filter(Boolean)
      .join(", ");
  }

  function getUserDirectGroupNames(user, currentNodesList) {
    if (!user?.id) return [];
    const activeGroupNames = (currentNodesList || [])
      .filter(
        (n) =>
          n?.holderType === "USER" &&
          n?.holderId === user.id &&
          n?.active !== false &&
          typeof n?.node === "string" &&
          n.node.startsWith("group."),
      )
      .map((n) => String(n.node).slice("group.".length))
      .map((x) => String(x || "").trim())
      .filter(Boolean);

    const uniqueActive = Array.from(new Set(activeGroupNames));
    return uniqueActive;
  }

  function minotarAvatarUrl(username, size = 24) {
    const u = String(username || "").trim();
    if (!u) return null;
    const encoded = encodeURIComponent(u);
    return `https://minotar.net/avatar/${encoded}/${size}`;
  }

  function formatNodeContext(ctx) {
    if (!ctx || typeof ctx !== "object") return [];
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
  let globalSearchQuery = "";

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

  $: nodeActionLabels = selectedGroup
    ? { edit: $_("pages.permissions.panel.actions.edit"), delete: $_("pages.permissions.panel.actions.delete") }
    : { edit: $_("pages.permissions.panel.actions.edit"), delete: $_("pages.permissions.panel.actions.delete") };

  const normalizeWeight = (raw) => {
    const n = parseInt(raw);
    if (isNaN(n)) return 0;
    return n;
  };

  function getGroupWeight(group, currentNodesList) {
    if (!group) return 0;
    const weightNodes = (currentNodesList || []).filter(
      (n) =>
        n.holderType === "GROUP" &&
        n.holderId === group.id &&
        n.active !== false &&
        typeof n.node === "string" &&
        n.node.startsWith("weight."),
    );

    if (weightNodes.length === 0) return 0;

    const weights = weightNodes
      .map((n) => parseInt(n.node.slice("weight.".length)))
      .filter((w) => !isNaN(w));

    return weights.length > 0 ? Math.max(...weights) : 0;
  }

  function upsertGroupWeightNode({ groupId, groupName, weight, now }) {
    const w = normalizeWeight(weight);

    const idxs = [];
    for (let i = 0; i < (nodes || []).length; i++) {
      const n = nodes[i];
      if (
        n?.holderType === "GROUP" &&
        n?.holderId === groupId &&
        typeof n?.node === "string" &&
        n.node.startsWith("weight.")
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
        holderType: "GROUP",
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
    return (nodes || []).filter(
      (n) => n.holderType === "GROUP" && n.holderId === groupId,
    ).length;
  }

  function computeSelectedGroupParents(group, currentNodesList) {
    if (!group) return [];

    const directParentNames = (currentNodesList || [])
      .filter(
        (n) =>
          n?.holderType === "GROUP" &&
          n?.holderId === group.id &&
          n?.active !== false &&
          typeof n?.node === "string" &&
          n.node.startsWith("group."),
      )
      .map((n) => n.node.slice("group.".length))
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
        (n) => n.holderType === "GROUP" && n.holderId === selectedGroup.id,
      );

      currentNodes = [...real];
      return;
    }
    if (selectedUser) {
      currentNodes = (nodes || []).filter(
        (n) => n.holderType === "USER" && n.holderId === selectedUser.id,
      );
      return;
    }
    currentNodes = [];
  }

  function addNode(holderType) {
    const now = Date.now();
    if (holderType === "GROUP" && selectedGroup) {
      // Use edit modal for creating a new node
      selectedNodeForEdit = {
        id: now, // temporary id for UI; server will remap on snapshot save
        holderType: "GROUP",
        holderId: selectedGroup.id,
        holderName: selectedGroup.name,
        node: "",
        active: true,
        context: { pano: true },
        expiresAt: null,
        createdAt: now,
        updatedAt: now,
      };
      showEditPermissionNodeModal({ node: selectedNodeForEdit, permissionGroups });
      return;
    }
    if (holderType === "USER" && selectedUser) {
      selectedNodeForEdit = {
        id: now,
        holderType: "USER",
        holderId: selectedUser.id,
        holderName: null,
        node: "",
        active: true,
        context: { pano: true },
        expiresAt: null,
        createdAt: now,
        updatedAt: now,
      };
      showEditPermissionNodeModal({ node: selectedNodeForEdit, permissionGroups });
    }
  }

  function toggleNode(node) {
    nodes = (nodes || []).map((n) =>
      n.id === node.id ? { ...n, active: !n.active, updatedAt: Date.now() } : n,
    );
    refreshCurrentNodes();
  }

  function removeNode(node) {
    nodes = (nodes || []).filter((n) => n.id !== node.id);
    refreshCurrentNodes();
  }

  function editNode(node) {
    selectedNodeForEdit = node;
    showEditPermissionNodeModal({ node, permissionGroups });
  }

  // Modal callbacks are wired once below via setCallback(...)

  async function loadSnapshot() {
    const res = await ApiUtil.get({ path: "/api/panel/permission/snapshot" });
    if (res?.error) {
      console.error("Failed to load snapshot:", res.error);
      return;
    }
    snapshot = res;
    permissionGroups = snapshot.groups || [];
    tracks = snapshot.tracks || [];
    nodes = snapshot.nodes || [];
    users = snapshot.users || [];
    selectedGroup = null;
    selectedUser = null;
    selectedTrack = null;
    refreshCurrentNodes();
  }

  async function saveSnapshot() {
    const body = {
      groups: permissionGroups,
      tracks,
      nodes,
    };
    const res = await ApiUtil.post({
      path: "/api/panel/permission/snapshot",
      body,
    });
    if (res?.error) {
      console.error("Failed to save snapshot:", res.error);
      await showToast("components.toasts.settings-save-error", {
        errorCode: $_("errors." + res.error),
      });
      return;
    }
    await loadSnapshot();
    await showToast("components.toasts.settings-save-success");
  }

  function addGroup() {
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
          n?.holderType === "GROUP" &&
          n?.holderId === selectedGroup.id &&
          n?.active !== false &&
          typeof n?.node === "string" &&
          n.node.startsWith("group."),
      )
      .map((n) => n.node.slice("group.".length))
      .filter(Boolean);

    newGroup = {
      name: selectedGroup.name || "",
      weight: getGroupWeight(selectedGroup, nodes),
      displayName: selectedGroup.displayName || "",
      parents: Array.from(new Set(parentNames)),
    };

    showCreatePermissionGroupModal({
      allGroups: permissionGroups,
      newGroup,
    });
  }

  function addTrack() {
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
          n?.holderType === "USER" &&
          n?.holderId === u.id &&
          n?.active !== false &&
          typeof n?.node === "string" &&
          n.node.startsWith("group."),
      );

      const hasDefaultGroupNode = (nodes || []).some(
        (n) =>
          n?.holderType === "USER" &&
          n?.holderId === u.id &&
          typeof n?.node === "string" &&
          n.node === "group.default" &&
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
            holderType: "USER",
            holderId: u.id,
            holderName: null,
            node: "group.default",
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
      await showToast("components.toasts.settings-save-error", {
        errorCode: "You can't remove yourself.",
      });
      return;
    }
    showConfirmRemovePermUserModal(u);
  }

  function removeUserConfirmed(u) {
    if (!u) return;

    users = (users || []).filter((x) => x.id !== u.id);
    nodes = (nodes || []).filter((n) => !(n.holderType === "USER" && n.holderId === u.id));

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
    if (selectedGroup.name === "default") return;
    showConfirmRemovePermGroupModal(selectedGroup);
  }

  function removeGroupConfirmed(groupToRemove) {
    if (!groupToRemove) return;
    if (groupToRemove.name === "default") return;

    const removedName = groupToRemove.name;
    const removedId = groupToRemove.id;

    // Remove group from source list
    permissionGroups = (permissionGroups || []).filter((g) => g.id !== removedId);

    // Remove group-held nodes
    nodes = (nodes || []).filter((n) => !(n.holderType === "GROUP" && n.holderId === removedId));

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
      name: "",
      weight: 0,
      displayName: "",
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
    return { id, holderType, holderId, holderName, node, active, context, expiresAt, createdAt, updatedAt };
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
          holderType: "GROUP",
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

  const norm = (v) => String(v || "").toLowerCase();

  function nodeSearchText(n) {
    if (!n || typeof n !== "object") return "";
    const parts = [
      n.holderType,
      n.holderName,
      n.node,
      // context can help searching for server/world/etc filters
      n.context ? JSON.stringify(n.context) : "",
    ];
    return norm(parts.filter(Boolean).join(" "));
  }

  function nodeMatchesQuery(n, q) {
    if (!q) return true;
    return nodeSearchText(n).includes(q);
  }
  const sortGroups = (gs, currentNodesList) =>
    [...(gs || [])].sort(
      (a, b) =>
        getGroupWeight(b, currentNodesList) - getGroupWeight(a, currentNodesList) ||
        String(a?.name ?? "").localeCompare(String(b?.name ?? ""), undefined, { sensitivity: "base" }),
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

        // Remove old parent nodes for this group
        nodes = (nodes || []).filter(
          (n) =>
            !(
              n.holderType === "GROUP" &&
              n.holderId === editingGroupId &&
              typeof n.node === "string" &&
              n.node.startsWith("group.")
            ),
        );

        // Update holderName for remaining group-held nodes
        nodes = (nodes || []).map((n) =>
          n.holderType === "GROUP" && n.holderId === editingGroupId
            ? { ...n, holderName: updatedGroup.name }
            : n,
        );

        nodes = [...(nodes || []), ...groupMetaNodes({
          now,
          groupId: editingGroupId,
          groupName: updatedGroup.name,
          parents,
        })];

        upsertGroupWeightNode({
          groupId: editingGroupId,
          groupName: updatedGroup.name,
          weight,
          now,
        });

        // Update track references if the group name changed
        if (oldName && oldName !== updatedGroup.name) {
          tracks = (tracks || []).map((t) => ({
            ...t,
            groupNames: (t.groupNames || []).map((gn) =>
              gn === oldName ? updatedGroup.name : gn,
            ),
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
        if (groupData?.name !== "default" && !base.includes("default")) base.push("default");
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
      nodes = [...(nodes || []), ...groupMetaNodes({
        now,
        groupId: newGroupData.id,
        groupName: newGroupData.name,
        parents,
      })];

      upsertGroupWeightNode({
        groupId: newGroupData.id,
        groupName: newGroupData.name,
        weight,
        now,
      });

      // Auto-select newly created group
      showGroups = true;
      showTracks = false;
      showUsers = false;
      selectGroup(newGroupData);
    } catch (error) {
      console.error("Error creating group:", error);
    }

  }

  function handleAddTrackFromModal(trackData) {
    if (!trackData) return;
    const now = Date.now();
    const newTrack = {
      id: now,
      name: trackData.name,
      description: trackData.description || "",
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
      handleAddTrackFromModal(trackData);
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

    if (selectedTrack && ((rid != null && selectedTrack.id === rid) || (rid == null && selectedTrack.name === rname))) {
      selectedTrack = null;
    }
    if (selectedTrackForEdit && ((rid != null && selectedTrackForEdit.id === rid) || (rid == null && selectedTrackForEdit.name === rname))) {
      selectedTrackForEdit = null;
    }
  });
  setConfirmRemovePermGroupModalCallback((removedGroup) => {
    removeGroupConfirmed(removedGroup);
  });
  setConfirmRemovePermUserModalCallback((removedUser) => {
    removeUserConfirmed(removedUser);
  });

  // Initialize and update filtered groups and tracks reactively
  $: {
    const q = norm(globalSearchQuery);
    const hasQ = !!q;
    const groupDisplayByName = new Map(
      (permissionGroups || []).map((g) => [
        String(g?.name || "").trim(),
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
            (n) => n?.holderType === "GROUP" && n?.holderId === gid && nodeMatchesQuery(n, q),
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
          const name = String(gn || "").trim();
          if (!name) return false;
          if (norm(name).includes(q)) return true;
          const display = groupDisplayByName.get(name) || "";
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
          (n) => n?.holderType === "USER" && n?.holderId === uid && nodeMatchesQuery(n, q),
        );
      })
      : users || [];

    refreshCurrentNodes();
    filteredCurrentNodes = hasQ ? (currentNodes || []).filter((n) => nodeMatchesQuery(n, q)) : currentNodes;
  }
</script>
