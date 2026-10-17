<!--
  `/panel/mail-templates/preview?owner=&key=&variant=`: the mail template editor's preview in its own
  window. It shows the editor's unsaved draft (published to localStorage, followed live) at a device
  width, with test data of its own (JSON, never saved). Mails render through
  `POST /panel/mail-templates/preview`; a layout (`?layout=<id>`) renders here, like its editor does,
  and has no data panel.
-->
<div class="d-flex flex-column flex-grow-1 w-100 bg-body-tertiary" style="min-height: 0;">
  <div class="d-flex flex-wrap align-items-center gap-2 px-3 py-2 border-bottom bg-body">
    <div class="me-auto" style="min-width: 0;">
      <div class="fw-semibold text-truncate">{title}</div>
      <div class="small text-body-secondary text-truncate">
        {$_('pages.mail-templates.fields.subject')}:
        <span class="text-body">{subject || '—'}</span>
        {#if locale}
          <span class="ms-1">· {locale}</span>
        {/if}
      </div>
    </div>

    <div
      class="btn-group btn-group-sm"
      role="group"
      aria-label={$_('pages.mail-templates.window.width')}>
      {#each PREVIEW_WIDTHS as option (option.id)}
        <button
          type="button"
          class="btn btn-outline-primary text-capitalize"
          class:active={width === option.id}
          aria-pressed={width === option.id}
          title={$_(`pages.mail-templates.window.widths.${option.id}`)}
          aria-label={$_(`pages.mail-templates.window.widths.${option.id}`)}
          onclick={() => (width = option.id)}>
          <i class="fa-solid {option.icon} fa-fw" aria-hidden="true"></i>
          <span class="d-none d-md-inline ms-1">
            {option.width ? `${option.width}px` : $_('pages.mail-templates.window.widths.full')}
          </span>
        </button>
      {/each}
    </div>

    {#if !layout}
      <button
        type="button"
        class="btn btn-sm text-capitalize"
        class:btn-primary={showData}
        class:btn-outline-primary={!showData}
        aria-pressed={showData}
        onclick={() => (showData = !showData)}>
        <i class="fa-solid fa-code me-1" aria-hidden="true"></i>
        {$_('pages.mail-templates.window.data')}
      </button>
    {/if}
    {#if loading}
      <span class="spinner-border spinner-border-sm text-primary" role="status"></span>
    {/if}
  </div>

  {#if error}
    <div class="alert alert-danger d-flex align-items-start rounded-0 mb-0" role="alert">
      <i class="fa-solid fa-circle-exclamation me-3 mt-1" aria-hidden="true"></i>
      <div>{error}</div>
    </div>
  {/if}

  <div class="d-flex flex-grow-1" style="min-height: 0;">
    <div class="flex-grow-1 overflow-auto p-3 d-flex justify-content-center">
      {#if !draft}
        <div class="text-body-secondary small align-self-center text-center">
          {$_('pages.mail-templates.window.no-draft')}
        </div>
      {:else}
        <iframe
          class="bg-white border rounded shadow-sm h-100"
          style="width: {frameWidth}; max-width: 100%; min-height: 600px;"
          class:opacity-50={!!error || loading}
          title={$_('pages.mail-templates.preview.title')}
          sandbox=""
          referrerpolicy="no-referrer"
          srcdoc={html}></iframe>
      {/if}
    </div>

    {#if showData && !layout}
      <div
        class="border-start bg-body p-3 d-flex flex-column gap-2"
        style="width: 380px; max-width: 45vw;">
        <div class="small text-body-secondary">
          {$_('pages.mail-templates.window.data-hint')}
        </div>
        <textarea
          class="form-control font-monospace small flex-grow-1"
          class:is-invalid={dataInvalid}
          spellcheck="false"
          aria-label={$_('pages.mail-templates.window.data')}
          bind:value={dataText}></textarea>
        {#if dataInvalid}
          <div class="invalid-feedback d-block">
            {$_('pages.mail-templates.window.data-invalid')}
          </div>
        {/if}
        <button
          type="button"
          class="btn btn-sm btn-primary text-capitalize w-100"
          onclick={() => (dataText = editorDataText)}>
          {$_('pages.mail-templates.window.data-from-editor')}
        </button>
      </div>
    {/if}
  </div>
</div>

<script module>
  /**
   * The mail from `?owner=&key=&variant=`, or the layout from `?layout=`. The permission is checked
   * by the `(preview)` layout.
   *
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    await event.parent();

    const params = event.url.searchParams;

    return {
      owner: params.get('owner') ?? '',
      mailKey: params.get('key') ?? '',
      variant: params.get('variant') ?? '',
      layoutId: params.get('layout') ?? '',
    };
  }
</script>

<script>
  import { getContext, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import ApiUtil from '$lib/api.util';

  import {
    createMailTemplatesApi,
    layoutSampleValues,
    renderLayoutSample,
  } from './mail-templates.api.js';
  import {
    isDataObject,
    layoutPreviewTarget,
    PREVIEW_WIDTHS,
    previewKey,
    readPreview,
    windowBody,
  } from './mail-preview-window.js';

  const PREVIEW_DELAY_MS = 300;

  let { data, api = createMailTemplatesApi(ApiUtil) } = $props();

  const pageTitle = getContext('pageTitle');

  pageTitle?.set('pages.mail-templates.window.title');

  /** The editor's draft (`{ body, title }` or `{ layout, title }`), kept up to date from localStorage. */
  let draft = $state(null);
  let width = $state('desktop');
  let showData = $state(false);
  /** The window's own test data (JSON); null until the editor's arrives. */
  let dataText = $state(null);
  let rendered = $state({ subject: '', html: '' });
  let loading = $state(false);
  let error = $state('');

  const layout = $derived(!!data.layoutId);
  const title = $derived(draft?.title || data.mailKey || data.layoutId);
  const locale = $derived(layout ? '' : (draft?.body?.locale ?? ''));
  const layoutSamples = $derived(layoutSampleValues($_, draft?.site));
  const html = $derived(
    layout ? renderLayoutSample(String(draft?.layout ?? ''), layoutSamples) : rendered.html,
  );
  const subject = $derived(layout ? layoutSamples.subject : rendered.subject);
  const editorDataText = $derived(JSON.stringify(draft?.body?.variables ?? {}, null, 2));
  const dataInvalid = $derived(dataText != null && !isDataObject(dataText));
  const body = $derived(layout ? null : windowBody(draft?.body ?? null, dataText));
  const frameWidth = $derived.by(() => {
    const option = PREVIEW_WIDTHS.find((item) => item.id === width);

    return option?.width ? `${option.width}px` : '100%';
  });

  // The editor's data is the window's starting point, and it follows the editor until the window's
  // own is edited.
  let dataEdited = false;

  $effect(() => {
    const text = editorDataText;

    if (!dataEdited) dataText = text;
  });

  $effect(() => {
    if (dataText != null && dataText !== editorDataText) dataEdited = true;
  });

  onMount(() => {
    const {
      owner,
      key: mailKey,
      variant,
    } = data.layoutId
      ? layoutPreviewTarget(data.layoutId)
      : { owner: data.owner, key: data.mailKey, variant: data.variant };
    const key = previewKey(owner, mailKey, variant);

    draft = readPreview(localStorage, owner, mailKey, variant);

    /** @param {StorageEvent} event */
    const onStorage = (event) => {
      if (event.key === key) draft = readPreview(localStorage, owner, mailKey, variant);
    };

    window.addEventListener('storage', onStorage);

    return () => window.removeEventListener('storage', onStorage);
  });

  let sequence = 0;

  async function renderPreview(request) {
    const current = ++sequence;

    loading = true;

    const result = await api.preview(request);

    if (current !== sequence) return;

    loading = false;

    if (result.ok) {
      rendered = {
        subject: String(result.body.subject ?? ''),
        html: String(result.body.html ?? ''),
      };
      error = '';

      return;
    }

    const code = result.error.code;

    error = get(_)(
      code === 'INVALID_FIELDS'
        ? 'pages.mail-templates.preview.invalid'
        : code === 'NETWORK_ERROR'
          ? 'errors.NETWORK_ERROR'
          : 'pages.mail-templates.toasts.failed',
    );
  }

  $effect(() => {
    const request = body;

    if (!request) return;

    const timer = setTimeout(() => renderPreview(request), PREVIEW_DELAY_MS);

    return () => clearTimeout(timer);
  });
</script>
