<!-- Server Settings Sub Page -->
<div class="card animate__animated animate__fadeIn">
  <div class="card-header">
    {$selectedServer.name} ({$selectedServer.host}:{$selectedServer.port})
  </div>
  <div class="card-body">
    <div class="row mb-3">
      <label class="col-md-4 col-form-label" for="mainServer">
        {$_('pages.server.settings.main-server')}
      </label>
      <div class="col col-form-label">
        {#if $selectedServer.id === $mainServer.id}
          <p class="mb-0 text-muted">
            <i class="fa-solid fa-check me-2"></i> {$_('pages.server.settings.already-main-server', {values:{serverName: $selectedServer.name}})}
          </p>
        {:else}
          <button
            href="javascript:void(0);"
            on:click="{() => showMakeMainServerModal($selectedServer)}"
            class="btn btn-link ps-0"
            ><i class="fa-solid fa-home me-2"></i> {$_('pages.server.settings.make-main-server')}</button>

          <small class="text-muted d-block"
            >{$_('pages.server.settings.main-server-info')}</small>
        {/if}
      </div>
    </div>
    <div class="row">
      <label class="col-md-4 col-form-label" for="removeServer">
        {$_('pages.server.settings.remove-server')}
      </label>
      <div class="col d-flex align-items-center">
        <button type="button" on:click={() => showRemoveServerModal($selectedServer)} class="btn btn-outline-danger btn-sm"
          ><i class="fa-solid fa-plug me-2"></i> {$_('pages.server.settings.disconnect')}</button>
      </div>
    </div>
  </div>
</div>

<MakeMainServerModal/>
<RemoveServerModal />

<script>
  import { getContext } from "svelte";
  import { _ } from "svelte-i18n";

  import MakeMainServerModal, { show as showMakeMainServerModal } from "$lib/component/modals/MakeMainServerModal.svelte";
  import RemoveServerModal, { show as showRemoveServerModal } from "$lib/component/modals/RemoveServerModal.svelte";

  const mainServer = getContext("mainServer");
  const selectedServer = getContext("selectedServer");
  const pageTitle = getContext("pageTitle");

  pageTitle.set("pages.server.settings.title");
</script>
