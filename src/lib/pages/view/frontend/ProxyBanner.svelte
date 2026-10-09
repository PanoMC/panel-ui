{#if status && status.state && status.state !== 'OK'}
  <div class="alert alert-warning d-flex align-items-start mb-0" role="alert" data-proxy-banner>
    <i class="fa-solid fa-triangle-exclamation me-3 mt-1" aria-hidden="true"></i>
    <div class="flex-grow-1 min-w-0">
      {#if status.state === 'UNTRUSTED_PROXY'}
        <h5 class="alert-heading mb-2">{$_('pages.frontend.proxy.untrusted.title')}</h5>
        <div>
          {$_('pages.frontend.proxy.untrusted.description', { values: { peers } })}
        </div>
        {#if status.suggestion}
          <pre class="mt-2 mb-0 user-select-all text-wrap" data-proxy-line>{status.suggestion}</pre>
          <button class="btn alert-btn mt-2" type="button" onclick={copyLine}>
            {$_('pages.frontend.proxy.untrusted.copy-line')}
          </button>
        {/if}
      {:else if status.state === 'SINGLE_CLIENT_IP'}
        <h5 class="alert-heading mb-2">{$_('pages.frontend.proxy.single.title')}</h5>
        <div>
          {$_('pages.frontend.proxy.single.description', { values: { peers } })}
        </div>
      {/if}
    </div>
  </div>
{/if}

<script>
  import copy from 'copy-to-clipboard';
  import { _ } from 'svelte-i18n';

  /**
   * The answer of `GET /panel/access/proxy-status`: the state of the reverse proxy in front of Pano,
   * read from live traffic. Nothing is shown while it is `OK`.
   * @type {{ status?: { state?: string, peers?: string[], suggestion?: string | null } | null, notify?: { success: (key: string) => any } }}
   */
  let { status = null, notify = undefined } = $props();

  const peers = $derived((status?.peers ?? []).join(', '));

  function copyLine() {
    if (status?.suggestion && copy(status.suggestion)) {
      notify?.success('pages.frontend.copied');
    }
  }
</script>
