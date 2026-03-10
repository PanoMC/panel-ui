<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-body text-center">
        <div class="pb-3">
          <i class="fas fa-question-circle fa-3x d-block m-auto text-gray"></i>
        </div>
        {$_($titleValue)}
      </div>
      <div class="modal-footer flex-nowrap">
        <button class="btn btn-link col-6 m-0" type="button" on:click={hide}>
          {$_('buttons.cancel')}
        </button>
        <button class="btn btn-danger col-6 m-0" type="button" on:click={onYesClick}>
          {$_('buttons.yes')}
        </button>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from 'svelte/store';

  const modalElement = writable();
  const titleValue = writable('');
  let callback = () => {};
  let modal;

  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  export async function show(newTitle, newCallback) {
    titleValue.set(newTitle);
    callback = newCallback;

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: 'static',
      keyboard: false,
    });

    modal.show();
  }

  export function hide() {
    if (modal) {
      modal.hide();
    }
  }
</script>

<script>
  import { _ } from 'svelte-i18n';

  function onYesClick() {
    callback();
    hide();
  }
</script>
