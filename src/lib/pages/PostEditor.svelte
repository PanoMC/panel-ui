<style>
  .thumbnail-wrapper {
    position: relative;
    display: block;
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
  }
</style>

{#snippet left()}
  <a
    href="{base}/posts{post.status === StatusTypes.TRASH
      ? '?pageType=TRASH'
      : post.status === StatusTypes.DRAFT
        ? '?pageType=DRAFT'
        : ''}"
    class="btn btn-link"
    role="button">
    <i class="fas fa-arrow-left"></i>
    <span class="d-lg-inline d-none ms-2"> {$_('pages.post-editor.posts')}</span>
  </a>
{/snippet}

{#snippet right()}
  {#if data.mode === Modes.EDIT}
    <button
      title={$_('buttons.remove')}
      aria-label={$_('buttons.remove')}
      class="btn btn-link"
      type="button"
      on:click={() => showDeletePostModal(post)}>
      <i class="fas fa-trash"></i>
    </button>
  {/if}
  {#if post.status !== StatusTypes.DRAFT && data.mode === Modes.EDIT}
    <button
      title={$_('pages.post-editor.move-to-drafts')}
      aria-label={$_('pages.post-editor.move-to-drafts')}
      class="btn btn-link"
      type="button"
      class:disabled={loading}
      on:click={onDraftClick}>
      <i class="fa-solid fa-sheet-plastic"></i>
    </button>
  {/if}
  <a
    class="btn btn-link"
    role="button"
    aria-label={$_('buttons.view')}
    title={$_('buttons.view')}
    target="_blank"
    href="{UI_URL === '/' ? '' : UI_URL}/preview/post/{post.id}">
    <i class="fas fa-eye"></i>
  </a>
  {#if post.status !== StatusTypes.PUBLISHED}
    <button
      title={$_(data.mode === Modes.CREATE ? 'buttons.save' : 'buttons.update')}
      aria-label={$_(data.mode === Modes.CREATE ? 'buttons.save' : 'buttons.update')}
      class="btn btn-link"
      type="button"
      class:disabled={loading || isEditorEmpty || post.title.length === 0}
      on:click={() => submit(false)}>
      <i class="fas fa-save"></i>
    </button>
  {/if}
  <button
    class="btn btn-secondary"
    type="button"
    class:disabled={loading || isEditorEmpty || post.title.length === 0}
    on:click={() => submit(true)}>
    <i class="fas fa-save"></i>
    <span class="d-lg-inline d-none ms-2">
      {post.status === StatusTypes.PUBLISHED
        ? $_('buttons.update')
        : $_('pages.post-editor.publish')}</span>
  </button>
  <Hook name="panel:post-editor:actions:right" post={post} />
{/snippet}

<!-- Post & Post Options -->
<section class="row g-3">
  <!-- Post -->
  <div class="col-lg-9">
    <div class="card h-100 w-100">
      <div class="card-body d-flex flex-column gap-3">
        <input
          class="form-control form-control-lg"
          type="text"
          placeholder={$_('pages.post-editor.inputs.title.placeholder')}
          bind:value={post.title} />

        <div class="w-100 flex-grow-1 d-flex flex-column">
          <!-- Editor -->
          <Editor bind:content={post.text} bind:isEmpty={isEditorEmpty} />
          <!-- Editor End -->
        </div>
      </div>
    </div>
  </div>

  <!-- Post Option Cards -->
  <div class="col-lg-3">
    <Hook name="panel:post-editor:sidebar:before" post={post} />
    <div class="card">
      <div class="card-body">
        <ul class="list-group p-0 m-0">
          <li class="list-group-item">
            <div class="d-flex justify-content-between align-items-center">
              {$_('pages.post-editor.status')}
              <div>
                {$_(getStatusByPostStatus(post.status))}
              </div>
            </div>
          </li>
          <li class="list-group-item">
            <div class="d-flex justify-content-between align-items-center">
              {$_('pages.post-editor.views')}
              <div>{data.mode === Modes.CREATE ? '0' : post.views}</div>
            </div>
          </li>
          {#if post.status === StatusTypes.PUBLISHED}
            <li class="list-group-item">
              <div class="d-flex justify-content-between align-items-center">
                {$_('pages.post-editor.created-at')}
                <div class="text-end">
                  <Date time={post.date} relativeFormat />
                </div>
              </div>
            </li>
            {#if post.moveDate}
              <li class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                  {$_('pages.post-editor.updated-at')}
                  <div><Date time={post.moveDate} relativeFormat /></div>
                </div>
              </li>
            {/if}
          {/if}
          <li class="list-group-item">
            <div class="d-flex justify-content-between align-items-center">
              {$_('pages.post-editor.category')}

              <form>
                <select class="form-control form-control-sm" bind:value={post.category}>
                  <option class="text-primary" value={-1}
                    >{$_('pages.post-editor.no-category')}</option>

                  {#each data.categories as category, index (category)}
                    <option value={category.id}>{category.title}</option>
                  {/each}
                </select>
              </form>
            </div>
          </li>
          <li class="list-group-item p-2">
            {#if !isThumbnailRemoved && (thumbnail || post.thumbnailUrl)}
              <div class="thumbnail-wrapper">
                <div class="ratio ratio-16x9 w-100 rounded overflow-hidden shadow-sm">
                  <DragAndDropZone
                    accept={['image/*']}
                    on:drop={(e) => handleThumbnailFile(e.detail)}
                    class="p-0 border-0">
                    <img
                      src={thumbnail || post.thumbnailUrl}
                      class="img-fluid w-100 h-100 object-fit-cover"
                      alt={$_('pages.post-editor.small-image')} />
                  </DragAndDropZone>
                </div>

                <button
                  type="button"
                  class="btn btn-sm btn-danger position-absolute top-0 start-100 translate-middle shadow-sm"
                  on:click={onRemoveThumbnailClick}
                  title={$_('buttons.remove')}
                  aria-label={$_('buttons.remove')}>
                  <i class="fas fa-minus"></i>
                </button>
              </div>
            {:else}
              <DragAndDropZone
                accept={['image/*']}
                on:drop={(e) => handleThumbnailFile(e.detail)}
                icon="fas fa-image fa-3x"
                title={$_('pages.post-editor.thumbnail-not-determined')}
                style="height: 240px;" />
            {/if}
          </li>
        </ul>
      </div>
    </div>
    <Hook name="panel:post-editor:sidebar:after" post={post} />
  </div>
</section>

<Hook name="panel:post-editor:content:bottom" post={post} />

<AddEditPostCategoryModal />

<script module>
  import ApiUtil from '$lib/api.util';
  import { error } from '@sveltejs/kit';
  import { executeHookLoad } from '$lib/PluginAPI.js';

  export const Modes = Object.freeze({
    EDIT: 'edit',
    CREATE: 'create',
  });

  export const StatusTypes = Object.freeze({
    PUBLISHED: 'PUBLISHED',
    DRAFT: 'DRAFT',
    TRASH: 'TRASH',
  });

  export const DefaultMode = Modes.CREATE;

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event, mode = DefaultMode) {
    const { parent } = event;
    await parent();

    let data = {
      post: {
        id: -1,
        title: '',
        text: '',
        category: -1,
        status: -1,
        date: 0,
        thumbnailUrl: '',
      },
      categoryCount: 0,
      categories: [],
      mode,
      error: {},
      hookProps: {},
    };

    if (mode === Modes.EDIT) {
      const id = parseInt(event.params.id) || -1;

      const postBody = await ApiUtil.get({
        path: `/api/panel/posts/${id}`,
        request: event,
      });

      if (postBody.error) {
        if (postBody.error === 'POST_NOT_FOUND') {
          throw error(404, postBody.error);
        }

        throw error(500, postBody.error);
      }

      postBody.id = id;

      data.post = postBody.post;
    }

    const categoriesBody = await ApiUtil.get({
      path: '/api/panel/post/categories',
      request: event,
    });

    data = { ...data, ...categoriesBody };

    data.hookProps['panel:post-editor:content:bottom'] = await executeHookLoad(
      'panel:post-editor:content:bottom',
      event,
    );

    return data;
  }
</script>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { base } from '$app/paths';
  import { goto } from '$app/navigation';

  import { UI_URL } from '$lib/variables';

  import {
    setCallback as setDeletePostModalCallback,
    show as showDeletePostModal,
  } from '$lib/components/modals/ConfirmDeletePostModal.svelte';

  import AddEditPostCategoryModal, {
    // show as showAddEditPostCategoryModal,
    setCallback as setCallbackForAddEditPostCategoryModal,
  } from '$lib/components/modals/AddEditPostCategoryModal.svelte';

  import { show as showDraftPostModal } from '$lib/components/modals/ConfirmDraftPostModal.svelte';

  import { show as showPublishPostModal } from '$lib/components/modals/ConfirmPublishPostModal.svelte';

  import Editor from '$lib/components/Editor.svelte';
  import DragAndDropZone from '$lib/components/DragAndDropZone.svelte';

  import {
    showSuccess as showSuccessToast,
    limitTitle,
  } from '$lib/components/ToastContainer.svelte';

  import Date from '$lib/components/Date.svelte';
  import Hook from '$lib/components/Hook.svelte';

  const { data = $bindable() } = $props();

  // Create a local reactive copy of data.post to fix Svelte 5 binding warnings
  let post = $state({ ...data.post });

  // Sync local post state back to data.post when it changes
  $effect(() => {
    data.post = $state.snapshot(post);
  });

  let isEditorEmpty = $state(true);
  let loading = $state(false);

  let thumbnail = $state();

  let isThumbnailSaved = $state();
  let isThumbnailRemoved = $state();

  let thumbnailInput = $state();
  let thumbnailFiles = $state(null);

  const pageTitle = getContext('pageTitle');
  const slots = getContext('layout-slots');
  Object.assign(slots, { left, right });

  pageTitle.set(
    data.mode === Modes.EDIT ? 'pages.post-editor.title-edit' : 'pages.post-editor.title-create',
  );

  function onThumbnailChange(event) {
    if (event.target.files && event.target.files.length > 0) {
      handleThumbnailFile(event.target.files[0]);
    }
  }

  function handleThumbnailFile(file) {
    if (!file) return;

    isThumbnailSaved = false;
    isThumbnailRemoved = false;
    thumbnailFiles = [file]; // Store as array for the FormData append in submit()

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      thumbnail = e.target.result;
    };
  }

  function getStatusByPostStatus(status) {
    return status === StatusTypes.TRASH
      ? 'pages.post-editor.trash'
      : status === StatusTypes.PUBLISHED
        ? 'pages.post-editor.published'
        : status === StatusTypes.DRAFT
          ? 'pages.post-editor.draft'
          : 'pages.post-editor.new';
  }

  function submit(publish) {
    showPublishPostModal(() => {
      loading = true;

      const bodyHandler = (body, reject) => {
        if (body.result === 'ok') {
          loading = false;

          if (data.mode === Modes.CREATE) {
            goto(base + '/posts/detail/' + body.id);
          }

          if (data.mode === Modes.EDIT && publish) {
            post.status = StatusTypes.PUBLISHED;
          }

          if (publish) {
            const title = limitTitle(post.title);

            showSuccessToast('components.toasts.post-published', {
              title,
            });
          } else {
            const title = limitTitle(post.title);

            showSuccessToast('components.toasts.post-saved', {
              title,
            });
          }

          isThumbnailSaved = true;
          isThumbnailRemoved = false;
          thumbnailFiles = null;

          return;
        } else if (body.result === 'error') {
          loading = false;

          data.error = body.error;

          return;
        }

        reject();
      };

      const body = new FormData();

      body.append('publish', publish);
      body.append('title', post.title);
      body.append('category', post.category);
      body.append('text', post.text);

      if (isThumbnailRemoved) {
        body.append('removeThumbnail', true);
      } else if (thumbnailFiles && thumbnailFiles[0]) {
        body.append('thumbnail', thumbnailFiles[0]);
      }

      if (post.id === -1) {
        ApiUtil.post({
          path: '/api/panel/post',
          body,
          handler: bodyHandler,
        });

        return;
      }

      ApiUtil.put({
        path: `/api/panel/posts/${post.id}`,
        body,
        handler: bodyHandler,
      });
    });
  }

  function onDraftClick() {
    showDraftPostModal(() => {
      loading = true;

      ApiUtil.put({
        path: `/api/panel/posts/${post.id}/status`,
        body: {
          to: 'DRAFT',
        },
        handler: async (body, reject) => {
          if (body.error) {
            reject();

            return;
          }

          loading = false;

          await goto(base + '/posts?pageType=DRAFT');

          const title = `<a href="${base}/posts?pageType=DRAFT" target="_blank">${limitTitle(post.title)}</a>`;

          await showSuccessToast('components.toasts.post-moved-to-draft', { title });
        },
      });
    });
  }

  function onRemoveThumbnailClick() {
    isThumbnailSaved = false;
    thumbnailFiles = null;
    thumbnail = null;
    isThumbnailRemoved = true;
    post.thumbnailUrl = null;
  }

  // function onCreateCategoryClick() {
  //   showAddEditPostCategoryModal("create");
  // }

  setCallbackForAddEditPostCategoryModal((routeFirstPage, category) => {
    ApiUtil.get({
      path: '/api/panel/post/categories',
      handler: (body, reject) => {
        if (body.error) {
          reject();

          return;
        }

        data.categories = body.categories;
        data.categoryCount = body.categoryCount;
        post.category = category.id;
      },
    });
  });

  setDeletePostModalCallback((deletedPost) => {
    if (deletedPost.status === StatusTypes.TRASH) {
      goto(base + '/posts');
    } else {
      goto(base + '/posts?pageType=TRASH');
    }
  });
</script>
