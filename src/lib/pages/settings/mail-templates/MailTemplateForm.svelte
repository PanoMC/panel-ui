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
      <span class="ms-2">{$_('buttons.back')}</span>
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
      disabled={busy || !canSave || !!syntax}
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

<div>
  <h4 class="mb-1 d-flex flex-wrap align-items-center gap-2">
    {mail.name || mail.key}
    {#if mailCustomized}
      <span
        class="badge text-bg-primary fs-6 fw-normal"
        aria-label="{$_('pages.mail-templates.customized')}: {$_(
          'pages.mail-templates.customized-hint',
        )}"
        use:tooltip={[$_('pages.mail-templates.customized-hint')]}>
        {$_('pages.mail-templates.customized')}
      </span>
    {/if}
  </h4>
  {#if mail.description}
    <div class="text-body-secondary small">{mail.description}</div>
  {/if}
</div>

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
  <div class="col-12 col-md-6 col-lg-4">
    <label class="form-label" for="mail-template-layout">
      {$_('pages.mail-templates.layout-select.label')}
    </label>
    <select
      id="mail-template-layout"
      class="form-select"
      aria-describedby="mail-template-layout-hint"
      value={layoutChoice}
      onchange={(event) => onLayoutChange(event.currentTarget.value)}>
      <option value="">
        {$_('pages.mail-templates.layout-select.default', {
          values: { name: layoutName(layoutDefault) },
        })}
      </option>
      {#each layouts as item (item.id)}
        <option value={item.id}>{item.name || item.id}</option>
      {/each}
      <option value={NO_LAYOUT}>{$_('pages.mail-templates.layout-select.none')}</option>
    </select>
  </div>
</div>

<div id="mail-template-layout-hint" class="small text-body-secondary">
  {$_(
    template.mode === Modes.HTML
      ? 'pages.mail-templates.layout-select.hint-html'
      : 'pages.mail-templates.layout-select.hint',
  )}
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
        <HandlebarsHint />
        {#if template.mode === Modes.HTML}
          <div class="small text-body-secondary">{$_('pages.mail-templates.html-mode-hint')}</div>
        {/if}

        {@render textField('subject', 'input')}

        {#if template.mode === Modes.FIELDS}
          {@render textField('preheader', 'input')}

          <div>
            <span class="form-label d-block">{$_('pages.mail-templates.fields.body')}</span>
            {#key editorVersion}
              <CodeEditor
                bind:this={bodyEditor}
                value={bodies.FIELDS}
                language={EditorLanguages.HTML}
                label={$_('pages.mail-templates.fields.body')}
                invalid={!!fieldErrors.body || !!shownSyntax}
                onfocus={() => (focused = 'body')}
                onchange={(value) => setBody(Modes.FIELDS, value)} />
            {/key}
            {@render syntaxError()}
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
                invalid={!!fieldErrors.body || !!shownSyntax}
                onfocus={() => (focused = 'html')}
                onchange={(value) => setBody(Modes.HTML, value)} />
            {/key}
            {@render syntaxError()}
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
        error={preview.error}
        windowHref={previewWindowHref(base, owner, mailKey, variant)} />
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

{#snippet syntaxError()}
  {#if shownSyntax}
    <div class="small text-danger mt-1" role="alert">
      {$_('pages.mail-templates.syntax.at', {
        values: {
          line: shownSyntax.line,
          column: shownSyntax.column,
          message: $_(`pages.mail-templates.syntax.${shownSyntax.code}`, {
            values: shownSyntax.values ?? {},
          }),
        },
      })}
    </div>
  {/if}
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
  import tooltip from '$lib/tooltip.util';
  import CodeEditor from '$lib/components/CodeEditor.svelte';
  import PageActions from '$lib/components/PageActions.svelte';
  import { show as showConfirm } from '$lib/components/modals/ConfirmActionModal.svelte';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';
  import { EditorLanguages } from '$lib/files.util.js';

  import {
    createMailTemplatesApi,
    effectiveLayout,
    fieldErrorsOf,
    layoutRequestValue,
    layoutSelection,
    MAIN_LAYOUT,
    Modes,
    NO_LAYOUT,
    normalizeTemplate,
    variableToken,
  } from './mail-templates.api.js';
  import { checkTemplateSyntax, minifyTemplate, prettifyTemplate } from './mail-template-source.js';
  import HandlebarsHint from './HandlebarsHint.svelte';
  import MailPreview from './MailPreview.svelte';
  import { previewWindowHref, publishPreview, sampleVariables } from './mail-preview-window.js';
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
    layouts = [],
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
    layout: String(entry.layout ?? mail.layout ?? ''),
    layoutDefault: String(entry.layoutDefault ?? mail.layoutDefault ?? MAIN_LAYOUT),
  }));
  const { initial, fallback, layoutDefault } = loaded;
  const initialFieldsBody =
    initial.mode === Modes.FIELDS
      ? initial.body
      : fallback.mode === Modes.FIELDS
        ? fallback.body
        : '';

  let template = $state(initial);
  /**
   * The body of each mode, so a look at the other tab does not lose this one. Code views show it
   * pretty-printed; it is minified when saved.
   */
  let bodies = $state({
    FIELDS: prettifyTemplate(initialFieldsBody),
    HTML: initial.mode === Modes.HTML ? prettifyTemplate(initial.body) : '',
  });
  /**
   * The saved mail as one complete HTML template (the backend's `templateHtml`): what the advanced
   * tab starts from while the mail is saved in fields mode.
   */
  let savedHtml = untrack(() => String(entry.templateHtml ?? ''));
  /** Whether the advanced tab's HTML was edited in this session (else it follows `savedHtml`). */
  let htmlEdited = $state(initial.mode === Modes.HTML);
  /** The saved state: its mode and its content key (minified), for the unsaved-changes check. */
  let savedMode = $state(initial.mode);
  let savedKey = $state(contentKey(initial));
  let customized = $state(loaded.customized);
  let customizedLocales = $state([...loaded.customizedLocales]);
  /**
   * The layout select (`''` = the mail's default) and the saved choice. It is the whole mail's
   * (every variant and language), saved with the template's Save.
   */
  let layoutChoice = $state(layoutSelection(loaded.layout, layoutDefault));
  let savedLayoutChoice = $state(layoutSelection(loaded.layout, layoutDefault));
  let saving = $state(false);
  let testing = $state(false);
  let leaving = false;
  /** Bumped to re-create the editors after their content was replaced (reset). */
  let editorVersion = $state(0);
  /** @type {string} the field a picked variable goes to */
  let focused = $state('');
  /** @type {Record<string, { code: string, message: string }>} */
  let fieldErrors = $state({});
  let preview = $state({ subject: null, html: '', loading: false, error: '' });
  /**
   * The latest preview's `templateHtml` (its fields composed with its layout) and the request it
   * answered, so the advanced tab can start from the unsaved fields.
   */
  let composed = { request: '', html: '' };

  /** @type {Record<string, HTMLInputElement | HTMLTextAreaElement>} */
  const inputs = $state({});
  let bodyEditor = $state();
  let htmlEditor = $state();

  const busy = $derived(saving || testing);
  const variants = $derived(mail.variants ?? []);
  const variables = $derived(
    entry.variables ?? variants.find((item) => item.key === variant)?.variables ?? [],
  );
  const defaultLocale = $derived(entry.defaultLocale ?? '');
  const payload = $derived({ ...template, body: bodies[template.mode] });
  /**
   * What counts for unsaved changes: a look at the advanced tab whose HTML was only prefilled is not
   * a change, and neither is a body that was only pretty-printed.
   */
  const effective = $derived(
    template.mode === Modes.HTML && savedMode !== Modes.HTML && !htmlEdited
      ? { ...template, mode: savedMode, body: bodies.FIELDS }
      : payload,
  );
  const contentDirty = $derived(contentKey(effective) !== savedKey);
  const layoutDirty = $derived(layoutChoice !== savedLayoutChoice);

  /** Other variants of this mail with an edited language. */
  const otherVariantsCustomized = $derived(
    (mail.variants ?? []).some(
      (item) => item.key !== variant && (item.customizedLocales ?? []).length > 0,
    ),
  );

  /**
   * The title's badge: anything of this mail differs from Pano's — a language of any variant or the
   * chosen layout. Which languages are edited shows in the language select.
   */
  const mailCustomized = $derived(
    otherVariantsCustomized || customizedLocales.length > 0 || savedLayoutChoice !== '',
  );
  const dirty = $derived(contentDirty || layoutDirty);
  /** The layout the mail renders with (the select's choice, or the mail's default). */
  const layout = $derived(effectiveLayout(layoutChoice, layoutDefault));
  /** First syntax error of the body the code editor shows: blocks saving at once, shown once typing pauses. */
  const syntax = $derived(checkTemplateSyntax(bodies[template.mode]));
  let shownSyntax = $state(null);

  $effect(() => {
    const error = syntax;

    if (!error) {
      shownSyntax = null;

      return;
    }

    const timer = setTimeout(() => (shownSyntax = error), 400);

    return () => clearTimeout(timer);
  });

  /** Saving in another mode than the saved one is allowed even without an edit. */
  const canSave = $derived(dirty || template.mode !== savedMode);
  /** What the preview renders with; only the preview window lets them be changed. */
  const samples = $derived(sampleVariables(variables));

  /** @param {string} id a layout id or `none` */
  function layoutName(id) {
    if (id === NO_LAYOUT) return get(_)('pages.mail-templates.layout-select.none');

    return layouts.find((item) => item.id === id)?.name || id;
  }

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
   * The comparable form of a template: every field, the body minified.
   *
   * @param {Record<string, string>} value
   */
  function contentKey(value) {
    const normalized = normalizeTemplate(value);

    return JSON.stringify({ ...normalized, body: minifyTemplate(normalized.body) });
  }

  /** @param {Record<string, string>} value the template as it is sent: its body minified */
  function minified(value) {
    return { ...value, body: minifyTemplate(value.body) };
  }

  /**
   * @param {string} field
   * @param {string} value
   */
  function setField(field, value) {
    template[field] = value;
  }

  /**
   * @param {string} mode
   * @param {string} value
   */
  function setBody(mode, value) {
    if (bodies[mode] === value) return;

    bodies[mode] = value;

    if (mode === Modes.HTML) htmlEdited = true;
  }

  /** @param {string} mode */
  function setMode(mode) {
    if (template.mode === mode) return;

    template.mode = mode;
    focused = '';

    // The advanced tab starts from the whole unsaved mail (layout + fields) until its HTML is
    // edited. Going back to the fields keeps them as they were.
    if (mode === Modes.HTML && !htmlEdited) prefillHtml(fieldsPreviewRequest());
  }

  /**
   * Fills the advanced tab with the fields composed with the chosen layout: the latest preview's
   * when it answered these fields, else a fresh one (the saved mail's HTML meanwhile).
   *
   * @param {Record<string, any>} fieldsRequest a preview request in fields mode
   */
  async function prefillHtml(fieldsRequest) {
    const key = JSON.stringify(fieldsRequest);

    if (composed.request === key && composed.html) {
      setPrefilledHtml(composed.html);

      return;
    }

    setPrefilledHtml(
      savedHtml ||
        `<!doctype html><html lang="{{locale}}"><head><meta charset="utf-8"><title>{{subject}}</title></head><body>${bodies.FIELDS}</body></html>`,
    );

    const result = await api.preview(fieldsRequest);

    if (!result.ok || typeof result.body.templateHtml !== 'string') return;

    composed = { request: key, html: result.body.templateHtml };

    // The admin may have edited the HTML or gone back to the fields while it loaded.
    if (template.mode === Modes.HTML && !htmlEdited) setPrefilledHtml(result.body.templateHtml);
  }

  /** @param {string} html */
  function setPrefilledHtml(html) {
    bodies.HTML = prettifyTemplate(html);
    editorVersion += 1;
  }

  /** @param {string} value the layout select's value */
  function onLayoutChange(value) {
    layoutChoice = value;

    // An advanced tab that only shows the prefilled HTML follows the new layout.
    if (template.mode === Modes.HTML && !htmlEdited) prefillHtml(fieldsPreviewRequest());
  }

  /** Re-reads the saved mail's complete HTML after a save, for the advanced tab's next look. */
  async function refreshSavedHtml() {
    const result = await api.get(owner, mailKey, variant, locale);

    if (result.ok && typeof result.body.templateHtml === 'string') {
      savedHtml = result.body.templateHtml;
    }
  }

  /** @param {{ name: string, type?: string }} variable */
  async function insertVariable(variable) {
    const target = focused || (template.mode === Modes.HTML ? 'html' : 'body');
    const token = variableToken(variable, { inline: target !== 'html' && target !== 'body' });

    if (target === 'html') {
      htmlEditor?.insert(token);

      return;
    }

    if (target === 'body') {
      bodyEditor?.insert(token);

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

  /** The preview request: the draft and the variables it renders with. */
  function previewRequest() {
    return { ...request(), variables: samples };
  }

  /** The preview request of the fields (whatever tab is open): what the advanced tab starts from. */
  function fieldsPreviewRequest() {
    return $state.snapshot({
      ...previewRequest(),
      template: minified({ ...template, mode: Modes.FIELDS, body: bodies.FIELDS }),
    });
  }

  function request() {
    return { owner, key: mailKey, variant, locale, layout, template: minified(payload) };
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
      if (body.template?.mode === Modes.FIELDS && typeof result.body.templateHtml === 'string') {
        composed = { request: JSON.stringify(body), html: result.body.templateHtml };
      }

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
    const body = $state.snapshot(previewRequest());

    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => renderPreview(body), PREVIEW_DELAY_MS);

    return () => clearTimeout(previewTimer);
  });

  // The preview window follows the unsaved mail at once (it debounces on its own).
  $effect(() => {
    publishPreview(localStorage, owner, mailKey, variant, {
      body: $state.snapshot(previewRequest()),
      title: mail.name || mail.key,
    });
  });

  async function onSaveClick() {
    saving = true;

    // The template only when it changed (or moves to the other mode), the layout only when it did.
    const saveTemplate = contentDirty || template.mode !== savedMode;
    const saved = minified($state.snapshot(payload));
    const result = saveTemplate ? await api.save(owner, mailKey, variant, locale, saved) : null;

    if (result && !result.ok) {
      saving = false;
      fieldErrors = fieldErrorsOf(result.error);
      showError(
        result.error.code === 'INVALID_FIELDS'
          ? 'pages.mail-templates.toasts.invalid'
          : errorKey(result.error.code),
      );

      return;
    }

    if (result) {
      fieldErrors = {};
      savedKey = contentKey(saved);
      savedMode = saved.mode;
      customized = true;

      if (saved.mode === Modes.HTML) htmlEdited = true;
      if (!customizedLocales.includes(locale)) customizedLocales.push(locale);
    }

    const choice = layoutChoice;
    const layoutResult = layoutDirty
      ? await api.setLayout(owner, mailKey, layoutRequestValue(choice))
      : null;

    saving = false;

    if (layoutResult && !layoutResult.ok) {
      showError(
        layoutResult.error.code === 'INVALID_FIELDS'
          ? 'pages.mail-templates.toasts.layout-missing'
          : errorKey(layoutResult.error.code),
      );

      return;
    }

    if (layoutResult) {
      savedLayoutChoice = layoutSelection(
        String(layoutResult.body.layout ?? effectiveLayout(choice, layoutDefault)),
        layoutDefault,
      );
      if (layoutChoice === choice) layoutChoice = savedLayoutChoice;
    }

    if (template.mode !== Modes.HTML || !htmlEdited) refreshSavedHtml();

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

        // The advanced tab stays open on the default's complete HTML; the fields show the default's.
        const tab = template.mode;
        const fieldsBody = fallback.mode === Modes.FIELDS ? fallback.body : bodies.FIELDS;

        savedHtml = String(entry.defaultHtml ?? '');
        bodies = {
          FIELDS: prettifyTemplate(fieldsBody),
          HTML: prettifyTemplate(fallback.mode === Modes.HTML ? fallback.body : savedHtml),
        };
        htmlEdited = fallback.mode === Modes.HTML;
        template = { ...fallback, mode: tab === Modes.HTML ? Modes.HTML : fallback.mode };
        savedMode = fallback.mode;
        savedKey = contentKey(fallback);
        customized = false;
        customizedLocales = customizedLocales.filter((code) => code !== locale);
        fieldErrors = {};
        focused = '';
        editorVersion += 1;

        // The default's HTML came with the layout the page loaded with; the chosen one may differ.
        if (tab === Modes.HTML && !htmlEdited) prefillHtml(fieldsPreviewRequest());
        refreshSavedHtml();

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
