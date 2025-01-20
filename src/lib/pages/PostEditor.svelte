<article class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions>
    <a
      href="{base}/posts{data.post.status === StatusTypes.TRASH
        ? '/trash'
        : data.post.status === StatusTypes.DRAFT
          ? '/draft'
          : ''}"
      class="btn btn-link"
      role="button"
      slot="left">
      <i class="fas fa-arrow-left me-2"></i>
      {$_("pages.post-editor.posts")}
    </a>

    <div slot="right">
      {#if data.mode === Modes.EDIT}
        <button
          class="btn btn-link text-danger"
          type="button"
          on:click="{showDeletePostModal(data.post)}"
          use:tooltip="{[
            $_('pages.post-editor.trash'),
            { placement: 'bottom' },
          ]}">
          <i class="fas fa-trash"></i>
        </button>
      {/if}
      {#if data.post.status !== StatusTypes.DRAFT && data.mode === Modes.EDIT}
        <button
          class="btn btn-link"
          type="button"
          class:disabled="{loading}"
          on:click="{onDraftClick}"
          use:tooltip="{[
            $_('pages.post-editor.move-to-drafts'),
            { placement: 'bottom' },
          ]}">
          <i class="fa-solid fa-box-archive"></i>
        </button>
      {/if}
      <a
        class="btn btn-link"
        role="button"
        target="_blank"
        href="{UI_URL === '/' ? '' : UI_URL}/preview/post/{data.post.id}"
        use:tooltip="{[$_('pages.post-editor.view'), { placement: 'bottom' }]}">
        <i class="fas fa-eye"></i>
      </a>
      {#if data.post.status !== StatusTypes.PUBLISHED}
        <button
          class="btn btn-primary"
          type="button"
          class:disabled="{loading ||
            isEditorEmpty ||
            data.post.title.length === 0}"
          on:click="{() => submit(false)}">
          {$_("pages.post-editor.save")}
        </button>
      {/if}
      <button
        class="btn btn-secondary"
        type="button"
        class:disabled="{loading ||
          isEditorEmpty ||
          data.post.title.length === 0}"
        on:click="{() => submit(true)}">
        {data.post.status === StatusTypes.PUBLISHED
          ? $_("pages.post-editor.update")
          : $_("pages.post-editor.publish")}
      </button>
    </div>
  </PageActions>

  <!-- Post & Post Options -->
  <section class="row g-3 animate__animated animate__fadeIn">
    <!-- Post -->
    <div class="col-lg-9">
      <div class="card h-100 w-100">
        <div class="card-body">
          <input
            class="form-control form-control-lg"
            type="text"
            placeholder="{$_('pages.post-editor.inputs.title.placeholder')}"
            bind:value="{data.post.title}" />

          <div class="align-self-center w-100 h-75">
            <!-- Editor -->
            <Editor
              bind:content="{data.post.text}"
              bind:isEmpty="{isEditorEmpty}" />
            <!-- Editor End -->
          </div>
        </div>
      </div>
    </div>

    <!-- Post Option Cards -->
    <div class="col-lg-3">
      <div class="card">
        <div class="card-body">
          <ul class="list-group p-0 m-0">
            <li class="list-group-item">
              <div class="d-flex justify-content-between align-items-center">
                {$_("pages.post-editor.status")}
                <div>
                  {$_(getStatusByPostStatus(data.post.status))}
                </div>
              </div>
            </li>
            <li class="list-group-item">
              <div class="d-flex justify-content-between align-items-center">
                {$_("pages.post-editor.views")}
                <div>{data.mode === Modes.CREATE ? "0" : data.post.views}</div>
              </div>
            </li>
            <li class="list-group-item">
              <div class="d-flex justify-content-between align-items-center">
                {$_("pages.post-editor.category")}

                <form>
                  <select
                    class="form-control form-control-sm"
                    bind:value="{data.post.category}">
                    <option class="text-primary" value="{-1}"
                      >{$_("pages.post-editor.no-category")}</option>

                    {#each data.categories as category, index (category)}
                      <option value="{category.id}">{category.title}</option>
                    {/each}
                  </select>
                </form>
              </div>
            </li>
            <li class="list-group-item form-group">
              <div class="d-flex justify-content-between align-items-center">
                {$_("pages.post-editor.thumbnail")}

                {#if !isThumbnailRemoved && (thumbnail || data.post.thumbnailUrl)}
                  <button
                    class="btn btn-link link-danger"
                    on:click="{onRemoveThumbnailClick}"
                    >{$_("pages.post-editor.clear")}</button>
                {:else}
                  <button
                    class="btn btn-sm btn-primary"
                    on:click="{() => thumbnailInput.click()}"
                    >{$_("pages.post-editor.add")}</button>
                {/if}
              </div>
              {#if !isThumbnailRemoved && (thumbnail || data.post.thumbnailUrl)}
                <a
                  href="javascript:void(0);"
                  use:tooltip="{[
                    $_('pages.post-editor.change'),
                    { placement: 'bottom' },
                  ]}"
                  on:click="{() => thumbnailInput.click()}">
                  <img
                    src="{thumbnail || data.post.thumbnailUrl}"
                    class="border rounded img-fluid"
                    title="{$_('pages.post-editor.small-image')}"
                    alt="{$_('pages.post-editor.small-image')}" /></a>
              {:else}
                <NoContent
                  icon="fas fa-image fa-3x"
                  text="{$_('pages.post-editor.thumbnail-not-determined')}" />
              {/if}
              <input
                class="d-none"
                type="file"
                id="uploadPostThumbnailInput"
                bind:files="{thumbnailFiles}"
                on:change="{onThumbnailChange}"
                bind:this="{thumbnailInput}" />
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</article>

<AddEditPostCategoryModal />

<script context="module">
  import ApiUtil from "$lib/api.util";
  import { error } from "@sveltejs/kit";

  export const Modes = Object.freeze({
    EDIT: "edit",
    CREATE: "create",
  });

  export const StatusTypes = Object.freeze({
    PUBLISHED: "PUBLISHED",
    DRAFT: "DRAFT",
    TRASH: "TRASH",
  });

  export const DefaultMode = Modes.CREATE;

  async function loadPost({ id, request }) {
    return new Promise((resolve, reject) => {
      ApiUtil.get({
        path: `/api/panel/posts/${id}`,
        request,
      }).then((body) => {
        if (body.result === "ok") {
          const data = body;

          data.id = parseInt(id);

          resolve(data);
        } else {
          reject(body);
        }
      });
    });
  }

  async function loadCategories({ request }) {
    return new Promise((resolve, reject) => {
      ApiUtil.get({
        path: "/api/panel/post/categories",
        request,
      }).then((body) => {
        if (body.result === "ok") {
          resolve(body);
        } else {
          reject(body);
        }
      });
    });
  }

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event, mode = DefaultMode) {
    const { parent } = event;
    const parentData = await parent();

    let data = {
      post: {
        id: -1,
        title: "",
        text: "",
        category: -1,
        status: -1,
        date: 0,
        thumbnailUrl: "",
      },
      categoryCount: 0,
      categories: [],
      mode,
      error: {},
    };

    if (parentData.NETWORK_ERROR) {
      return data;
    }

    if (mode === Modes.EDIT) {
      await loadPost({ id: event.params.id || -1, request: event })
        .then((body) => {
          data.post = body.post;
        })
        .catch((body) => {
          if (body.error) {
            if (body.error === "POST_NOT_FOUND") {
              throw error(404, body.error);
            }

            throw error(500, body.error);
          }
        });
    }

    if (data !== null)
      await loadCategories({ request: event }).then((body) => {
        data = { ...data, ...body };
      });

    return data;
  }
