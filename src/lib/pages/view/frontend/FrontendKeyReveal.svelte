<div class="vstack gap-3" data-key-reveal>
  <div>
    <div class="form-label">{$_('pages.frontend.keys.reveal.key')}</div>
    <div class="input-group">
      <input
        class="form-control font-monospace"
        type="text"
        readonly
        data-key-value
        aria-label={$_('pages.frontend.keys.reveal.key')}
        value={created.key}
        onfocus={(event) => event.currentTarget.select()} />
      <button
        class="btn btn-secondary"
        type="button"
        title={$_('buttons.copy')}
        aria-label={$_('buttons.copy')}
        onclick={() => copyText(created.key)}>
        <i class="fa-solid fa-copy" aria-hidden="true"></i>
      </button>
    </div>
  </div>
  <div>
    <div class="form-label">{$_('pages.frontend.keys.reveal.env')}</div>
    <div class="input-group">
      <pre class="form-control font-monospace mb-0 user-select-all text-wrap" data-key-env>{envText(
          created.env,
        )}</pre>
      <button
        class="btn btn-secondary"
        type="button"
        title={$_('buttons.copy')}
        aria-label={$_('buttons.copy')}
        onclick={() => copyText(envText(created.env))}>
        <i class="fa-solid fa-copy" aria-hidden="true"></i>
      </button>
    </div>
  </div>
</div>

<script>
  import copy from 'copy-to-clipboard';
  import { _ } from 'svelte-i18n';

  import { envText } from './frontend.util.js';

  /**
   * The key just created and the two `.env` lines for it. They are in the create answer only, so
   * this is the one place they are shown.
   * @type {{ created: { key: string, env: string[] }, notify?: { success: (key: string) => any, error: (key: string) => any } }}
   */
  let { created, notify = undefined } = $props();

  function copyText(text) {
    if (copy(text)) {
      notify?.success('pages.frontend.copied');
    } else {
      notify?.error('pages.frontend.copy-failed');
    }
  }
</script>
