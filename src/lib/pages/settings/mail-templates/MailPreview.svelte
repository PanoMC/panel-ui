<style>
  .mail-preview-frame {
    display: block;
    width: 100%;
    min-height: 640px;
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
<div class="card h-100">
  <div class="card-header py-3 d-flex align-items-center gap-2">
    <div class="flex-grow-1 min-w-0 text-truncate">
      {$_('pages.mail-templates.preview.title')}
      {#if loading}
        <span class="spinner-border spinner-border-sm text-primary ms-2" aria-hidden="true"></span>
      {/if}
    </div>
    <div
      class="btn-group btn-group-sm"
      role="group"
      aria-label={$_('pages.mail-templates.preview.width')}>
      <button
        type="button"
        class="btn btn-outline-primary"
        class:active={!mobile}
        aria-pressed={!mobile}
        title={$_('pages.mail-templates.preview.desktop')}
        aria-label={$_('pages.mail-templates.preview.desktop')}
        onclick={() => (mobile = false)}>
        <i class="fas fa-desktop" aria-hidden="true"></i>
      </button>
      <button
        type="button"
        class="btn btn-outline-primary"
        class:active={mobile}
        aria-pressed={mobile}
        title={$_('pages.mail-templates.preview.mobile')}
        aria-label={$_('pages.mail-templates.preview.mobile')}
        onclick={() => (mobile = true)}>
        <i class="fas fa-mobile-screen" aria-hidden="true"></i>
      </button>
    </div>
    {#if windowHref}
      <!-- The preview window: follows this editor's unsaved draft, with device widths and its own test data. -->
      <a
        class="btn btn-sm btn-primary"
        href={windowHref}
        target="_blank"
        rel="noopener"
        title={$_('pages.mail-templates.window.open')}
        aria-label={$_('pages.mail-templates.window.open')}>
        <i class="fas fa-up-right-from-square" aria-hidden="true"></i>
      </a>
    {/if}
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
  <div class="card-body p-2 bg-body-tertiary d-flex flex-grow-1">
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

  let { html = '', subject = null, loading = false, error = '', windowHref = '' } = $props();

  let mobile = $state(false);
</script>
