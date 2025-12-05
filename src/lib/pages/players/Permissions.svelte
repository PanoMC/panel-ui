<div class="container vstack gap-3">
  <PageActions>
    <div slot="left">
      <a href="/panel/players" class="btn btn-link">
        <i class="fa fa-arrow-left me-2"></i>Oyuncular
      </a>
    </div>
    <div slot="middle">
      <input
        type="text"
        class="form-control form-control-sm"
        placeholder={$_("pages.permissions.search.placeholder")}
        bind:value={globalSearchQuery}
        on:input={handleGlobalSearch} />
    </div>
    <div slot="right" class="hstack gap-2">
      {#if selectedTrackForEdit}
        <button
          type="button"
          class="btn btn-link"
          aria-label={$_("buttons.remove")}
          title={$_("buttons.remove")}
          on:click={showRemoveTrackModal}>
          <i class="fa fa-trash"></i>
        </button>
        <button
          type="button"
          class="btn btn-link"
          aria-label={$_("buttons.edit")}
          title={$_("buttons.edit")}
          on:click={showEditTrackModal}>
          <i class="fa fa-pen"></i>
        </button>
      {/if}
      {#if selectedGroup || selectedUser}
        <button
          title=""
          type="button"
          class="btn btn-link"
          on:click={saveChanges}>
          <i class="fa fa-save"></i>
        </button>
      {/if}
      {#if tracksAccordionExpanded}
        <button
          type="button"
          class="btn btn-primary"
          on:click={showAddTrackModal}>
          <i class="fa fa-plus"></i>
          <span class="d-lg-inline d-none ms-2">Add Track</span>
        </button>
      {/if}
      {#if groupsAccordionExpanded}
        <button
          type="button"
          class="btn btn-secondary"
          on:click={showCreateModal}>
          <i class="fa fa-plus"></i>
          <span class="d-lg-inline d-none ms-2"
            >{$_("pages.permissions.create-permission-group-button")}</span>
        </button>
      {/if}
    </div>
  </PageActions>

  <!-- Editor View -->
  <div class="row g-3">
    <!-- Groups Sidebar -->
    <div class="col-md-4">
      <div class="accordion" id="groupsAccordion">
        <!-- Tracks Accordion Item -->
        <div class="accordion-item">
          <div
            class="accordion-header d-flex justify-content-between align-items-center"
            id="tracksHeading">
            <button
              class="accordion-button collapsed flex-grow-1"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#tracksCollapse"
              aria-expanded="false"
              aria-controls="tracksCollapse"
              on:click={() =>
                (tracksAccordionExpanded = !tracksAccordionExpanded)}>
              <strong>Tracks</strong>
            </button>
          </div>
          <div
            id="tracksCollapse"
            class="accordion-collapse collapse accordion-flush p-2"
            aria-labelledby="tracksHeading"
            data-bs-parent="#groupsAccordion">
            <div class="accordion-body p-0">
              <div
                class="list-group list-group-flush"
                style="max-height: 400px; overflow-y: auto;">
                <!-- Tracks List -->
                {#each filteredTracks as track (track.id)}
                  <div class="accordion-item">
                    <h2 class="accordion-header" id="track-{track.id}-heading">
                      <button
                        class="accordion-button collapsed"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#track-{track.id}-collapse"
                        aria-expanded="false"
                        aria-controls="track-{track.id}-collapse"
                        on:click={() => toggleTrackAccordion(track)}>
                        <div class="fw-bold">{track.name}</div>
                      </button>
                    </h2>
                    <div
                      id="track-{track.id}-collapse"
                      class="accordion-collapse collapse"
                      aria-labelledby="track-{track.id}-heading"
                      data-bs-parent="#tracksCollapse">
                      <div class="accordion-body">
                        <div class="list-group list-group-flush">
                          <button
                            type="button"
                            class="list-group-item list-group-item-action"
                            on:click={() => selectTrackItem(track, "vip")}>
                            <div class="d-flex align-items-center">
                              <i class="bi bi-star-fill text-warning me-2"></i>
                              <span>vip</span>
                            </div>
                          </button>
                          <button
                            type="button"
                            class="list-group-item list-group-item-action"
                            on:click={() => selectTrackItem(track, "vşpplus")}>
                            <div class="d-flex align-items-center">
                              <i class="bi bi-star-fill text-success me-2"></i>
                              <span>vşpplus</span>
                            </div>
                          </button>
                          <button
                            type="button"
                            class="list-group-item list-group-item-action"
                            on:click={() => selectTrackItem(track, "op")}>
                            <div class="d-flex align-items-center">
                              <i
                                class="bi bi bi-shield-fill-check text-danger me-2"
                              ></i>
                              <span>op</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                {/each}

                {#if filteredTracks.length === 0}
                  <NoContent />
                {/if}
              </div>
            </div>
          </div>
        </div>

        <!-- Groups Accordion Item -->
        <div class="accordion-item">
          <h2 class="accordion-header" id="groupsHeading">
            <button
              class="accordion-button"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#groupsCollapse"
              aria-expanded="true"
              aria-controls="groupsCollapse"
              on:click={toggleGroupsAccordion}>
              <strong>{$_("pages.permissions.groups")}</strong>
            </button>
          </h2>
          <div
            id="groupsCollapse"
            class="accordion-collapse collapse show"
            aria-labelledby="groupsHeading"
            data-bs-parent="#groupsAccordion">
            <div class="accordion-body p-0">
              <div
                class="list-group list-group-flush"
                style="max-height: 400px; overflow-y: auto;">
                {#each filteredGroups as group (group.id)}
                  {@const isSelected =
                    selectedGroup && selectedGroup.id === group.id}
                  <button
                    type="button"
                    class="list-group-item list-group-item-action d-flex justify-content-between align-items-center {isSelected
                      ? 'active'
                      : ''}"
                    on:click={() => selectGroupForEditing(group)}>
                    <div class="flex-grow-1">
                      <div class="fw-bold">{group.name}</div>
                      <small>
                        {group.permissions?.length || 0}
                        {$_("pages.permissions.permissions")}
                        {#if group.players?.length}
                          • {group.players.length}
                          {$_("pages.permissions.players")}
                        {/if}
                      </small>
                    </div>
                  </button>
                {/each}

                {#if filteredGroups.length === 0}
                  <div class="list-group-item text-center">
                    <p class="mb-0">
                      {$_("pages.permissions.no-groups-found")}
                    </p>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>

        <!-- Users Accordion Item -->
        <div class="accordion-item">
          <h2 class="accordion-header" id="usersHeading">
            <button
              class="accordion-button collapsed"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#usersCollapse"
              aria-expanded="false"
              aria-controls="usersCollapse">
              <strong>{$_("pages.permissions.users")}</strong>
            </button>
          </h2>
          <div
            id="usersCollapse"
            class="accordion-collapse collapse"
            aria-labelledby="usersHeading"
            data-bs-parent="#groupsAccordion">
            <div class="accordion-body p-0">
              <div class="list-group list-group-flush">
                <!-- User List -->
                {#each [{ id: 1, name: "Alice Johnson", avatar: "https://ui-avatars.com/api/?name=Alice+Johnson&size=32&background=007bff&color=ffffff", permissions: [] }, { id: 2, name: "Bob Smith", avatar: "https://ui-avatars.com/api/?name=Bob+Smith&size=32&background=28a745&color=ffffff", permissions: [] }, { id: 3, name: "Charlie Brown", avatar: "https://ui-avatars.com/api/?name=Charlie+Brown&size=32&background=dc3545&color=ffffff", permissions: [] }] as user (user.id)}
                  <button
                    type="button"
                    class="list-group-item list-group-item-action d-flex justify-content-between align-items-center {selectedUser &&
                    selectedUser.id === user.id
                      ? 'active'
                      : ''}"
                    on:click={() => selectUserForEditing(user)}>
                    <div class="d-flex align-items-center">
                      <img
                        width="32"
                        height="32"
                        src={user.avatar}
                        alt={user.name}
                        class="rounded-circle me-2" />
                      <div>
                        <div class="fw-bold">{user.name}</div>
                      </div>
                    </div>
                  </button>
                {/each}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Editor Area -->
    <div class="col-md-8">
      {#if selectedGroup || selectedUser}
        {@const currentItem = selectedGroup || selectedUser}
        {@const isGroup = !!selectedGroup}
        <div class="card">
          <!-- Header -->
          <div class="card-header">
            <div class="d-flex justify-content-between">
              <div>
                <h5 class="mb-0">
                  <span class="badge rounded-pill text-bg-primary"
                    >{currentItem.name}</span>
                </h5>
                <small>
                  {currentItem.permissions?.length || 0}
                  {$_("pages.permissions.permissions-assigned")}
                  {#if isGroup && currentItem.weight}• Weight: {currentItem.weight}{/if}
                  {#if isGroup && currentItem.parent}• Parent: {currentItem.parent}{/if}
                </small>
              </div>
              <div class="hstack gap-2">
                <button
                  type="button"
                  class="btn btn-sm btn-primary"
                  on:click={() => (showAddPermissionModal = true)}>
                  Add Node ({currentItem.permissions?.length || 0})
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-secondary"
                  on:click={showCreateModal}
                  >Add Perm Group ({data.permissionGroups?.length || 0})
                </button>
                <button
                  title={$_("buttons.close")}
                  aria-label={$_("buttons.close")}
                  class="btn-close"
                  on:click={() => {
                    selectedGroup = null;
                    selectedUser = null;
                  }}>
                </button>
              </div>
            </div>
          </div>

          <!-- Permission Editor -->
          <PermissionEditor
            permissions={currentItem.permissions || []}
            permissionGroupsCount={data.permissionGroups?.length || 0}
            showHeader={false}
            isAdmin={false}
            on:permissionsChanged={handlePermissionsChanged}
            on:addPermGroup={showCreateModal} />
        </div>
      {:else}
        <!-- Welcome Screen -->
        <NoContent
          icon="fa-solid fa-users fa-3x"
          text={$_("pages.permissions.select-group-description")} />
      {/if}
    </div>
  </div>
</div>

<!-- Create Permission Group Modal -->
<CreatePermissionGroupModal
  showModal={showModal}
  newGroup={newGroup}
  on:close={handleModalClose}
  on:save={handleCreateGroup} />

<!-- Add Permission Tracks Modal -->
<AddPermTracksModal
  showModal={showAddPermTracksModal}
  on:close={handleAddPermTracksModalClose}
  on:save={handleAddPermTracksSave} />

<!-- Edit Permission Track Modal -->
<EditPermTrackModal
  showModal={showEditPermTrackModal}
  on:close={handleEditPermTrackModalClose}
  on:save={handleEditPermTrackSave} />

<!-- Add Permission Node Modal -->
<AddPermissionNodeModal
  showModal={showAddPermissionModal}
  permissionList={data.allPermissions || []}
  on:close={handleAddPermissionModalClose}
  on:add={handleAddPermissions} />

<script context="module">
  import ApiUtil, { buildQueryParams } from "$lib/api.util.js";
  import { error } from "@sveltejs/kit";

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const {
      parent,
      url: { searchParams },
    } = event;
    await parent();

    const page = searchParams.get("page") || 1;

    const queryParams = buildQueryParams({
      page,
    });
    const body = await ApiUtil.get({
      path: `/api/panel/permissionGroups` + queryParams,
      request: event,
    });

    if (body.error) {
      if (body.error === "PAGE_NOT_FOUND") {
        throw error(404, body.error);
      }

      throw error(500, body.error);
    }

    body.page = parseInt(page);

    return body;
  }
</script>

<script>
  import { getContext } from "svelte";
  import { _ } from "svelte-i18n";

  import { base } from "$app/paths";

  import PermissionEditor from "$lib/component/PermissionEditor.svelte";
  import CreatePermissionGroupModal from "$lib/component/modals/CreatePermissionGroupModal.svelte";
  import AddPermTracksModal from "$lib/component/modals/AddPermTracksModal.svelte";
  import EditPermTrackModal from "$lib/component/modals/EditPermTrackModal.svelte";
  import AddPermissionNodeModal from "$lib/component/modals/AddPermissionNodeModal.svelte";
  import PageActions from "$lib/component/PageActions.svelte";
  import NoContent from "$lib/component/NoContent.svelte";

  export let data;

  const pageTitle = getContext("pageTitle");

  pageTitle.set("pages.permissions.title");

  // Variables for editor functionality
  let selectedGroup = null;
  let selectedUser = null;
  let filteredGroups = data.permissionGroups || [];

  // Variables for tracks functionality
  let selectedTrackCategory = null;
  let selectedTrackItem = null;
  let tracksAccordionExpanded = false;
  let selectedTrackForEdit = null;
  let globalSearchQuery = "";
  let groupsAccordionExpanded = true; // Groups accordion is expanded by default
  let filteredTracks = [
    { id: 1, name: "Ambient Music", category: "music", type: "background" },
    {
      id: 2,
      name: "Action Soundtrack",
      category: "soundtrack",
      type: "action",
    },
    { id: 3, name: "Electronic Beats", category: "music", type: "electronic" },
    {
      id: 4,
      name: "Orchestral Score",
      category: "soundtrack",
      type: "orchestral",
    },
  ];

  // Modal variables
  let showModal = false;
  let showAddPermTracksModal = false;
  let showEditPermTrackModal = false;
  let showAddPermissionModal = false;
  let newGroup = {
    name: "",
    weight: 0,
    displayName: "",
    prefix: "",
    parent: "",
    suffix: "",
  };

  // Functions for editor functionality
  function selectGroupForEditing(group) {
    selectedGroup = { ...group }; // Create a copy to avoid direct mutation
    selectedUser = null; // Clear user selection when selecting group
  }

  function selectUserForEditing(user) {
    selectedUser = { ...user }; // Create a copy to avoid direct mutation
    selectedGroup = null; // Clear group selection when selecting user
  }

  function selectTrackCategory(category) {
    selectedTrackCategory = category;
  }

  function selectTrack(track) {
    console.log("Selected track:", track);
    // Burada track seçildiğinde yapılacak işlemler eklenebilir
  }

  function toggleTrackAccordion(track) {
    selectedTrackForEdit =
      selectedTrackForEdit && selectedTrackForEdit.id === track.id
        ? null
        : track;
  }

  function toggleGroupsAccordion() {
    groupsAccordionExpanded = !groupsAccordionExpanded;
  }

  function selectTrackItem(track, itemType) {
    console.log("Selected track item:", { track, itemType });

    // Eğer aynı track öğesi tekrar seçildiyse, seçimi kaldır
    if (
      selectedTrackItem &&
      selectedTrackItem.track.id === track.id &&
      selectedTrackItem.itemType === itemType
    ) {
      selectedTrackItem = null;
      selectedTrackForEdit = null; // Track öğesi seçimi kaldırıldığında edit/remove butonlarını gizle
    } else {
      selectedTrackItem = { track, itemType };
      selectedTrackForEdit = track; // Track öğesi seçildiğinde edit/remove butonlarını göster
    }
  }

  function handlePermissionsChanged(event) {
    if (selectedGroup) {
      selectedGroup.permissions = event.detail.permissions;
      selectedGroup = { ...selectedGroup }; // Trigger reactivity
    } else if (selectedUser) {
      selectedUser.permissions = event.detail.permissions;
      selectedUser = { ...selectedUser }; // Trigger reactivity
    }
  }

  async function saveChanges() {
    const currentItem = selectedGroup || selectedUser;
    if (!currentItem) return;

    try {
      // Here you would implement the API call to save the changes
      console.log("Saving changes:", currentItem);

      if (selectedGroup) {
        // For groups, update the local data
        const groupIndex = data.permissionGroups.findIndex(
          (g) => g.id === selectedGroup.id,
        );
        if (groupIndex !== -1) {
          data.permissionGroups[groupIndex] = { ...selectedGroup };
          data.permissionGroups = [...data.permissionGroups];
        }
        console.log("Group permissions saved successfully");
      } else if (selectedUser) {
        // For users, you would implement user permission saving logic here
        console.log("User permissions saved successfully");
      }
    } catch (error) {
      console.error("Error saving changes:", error);
      // Show error message (you might want to add a toast notification here)
    }
  }

  // Modal functions
  function showCreateModal() {
    newGroup = {
      name: "",
      weight: 0,
      displayName: "",
      prefix: "",
      parent: "",
      suffix: "",
    };
    showModal = true;
  }

  function showAddTrackModal() {
    showAddPermTracksModal = true;
  }

  function showEditTrackModal() {
    showEditPermTrackModal = true;
  }

  function showRemoveTrackModal() {
    if (selectedTrackForEdit) {
      // Burada track kaldırma işlemi yapılacak
      console.log("Removing track:", selectedTrackForEdit);
      // Şimdilik basit bir alert gösterelim
      if (
        confirm(
          `"${selectedTrackForEdit.name}" track'ını kaldırmak istediğinize emin misiniz?`,
        )
      ) {
        // Track'i filteredTracks'tan kaldır
        filteredTracks = filteredTracks.filter(
          (track) => track.id !== selectedTrackForEdit.id,
        );
        selectedTrackForEdit = null;
      }
    }
  }

  function handleModalClose() {
    showModal = false;
    newGroup = {
      name: "",
      weight: 0,
      displayName: "",
      prefix: "",
      parent: "",
      suffix: "",
    };
  }

  function handleAddPermTracksModalClose() {
    showAddPermTracksModal = false;
  }

  function handleAddPermTracksSave() {
    // Handle save logic here
    showAddPermTracksModal = false;
  }

  function handleEditPermTrackModalClose() {
    showEditPermTrackModal = false;
  }

  function handleEditPermTrackSave() {
    // Handle save logic here
    showEditPermTrackModal = false;
  }

  function handleAddPermissionModalClose() {
    showAddPermissionModal = false;
  }

  function handleAddPermissions(event) {
    const newPermissions = event.detail.permissions.map((perm) => ({
      permission: perm,
      value: true,
      expiry: null,
      contexts: "none",
    }));

    if (selectedGroup) {
      selectedGroup.permissions = [
        ...(selectedGroup.permissions || []),
        ...newPermissions,
      ];
      selectedGroup = { ...selectedGroup };
    } else if (selectedUser) {
      selectedUser.permissions = [
        ...(selectedUser.permissions || []),
        ...newPermissions,
      ];
      selectedUser = { ...selectedUser };
    }
  }

  async function handleCreateGroup(event) {
    const groupData = event.detail.group;

    try {
      // Here you would implement the API call to create the group
      // For now, we'll just add it to local data
      const newGroupData = {
        id: Date.now(), // Temporary ID
        name: groupData.name,
        weight: parseInt(groupData.weight),
        displayName: groupData.displayName || groupData.name,
        prefix: groupData.prefix,
        parent: groupData.parent,
        suffix: groupData.suffix,
        permissions: [],
        players: [],
      };

      data.permissionGroups = [...data.permissionGroups, newGroupData];
      showModal = false;

      console.log("Group created successfully");
    } catch (error) {
      console.error("Error creating group:", error);
    }
  }

  // Initialize and update filtered groups and tracks reactively
  $: {
    // Filter groups based on global search
    filteredGroups = globalSearchQuery
      ? (data.permissionGroups || []).filter((group) =>
          group.name.toLowerCase().includes(globalSearchQuery.toLowerCase()),
        )
      : data.permissionGroups || [];

    // Filter tracks based on global search and category
    let baseTracks = [
      { id: 1, name: "Ambient Music", category: "music", type: "background" },
      {
        id: 2,
        name: "Action Soundtrack",
        category: "soundtrack",
        type: "action",
      },
      {
        id: 3,
        name: "Electronic Beats",
        category: "music",
        type: "electronic",
      },
      {
        id: 4,
        name: "Orchestral Score",
        category: "soundtrack",
        type: "orchestral",
      },
    ];

    if (selectedTrackCategory) {
      baseTracks = baseTracks.filter(
        (track) => track.category === selectedTrackCategory,
      );
    }

    filteredTracks = baseTracks.filter(
      (track) =>
        !globalSearchQuery ||
        track.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
        track.category.toLowerCase().includes(globalSearchQuery.toLowerCase()),
    );
  }
</script>
