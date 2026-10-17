<form class="d-flex flex-column overflow-hidden" onsubmit={onSubmit}>
  <div class="modal-header">
    <h5 class="modal-title text-capitalize d-flex flex-wrap align-items-center gap-2">
      {title}
      {#if builtIn && customized}
        <span
          class="badge text-bg-primary fw-normal"
          aria-label="{$_('pages.mail-templates.customized')}: {$_(
            'pages.mail-templates.layout.customized-hint',
          )}"
          use:tooltip={[$_('pages.mail-templates.layout.customized-hint')]}>
          {$_('pages.mail-templates.customized')}
        </span>
      {/if}
    </h5>
    <div class="ms-auto d-flex align-items-center gap-1">
      {#if builtIn && customized}
        <button
          type="button"
          class="btn btn-link"
          title={$_('pages.mail-templates.reset.button')}
          aria-label={$_('pages.mail-templates.reset.button')}
          disabled={saving}
          onclick={onResetClick}>
          <i class="fas fa-rotate-left" aria-hidden="true"></i>
        </button>
      {/if}
      {#if deletable}
        <button
          type="button"
          class="btn btn-link link-danger"
          title={$_('pages.mail-templates.layout.delete')}
          aria-label={$_('pages.mail-templates.layout.delete')}
          disabled={saving}
          onclick={onDeleteClick}>
          <i class="fas fa-trash" aria-hidden="true"></i>
        </button>
      {/if}
    </div>
    <button
      type="button"
      class="btn-close ms-0"
      data-bs-dismiss="modal"
      aria-label={$_('buttons.close')}></button>
  </div>

  <div class="modal-body vstack gap-3">
    {#if !builtIn}
      <div class="row">
        <div class="col-12 col-md-6 col-lg-4">
          <input
            id="mail-layout-name"
            type="text"
            class="form-control"
            placeholder={$_('pages.mail-templates.layout.name-label')}
            aria-label={$_('pages.mail-templates.layout.name-label')}
            class:is-invalid={nameMissing || !!nameError}
            maxlength={NAME_MAX_LENGTH}
            bind:value={name} />
          {#if nameMissing || nameError}
            <div class="invalid-feedback d-block">
              {$_(
                nameError === 'TOO_LONG'
                  ? 'pages.mail-templates.layouts.errors.TOO_LONG'
                  : 'pages.mail-templates.layouts.errors.REQUIRED',
              )}
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <div class="row g-3">
      <div class="col-12 col-xl-7">
        <div class="card h-100">
          <div class="card-header py-3 d-flex align-items-center gap-2">
            <span class="flex-grow-1">{$_('pages.mail-templates.fields.html')}</span>
          </div>
          <div class="card-body">
            {#key editorVersion}
              <CodeEditor
                value={body}
                language={EditorLanguages.HTML}
                height="600px"
                label={$_('pages.mail-templates.fields.html')}
                invalid={missingContent || !!shownSyntax}
                onchange={onChange} />
            {/key}
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
            {#if missingContent}
              <div class="small text-danger mt-1">
                {$_('pages.mail-templates.field-errors.MISSING_CONTENT', {
                  values: { slot: LAYOUT_CONTENT_SLOT },
                })}
              </div>
            {/if}
          </div>
        </div>
      </div>
      <div class="col-12 col-xl-5">
        <div class="h-100">
          <MailPreview html={previewHtml} windowHref={layoutPreviewHref(base, layoutId)} />
        </div>
      </div>
    </div>
  </div>

  <div class="modal-footer">
    <button
      type="submit"
      class="btn btn-primary w-100"
      disabled={saving || !dirty || missingContent || !!syntax || nameMissing}>
      {#if saving}
        <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
      {/if}
      {$_('buttons.save')}
    </button>
  </div>
</form>

<script>
  import { untrack } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { beforeNavigate, goto } from '$app/navigation';
  import { base } from '@panomc/sdk/core/js/basePath.js';

  import ApiUtil from '$lib/api.util';
  import tooltip from '$lib/tooltip.util';
  import CodeEditor from '$lib/components/CodeEditor.svelte';
  import { show as showConfirm } from '$lib/components/modals/ConfirmActionModal.svelte';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';
  import { EditorLanguages } from '$lib/files.util.js';

  import { checkTemplateSyntax, minifyTemplate, prettifyTemplate } from './mail-template-source.js';
  import MailPreview from './MailPreview.svelte';
  import {
    createMailTemplatesApi,
    fieldErrorsOf,
    LAYOUT_CONTENT_SLOT,
    layoutSampleValues,
    renderLayoutSample,
  } from './mail-templates.api.js';
  import { layoutPreviewHref, layoutPreviewTarget, publishPreview } from './mail-preview-window.js';

  /** The longest name a custom layout may have (the backend's limit). */
  const NAME_MAX_LENGTH = 100;

  let { data, api = createMailTemplatesApi(ApiUtil), onchanged, onclose, registerDirty } = $props();

  // The loaded layout is copied in, and again only when a load brings another one (a retry after a
  // failed load); between those only a save or a reset replaces it.
  let body = $state('');
  let name = $state('');
  /** The saved name (custom layouts only). */
  let savedName = $state('');
  let customized = $state(false);
  /** @type {Array<{ owner: string, key: string, name?: string }>} */
  let usedBy = $state([]);
  /** @type {string} the backend's code for the name (`REQUIRED`, `TOO_LONG`) after a failed save */
  let nameError = $state('');
  /** The saved layout, minified: a layout that was only pretty-printed is not a change. */
  let savedKey = $state('');
  let editorVersion = $state(0);
  /** @type {any} */
  let loadedLayout;

  $effect.pre(() => {
    const layout = data.layout;

    if (layout === loadedLayout) return;

    loadedLayout = layout;
    untrack(() => {
      applyLayout(layout);
      editorVersion += 1;
    });
  });

  /**
   * Shows a layout as the backend answered it (load, save, reset).
   *
   * @param {any} layout
   */
  function applyLayout(layout) {
    body = prettifyTemplate(String(layout?.body ?? ''));
    savedKey = minifyTemplate(layout?.body ?? '');
    name = String(layout?.name ?? '');
    savedName = name;
    customized = !!layout?.customized;
    usedBy = layout?.usedBy ?? [];
    nameError = '';
  }

  const layoutId = $derived(String(data.layout?.id ?? ''));
  const builtIn = $derived(!!data.layout?.builtIn);
  const deletable = $derived(!!data.layout?.deletable);
  const title = $derived(savedName || layoutId);
  let saving = $state(false);
  let leaving = false;

  const missingContent = $derived(!body.includes(LAYOUT_CONTENT_SLOT));
  const nameMissing = $derived(!builtIn && !name.trim());
  const dirty = $derived(
    minifyTemplate(body) !== savedKey || (!builtIn && name.trim() !== savedName),
  );
  /** First syntax error of the layout: blocks saving at once, shown once typing pauses. */
  const syntax = $derived(checkTemplateSyntax(body));
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
  /** The site's logo and name, so the layout preview looks like a real mail. */
  const site = $derived({
    websiteLogo: data.layout?.websiteLogo ?? '',
    websiteName: data.layout?.websiteName ?? '',
  });
  const previewHtml = $derived(renderLayoutSample(body, layoutSampleValues($_, site)));

  // The preview window follows the unsaved layout (it renders it on its own, like this page).
  $effect(() => {
    const { owner, key, variant } = layoutPreviewTarget(layoutId);

    publishPreview(localStorage, owner, key, variant, { layout: body, site, title });
  });

  /** @param {string} value */
  function onChange(value) {
    body = value;
  }

  /** @param {SubmitEvent} event */
  function onSubmit(event) {
    event.preventDefault();

    if (!saving && dirty && !missingContent && !syntax && !nameMissing) onSaveClick();
  }

  async function onSaveClick() {
    saving = true;

    const saved = minifyTemplate(body);
    const result = await api.saveLayout(layoutId, saved, builtIn ? undefined : name.trim());

    saving = false;

    if (!result.ok) {
      const fields = fieldErrorsOf(result.error);

      nameError = fields.name?.code ?? '';
      showError(
        fields.body?.code === 'MISSING_CONTENT'
          ? 'pages.mail-templates.toasts.missing-content'
          : fields.body?.code === 'TEMPLATE_ERROR'
            ? 'pages.mail-templates.toasts.invalid'
            : fields.name
              ? 'pages.mail-templates.toasts.layout-name-invalid'
              : 'pages.mail-templates.toasts.failed',
        { slot: LAYOUT_CONTENT_SLOT },
      );

      return;
    }

    // The editor keeps the admin's formatting; only the saved state follows the answer.
    savedKey = saved;
    savedName = String(result.body?.name ?? name.trim());
    name = savedName;
    customized = !!result.body?.customized;
    usedBy = result.body?.usedBy ?? usedBy;
    nameError = '';
    onchanged?.();
    showSuccess('pages.mail-templates.toasts.layout-saved');
  }

  function onResetClick() {
    showConfirm(
      {
        title: 'pages.mail-templates.layout.reset-title',
        description: 'pages.mail-templates.layout.reset-description',
        confirmLabel: 'buttons.reset',
        variant: 'danger',
      },
      async () => {
        saving = true;

        const result = await api.deleteLayout(layoutId);

        saving = false;

        if (!result.ok) {
          showError('pages.mail-templates.toasts.failed');

          return;
        }

        applyLayout(
          typeof result.body?.body === 'string'
            ? result.body
            : { ...data.layout, body: data.layout?.default ?? '', customized: false },
        );
        editorVersion += 1;
        onchanged?.();
        showSuccess('pages.mail-templates.toasts.layout-reset');
      },
    );
  }

  function onDeleteClick() {
    showConfirm(
      {
        title: 'pages.mail-templates.layout.delete-title',
        description:
          usedBy.length > 0
            ? 'pages.mail-templates.layout.delete-description-used'
            : 'pages.mail-templates.layout.delete-description',
        confirmLabel: 'buttons.delete',
        variant: 'danger',
        items: usedBy.map((mail) => mail.name || mail.key),
      },
      async () => {
        saving = true;

        const result = await api.deleteLayout(layoutId);

        saving = false;

        if (!result.ok) {
          showError('pages.mail-templates.toasts.failed');

          return;
        }

        showSuccess('pages.mail-templates.toasts.layout-deleted');
        onchanged?.();
        onclose?.();
      },
      { name: title, count: usedBy.length },
    );
  }

  // The modal asks before it closes on unsaved changes.
  untrack(() => registerDirty?.(() => dirty));

  beforeNavigate((navigation) => {
    if (!dirty || leaving) return;

    navigation.cancel();

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
</script>
