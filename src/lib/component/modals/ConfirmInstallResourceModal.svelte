<div
  aria-hidden="true"
  class="modal fade"
  bind:this="{$modalElement}"
  role="dialog"
  tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-body text-center">
        <div class="pb-3">
          <i class="fas fa-question-circle fa-3x d-block m-auto text-gray"></i>
        </div>
        {$_('components.modals.confirm-install-resource.title', {values: {...$versionInfoObj?.version}})}
      </div>
      <div class="modal-footer flex-nowrap">
        <button
          class="btn btn-link col-6 m-0"
          data-bs-dismiss="modal"
          type="button"
          class:disabled="{loading}"
          on:click="{hide}">
          {$_('buttons.cancel')}
        </button>
        <button
          class="btn col-6 m-0"
          class:btn-secondary="{!installed}"
          class:btn-success={installed}
          type="button"
          class:disabled="{loading || installed}"
          on:click="{onYesClick}">
          {#if installed}
            <i class="fas fa-check"></i>
          {/if}
          {$_('buttons.' + (installed ? 'installed' : 'yes'))}
        </button>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from "svelte/store";

  const modalElement = writable();
  const versionInfoObj = writable({});

  let callback = (versionInfo) => {};
  let hideCallback = (versionInfo) => {};
  let modal;

  export function show(versionInfo) {
    versionInfoObj.set(versionInfo);

    console.log(versionInfo)

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: "static",
      keyboard: false,
    });
    modal.show();
  }

  export function setCallback(newCallback) {
    callback = newCallback;
  }

  export function hide() {
    hideCallback(get(versionInfoObj));

    modal.hide();
  }

  export function onHide(newCallback) {
    hideCallback = newCallback;
  }
</script>

<script>
  import { _ } from "svelte-i18n";

  let loading;

  $: installed = $versionInfoObj?.installed?.version === $versionInfoObj?.version?.tag

  function onYesClick() {
    modal.hide();
    callback($versionInfoObj);
  }
</script>
