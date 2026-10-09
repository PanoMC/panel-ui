<div class="vstack gap-2" data-secret-reveal>
  <div class="input-group">
    <input
      class="form-control font-monospace"
      type="text"
      readonly
      data-secret-value
      aria-label={$_('pages.webhooks.secret.label')}
      value={secret}
      onfocus={(event) => event.currentTarget.select()} />
    <button
      class="btn btn-secondary"
      type="button"
      title={$_('buttons.copy')}
      aria-label={$_('buttons.copy')}
      onclick={copyText}>
      <i class="fa-solid fa-copy" aria-hidden="true"></i>
    </button>
  </div>
  <div class="form-text">{$_('pages.webhooks.secret.hint')}</div>
</div>

<script>
  import copy from 'copy-to-clipboard';
  import { _ } from 'svelte-i18n';

  /**
   * The signing secret just made. It is in the answer of the save only, so this is the one place
   * it is shown.
   * @type {{ secret: string, notify?: { success: (key: string) => any, error: (key: string) => any } }}
   */
  let { secret, notify = undefined } = $props();

  function copyText() {
    if (copy(secret)) {
      notify?.success('pages.webhooks.copied');
    } else {
      notify?.error('pages.webhooks.copy-failed');
    }
  }
</script>
