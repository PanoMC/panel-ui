<!--
  One large modal for the mail templates page: a mail's template (`showMail`) or a layout
  (`showLayout`). It loads what it shows when it opens, asks before it closes on unsaved changes, and
  tells the page (`onchanged`) once it is closed after something was saved.
-->
<div class="modal fade" tabindex="-1" role="dialog" aria-hidden="true" bind:this={modalElement}>
  <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
    <div class="modal-content">
      {#if phase === 'ready' && mailData}
        {#key session}
          <MailTemplateForm
            owner={mailData.owner}
            mailKey={mailData.key}
            mail={mailData.mail}
            variant={mailData.variant}
            locale={mailData.locale}
            locales={mailData.locales}
            layouts={mailData.layouts}
            entry={mailData.entry}
            onswitch={switchTo}
            onchanged={markChanged}
            registerDirty={setDirtyCheck} />
        {/key}
      {:else if phase === 'ready' && layoutData}
        {#key session}
          <MailLayoutEditor
            data={{ layout: layoutData }}
            onchanged={markChanged}
            onclose={closeNow}
            registerDirty={setDirtyCheck} />
        {/key}
      {:else}
        <div class="modal-header">
          <h5 class="modal-title text-capitalize">{$_('pages.mail-templates.title')}</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label={$_('buttons.close')}></button>
        </div>
        <div class="modal-body">
          {#if phase === 'failed'}
            <div class="alert alert-danger d-flex align-items-start mb-0" role="alert">
              <i class="fa-solid fa-circle-exclamation me-3 mt-1" aria-hidden="true"></i>
              <div>
                <div>{$_('pages.mail-templates.load-failed')}</div>
                <button type="button" class="btn alert-btn text-capitalize mt-2" onclick={load}>
                  {$_('buttons.try-again')}
                </button>
              </div>
            </div>
          {:else}
            <div class="text-center py-5">
              <span class="spinner-border text-primary" role="status" aria-hidden="true"></span>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

<script>
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import { invalidateAll } from '$app/navigation';

  import ApiUtil from '$lib/api.util';
  import { currentLanguage } from '$lib/language.util.js';
  import { show as showConfirm } from '$lib/components/modals/ConfirmActionModal.svelte';

  import { createMailTemplatesApi, DEFAULT_VARIANT, pickLocale } from './mail-templates.api.js';
  import MailLayoutEditor from './MailLayoutEditor.svelte';
  import MailTemplateForm from './MailTemplateForm.svelte';

  let { api = createMailTemplatesApi(ApiUtil) } = $props();

  /** @type {HTMLElement | undefined} */
  let modalElement = $state();
  /** @type {any} */
  let modal;
  /** @type {'loading' | 'failed' | 'ready'} */
  let phase = $state('loading');
  /** @type {any} what is open: `{ type: 'mail', owner, key, variant?, locale? }` or `{ type: 'layout', id }` */
  let target = null;
  /** @type {any} */
  let mailData = $state(null);
  /** @type {any} */
  let layoutData = $state(null);
  /** Bumped for every load, so the editor starts over for another mail, variant or language. */
  let session = $state(0);
  let loadSequence = 0;
  let isDirty = () => false;
  let force = false;
  let changed = false;

  /**
   * @param {{ owner: string, key: string }} mail
   * @param {{ variant?: string, locale?: string }} [query]
   */
  export function showMail(mail, query = {}) {
    open({ type: 'mail', owner: mail.owner, key: mail.key, ...query });
  }

  /** @param {string} id */
  export function showLayout(id) {
    open({ type: 'layout', id });
  }

  /** @param {any} next */
  function open(next) {
    target = next;
    force = false;
    changed = false;
    isDirty = () => false;
    mailData = null;
    layoutData = null;
    phase = 'loading';
    modal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.show();
    load();
  }

  async function load() {
    const sequence = ++loadSequence;
    const current = target;

    phase = 'loading';

    if (current.type === 'layout') {
      const result = await api.getLayout(current.id);

      if (sequence !== loadSequence) return;

      if (!result.ok) {
        phase = 'failed';

        return;
      }

      layoutData = result.body;
      session += 1;
      phase = 'ready';

      return;
    }

    const list = await api.list();

    if (sequence !== loadSequence) return;

    const mail = list.ok
      ? (list.body.items ?? []).find(
          (item) => item.owner === current.owner && item.key === current.key,
        )
      : null;

    if (!mail) {
      phase = 'failed';

      return;
    }

    const variants = mail.variants ?? [];
    const variant =
      variants.find((item) => item.key === current.variant)?.key ??
      variants[0]?.key ??
      DEFAULT_VARIANT;
    const locales = list.body.locales ?? [];
    const locale = pickLocale(locales, current.locale, get(currentLanguage)?.code);
    const entry = await api.get(current.owner, current.key, variant, locale);

    if (sequence !== loadSequence) return;

    if (!entry.ok) {
      phase = 'failed';

      return;
    }

    mailData = {
      owner: current.owner,
      key: current.key,
      mail,
      variant,
      locale,
      locales,
      layouts: list.body.layouts ?? [],
      entry: entry.body,
    };
    session += 1;
    phase = 'ready';
  }

  /** @param {{ variant: string, locale: string }} next another variant or language of the open mail */
  function switchTo(next) {
    isDirty = () => false;
    target = { ...target, ...next };
    load();
  }

  function markChanged() {
    changed = true;
  }

  /** @param {() => boolean} check */
  function setDirtyCheck(check) {
    isDirty = check;
  }

  function closeNow() {
    force = true;
    modal?.hide();
  }

  /**
   * Closing with unsaved changes asks first (the close button, Esc and the backdrop all land here).
   *
   * @param {Event} event
   */
  function onHide(event) {
    if (force || !isDirty()) return;

    event.preventDefault();

    showConfirm(
      {
        title: 'pages.mail-templates.unsaved.title',
        description: 'pages.mail-templates.unsaved.description',
        confirmLabel: 'buttons.discard',
        variant: 'danger',
      },
      closeNow,
    );
  }

  function onHidden() {
    loadSequence += 1;
    mailData = null;
    layoutData = null;

    if (changed) {
      changed = false;
      invalidateAll();
    }
  }

  onMount(() => {
    modalElement?.addEventListener('hide.bs.modal', onHide);
    modalElement?.addEventListener('hidden.bs.modal', onHidden);

    return () => {
      modalElement?.removeEventListener('hide.bs.modal', onHide);
      modalElement?.removeEventListener('hidden.bs.modal', onHidden);
    };
  });
</script>
