<!-- The finished Custom JSON body as the receiver gets it (the preview of the template editor). -->
<div class="custom-json-preview" data-custom-preview>
  {#if body !== null && body !== undefined}
    <pre class="custom-json-code"><code>{@html highlightJson(body)}</code></pre>
  {:else}
    <div class="custom-json-empty">
      {#if loading}
        <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
      {:else}
        <i class="fa-solid fa-code" aria-hidden="true"></i>
      {/if}
    </div>
  {/if}
</div>

<script>
  import { highlightJson } from './custom.js';

  /** @type {{ body: any, name?: string, loading?: boolean }} */
  let { body, name = '', loading = false } = $props();
</script>
