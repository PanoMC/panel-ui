<!-- Post Category Delete Confirmation Modal -->
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
        {$_('components.modals.confirm-delete-post-category.title')}
        {#if $category.postCount !== 0}
          <div class="mt-3 alert alert-warning text-left">
            {$_('components.modals.confirm-delete-post-category.description')}
            <br />
            <br />
            {#each $category.posts as post, index (post)}
              <a
                class="badge bg-warning rounded-pill"
                href="{base}/posts/detail/{post.id}"
                target="_blank">
                {post.title}
              </a>
            {/each}
          </div>
          {#if $category.postCount > 5}
            {$_('components.modals.confirm-delete-post-category.more-posts', {values: {count:$category.postCount - 5}})}
          {/if}
        {/if}
      </div>
      <div class="modal-footer flex-nowrap">
        <button
          class="btn btn-link col-6 m-0"
          type="button"
          class:disabled="{loading}"
          on:click="{hide}">
          {$_('components.modals.confirm-delete-post-category.cancel')}
        </button>
        <button
          class="btn btn-danger col-6 m-0"
          type="button"
          class:disabled="{loading}"
          on:click="{onYesClick}">
          {$_('components.modals.confirm-delete-post-category.yes')}
        </button>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from "svelte/store";

  const dialogID = "postCategoryDeleteConfirmationModal";
  const category = writable({
    posts: [],
  });

  let callback = (category) => {};
  let hideCallback = (category) => {};
  let modal;

  export function show(newCategory) {
    category.set(newCategory);

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
    hideCallback(get(category));

    modal.hide();
  }

  export function onHide(newCallback) {
    hideCallback = newCallback;
  }
</script>

<script>
  import { base } from "$app/paths";

  import ApiUtil from "$lib/api.util";

  import {
    show as showToast,
    limitTitle,
  } from "$lib/component/ToastContainer.svelte";
  import { _ } from "svelte-i18n";

  let loading = false;

  function refreshBrowserPage() {
    location.reload();
  }

  function onYesClick() {
    loading = true;

    ApiUtil.delete({
      path: `/api/panel/post/categories/${get(category).id}`,
      handler: (body, reject) => {
        if (body.error) {
          refreshBrowserPage();
          return;
        }

        loading = false;

        hide();

        showToast('components.toasts.post-category-deleted-permanently', {
          title: limitTitle(get(category).title),
        });

        callback(get(category));
      },
    })
  }
</script>