</script>

<script>
  import { getContext } from "svelte";
  import { _ } from "svelte-i18n";

  import { base } from "$app/paths";
  import { goto } from "$app/navigation";

  import tooltip from "$lib/tooltip.util";

  import { showNetworkErrorOnCatch } from "$lib/Store";
  import { UI_URL } from "$lib/variables";

  import {
    setCallback as setDeletePostModalCallback,
    show as showDeletePostModal,
  } from "$lib/component/modals/ConfirmDeletePostModal.svelte";

  import AddEditPostCategoryModal, {
    // show as showAddEditPostCategoryModal,
    setCallback as setCallbackForAddEditPostCategoryModal,
  } from "$lib/component/modals/AddEditPostCategoryModal.svelte";

  import Editor from "$lib/component/Editor.svelte";

  import { show as showToast } from "$lib/component/ToastContainer.svelte";

  import PostPublishedToast from "$lib/component/toasts/PostPublishedToast.svelte";
  import PostMovedToDraftToast from "$lib/component/toasts/PostMovedToDraftToast.svelte";
  import PostSavedToast from "$lib/component/toasts/PostSavedToast.svelte";
  import NoContent from "$lib/component/NoContent.svelte";
  import PageActions from "$lib/component/PageActions.svelte";

  export let data;

  let isEditorEmpty = true;
  let loading = false;

  let thumbnail;

  let isThumbnailSaved;
  let isThumbnailRemoved;

  let thumbnailInput;
  let thumbnailFiles = [];

  const pageTitle = getContext("pageTitle");

  pageTitle.set(
    data.mode === Modes.EDIT
      ? "pages.post-editor.title-edit"
      : "pages.post-editor.title-create",
  );

  function onThumbnailChange(event) {
    isThumbnailSaved = false;
    isThumbnailRemoved = false;

    const reader = new FileReader();
    const newImage = event.target.files[0];

    reader.readAsDataURL(newImage);

    reader.onload = (e) => {
      thumbnail = e.target.result;
    };
  }

  function getStatusByPostStatus(status) {
    return status === StatusTypes.TRASH
      ? "pages.post-editor.trash"
      : status === StatusTypes.PUBLISHED
        ? "pages.post-editor.published"
        : status === StatusTypes.DRAFT
          ? "pages.post-editor.draft"
          : "pages.post-editor.new";
  }

  function submit(publish) {
    loading = true;

    showNetworkErrorOnCatch((resolve, reject) => {
      const bodyHandler = (body) => {
        if (body.result === "ok") {
          loading = false;

          if (data.mode === Modes.CREATE) {
            goto(base + "/posts/post/" + body.id);
          }

          if (data.mode === Modes.EDIT && publish) {
            data.post.status = StatusTypes.PUBLISHED;
          }

          if (publish) {
            showToast(PostPublishedToast, {
              postId: body.id,
              title: data.post.title,
            });
          } else {
            showToast(PostSavedToast, {
              postId: body.id,
              title: data.post.title,
            });
          }

          isThumbnailSaved = true;
          isThumbnailRemoved = false;
          thumbnailFiles = [];

          resolve();
        } else if (body.result === "error") {
          loading = false;

          data.error = body.error;

          resolve();
        } else reject();
      };

      const body = new FormData();

      body.append("publish", publish);
      body.append("title", data.post.title);
      body.append("category", data.post.category);
      body.append("text", data.post.text);

      if (isThumbnailRemoved) {
        body.append("removeThumbnail", true);
      } else if (thumbnailFiles[0]) {
        body.append("thumbnail", thumbnailFiles[0]);
      }

      if (data.post.id === -1) {
        ApiUtil.post({
          path: "/api/panel/post",
          body,
        })
          .then(bodyHandler)
          .catch(() => {
            reject();
          });

        return;
      }

      ApiUtil.put({
        path: `/api/panel/posts/${data.post.id}`,
        body,
      })
        .then(bodyHandler)
        .catch(() => {
          reject();
        });
    });
  }

  function onDraftClick() {
    loading = true;

    showNetworkErrorOnCatch((resolve, reject) => {
      ApiUtil.put({
        path: `/api/panel/posts/${data.post.id}/status`,
        body: {
          to: "DRAFT",
        },
      })
        .then((body) => {
          if (body.result === "ok") {
            loading = false;

            goto(base + "/posts/draft");

            showToast(PostMovedToDraftToast, { title: data.post.title });

            resolve();
          } else reject();
        })
        .catch(() => {
          reject();
        });
    });
  }

  function onRemoveThumbnailClick() {
    isThumbnailSaved = false;
    thumbnailFiles = [];
    thumbnail = null;
    isThumbnailRemoved = true;
    data.post.thumbnailUrl = null;
  }

  // function onCreateCategoryClick() {
  //   showAddEditPostCategoryModal("create");
  // }

  setCallbackForAddEditPostCategoryModal((routeFirstPage, category) => {
    showNetworkErrorOnCatch((resolve, reject) => {
      loadCategories()
        .then((loadedData) => {
          data.categories = loadedData.categories;
          data.categoryCount = loadedData.categoryCount;
          data.post.category = category.id;
        })
        .catch(() => {
          reject();
        });
    });
  });

  setDeletePostModalCallback((post) => {
    if (post.status === StatusTypes.TRASH) {
      goto(base + "/posts");
    } else {
      goto(base + "/posts/trash");
    }
  });
</script>
