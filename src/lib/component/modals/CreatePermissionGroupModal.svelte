{#if showModal}
  <div
    class="modal-backdrop fade show"
    on:click={closeModal}
    on:keydown={(e) => {
      if (e.key === "Escape") closeModal();
    }}
    role="button"
    tabindex="0"
    aria-label="Close modal">
  </div>
  <div class="modal fade show d-block" tabindex="-1" role="dialog">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            {$_("pages.permission-groups.create-permission-group-button")}
          </h5>
          <button
            type="button"
            class="btn-close"
            on:click={closeModal}
            aria-label={$_("buttons.close")}
            title={$_("buttons.close")}></button>
        </div>
        <div class="modal-body">
          <form on:submit|preventDefault={handleSubmit}>
            <div class="mb-3">
              <div class="input-group">
                <input
                  type="text"
                  class="form-control form-control-lg"
                  id="groupName"
                  bind:value={newGroup.name}
                  maxlength="30"
                  required
                  placeholder={$_("pages.permission-groups.form.group-name")}
                  title={$_("pages.permission-groups.form.group-name")} />
                <input
                  type="number"
                  class="form-control form-control-lg"
                  id="groupWeight"
                  bind:value={newGroup.weight}
                  min="0"
                  max="199"
                  required
                  placeholder={$_("pages.permission-groups.form.weight")}
                  title={$_("pages.permission-groups.form.weight")} />
              </div>
            </div>
            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="groupDisplayName" class="form-label"
                  >{$_("pages.permission-groups.form.display-name")}</label>
                <input
                  type="text"
                  class="form-control"
                  id="groupDisplayName"
                  bind:value={newGroup.displayName}
                  maxlength="30"
                  placeholder={$_(
                    "pages.permission-groups.form.display-name-placeholder",
                  )} />
              </div>
              <div class="col-md-6 mb-3">
                <label for="groupParent" class="form-label"
                  >{$_("pages.permission-groups.form.parent")}</label>
                <select
                  class="form-select"
                  id="groupParent"
                  bind:value={newGroup.parent}>
                  <option value=""
                    >{$_("pages.permission-groups.form.select-option")}</option>
                  <option value="admin"
                    >{$_("pages.permission-groups.form.parent-admin")}</option>
                  <option value="moderator"
                    >{$_(
                      "pages.permission-groups.form.parent-moderator",
                    )}</option>
                  <option value="vip"
                    >{$_("pages.permission-groups.form.parent-vip")}</option>
                </select>
              </div>
            </div>
            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="groupPrefix" class="form-label"
                  >{$_("pages.permission-groups.form.prefix")}</label>
                <input
                  type="text"
                  class="form-control"
                  id="groupPrefix"
                  bind:value={newGroup.prefix}
                  maxlength="30"
                  placeholder={$_(
                    "pages.permission-groups.form.prefix-placeholder",
                  )} />
              </div>
              <div class="col-md-6 mb-3">
                <label for="groupSuffix" class="form-label"
                  >{$_("pages.permission-groups.form.suffix")}</label>
                <input
                  type="text"
                  class="form-control"
                  id="groupSuffix"
                  bind:value={newGroup.suffix}
                  maxlength="30"
                  placeholder={$_(
                    "pages.permission-groups.form.suffix-placeholder",
                  )} />
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary w-100"
            on:click={handleSubmit}>
            {$_("buttons.save")}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Create Permission Group Modal -->
<script>
  import { _ } from "svelte-i18n";
  import { createEventDispatcher } from "svelte";

  export let showModal = false;
  export let newGroup = {
    name: "",
    weight: 0,
    displayName: "",
    prefix: "",
    parent: "",
    suffix: "",
  };

  const dispatch = createEventDispatcher();

  function closeModal() {
    dispatch("close");
  }

  function handleSubmit() {
    // Basic validation
    if (!newGroup.name.trim()) {
      alert($_("pages.permission-groups.validation.name-required"));
      return;
    }

    if (newGroup.weight < 0 || newGroup.weight > 199) {
      alert($_("pages.permission-groups.validation.weight-range"));
      return;
    }

    dispatch("save", { group: newGroup });
  }
</script>
