<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-body text-center">
        <div class="pb-3">
          <i class="fas fa-question-circle fa-3x d-block m-auto text-gray"></i>
        </div>
        {$_('components.modals.confirm-delete-language.title')}
      </div>
      <div class="modal-footer flex-nowrap">
        <button
          class="btn btn-link col-6 m-0"
          type="button"
          class:disabled={loading}
          on:click={hide}>
          {$_('buttons.cancel')}
        </button>
        <button
          class="btn btn-danger col-6 m-0"
          type="button"
          class:disabled={loading}
          on:click={onYesClick}>
          {$_('buttons.yes')}
        </button>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from 'svelte/store';

  const modalElement = writable();
  const locale = writable({});

  let callback = (locale) => {};
  let hideCallback = (locale) => {};
  let modal;

  export function show(newLocale) {
    locale.set(newLocale);

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: 'static',
      keyboard: false,
    });
    modal.show();
  }

  export function setCallback(newCallback) {
    callback = newCallback;
  }

  export function hide() {
    hideCallback(get(locale));

    modal.hide();
  }

  export function onHide(newCallback) {
    hideCallback = newCallback;
  }
</script>

<script>
  import { _ } from 'svelte-i18n';

  import ApiUtil from '$lib/api.util';

  import {
    showSuccess as showSuccessToast,
    limitTitle,
  } from '$lib/components/ToastContainer.svelte';

  let loading = false;

  function refreshBrowserPage() {
    location.reload();
  }

  function onYesClick() {
    loading = true;

    ApiUtil.delete({
      path: `/api/panel/locales/${get(locale).id}`,
      handler: (body, reject) => {
        if (body.error) {
          refreshBrowserPage();
          return;
        }

        loading = false;

        hide();

        showSuccessToast('components.toasts.language-deleted-permanently', {
          name: limitTitle(get(locale).name),
        });

        callback(get(locale));
      },
    });
  }
</script>
