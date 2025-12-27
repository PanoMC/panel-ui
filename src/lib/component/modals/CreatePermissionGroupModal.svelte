<!-- Create Permission Group Modal -->
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
          {$_("pages.permission-groups.create-permission-group-button")}
        </h5>
        <button
          type="button"
          class="btn-close"
          aria-label={$_("buttons.close")}
          title={$_("buttons.close")}
          on:click={hide}></button>
      </div>
      <div class="modal-body">
        <form on:submit|preventDefault={handleSubmit}>
          <div class="mb-3">
            <div class="row g-2">
              <div class="col-8">
                <label for="groupName" class="form-label">
                  {$_("pages.permission-groups.form.group-name")}
                </label>
                <input
                  type="text"
                  class="form-control form-control-lg"
                  id="groupName"
                  bind:value={$newGroup.name}
                  disabled={$lockGroupName}
                  aria-disabled={$lockGroupName}
                  maxlength="30"
                  required
                  placeholder={$_("pages.permission-groups.form.group-name-placeholder")}
                  title={$_("pages.permission-groups.form.group-name")} />
              </div>
              <div class="col-4">
                <label for="groupWeight" class="form-label">
                  {$_("pages.permission-groups.form.weight")}
                </label>
                <input
                  type="number"
                  class="form-control form-control-lg"
                  id="groupWeight"
                  bind:value={$newGroup.weight}
                  inputmode="numeric"
                  on:blur={() => newGroup.update((g) => ({ ...g, weight: normalizeWeight(g.weight) }))}
                  placeholder={$_("pages.permission-groups.form.weight-placeholder")}
                  title={$_("pages.permission-groups.form.weight")} />
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-md-12 mb-3">
              <label for="groupDisplayName" class="form-label"
                >{$_("pages.permission-groups.form.display-name")}</label>
              <input
                type="text"
                class="form-control"
                id="groupDisplayName"
                bind:value={$newGroup.displayName}
                maxlength="30"
                placeholder={$_(
                  "pages.permission-groups.form.display-name-placeholder",
                )} />
            </div>
          </div>

          <div class="mb-1">
            <div class="form-label">{$_("pages.permission-groups.form.parents")}</div>
            {#if ($newGroup.parents || []).length === 0}
              <div class="small text-muted">{$_("pages.permission-groups.form.no-parents")}</div>
            {:else}
              <div class="list-group list-group-flush border rounded">
                {#each ($newGroup.parents || []) as p (p)}
                  <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div class="text-truncate">
                      {parentLabel(p)}
                      <small class="text-muted">({p})</small>
                    </div>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-danger"
                      on:click={() => removeParent(p)}>
                      {$_("buttons.remove")}
                    </button>
                  </div>
                {/each}
              </div>
            {/if}
          </div>

          <div class="row g-2 mt-2">
            <div class="col-9">
              <select class="form-select" bind:value={parentToAdd}>
                <option value="">{$_("pages.permission-groups.form.select-option")}</option>
                {#each availableParentGroups as g (g.id ?? g.name)}
                  <option value={g.name}>
                    {g.displayName || g.name} ({g.name})
                  </option>
                {/each}
              </select>
            </div>
            <div class="col-3 d-grid">
              <button
                type="button"
                class="btn btn-outline-primary"
                disabled={!String(parentToAdd || "").trim()}
                aria-disabled={!String(parentToAdd || "").trim()}
                on:click={addParent}>
                {$_("buttons.add")}
              </button>
            </div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button
          type="button"
          class="btn btn-secondary w-100"
          disabled={!canSave}
          aria-disabled={!canSave}
          on:click={handleSubmit}>
          {$_("buttons.save")}
        </button>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from "svelte/store";

  const modalElement = writable();
  const allGroups = writable([]);
  const lockGroupName = writable(false);
  const originalGroupName = writable("");
  const normalizeWeight = (raw) => {
    const n = parseInt(raw);
    if (isNaN(n)) return 0;
    return n;
  };

  const newGroup = writable({
    name: "",
    weight: 0,
    displayName: "",
    parents: [],
  });

  let callback = (group) => {};
  let hideCallback = () => {};
  let modal;

  export function show(payload = {}) {
    allGroups.set(Array.isArray(payload.allGroups) ? payload.allGroups : []);
    const initialName = String(payload?.newGroup?.name || "").trim();
    lockGroupName.set(initialName === "default");
    originalGroupName.set(initialName);
    newGroup.set({
      name: "",
      displayName: "",
      ...(payload.newGroup ?? {}),
      weight: normalizeWeight(payload?.newGroup?.weight),
      parents: Array.from(new Set([...(payload?.newGroup?.parents || [])].filter(Boolean))),
    });

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: "static",
      keyboard: false,
    });
    modal.show();
  }

  export function hide() {
    hideCallback(get(newGroup));
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

  const isValidGroupName = (raw) => {
    const name = String(raw || "").trim();
    if (!name) return false;
    if (name.length > 30) return false;
    // allow typical permission group keys: letters/numbers/dot/underscore/dash
    return /^[a-zA-Z0-9._-]+$/.test(name);
  };

  const normalizeWeight = (raw) => {
    const n = parseInt(raw);
    if (isNaN(n)) return 0;
    return n;
  };

  let parentToAdd = "";
  let canSave = false;
  let availableParentGroups = [];

  $: {
    const name = String($newGroup?.name || "").trim();
    const nameLc = name.toLowerCase();
    const originalLc = String($originalGroupName || "").trim().toLowerCase();

    const taken =
      !!nameLc &&
      ($allGroups || []).some((g) => {
        const gn = String(g?.name || "").trim().toLowerCase();
        if (!gn) return false;
        if (gn === originalLc) return false; // allow unchanged name in edit mode
        return gn === nameLc;
      });

    canSave = isValidGroupName(name) && !taken;
  }

  $: {
    const selfName = String($newGroup?.name || "").trim();
    const selected = new Set(($newGroup?.parents || []).map((p) => String(p || "").trim()).filter(Boolean));
    availableParentGroups = ($allGroups || []).filter((g) => {
      const gn = String(g?.name || "").trim();
      if (!gn) return false;
      if (gn === selfName) return false;
      if (selected.has(gn)) return false;
      return true;
    });
  }

  const parentLabel = (name) => {
    const byName = new Map(($allGroups || []).map((g) => [g.name, g]));
    const g = byName.get(name);
    return g?.displayName || name;
  };

  function addParent() {
    const name = String(parentToAdd || "").trim();
    if (!name) return;

    newGroup.update((g) => {
      const curr = Array.isArray(g.parents) ? g.parents : [];
      if (curr.includes(name)) return g;
      return { ...g, parents: [...curr, name] };
    });

    parentToAdd = "";
  }

  function removeParent(name) {
    const n = String(name || "").trim();
    if (!n) return;
    newGroup.update((g) => {
      const curr = Array.isArray(g.parents) ? g.parents : [];
      return { ...g, parents: curr.filter((x) => x !== n) };
    });
  }

  function handleSubmit() {
    const ng = get(newGroup);

    if (!ng.name.trim()) {
      alert($_("pages.permission-groups.validation.name-required"));
      return;
    }
    if (!canSave) {
      return;
    }

    hide();
    callback({
      ...ng,
      weight: normalizeWeight(ng.weight),
      parents: Array.from(new Set([...(ng.parents || [])].filter(Boolean))),
    });
  }
</script>
