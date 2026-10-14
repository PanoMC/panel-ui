<style>
  .mail-preview-frame {
    display: block;
    width: 100%;
    height: 640px;
    margin: 0 auto;
    border: 0;
    background: #fff;
    transition: max-width 0.2s ease;
  }

  .mail-preview-frame.mobile {
    max-width: 375px;
  }

  .mail-preview-stale {
    opacity: 0.5;
  }
</style>

<!-- The rendered mail in a sandboxed frame: no scripts, no same origin, no forms or popups. -->
<div class="card">
  <div class="card-header py-3 d-flex align-items-center gap-2">
    <div class="flex-grow-1 min-w-0 text-truncate">
      {$_('pages.mail-templates.preview.title')}
      {#if loading}
        <span class="spinner-border spinner-border-sm ms-2" aria-hidden="true"></span>
      {/if}
    </div>
    <div
      class="btn-group btn-group-sm"
      role="group"
      aria-label={$_('pages.mail-templates.preview.width')}>
      <button
        type="button"
        class="btn btn-outline-secondary"
        class:active={!mobile}
        aria-pressed={!mobile}
        title={$_('pages.mail-templates.preview.desktop')}
        aria-label={$_('pages.mail-templates.preview.desktop')}
        onclick={() => (mobile = false)}>
        <i class="fas fa-desktop" aria-hidden="true"></i>
      </button>
      <button
        type="button"
        class="btn btn-outline-secondary"
        class:active={mobile}
        aria-pressed={mobile}
        title={$_('pages.mail-templates.preview.mobile')}
        aria-label={$_('pages.mail-templates.preview.mobile')}
        onclick={() => (mobile = true)}>
        <i class="fas fa-mobile-screen" aria-hidden="true"></i>
      </button>
    </div>
    <button
      type="button"
      class="btn btn-sm btn-outline-secondary"
      title={$_('pages.mail-templates.preview.open-new-window')}
      aria-label={$_('pages.mail-templates.preview.open-new-window')}
      disabled={!html}
      onclick={openInNewWindow}>
      <i class="fas fa-up-right-from-square" aria-hidden="true"></i>
    </button>
  </div>
  {#if subject !== null}
    <div class="card-body border-bottom py-2 small">
      <span class="text-body-secondary">{$_('pages.mail-templates.fields.subject')}:</span>
      <span class="ms-1">{subject}</span>
    </div>
  {/if}
  {#if error}
    <div class="card-body py-2 small text-danger border-bottom" role="alert">
      <i class="fa-solid fa-circle-exclamation me-1" aria-hidden="true"></i>
      {error}
    </div>
  {/if}
  <div class="card-body p-2 bg-body-tertiary">
    <iframe
      class="mail-preview-frame rounded"
      class:mobile
      class:mail-preview-stale={!!error}
      title={$_('pages.mail-templates.preview.title')}
      sandbox=""
      referrerpolicy="no-referrer"
      srcdoc={html}></iframe>
  </div>
</div>

<script>
  import { _ } from 'svelte-i18n';

  let { html = '', subject = null, loading = false, error = '' } = $props();

  let mobile = $state(false);

  /** @param {string} value */
  function escapeHtml(value) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }

  /**
   * Opens the preview in a new window. The page is a blob with no scripts that only holds the mail in a frame
   * sandboxed like the inline one, so the mail never runs with the panel's origin.
   */
  function openInNewWindow() {
    const title = escapeHtml(subject || $_('pages.mail-templates.preview.title'));
    const page = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>html,body{margin:0;height:100%;background:#fff}iframe{display:block;width:100%;height:100%;border:0}</style></head><body><iframe title="${title}" sandbox="" referrerpolicy="no-referrer" srcdoc="${escapeHtml(html)}"></iframe></body></html>`;
    const url = URL.createObjectURL(new Blob([page], { type: 'text/html' }));

    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
</script>
