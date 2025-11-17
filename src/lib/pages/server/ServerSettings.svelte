<!-- Server Settings Sub Page -->
<div class="card animate__animated animate__fadeIn">
  <div class="card-header">Tercihler</div>
  <div class="card-body">
    <div class="row mb-3">
      <label class="col-md-4 col-form-label" for="mainServer">
        {$_("pages.server.settings.main-server")}
        <small class="d-block"
          >{$_("pages.server.settings.main-server-info")}</small>
      </label>
      <div class="col col-form-label">
        {#if $selectedServer.id === $mainServer.id}
          <button class="btn btn-secondary btn-sm disabled" disabled>
            <i class="fa-solid fa-check me-1"></i>
            {$_("pages.server.settings.already-main-server", {
              values: { serverName: $selectedServer.name },
            })}
          </button>
        {:else}
          <button
            on:click={() => showMakeMainServerModal($selectedServer)}
            class="btn btn-secondary btn-sm">
            <i class="fas fa-crown me-1"></i>
            {$_("pages.server.settings.make-main-server")}</button>
        {/if}
      </div>
    </div>
    <div class="row">
      <label class="col-md-4 col-form-label" for="removeServer">
        {$_("pages.server.settings.remove-server")}
      </label>
      <div class="col hstack gap-2">
        <span class="badge text-bg-primary">{$selectedServer.name}</span>
        <button
          type="button"
          title={$_("buttons.remove")}
          aria-label={$_("buttons.remove")}
          on:click={() => showRemoveServerModal($selectedServer)}
          class="btn-close">
        </button>
      </div>
    </div>
  </div>
</div>

<MakeMainServerModal />
<RemoveServerModal />

<script>
  import { getContext } from "svelte";
  import { _ } from "svelte-i18n";

  import MakeMainServerModal, {
    show as showMakeMainServerModal,
  } from "$lib/component/modals/MakeMainServerModal.svelte";
  import RemoveServerModal, {
    show as showRemoveServerModal,
  } from "$lib/component/modals/RemoveServerModal.svelte";

  const mainServer = getContext("mainServer");
  const selectedServer = getContext("selectedServer");
  const pageTitle = getContext("pageTitle");

  pageTitle.set("pages.server.settings.title");
</script>
