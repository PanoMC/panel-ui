<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-body text-center">
        <div class="pb-3">
          <i class="fas fa-question-circle fa-3x d-block m-auto text-gray"></i>
        </div>
        {$_($titleValue, { values: $titleValues })}
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
  const titleValues = writable({});
  let callback = () => {};
  let modal;

  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  // Interpolation values are optional and may be passed either before or after the callback.
  export async function show(newTitle, newCallbackOrValues, newValuesOrCallback) {
    const isCallbackFirst = typeof newCallbackOrValues === 'function';
    const newCallback = isCallbackFirst ? newCallbackOrValues : newValuesOrCallback;
    const newValues = isCallbackFirst ? newValuesOrCallback : newCallbackOrValues;

    titleValue.set(newTitle);
    titleValues.set(newValues || {});
    callback = newCallback || (() => {});

    const element = get(modalElement);

    // The modal is mounted once in AppLayout; degrade to a no-op instead of throwing if that
    // mount is ever missing, so a caller never loses its own error handling to this.
    if (!element) {
      console.error('ConfirmActionModal is not mounted.');

      return;
    }

    modal = new window.bootstrap.Modal(element, {
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
