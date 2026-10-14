<style>
  @media (min-width: 1200px) {
    .mail-preview-column {
      position: sticky;
      top: 1rem;
    }
  }
</style>

<div class="vstack gap-3">
  {#if data.failed}
    <div class="alert alert-danger d-flex align-items-center mb-0" role="alert">
      <i class="fa-solid fa-circle-exclamation me-3" aria-hidden="true"></i>
      <div class="flex-grow-1">{$_('pages.mail-templates.load-failed')}</div>
      <button
        type="button"
        title={$_('buttons.try-again')}
        aria-label={$_('buttons.try-again')}
        class="btn alert-btn ms-3"
        onclick={() => invalidateAll()}>
        <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>
      </button>
    </div>
  {:else}
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
            disabled={saving}
            onclick={onResetClick}>
            <i class="fas fa-rotate-left" aria-hidden="true"></i>
          </button>
        {/if}
        <button
          type="button"
          class="btn btn-secondary text-nowrap"
          disabled={saving || !dirty || missingContent}
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

    <h4 class="mb-0">{$_('pages.mail-templates.layout.name')}</h4>

    <div class="small text-body-secondary">
      {$_('pages.mail-templates.layout.hint', { values: { slot: LAYOUT_CONTENT_SLOT } })}
    </div>

    <div class="row g-3">
      <div class="col-12 col-xl-7">
        <div class="card">
          <div class="card-header py-3 d-flex align-items-center gap-2">
            <span class="flex-grow-1">{$_('pages.mail-templates.fields.html')}</span>
            {#if customized}
              <span class="badge text-bg-primary">{$_('pages.mail-templates.customized')}</span>
            {:else}
              <span class="badge text-bg-secondary">{$_('pages.mail-templates.default')}</span>
            {/if}
          </div>
          <div class="card-body">
            {#key editorVersion}
              <CodeEditor
                value={body}
                language={EditorLanguages.HTML}
                height="600px"
                label={$_('pages.mail-templates.fields.html')}
                invalid={missingContent}
                onchange={onChange} />
            {/key}
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
        <div class="mail-preview-column">
          <MailPreview
            html={previewHtml}
            windowHref={previewWindowHref(
              base,
              LAYOUT_PREVIEW.owner,
              LAYOUT_PREVIEW.key,
              LAYOUT_PREVIEW.variant,
            )} />
        </div>
      </div>
    </div>
  {/if}
</div>

<script module>
  import ApiUtil from '$lib/api.util';

  import { createMailTemplatesApi } from './mail-templates.api.js';

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    await event.parent();

    const result = await createMailTemplatesApi(ApiUtil, event).getLayout();

    return result.ok ? { failed: false, layout: result.body } : { failed: true };
  }
</script>

<script>
  import { untrack } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { beforeNavigate, goto, invalidateAll } from '$app/navigation';
  import { base } from '$app/paths';

  import CodeEditor from '$lib/components/CodeEditor.svelte';
  import PageActions from '$lib/components/PageActions.svelte';
  import { show as showConfirm } from '$lib/components/modals/ConfirmActionModal.svelte';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';
  import { EditorLanguages } from '$lib/files.util.js';

  import MailPreview from './MailPreview.svelte';
  import {
    LAYOUT_CONTENT_SLOT,
    layoutSampleValues,
    renderLayoutSample,
  } from './mail-templates.api.js';
  import { LAYOUT_PREVIEW, previewWindowHref, publishPreview } from './mail-preview-window.js';

  let { data, api = createMailTemplatesApi(ApiUtil) } = $props();

  // The loaded layout is copied in, and again only when a load brings another one (a retry after a
  // failed load); between those only a save or a reset replaces it.
  let body = $state('');
  let customized = $state(false);
  let dirty = $state(false);
  let editorVersion = $state(0);
  /** @type {any} */
  let loadedLayout;

  $effect.pre(() => {
    const layout = data.layout;

    if (layout === loadedLayout) return;

    loadedLayout = layout;
    body = String(layout?.body ?? '');
    customized = !!layout?.customized;
    dirty = false;
    untrack(() => (editorVersion += 1));
  });
  let saving = $state(false);
  let leaving = false;

  const missingContent = $derived(!body.includes(LAYOUT_CONTENT_SLOT));
  const previewHtml = $derived(renderLayoutSample(body, layoutSampleValues($_)));

  // The preview window follows the unsaved layout (it renders it on its own, like this page).
  $effect(() => {
    publishPreview(localStorage, LAYOUT_PREVIEW.owner, LAYOUT_PREVIEW.key, LAYOUT_PREVIEW.variant, {
      layout: body,
      title: $_('pages.mail-templates.layout.name'),
    });
  });

  /** @param {string} value */
  function onChange(value) {
    body = value;
    dirty = true;
  }

  async function onSaveClick() {
    saving = true;

    const result = await api.saveLayout(body);

    saving = false;

    if (!result.ok) {
      showError(
        result.error.fields?.body === 'MISSING_CONTENT'
          ? 'pages.mail-templates.toasts.missing-content'
          : 'pages.mail-templates.toasts.failed',
        { slot: LAYOUT_CONTENT_SLOT },
      );

      return;
    }

    dirty = false;
    customized = true;
    showSuccess('pages.mail-templates.toasts.saved');
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

        const result = await api.resetLayout();

        saving = false;

        if (!result.ok) {
          showError('pages.mail-templates.toasts.failed');

          return;
        }

        body = String(data.layout?.default ?? '');
        customized = false;
        dirty = false;
        editorVersion += 1;
        showSuccess('pages.mail-templates.toasts.reset');
      },
    );
  }

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
