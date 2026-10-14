<style>
  @media (min-width: 1200px) {
    .mail-preview-column {
      position: sticky;
      top: 1rem;
    }
  }
</style>

<PageActions>
  <div slot="left">
    <a href="{base}/settings/mail-templates" class="btn btn-link" role="button">
      <i class="fas fa-arrow-left" aria-hidden="true"></i>
      <span class="ms-2">{mail.name || mail.key}</span>
    </a>
  </div>
  <div slot="right" class="hstack gap-2">
    {#if customized}
      <button
        type="button"
        class="btn btn-link"
        title={$_('pages.mail-templates.reset.button')}
        aria-label={$_('pages.mail-templates.reset.button')}
        disabled={busy}
        onclick={onResetClick}>
        <i class="fas fa-rotate-left" aria-hidden="true"></i>
      </button>
    {/if}
    <button
      type="button"
      class="btn btn-link"
      title={$_('pages.mail-templates.send-test')}
      aria-label={$_('pages.mail-templates.send-test')}
      disabled={busy}
      onclick={onTestClick}>
      {#if testing}
        <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
      {:else}
        <i class="fas fa-paper-plane" aria-hidden="true"></i>
      {/if}
    </button>
    <button
      type="button"
      class="btn btn-secondary text-nowrap"
      disabled={busy || !dirty}
      onclick={onSaveClick}>
      {#if saving}
        <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
      {:else}
        <i class="fas fa-save" aria-hidden="true"></i>
      {/if}
      <span class="d-lg-inline d-none ms-2">{$_('buttons.save')}</span>
    </button>
  </div>
</PageActions>

<div class="row g-3 align-items-end">
  {#if variants.length > 1}
    <div class="col-12 col-md-6 col-lg-4">
      <label class="form-label" for="mail-template-variant">
        {$_('pages.mail-templates.variant')}
      </label>
      <select
        id="mail-template-variant"
        class="form-select"
        value={variant}
        onchange={(event) => switchTo(event, { variant: event.currentTarget.value })}>
        {#each variants as item (item.key)}
          <option value={item.key}>{item.name || item.key}</option>
        {/each}
      </select>
    </div>
  {/if}
  <div class="col-12 col-md-6 col-lg-4">
    <label class="form-label" for="mail-template-locale">
      {$_('pages.mail-templates.language')}
    </label>
    <select
      id="mail-template-locale"
      class="form-select"
      value={locale}
      onchange={(event) => switchTo(event, { locale: event.currentTarget.value })}>
      {#each locales as item (item.code)}
        <option value={item.code}>
          {item.name || item.code}{customizedLocales.includes(item.code)
            ? ` (${$_('pages.mail-templates.customized-short')})`
            : ''}
        </option>
      {/each}
    </select>
  </div>
  <div class="col-12 col-lg-auto">
    {#if customized}
      <span class="badge text-bg-primary">{$_('pages.mail-templates.customized')}</span>
    {:else}
      <span class="badge text-bg-secondary">{$_('pages.mail-templates.default')}</span>
    {/if}
  </div>
</div>

{#if defaultLocale && defaultLocale !== locale}
  <div class="alert alert-info d-flex align-items-center mb-0" role="status">
    <i class="fa-solid fa-circle-info me-3" aria-hidden="true"></i>
    <div class="flex-grow-1">
      {$_(
        customized
          ? 'pages.mail-templates.fallback-customized'
          : 'pages.mail-templates.fallback-default',
        { values: { language: localeName(locale), defaultLanguage: localeName(defaultLocale) } },
      )}
    </div>
  </div>
{/if}

<div class="row g-3">
  <div class="col-12 col-xl-7">
    <div class="card">
      <div class="card-header d-flex flex-wrap align-items-center gap-2">
        <ul class="nav nav-pills gap-1 flex-grow-1" role="tablist">
          {#each [Modes.FIELDS, Modes.HTML] as mode (mode)}
            <li class="nav-item" role="presentation">
              <button
                type="button"
                class="nav-link"
                class:active={template.mode === mode}
                role="tab"
                aria-selected={template.mode === mode}
                onclick={() => setMode(mode)}>
                {$_(
                  mode === Modes.FIELDS
                    ? 'pages.mail-templates.tabs.fields'
                    : 'pages.mail-templates.tabs.html',
                )}
              </button>
            </li>
          {/each}
        </ul>
        <VariableMenu {variables} onpick={insertVariable} />
      </div>
      <div class="card-body vstack gap-3">
        {#if template.mode === Modes.HTML}
          <div class="small text-body-secondary">{$_('pages.mail-templates.html-mode-hint')}</div>
        {/if}

        {@render textField('subject', 'input')}

        {#if template.mode === Modes.FIELDS}
          {@render textField('preheader', 'input')}

          <div>
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
              <span class="form-label mb-0">{$_('pages.mail-templates.fields.body')}</span>
              <div class="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  class:active={bodyView === 'visual'}
                  aria-pressed={bodyView === 'visual'}
                  disabled={bodyHasBlocks}
                  title={bodyHasBlocks
                    ? $_('pages.mail-templates.visual-disabled', {
                        values: { examples: '{{#if}}, {{#each}}' },
                      })
                    : ''}
                  onclick={() => (bodyView = 'visual')}>
                  {$_('pages.mail-templates.view.visual')}
                </button>
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  class:active={bodyView === 'source'}
                  aria-pressed={bodyView === 'source'}
                  onclick={() => (bodyView = 'source')}>
                  {$_('pages.mail-templates.view.source')}
                </button>
              </div>
            </div>
            {#key `${bodyView}|${editorVersion}`}
              {#if bodyView === 'visual'}
                <MailBodyEditor
                  bind:this={visualEditor}
                  value={bodies.FIELDS}
                  invalid={!!fieldErrors.body}
                  onfocus={() => (focused = 'body')}
                  onchange={(value) => setBody(Modes.FIELDS, value)} />
              {:else}
                <CodeEditor
                  bind:this={sourceEditor}
                  value={bodies.FIELDS}
                  language={EditorLanguages.HTML}
                  label={$_('pages.mail-templates.fields.body')}
                  invalid={!!fieldErrors.body}
                  onfocus={() => (focused = 'body')}
                  onchange={(value) => setBody(Modes.FIELDS, value)} />
              {/if}
            {/key}
            {@render fieldError('body')}
          </div>

          <div class="row g-3">
            <div class="col-12 col-md-5">{@render textField('buttonLabel', 'input')}</div>
            <div class="col-12 col-md-7">{@render textField('buttonUrl', 'input')}</div>
          </div>

          {@render textField('footer', 'textarea')}
        {:else}
          <div>
            <span class="form-label d-block">{$_('pages.mail-templates.fields.html')}</span>
            {#key editorVersion}
              <CodeEditor
                bind:this={htmlEditor}
                value={bodies.HTML}
                language={EditorLanguages.HTML}
                height="560px"
                label={$_('pages.mail-templates.fields.html')}
                invalid={!!fieldErrors.body}
                onfocus={() => (focused = 'html')}
                onchange={(value) => setBody(Modes.HTML, value)} />
            {/key}
            {@render fieldError('body')}
          </div>
        {/if}
      </div>
    </div>
  </div>

  <div class="col-12 col-xl-5">
    <div class="mail-preview-column">
      <MailPreview
        html={preview.html}
        subject={preview.subject}
        loading={preview.loading}
        error={preview.error} />
    </div>
  </div>
</div>

{#snippet textField(field, kind)}
  <div>
    <label class="form-label" for="mail-template-{field}">
      {$_(`pages.mail-templates.fields.${field}`)}
    </label>
    {#if kind === 'textarea'}
      <textarea
        id="mail-template-{field}"
        class="form-control"
        class:is-invalid={!!fieldErrors[field]}
        rows="2"
        bind:this={inputs[field]}
        value={template[field]}
        onfocus={() => (focused = field)}
        oninput={(event) => setField(field, event.currentTarget.value)}></textarea>
    {:else}
      <input
        id="mail-template-{field}"
        type="text"
        class="form-control"
        class:is-invalid={!!fieldErrors[field]}
        bind:this={inputs[field]}
        value={template[field]}
        onfocus={() => (focused = field)}
        oninput={(event) => setField(field, event.currentTarget.value)} />
    {/if}
    {@render fieldError(field)}
  </div>
{/snippet}

{#snippet fieldError(field)}
  {#if fieldErrors[field]}
    <div class="small text-danger mt-1">
      {$_(`pages.mail-templates.field-errors.${knownFieldError(fieldErrors[field].code)}`)}
      {#if fieldErrors[field].message}
        <code class="d-block text-danger text-wrap">{fieldErrors[field].message}</code>
      {/if}
    </div>
  {/if}
{/snippet}

<script>
  import { onMount, tick, untrack } from 'svelte';
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import { beforeNavigate, goto } from '$app/navigation';
  import { base } from '$app/paths';

  import ApiUtil from '$lib/api.util';
  import CodeEditor from '$lib/components/CodeEditor.svelte';
  import PageActions from '$lib/components/PageActions.svelte';
  import { show as showConfirm } from '$lib/components/modals/ConfirmActionModal.svelte';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';
  import { EditorLanguages } from '$lib/files.util.js';

  import {
    createMailTemplatesApi,
    fieldErrorsOf,
    hasBlockHelpers,
    Modes,
    normalizeTemplate,
    variableToken,
  } from './mail-templates.api.js';
  import MailBodyEditor from './MailBodyEditor.svelte';
  import MailPreview from './MailPreview.svelte';
  import VariableMenu from './VariableMenu.svelte';

  /** Error codes that have their own text under `errors.*`. */
  const KNOWN_ERRORS = [
    'MAIL_DISABLED',
    'PANO_MAIL_UNAVAILABLE',
    'CONNECT_REQUIRED',
    'NETWORK_ERROR',
  ];
  const FIELD_ERRORS = ['REQUIRED', 'TOO_LONG', 'TEMPLATE_ERROR'];
  const PREVIEW_DELAY_MS = 500;

  let {
    owner,
    mailKey,
    mail,
    variant,
    locale,
    locales,
    entry,
    api = createMailTemplatesApi(ApiUtil),
  } = $props();

  // Everything below starts from the loaded entry; the page re-creates this component for another
  // variant or language, so none of it follows later prop changes.
  const loaded = untrack(() => ({
    initial: normalizeTemplate(entry.template),
    fallback: normalizeTemplate(entry.default),
    customized: !!entry.customized,
    customizedLocales:
      (mail.variants ?? []).find((item) => item.key === variant)?.customizedLocales ?? [],
  }));
  const { initial, fallback } = loaded;
  const initialFieldsBody =
    initial.mode === Modes.FIELDS
      ? initial.body
      : fallback.mode === Modes.FIELDS
        ? fallback.body
        : '';

  let template = $state(initial);
  /** The body of each mode, so a look at the other tab does not lose this one. */
  let bodies = $state({
    FIELDS: initialFieldsBody,
    HTML: initial.mode === Modes.HTML ? initial.body : '',
  });
  let customized = $state(loaded.customized);
  let customizedLocales = $state([...loaded.customizedLocales]);
  let dirty = $state(false);
  let saving = $state(false);
  let testing = $state(false);
  let leaving = false;
  /** Bumped to re-create the editors after their content was replaced (reset). */
  let editorVersion = $state(0);
  let bodyView = $state(hasBlockHelpers(initialFieldsBody) ? 'source' : 'visual');
  /** @type {string} the field a picked variable goes to */
  let focused = $state('');
  /** @type {Record<string, { code: string, message: string }>} */
  let fieldErrors = $state({});
  let preview = $state({ subject: null, html: '', loading: false, error: '' });

  /** @type {Record<string, HTMLInputElement | HTMLTextAreaElement>} */
  const inputs = {};
  let visualEditor = $state();
  let sourceEditor = $state();
  let htmlEditor = $state();

  const busy = $derived(saving || testing);
  const variants = $derived(mail.variants ?? []);
  const variables = $derived(
    entry.variables ?? variants.find((item) => item.key === variant)?.variables ?? [],
  );
  const defaultLocale = $derived(entry.defaultLocale ?? '');
  const bodyHasBlocks = $derived(hasBlockHelpers(bodies.FIELDS));
  const payload = $derived({ ...template, body: bodies[template.mode] });

  /** @param {string} code */
  function localeName(code) {
    return locales.find((item) => item.code === code)?.name || code;
  }

  /** @param {string} code */
  function knownFieldError(code) {
    return FIELD_ERRORS.includes(code) ? code : 'INVALID';
  }

  /** @param {string} code */
  function errorKey(code) {
    return KNOWN_ERRORS.includes(code) ? `errors.${code}` : 'pages.mail-templates.toasts.failed';
  }

  /**
   * @param {string} field
   * @param {string} value
   */
  function setField(field, value) {
    template[field] = value;
    dirty = true;
  }

  /**
   * @param {string} mode
   * @param {string} value
   */
  function setBody(mode, value) {
    bodies[mode] = value;
    dirty = true;
  }

  /** @param {string} mode */
  function setMode(mode) {
    if (template.mode === mode) return;

    template.mode = mode;
    focused = '';
    dirty = true;

    // A first look at the advanced tab starts from the fields' body in a bare document.
    if (mode === Modes.HTML && !bodies.HTML.trim()) {
      bodies.HTML = `<!doctype html>\n<html lang="{{locale}}">\n<head>\n<meta charset="utf-8">\n<title>{{websiteName}}</title>\n</head>\n<body>\n${bodies.FIELDS}\n</body>\n</html>\n`;
    }
  }

  /** @param {{ name: string, type?: string }} variable */
  async function insertVariable(variable) {
    const token = variableToken(variable);
    const target = focused || (template.mode === Modes.HTML ? 'html' : 'body');

    if (target === 'html') {
      htmlEditor?.insert(token);

      return;
    }

    if (target === 'body') {
      (bodyView === 'visual' ? visualEditor : sourceEditor)?.insert(token);

      return;
    }

    const element = inputs[target];
    const value = template[target] ?? '';
    const start = element?.selectionStart ?? value.length;
    const end = element?.selectionEnd ?? start;

    setField(target, value.slice(0, start) + token + value.slice(end));

    await tick();

    if (element) {
      element.focus();
      element.setSelectionRange(start + token.length, start + token.length);
    }
  }

  /**
   * Opens another variant or language. The select shows the current one until the page actually
   * moves, since the unsaved-changes guard may hold it.
   *
   * @param {Event & { currentTarget: HTMLSelectElement }} event
   * @param {{ variant?: string, locale?: string }} next
   */
  function switchTo(event, next) {
    const select = event.currentTarget;
    const params = new URLSearchParams({
      variant: next.variant ?? variant,
      locale: next.locale ?? locale,
    });

    select.value = next.variant ? variant : locale;
    goto(`?${params}`, { noScroll: true, keepFocus: true });
  }

  function request() {
    return { owner, key: mailKey, variant, locale, template: payload };
  }

  // Live preview: the unsaved content, rendered by the backend half a second after the last edit.
  let previewTimer;
  let previewSequence = 0;

  async function renderPreview(body) {
    const sequence = ++previewSequence;

    preview.loading = true;

    const result = await api.preview(body);

    if (sequence !== previewSequence) return;

    preview.loading = false;

    if (result.ok) {
      preview.subject = String(result.body.subject ?? '');
      preview.html = String(result.body.html ?? '');
      preview.error = '';
      fieldErrors = {};

      return;
    }

    fieldErrors = fieldErrorsOf(result.error);
    preview.error =
      result.error.code === 'INVALID_FIELDS'
        ? get(_)('pages.mail-templates.preview.invalid')
        : get(_)(errorKey(result.error.code));
  }

  $effect(() => {
    const body = $state.snapshot(request());

    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => renderPreview(body), PREVIEW_DELAY_MS);

    return () => clearTimeout(previewTimer);
  });

  async function onSaveClick() {
    saving = true;

    const result = await api.save(owner, mailKey, variant, locale, $state.snapshot(payload));

    saving = false;

    if (!result.ok) {
      fieldErrors = fieldErrorsOf(result.error);
      showError(
        result.error.code === 'INVALID_FIELDS'
          ? 'pages.mail-templates.toasts.invalid'
          : errorKey(result.error.code),
      );

      return;
    }

    fieldErrors = {};
    dirty = false;
    customized = true;

    if (!customizedLocales.includes(locale)) customizedLocales.push(locale);

    showSuccess('pages.mail-templates.toasts.saved');
  }

  async function onTestClick() {
    testing = true;

    const result = await api.test($state.snapshot(request()));

    testing = false;

    if (!result.ok) {
      fieldErrors = fieldErrorsOf(result.error);
      showError(
        result.error.code === 'INVALID_FIELDS'
          ? 'pages.mail-templates.toasts.invalid'
          : errorKey(result.error.code),
      );

      return;
    }

    showSuccess('pages.mail-templates.toasts.test-sent');
  }

  function onResetClick() {
    showConfirm(
      {
        title: 'pages.mail-templates.reset.title',
        description: 'pages.mail-templates.reset.description',
        confirmLabel: 'buttons.reset',
        variant: 'danger',
      },
      async () => {
        saving = true;

        const result = await api.reset(owner, mailKey, variant, locale);

        saving = false;

        if (!result.ok) {
          showError(errorKey(result.error.code));

          return;
        }

        template = { ...fallback };
        bodies = {
          FIELDS: fallback.mode === Modes.FIELDS ? fallback.body : bodies.FIELDS,
          HTML: fallback.mode === Modes.HTML ? fallback.body : '',
        };
        bodyView = hasBlockHelpers(bodies.FIELDS) ? 'source' : 'visual';
        customized = false;
        customizedLocales = customizedLocales.filter((code) => code !== locale);
        fieldErrors = {};
        focused = '';
        dirty = false;
        editorVersion += 1;

        showSuccess('pages.mail-templates.toasts.reset');
      },
      { language: localeName(locale) },
    );
  }

  // Unsaved changes: ask before leaving, switching variant or switching language.
  beforeNavigate((navigation) => {
    if (!dirty || leaving) return;

    navigation.cancel();

    // Closing the tab or leaving the site: the browser asks on its own.
    if (navigation.type === 'leave' || !navigation.to) return;

    const target = navigation.to.url;

    showConfirm(
      {
        title: 'pages.mail-templates.unsaved.title',
        description: 'pages.mail-templates.unsaved.description',
        confirmLabel: 'buttons.discard',
        variant: 'danger',
      },
      () => {
        leaving = true;

        if (target.origin !== window.location.origin) {
          window.location.href = target.href;

          return;
        }

        goto(target.pathname + target.search + target.hash);
      },
    );
  });

  onMount(() => () => clearTimeout(previewTimer));
</script>
