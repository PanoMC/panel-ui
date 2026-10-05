<!-- Confirm Delete Post Modal -->
<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-body text-center">
        <div class="pb-3">
          <i class="fas fa-question-circle fa-3x d-block m-auto"></i>
        </div>
        <h5 class="mb-2">
          {$post.status === 0
            ? $_('components.modals.confirm-delete-post.title-permanent')
            : $_('components.modals.confirm-delete-post.title-trash')}
        </h5>
        <div class="text-body-secondary">
          {$post.status === 0
            ? $_('components.modals.confirm-delete-post.description-permanent')
            : $_('components.modals.confirm-delete-post.description-trash')}
        </div>
      </div>
      <div class="modal-footer flex-nowrap">
        <button
          class="btn btn-link text-decoration-none col-6 m-0"
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
          {#if loading}
            <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
          {/if}
          {$post.status === 0 ? $_('buttons.delete-permanently') : $_('buttons.move-to-trash')}
        </button>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from 'svelte/store';

  const modalElement = writable();
  const post = writable({});

  let callback = (post) => {};
  let hideCallback = (post) => {};
  let modal;

  export function show(newPost) {
    post.set(newPost);

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
    hideCallback(get(post));

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
  import { base } from '$app/paths';

  let loading = false;

  function refreshBrowserPage() {
    location.reload();
  }

  function onYesClick() {
    loading = true;

    const bodyHandler = (body) => {
      if (body.error) {
        refreshBrowserPage();
      }

      loading = false;

      hide();

      if (get(post).status === 0) {
        showSuccessToast('components.toasts.post-deleted-permanently', {
          title: limitTitle(get(post).title),
        });
      } else {
        showSuccessToast('components.toasts.post-moved-to-trash', {
          title: limitTitle(get(post).title),
          href: `${base}/posts?pageType=TRASH`,
        });
      }

      callback(get(post));
    };

    if (get(post).status === 0) {
      ApiUtil.delete({
        path: `/api/panel/posts/${get(post).id}`,
        handler: bodyHandler,
      });

      return;
    }

    ApiUtil.put({
      path: `/api/panel/posts/${get(post).id}/status`,
      body: {
        to: 'TRASH',
      },
      handler: bodyHandler,
    });
  }
</script>
