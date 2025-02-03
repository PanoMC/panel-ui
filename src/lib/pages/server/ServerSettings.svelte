<!-- Server Settings Sub Page -->
<div class="card animate__animated animate__fadeIn">
  <div class="card-body">
    <h5 class="card-title">
      {$selectedServer.name} ({$selectedServer.host}:{$selectedServer.port})
    </h5>
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
          <a
            href="javascript:void(0);"
            on:click="{() => showMakeMainServerModal($selectedServer)}"
            class="btn btn-link ps-0"
            ><i class="fa-solid fa-home me-2"></i> {$_('pages.server.settings.make-main-server')}</a>

          <small class="text-muted d-block"
            >{$_('pages.server.settings.main-server-info')}</small>
        {/if}
      </div>
    </div>
    <div class="row py-3 rounded my-3 bg-danger bg-opacity-25">
      <label class="col-md-4 col-form-label" for="removeServer">
        {$_('pages.server.settings.remove-server')}
      </label>
      <div class="col d-flex align-items-center">
        <a href="javascript:void(0);" on:click={() => showRemoveServerModal($selectedServer)} class="btn btn-link link-danger ps-0"
          ><i class="fa-solid fa-plug me-2"></i> {$_('pages.server.settings.disconnect')}</a>
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
