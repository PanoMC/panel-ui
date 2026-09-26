<!-- Device-code link of this Pano to a panomc.com account (host-api.md /host/link/*), per purpose. -->
<div class="card">
  <div class="card-body vstack gap-3">
    <div class="d-flex align-items-start gap-3">
      <div
        class="d-inline-flex rounded justify-content-center align-items-center bg-primary-subtle text-primary flex-shrink-0"
        style="width: 48px; height: 48px;">
        <i class="fa-solid {purpose === 'TRANSFER' ? 'fa-right-left' : 'fa-cloud'} fa-lg"></i>
      </div>
      <div class="vstack gap-1 min-w-0">
        <h5 class="mb-0">{$_(`pages.settings.backups.link.title-${purposeKey}`)}</h5>
        <div class="text-body-secondary small">
          {$_(`pages.settings.backups.link.description-${purposeKey}`)}
        </div>
      </div>
      {#if link}
        <span class="badge text-bg-success ms-auto">
          {$_('pages.settings.backups.link.linked')}
        </span>
      {/if}
    </div>

    {#if link}
      <div class="d-flex flex-wrap align-items-center gap-3 small">
        <span>
          <i class="fa-solid fa-server me-1 text-body-secondary" aria-hidden="true"></i>
          {link.instanceName || '—'}
        </span>
        {#if link.linkedAt}
          <span class="text-body-secondary">
            {$_('pages.settings.backups.link.linked-at')}
            <DateComponent time={link.linkedAt} relativeFormat />
          </span>
        {/if}
        <div class="ms-auto hstack gap-2">
          {#if confirmingUnlink}
            <button
              type="button"
              class="btn btn-sm btn-link"
              onclick={() => (confirmingUnlink = false)}>
              {$_('buttons.cancel')}
            </button>
            <button type="button" class="btn btn-sm btn-danger" disabled={busy} onclick={unlink}>
              {$_('pages.settings.backups.link.unlink-confirm')}
            </button>
          {:else}
            <button
              type="button"
              class="btn btn-sm btn-outline-danger"
              onclick={() => (confirmingUnlink = true)}>
              {$_('pages.settings.backups.link.unlink')}
            </button>
          {/if}
        </div>
      </div>
      {#if confirmingUnlink}
        <div class="alert alert-warning small mb-0">
          {$_(`pages.settings.backups.link.unlink-warning-${purposeKey}`)}
        </div>
      {/if}
    {:else if pending}
      <div class="vstack gap-2 align-items-center text-center border rounded p-3">
        <div class="small text-body-secondary">{$_('pages.settings.backups.link.enter-code')}</div>
        <div class="fs-3 fw-bold font-monospace user-select-all">{pending.code}</div>
        <div class="hstack gap-2 flex-wrap justify-content-center">
          {#if pending.verifyUrl}
            <a
              class="btn btn-primary btn-sm"
              href={pending.verifyUrl}
              target="_blank"
              rel="noopener noreferrer">
              <i class="fa-solid fa-arrow-up-right-from-square me-1" aria-hidden="true"></i>
              {$_('pages.settings.backups.link.open-verify')}
            </a>
          {/if}
          <button type="button" class="btn btn-secondary btn-sm" onclick={copyCode}>
            <i class="fa-regular fa-copy me-1" aria-hidden="true"></i>
            {copied ? $_('pages.settings.backups.link.copied') : $_('buttons.copy')}
          </button>
          <button type="button" class="btn btn-link btn-sm" onclick={cancel}>
            {$_('buttons.cancel')}
          </button>
        </div>
        <div class="small text-body-secondary">
          <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
          {$_('pages.settings.backups.link.waiting')}
        </div>
      </div>
    {:else}
      {#if expired}
        <div class="alert alert-warning small mb-0">
          {$_('pages.settings.backups.link.expired')}
        </div>
      {/if}
      <div>
        <button type="button" class="btn btn-primary" disabled={busy} onclick={start}>
          {#if busy}
            <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
          {:else}
            <i class="fa-solid fa-link me-1" aria-hidden="true"></i>
          {/if}
          {$_('pages.settings.backups.link.connect')}
        </button>
      </div>
    {/if}

    {#if error}
      <div class="alert alert-danger small mb-0">{$_(error.key, { values: error.values })}</div>
    {/if}
  </div>
</div>

<script>
  import { _ } from 'svelte-i18n';
  import copy from 'copy-to-clipboard';

  import ApiUtil from '$lib/api.util.js';
  import { describeError, pollDelay } from '$lib/pano-backup.util.js';

  import DateComponent from '$lib/components/Date.svelte';

  /**
   * @type {{
   *   purpose: 'BACKUP' | 'TRANSFER',
   *   link?: object | null,
   *   pending?: object | null,
   *   onchange?: (link: object | null) => void,
   * }}
   */
  let { purpose, link = $bindable(null), pending = $bindable(null), onchange } = $props();

  let busy = $state(false);
  let expired = $state(false);
  let copied = $state(false);
  let confirmingUnlink = $state(false);
  /** @type {ReturnType<typeof describeError>} */
  let error = $state(null);

  const purposeKey = $derived(String(purpose).toLowerCase());
  const pendingCode = $derived(pending?.code ?? null);

  // Polls while a code is on screen; stops by itself once linked, expired or cancelled.
  $effect(() => {
    if (!pendingCode) {
      return;
    }

    let stopped = false;
    let timer;
    const delay = pollDelay(pending?.interval);

    const tick = async () => {
      const body = await ApiUtil.post({
        path: '/api/panel/pano-backups/remote/link/poll',
        body: { purpose },
      }).catch(() => null);

      if (stopped) {
        return;
      }

      if (body?.error) {
        error = describeError(body);
      } else if (body?.status === 'LINKED') {
        pending = null;
        link = body.link || { purpose };
        error = null;
        onchange?.(link);

        return;
      } else if (body?.status === 'EXPIRED' || body?.status === 'NONE') {
        pending = null;
        expired = true;

        return;
      }

      timer = setTimeout(tick, delay);
    };

    timer = setTimeout(tick, delay);

    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  });

  async function start() {
    busy = true;
    error = null;
    expired = false;

    try {
      const body = await ApiUtil.post({
        path: '/api/panel/pano-backups/remote/link',
        body: { purpose },
      });

      if (body?.error) {
        error = describeError(body);

        return;
      }

      pending = body;
    } finally {
      busy = false;
    }
  }

  function cancel() {
    // The code simply lapses on panomc.com; nothing to tell the server.
    pending = null;
  }

  function copyCode() {
    copy(pending?.code || '');
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }

  async function unlink() {
    busy = true;
    error = null;

    try {
      const body = await ApiUtil.delete({
        path: `/api/panel/pano-backups/remote/link/${purpose}`,
      });

      if (body?.error) {
        error = describeError(body);

        return;
      }

      link = null;
      confirmingUnlink = false;
      onchange?.(null);
    } finally {
      busy = false;
    }
  }
</script>
