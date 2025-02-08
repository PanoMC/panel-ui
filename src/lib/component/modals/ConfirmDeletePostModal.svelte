<!-- Confirm Delete Post Modal -->
<div
  aria-hidden="true"
  class="modal fade"
  id="{dialogID}"
  role="dialog"
  tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-body text-center">
        <div class="pb-3">  
          <i class="fas fa-question-circle fa-3x d-block m-auto text-gray"></i>
        </div>
        {$post.status === 0
          ? $_('components.modals.confirm-delete-post.title-permanent')
          : $_('components.modals.confirm-delete-post.title-trash')}
      </div>
      <div class="modal-footer flex-nowrap">
        <button
          class="btn btn-link col-6 m-0"
          type="button"
          class:disabled="{loading}"
          on:click="{hide}">
          {$_('components.modals.confirm-delete-post.cancel')}
        </button>
        <button
          class="btn btn-danger col-6 m-0"
          type="button"
          class:disabled="{loading}"
          on:click="{onYesClick}">
          {$_('components.modals.confirm-delete-post.yes')}
        </button>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from "svelte/store";

  const dialogID = "confirmDeletePost";
  const post = writable({});

  let callback = (post) => {};
  let hideCallback = (post) => {};
  let modal;

  export function show(newPost) {
    post.set(newPost);

    modal = new window.bootstrap.Modal(document.getElementById(dialogID), {
      backdrop: "static",
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
  import { _ } from "svelte-i18n";

  import ApiUtil from "$lib/api.util";

  import { show as showToast, limitTitle } from "$lib/component/ToastContainer.svelte";
  import { base } from "$app/paths";

  let loading = false;

  function refreshBrowserPage() {
    location.reload();
  }

  function onYesClick() {
    loading = true;

    const bodyHandler = (body) => {
      if (body.error) {
        refreshBrowserPage()
      }

      loading = false;

      hide();

      if (get(post).status === 0) {
        showToast('components.toasts.post-deleted-permanently', { title: limitTitle(get(post).title) });
      } else {
        const title = `<a href="${base}/posts?pageType=TRASH" target="_blank">${limitTitle(get(post).title)}</a>`
        showToast('components.toasts.post-moved-to-trash', { title });
      }

      callback(get(post));
    };

    if (get(post).status === 0) {
      ApiUtil.delete({
        path: `/api/panel/posts/${get(post).id}`,
        handler: bodyHandler
      })

      return;
    }

    ApiUtil.put({
      path: `/api/panel/posts/${get(post).id}/status`,
      body: {
        to: "TRASH",
      },
      handler: bodyHandler
    })
  }
</script>
