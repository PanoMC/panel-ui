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
          <div class="form-floating mb-3">
            <input
              type="text"
              class="form-control form-control-lg"
              id="groupDisplayName"
              bind:value={$newGroup.displayName}
              title="{$_("pages.permission-groups.form.display-name")}"
              maxlength="30" />
            <label for="groupDisplayName">
              {$_("pages.permission-groups.form.display-name")}
            </label>
          </div>
          <div class="input-group mb-3">
            <div class="form-floating">
              <input
                type="text"
                class="form-control font-monospace"
                id="groupName"
                bind:value={$newGroup.name}
                disabled={$lockGroupName}
                aria-disabled={$lockGroupName}
                maxlength="30"
                required
                title={$_("pages.permission-groups.form.group-name")} />
              <label for="groupName">
                {$_("pages.permission-groups.form.group-name")}
              </label>
            </div>
            <div class="form-floating">
              <input
                type="number"
                class="form-control"
                id="groupWeight"
                bind:value={$newGroup.weight}
                inputmode="numeric"
                on:blur={() => newGroup.update((g) => ({ ...g, weight: normalizeWeight(g.weight) }))}
                title={$_("pages.permission-groups.form.weight")} />
              <label for="groupWeight">
                {$_("pages.permission-groups.form.weight")}
              </label>
            </div>
          </div>

          <div class="form-label">{$_("pages.permission-groups.form.parents")}</div>
          {#if ($newGroup.parents || []).length === 0}
          <NoContent />
          {:else}
            <div class="list-group list-group">
              {#each ($newGroup.parents || []) as p (p)}
                <div class="list-group-item d-flex justify-content-between align-items-center">
                  <div class="text-truncate">
                    {parentLabel(p)}
                    <small>({p})</small>
                  </div>
                  <button
                    type="button"
                    class="btn-close"
                    title="{$_("buttons.remove")}"
                    aria-label="{$_("buttons.remove")}"
                    on:click={() => removeParent(p)}>
                  </button>
                </div>
              {/each}
            </div>
          {/if}

          {#if availableParentGroups.length > 0}
            <div class="hstack gap-2 mt-3">
              <select class="form-select" bind:value={parentToAdd}>
                <option value="">{$_("pages.permission-groups.form.select-option")}</option>
                {#each availableParentGroups as g (g.id ?? g.name)}
                  <option class="font-monospace" value={g.name}>
                    {g.displayName || g.name} ({g.name})
                  </option>
                {/each}
              </select>
              <button
                type="button"
                class="btn btn-primary"
                title="{$_("buttons.add")}"
                aria-label="{$_("buttons.add")}"
                disabled={!String(parentToAdd || "").trim()}
                aria-disabled={!String(parentToAdd || "").trim()}
                on:click={addParent}>
                <i class="fa fa-plus"></i>
              </button>
            </div>
          {/if}
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
    import NoContent from "../NoContent.svelte";

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
