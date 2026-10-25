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
  <!-- Where the post stands: the autosave while the editor holds changes the site does not show,
       otherwise when the post was saved last. -->
  {#if autosaveState !== AutosaveStates.IDLE || (mode === Modes.EDIT && lastSavedAt)}
    <span
      class="text-body-secondary small text-nowrap d-none d-md-inline me-2"
      class:text-danger={autosaveState === AutosaveStates.FAILED}
      aria-live="polite">
      {#if autosaveState === AutosaveStates.SAVING}
        {$_('pages.post-editor.autosave-saving')}
      {:else if autosaveState === AutosaveStates.FAILED}
        {$_('pages.post-editor.autosave-failed')}
      {:else if autosaveState === AutosaveStates.SAVED}
        {$_('pages.post-editor.autosave-saved', { values: { time: ago(autosavedAt, now) } })}
      {:else}
        {$_('pages.post-editor.last-edited', { values: { time: ago(lastSavedAt, now) } })}
      {/if}
    </span>
  {/if}
  {#if mode === Modes.EDIT}
    <button
      title={$_('buttons.remove')}
      aria-label={$_('buttons.remove')}
      class="btn btn-link"
      type="button"
      on:click={() => showDeletePostModal(post)}>
      <i class="fas fa-trash"></i>
    </button>
  {/if}
  {#if post.status !== StatusTypes.DRAFT && mode === Modes.EDIT}
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
  <!-- What is on screen now, saved or not: the draft goes to Pano for a short while and the
       theme renders it (a new post that was never saved can be looked at the same way). -->
  <button
    class="btn btn-link"
    type="button"
    aria-label={$_('buttons.view')}
    title={$_('buttons.view')}
    disabled={previewing}
    on:click={onPreviewClick}>
    {#if previewing}
      <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
    {:else}
      <i class="fas fa-eye"></i>
    {/if}
  </button>
  <!-- Saves without publishing: a new post becomes a draft, a draft stays one. No confirmation,
       nothing goes live. -->
  {#if mode === Modes.CREATE || post.status === StatusTypes.DRAFT}
    <button
      title={$_('pages.post-editor.save-draft')}
      aria-label={$_('pages.post-editor.save-draft')}
      class="btn btn-link"
      type="button"
      class:disabled={loading || isEditorEmpty || post.title.length === 0}
      on:click={() => submit(false)}>
      <i class="fas fa-file-pen"></i>
    </button>
  {/if}
  <!-- The asterisk says the editor holds changes the site does not show yet (autosaved or not). -->
  <button
    class="btn btn-secondary"
    type="button"
    title={isDirty ? $_('pages.post-editor.unsaved-changes') : undefined}
    class:disabled={loading || isEditorEmpty || post.title.length === 0}
    on:click={() => submit(true)}>
    <i class="fas fa-save"></i>
    <span class="d-lg-inline d-none ms-2">
      {post.status === StatusTypes.PUBLISHED
        ? $_('buttons.update')
        : $_('pages.post-editor.publish')}</span
    >{#if isDirty}<span class="ms-1" aria-hidden="true">*</span>{/if}
  </button>
  <Hook name="panel:post-editor:actions:right" {post} />
{/snippet}

<!-- Post & Post Options -->
<section class="row g-3">
  <!-- Post -->
  <div class="col-lg-9">
    <div class="card h-100 w-100">
      <div class="card-body d-flex flex-column gap-3">
        <input
          id="postTitle"
          class="form-control form-control-lg"
          type="text"
          placeholder={$_('pages.post-editor.inputs.title.placeholder')}
          bind:this={titleInput}
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
    <Hook name="panel:post-editor:sidebar:before" {post} />
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
              <div>{mode === Modes.CREATE ? '0' : post.views}</div>
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
    <Hook name="panel:post-editor:sidebar:after" {post} />
  </div>
</section>

<Hook name="panel:post-editor:content:bottom" {post} />

<AddEditPostCategoryModal />

<script module>
  import { errorCode } from '$lib/apiError.util.js';
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

  const AutosaveStates = Object.freeze({
    IDLE: 'idle',
    SAVING: 'saving',
    SAVED: 'saved',
    FAILED: 'failed',
  });

  /** How long the editor waits after the last keystroke before it autosaves. */
  const AUTOSAVE_DELAY_MS = 1500;

  /**
   * Every post category for the editor's select. The list endpoint is paged (`{ items, page }`), so the
   * pages are read one after another at the largest page size.
   *
   * @param {any} [request] the load event, so the server side sends the visitor's cookies
   * @returns {Promise<{ categories: any[], categoryCount: number }>}
   */
  export async function loadAllPostCategories(request) {
    const categories = [];
    let totalPages = 1;

    for (let page = 1; page <= totalPages; page++) {
      const body = await ApiUtil.get({
        path: `/panel/post/categories?page=${page}&pageSize=100`,
        request,
      });

      if (body.error || !Array.isArray(body.items)) break;

      categories.push(...body.items);
      totalPages = body.page?.totalPages ?? 1;
    }

    return { categories, categoryCount: categories.length };
  }

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
      autosave: null,
      error: {},
      hookProps: {},
    };

    if (mode === Modes.EDIT) {
      const id = parseInt(event.params.id) || -1;

      const postBody = await ApiUtil.get({
        path: `/panel/posts/${id}`,
        request: event,
      });

      if (postBody.error) {
        if (postBody.error?.code === 'POST_NOT_FOUND') {
          throw error(404, postBody.error?.code);
        }

        throw error(500, postBody.error?.code);
      }

      postBody.id = id;

      data.post = postBody.post;
      data.autosave = postBody.autosave ?? null;
    }

    data = { ...data, ...(await loadAllPostCategories(event)) };

    data.hookProps['panel:post-editor:content:bottom'] = await executeHookLoad(
      'panel:post-editor:content:bottom',
      event,
    );

    return data;
  }
</script>

<script>
  import { getContext, onDestroy, onMount, tick } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { formatDistanceToNowStrict } from 'date-fns';
  import * as dateLocales from 'date-fns/locale';

  import { currentLanguage } from '$lib/language.util.js';

  import { base } from '@panomc/sdk/core/js/basePath.js';
  import { beforeNavigate, goto, replaceState } from '$app/navigation';

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
  import { show as showConfirmActionModal } from '$lib/components/modals/ConfirmActionModal.svelte';

  import Editor, { normalizeHtml } from '$lib/components/Editor.svelte';
  import DragAndDropZone from '$lib/components/DragAndDropZone.svelte';

  import {
    showError as showErrorToast,
    showSuccess as showSuccessToast,
    limitTitle,
  } from '$lib/components/ToastContainer.svelte';

  import Date from '$lib/components/Date.svelte';
  import Hook from '$lib/components/Hook.svelte';

  const { data = $bindable() } = $props();

  // Create a local reactive copy of data.post to fix Svelte 5 binding warnings. Unsaved changes the
  // editor autosaved earlier are put back on top of the saved post.
  let post = $state({
    ...data.post,
    ...(data.autosave
      ? {
          title: data.autosave.title,
          text: data.autosave.text,
          category: data.autosave.category,
          ...(data.autosave.removeThumbnail ? { thumbnailUrl: null } : {}),
        }
      : {}),
  });

  /** The post as Pano has it (`data.post` follows the editor below), to go back to on a discard. */
  let savedPost = { ...data.post };

  /** Create until the first autosave (or save) makes the post; edit from then on. */
  let mode = $state(data.mode);

  // Sync local post state back to data.post when it changes
  $effect(() => {
    data.post = $state.snapshot(post);
  });

  let isEditorEmpty = $state(true);
  let loading = $state(false);
  let previewing = $state(false);

  /**
   * Opens the theme's preview of the post as it stands in the editor, without saving it. The tab is
   * opened at once (a tab opened after the request would be a blocked pop-up) and sent to the
   * preview when Pano has the draft; if that fails it is closed again and the error is said.
   */
  async function onPreviewClick() {
    if (previewing) {
      return;
    }

    const tab = window.open('', '_blank');

    previewing = true;

    const send = (withCover) =>
      ApiUtil.post({
        path: '/panel/posts/previews',
        body: {
          ...(post.id > 0 ? { id: post.id } : {}),
          title: post.title ?? '',
          text: post.text ?? '',
          categoryId: Number(post.category) || -1,
          thumbnailUrl: isThumbnailRemoved
            ? ''
            : withCover && thumbnail
              ? thumbnail
              : (post.thumbnailUrl ?? ''),
        },
        handler: (response) => response,
      }).catch(() => null);

    // A cover picked just now exists only in this browser (as a `data:` image). If it makes the
    // draft too large, the preview is still shown, with the saved cover instead.
    let body = await send(true);

    if ((!body || body.error) && thumbnail) {
      body = await send(false);
    }

    previewing = false;

    if (!body || body.error || !body.token) {
      tab?.close();

      await showErrorToast(
        body?.error?.code === 'NO_PERMISSION'
          ? 'errors.NO_PERMISSION'
          : 'pages.frontend.errors.UNKNOWN',
      );

      return;
    }

    const url = `${UI_URL === '/' ? '' : UI_URL}/preview/post/${body.token}`;

    if (tab) {
      tab.location.href = url;
    } else {
      window.open(url, '_blank');
    }
  }

  let titleInput = $state();

  onMount(async () => {
    // The title is where writing a post starts, so the caret waits there. The editor mounts its
    // own editable surface in the same pass, so this waits for the DOM to settle first.
    await tick();

    titleInput?.focus();
  });

  // A cover the autosave holds is shown like one picked just now.
  let thumbnail = $state(data.autosave?.thumbnailUrl || undefined);

  let isThumbnailSaved = $state();
  let isThumbnailRemoved = $state(!!data.autosave?.removeThumbnail);

  /** The cover differs from the saved one: picked or removed in the editor, autosaved or not. */
  let isCoverChanged = $state(!!(data.autosave?.thumbnailUrl || data.autosave?.removeThumbnail));
  /** A cover removal the autosave has not sent yet (a picked cover waits in `thumbnailFiles`). */
  let isCoverRemovalPending = $state(false);
  /** Counts cover picks and removals, so each one is autosaved. */
  let coverVersion = $state(0);

  // ---- Autosave -------------------------------------------------------------------------------

  /** The post as it is saved, to tell whether the editor differs from it. The text is compared the
   * way the editor writes it, which needs the browser, so it is filled in on mount. */
  let saved = $state({
    title: savedPost.title ?? '',
    text: null,
    category: Number(savedPost.category),
  });

  let hasServerAutosave = $state(!!data.autosave);
  let autosaveState = $state(data.autosave ? AutosaveStates.SAVED : AutosaveStates.IDLE);
  let autosavedAt = $state(data.autosave?.updatedAt ?? 0);

  /** Moves on every half minute, so "saved … ago" keeps up with the clock. */
  let now = $state(globalThis.Date.now()); // `Date` here is the component

  /** When the post was saved last. */
  let lastSavedAt = $state(data.post.date ?? 0);

  /** "5 minutes ago", or "just now" within the first minute. [current] keeps it moving. */
  function ago(time, current) {
    if (current - time < 60 * 1000) {
      return $_('pages.post-editor.just-now');
    }

    return formatDistanceToNowStrict(time, {
      addSuffix: true,
      locale: dateLocales[$currentLanguage.dateFnsCode],
    });
  }

  let autosaveTimer = null;
  /** @type {Promise<void> | null} */
  let autosaveRun = null;
  let isAutosaveQueued = false;
  /** What the last autosave sent, so a change that went back to it does not send again. */
  let lastAutosavedKey = '';

  function isEmptyHtml(html) {
    return !html || html.replace(/<p><\/p>/g, '').trim().length === 0;
  }

  const isDirty = $derived.by(() => {
    if (saved.text === null) {
      return hasServerAutosave;
    }

    const textChanged = !(
      (isEmptyHtml(post.text) && isEmptyHtml(saved.text)) ||
      post.text === saved.text
    );

    return (
      textChanged ||
      (post.title ?? '') !== saved.title ||
      Number(post.category) !== saved.category ||
      isCoverChanged
    );
  });

  const autosaveKey = $derived(
    JSON.stringify([
      post.title ?? '',
      post.text ?? '',
      Number(post.category),
      isCoverChanged,
      coverVersion,
    ]),
  );

  $effect(() => {
    const key = autosaveKey;

    if (saved.text === null || key === lastAutosavedKey) {
      return;
    }

    scheduleAutosave();
  });

  function scheduleAutosave() {
    clearTimeout(autosaveTimer);

    autosaveTimer = setTimeout(() => {
      autosaveTimer = null;

      autosave();
    }, AUTOSAVE_DELAY_MS);
  }

  /** Runs the waiting autosave now and waits for every autosave still on its way. */
  async function flushAutosave() {
    if (autosaveTimer) {
      clearTimeout(autosaveTimer);
      autosaveTimer = null;

      autosave();
    }

    while (autosaveRun) {
      await autosaveRun;
    }
  }

  function autosave() {
    if (autosaveRun) {
      isAutosaveQueued = true;

      return autosaveRun;
    }

    autosaveRun = runAutosave().finally(() => {
      autosaveRun = null;

      if (isAutosaveQueued) {
        isAutosaveQueued = false;

        autosave();
      }
    });

    return autosaveRun;
  }

  async function runAutosave() {
    if (loading) {
      return;
    }

    const key = autosaveKey;

    // Back to what is saved: the kept changes are not needed any more.
    if (!isDirty) {
      lastAutosavedKey = key;

      if (hasServerAutosave && post.id > 0) {
        autosaveState = AutosaveStates.SAVING;

        try {
          await ApiUtil.delete({ path: `/panel/posts/${post.id}/autosave` });

          hasServerAutosave = false;
          autosaveState = AutosaveStates.IDLE;
        } catch {
          autosaveState = AutosaveStates.FAILED;
        }
      }

      return;
    }

    // A new post is made (as a draft) once there is something in it.
    if (post.id === -1 && (post.title ?? '').length === 0 && isEditorEmpty) {
      return;
    }

    const files = thumbnailFiles;
    const removal = isCoverRemovalPending;

    const sentTitle = post.title ?? '';
    const sentCategory = Number(post.category);

    const body = new FormData();

    body.append('title', sentTitle);
    body.append('category', post.category);
    body.append('text', post.text ?? '');

    if (removal) {
      body.append('removeThumbnail', true);
    } else if (files && files[0]) {
      body.append('thumbnail', files[0]);
    }

    autosaveState = AutosaveStates.SAVING;

    let response;

    try {
      response =
        post.id === -1
          ? await ApiUtil.post({ path: '/panel/posts/autosave', body })
          : await ApiUtil.put({ path: `/panel/posts/${post.id}/autosave`, body });
    } catch {
      response = null;
    }

    if (!response || response.error) {
      autosaveState = AutosaveStates.FAILED;

      return;
    }

    lastAutosavedKey = key;
    hasServerAutosave = true;
    autosaveState = AutosaveStates.SAVED;
    autosavedAt = response.updatedAt;
    now = globalThis.Date.now();

    // Sent: the cover is now held by the autosave and is not uploaded again.
    if (thumbnailFiles === files) {
      thumbnailFiles = null;
    }

    if (removal) {
      isCoverRemovalPending = false;
    }

    if (post.id === -1) {
      becomeDraft(response.id, sentTitle, sentCategory);
    }
  }

  /** The first autosave made the post (a draft with the title and category): edit it from now on. */
  function becomeDraft(id, title, category) {
    post.id = id;
    post.status = StatusTypes.DRAFT;
    mode = Modes.EDIT;

    saved = { title, text: '', category };
    lastSavedAt = globalThis.Date.now();
    savedPost = { ...$state.snapshot(post), title, category, text: '', thumbnailUrl: '' };

    // Only a title (and category) so far: the draft holds all of it, so there is nothing unsaved to keep.
    if (!isDirty) {
      ApiUtil.delete({ path: `/panel/posts/${id}/autosave` })
        .then((response) => {
          if (!response?.error) {
            hasServerAutosave = false;
          }
        })
        .catch(() => {});
    }

    pageTitle.set('pages.post-editor.title-edit');

    // The address follows without loading the page again, so typing goes on undisturbed.
    replaceState(base + '/posts/detail/' + id, {});
  }

  /** Set right before the editor navigates away by itself (after a save, a move or a delete). */
  let isLeaveAllowed = false;

  beforeNavigate((navigation) => {
    // Changes the autosave already holds come back when the post is opened again: only what it has
    // not got yet (waiting, on its way, or failed) is worth asking about.
    const hasChangesNotAutosaved =
      !!autosaveTimer || !!autosaveRun || (autosaveState === AutosaveStates.FAILED && isDirty);

    // What waits for the autosave is sent right away, whatever happens next.
    if (autosaveTimer) {
      flushAutosave();
    }

    if (isLeaveAllowed || !hasChangesNotAutosaved) {
      return;
    }

    // Closing or reloading the tab: the browser asks by itself once the navigation is cancelled.
    navigation.cancel();

    if (navigation.type === 'leave' || !navigation.to) {
      return;
    }

    const to = navigation.to.url;

    showConfirmActionModal(
      {
        title: 'pages.post-editor.leave-unsaved.title',
        description: 'pages.post-editor.leave-unsaved.description',
        confirmLabel: 'pages.post-editor.leave-unsaved.confirm',
      },
      async () => {
        isLeaveAllowed = true;

        await flushAutosave();

        await goto(to);
      },
    );
  });

  onMount(() => {
    saved.text = normalizeHtml(savedPost.text ?? '');

    // What the editor opened with (the saved post or the kept changes) is not a change to send.
    lastAutosavedKey = autosaveKey;

    const clock = setInterval(() => (now = globalThis.Date.now()), 30 * 1000);

    return () => clearInterval(clock);
  });

  onDestroy(() => {
    clearTimeout(autosaveTimer);
  });

  let thumbnailInput = $state();
  let thumbnailFiles = $state(null);

  const pageTitle = getContext('pageTitle');
  const slots = getContext('layout-slots');
  Object.assign(slots, { left, right });

  pageTitle.set(
    mode === Modes.EDIT ? 'pages.post-editor.title-edit' : 'pages.post-editor.title-create',
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
    isCoverChanged = true;
    isCoverRemovalPending = false;
    coverVersion++;
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
    // Only publishing asks first; a draft save puts nothing on the site.
    const confirm = publish ? showPublishPostModal : (/** @type {() => void} */ run) => run();

    confirm(async () => {
      // An autosave on its way must not land after the save and bring the changes back.
      await flushAutosave();

      loading = true;

      const bodyHandler = (body, reject) => {
        if (!body.error) {
          loading = false;

          if (mode === Modes.CREATE) {
            isLeaveAllowed = true;

            goto(base + '/posts/detail/' + body.id);
          }

          if (mode === Modes.EDIT && publish) {
            post.status = StatusTypes.PUBLISHED;
          }

          // Saved: the editor matches the post now and the kept changes are gone.
          saved = {
            title: post.title ?? '',
            text: post.text ?? '',
            category: Number(post.category),
          };
          savedPost = { ...$state.snapshot(post) };
          isCoverChanged = false;
          isCoverRemovalPending = false;
          hasServerAutosave = false;
          lastSavedAt = globalThis.Date.now();
          autosaveState = AutosaveStates.IDLE;
          lastAutosavedKey = autosaveKey;

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
        } else if (body.error) {
          loading = false;

          data.error = errorCode(body);

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
          path: '/panel/post',
          body,
          handler: bodyHandler,
        });

        return;
      }

      ApiUtil.put({
        path: `/panel/posts/${post.id}`,
        body,
        handler: bodyHandler,
      });
    });
  }

  function onDraftClick() {
    showDraftPostModal(() => {
      loading = true;

      ApiUtil.put({
        path: `/panel/posts/${post.id}/status`,
        body: {
          to: 'DRAFT',
        },
        handler: async (body, reject) => {
          if (body.error) {
            reject();

            return;
          }

          loading = false;

          isLeaveAllowed = true;

          await goto(base + '/posts?pageType=DRAFT');

          await showSuccessToast('components.toasts.post-moved-to-draft', {
            title: limitTitle(post.title),
            href: `${base}/posts?pageType=DRAFT`,
          });
        },
      });
    });
  }

  function onRemoveThumbnailClick() {
    isThumbnailSaved = false;
    thumbnailFiles = null;
    thumbnail = null;
    isThumbnailRemoved = true;
    isCoverChanged = true;
    isCoverRemovalPending = true;
    coverVersion++;
    post.thumbnailUrl = null;
  }

  // function onCreateCategoryClick() {
  //   showAddEditPostCategoryModal("create");
  // }

  setCallbackForAddEditPostCategoryModal(async (routeFirstPage, category) => {
    const loaded = await loadAllPostCategories();

    data.categories = loaded.categories;
    data.categoryCount = loaded.categoryCount;
    post.category = category.id;
  });

  setDeletePostModalCallback((deletedPost) => {
    isLeaveAllowed = true;

    if (deletedPost.status === StatusTypes.TRASH) {
      goto(base + '/posts');
    } else {
      goto(base + '/posts?pageType=TRASH');
    }
  });
</script>
