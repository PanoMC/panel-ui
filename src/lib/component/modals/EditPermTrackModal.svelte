<!-- Edit Permission Track Modal -->
<div
  class="modal fade"
  bind:this={$modalElement}
  tabindex="-1"
  role="dialog"
  aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">
          {#if $isEdit}
            {$_("pages.permission-groups.tracks.edit-permission-track")}
          {:else}
            {$_("pages.permission-groups.tracks.add-permission-track")}
          {/if}
        </h5>
        <button
          type="button"
          class="btn-close"
          aria-label={$_("buttons.close")}
          title={$_("buttons.close")}
          on:click={hide}></button>
      </div>
      <div class="modal-body">
        <div class="form-floating mb-3">
          <input id="editTrackName" class="form-control" type="text" placeholder={$_("pages.permission-groups.tracks.form.name")} bind:value={$draft.name} maxlength="128" />
          <label for="editTrackName">{$_("pages.permission-groups.tracks.form.name")}</label>
        </div>

        <div class="form-floating mb-3">
          <textarea id="editTrackDescription" class="form-control" placeholder={$_("pages.permission-groups.tracks.form.description")} rows="4" style="height: 140px;" bind:value={$draft.description}></textarea>
          <label for="editTrackDescription">{$_("pages.permission-groups.tracks.form.description")}</label>
        </div>

        <div class="mb-3">
          <label for="">{$_("pages.permission-groups.tracks.groups.title")}</label>
          <div class="small mb-0">{$_("pages.permission-groups.tracks.groups.help")}</div>
        </div>

        {#if $permissionGroups.length === 0}
          <p class="mb-0">{$_("pages.permission-groups.tracks.groups.no-groups-available")}</p>
        {:else}
          <div class="d-flex flex-wrap gap-2 mb-3" style="max-height: 160px; overflow-y: auto;">
            {#each sortedPermissionGroups.filter((g) => !($draft.groupNames || []).includes(g.name)) as group (group.name)}
              <button
                type="button"
                class="btn btn-sm btn-secondary rounded-pill {draggingAvailableName === group.name ? 'opacity-50' : ''}"
                draggable="true"
                on:dragstart={(e) => onAvailableDragStart(e, group.name)}
                on:dragend={() => (draggingAvailableName = null)}
                aria-label={`Drag to add: ${group.name}`}
                title={`Drag to add: ${group.name}`}>
                <span>{groupLabel(group.name)}</span>
              </button>
            {/each}
          </div>
        {/if}

        {#if $draft.groupNames.length > 0}
          <div class="mb-3">
            <div class="mb-2">{$_("pages.permission-groups.tracks.selected.title")}</div>
            <div
              class={"list-group " + (isDragOverSelected ? "border border-primary rounded" : "")}
              role="list"
              on:dragover|preventDefault={() => (isDragOverSelected = true)}
              on:dragleave={() => (isDragOverSelected = false)}
              on:drop|preventDefault={(e) => onDropIntoList(e)}>
              {#each $draft.groupNames as gname, idx (gname)}
                <div
                  class="list-group-item d-flex justify-content-between align-items-center"
                  draggable="true"
                  role="listitem"
                  on:dragstart={(e) => onSelectedDragStart(e, gname)}
                  on:dragover|preventDefault
                  on:drop|preventDefault={(e) => onDropOnItem(e, gname)}
                  on:dragend={() => {
                    draggedName = null;
                    draggedFrom = null;
                    isDragOverSelected = false;
                  }}>
                  <div class="d-flex align-items-center overflow-hidden">
                    <span class="me-2 text-muted" title="Drag to reorder" style="cursor: grab;">≡</span>
                    <span class="badge text-bg-secondary me-2">{idx + 1}</span>
                    <span class="text-truncate">{groupLabel(gname)}</span>
                  </div>
                  <button
                    type="button"
                    class="btn-close"
                    on:click={() => removeGroupFromTrack(gname)}
                    aria-label={`Remove group: ${gname}`}
                    title={`Remove group: ${gname}`}>
                  </button>
                </div>
                {#if idx < $draft.groupNames.length - 1}
                  <div class="text-center">
                    <i class="fa fa-arrow-down fa-fw"></i>
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        {:else}
          <div
            class={"p-3 border rounded " + (isDragOverSelected ? "border-primary" : "")}
            role="region"
            aria-label={$_("pages.permission-groups.tracks.selected.dropzone-aria")}
            on:dragover|preventDefault={() => (isDragOverSelected = true)}
            on:dragleave={() => (isDragOverSelected = false)}
            on:drop|preventDefault={(e) => onDropIntoList(e)}>
            <NoContent />
          </div>
        {/if}
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary w-100" on:click={handleSave}>
          {$_("pages.permission-groups.tracks.buttons.save-changes")}
        </button>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from "svelte/store";

  const modalElement = writable();
  const permissionGroups = writable([]);
  const track = writable(null);
  const isEdit = writable(false);
  const draft = writable({
    name: "",
    description: "",
    groupNames: [],
  });

  const uniquePreserveOrder = (arr) => {
    const out = [];
    const seen = new Set();
    (arr || []).forEach((x) => {
      const v = String(x || "").trim();
      if (!v) return;
      if (seen.has(v)) return;
      seen.add(v);
      out.push(v);
    });
    return out;
  };

  let callback = (track) => {};
  let hideCallback = () => {};
  let modal;

  export function show(payload = {}) {
    permissionGroups.set(payload.permissionGroups ?? []);
    const t = payload.track ?? null;
    track.set(t);
    isEdit.set(!!t);
    draft.set({
      name: t?.name || "",
      description: t?.description || "",
      groupNames: uniquePreserveOrder(Array.isArray(t?.groupNames) ? t.groupNames : []),
    });

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: "static",
      keyboard: false,
    });
    modal.show();
  }

  export function hide() {
    hideCallback(get(track));
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
  import { _ } from "svelte-i18n";
    import NoContent from "../NoContent.svelte";

  let draggedName = null;
  let draggedFrom = null; // "available" | "selected" | null
  let sortedPermissionGroups = [];
  let isDragOverSelected = false;
  let draggingAvailableName = null;

  function groupLabel(name) {
    const n = String(name || "").trim();
    if (!n) return "";
    const g = ($permissionGroups || []).find((x) => String(x?.name || "").trim() === n);
    const dn = String(g?.displayName || "").trim();
    if (!dn || dn === n) return n;
    return `${dn} (${n})`;
  }

  $: {
    sortedPermissionGroups = [...($permissionGroups || [])].sort(
      (a, b) => String(a?.name || "").localeCompare(String(b?.name || "")),
    );
  }

  function onAvailableDragStart(e, name) {
    const g = String(name || "").trim();
    if (!g) return;
    draggedName = g;
    draggedFrom = "available";
    draggingAvailableName = g;
    try {
      if (e && e.dataTransfer) {
        e.dataTransfer.setData("text/plain", g);
        e.dataTransfer.setData("application/x-pano-track-group", g);
        // From the pool into selected list: behaves like "move" (it will disappear after drop)
        e.dataTransfer.effectAllowed = "move";
      }
    } catch (_) {}
  }

  function onSelectedDragStart(e, name) {
    const g = String(name || "").trim();
    if (!g) return;
    draggedName = g;
    draggedFrom = "selected";
    try {
      if (e && e.dataTransfer) {
        e.dataTransfer.setData("text/plain", g);
        e.dataTransfer.setData("application/x-pano-track-group", g);
        e.dataTransfer.effectAllowed = "move";
      }
    } catch (_) {}
  }

  function dropGroupIntoList(name) {
    const g = String(name || "").trim();
    if (!g) return;
    draft.update((d) => {
      const arr = Array.isArray(d.groupNames) ? [...d.groupNames] : [];
      if (arr.includes(g)) return d;
      return { ...d, groupNames: [...arr, g] };
    });
  }

  function reorderWithinList(dragName, targetName) {
    if (!dragName || !targetName || dragName === targetName) return;
    draft.update((d) => {
      const arr = Array.isArray(d.groupNames) ? [...d.groupNames] : [];
      const from = arr.indexOf(dragName);
      const to = arr.indexOf(targetName);
      if (from === -1 || to === -1) return d;
      arr.splice(from, 1);
      arr.splice(to, 0, dragName);
      return { ...d, groupNames: arr };
    });
  }

  function extractDraggedName(e) {
    const fromDT =
      e?.dataTransfer?.getData("application/x-pano-track-group") ||
      e?.dataTransfer?.getData("text/plain");
    const v = String(fromDT || draggedName || "").trim();
    return v || null;
  }

  function onDropIntoList(e) {
    const g = extractDraggedName(e);
    isDragOverSelected = false;
    if (!g) return;
    draggingAvailableName = null;

    if (draggedFrom === "selected") {
      // dropping to list container => move to end
      draft.update((d) => {
        const arr = Array.isArray(d.groupNames) ? [...d.groupNames] : [];
        const from = arr.indexOf(g);
        if (from === -1) return d;
        arr.splice(from, 1);
        arr.push(g);
        return { ...d, groupNames: arr };
      });
      return;
    }

    // from available => append
    dropGroupIntoList(g);
  }

  function onDropOnItem(e, targetName) {
    const g = extractDraggedName(e);
    isDragOverSelected = false;
    if (!g) return;
    draggingAvailableName = null;

    if (draggedFrom === "selected") {
      reorderWithinList(g, targetName);
      return;
    }

    // from available => always append (avoid surprising "insert before" behavior)
    dropGroupIntoList(g);
  }

  function removeGroupFromTrack(name) {
    const g = String(name || "").trim();
    if (!g) return;
    draft.update((d) => {
      const arr = Array.isArray(d.groupNames) ? d.groupNames : [];
      return { ...d, groupNames: arr.filter((x) => x !== g) };
    });
  }

  function handleSave() {
    const d = get(draft);
    if (!d.name?.trim()) return;

    hide();
    const t = get(track);
    if (t) {
      callback({
        ...t,
        name: d.name.trim(),
        description: d.description || "",
        groupNames: uniquePreserveOrder(Array.isArray(d.groupNames) ? d.groupNames : []),
      });
      return;
    }
    callback({
      name: d.name.trim(),
      description: d.description || "",
      groupNames: uniquePreserveOrder(Array.isArray(d.groupNames) ? d.groupNames : []),
    });
  }
</script>
