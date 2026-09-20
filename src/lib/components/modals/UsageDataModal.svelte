<style>
  .usage-data-list {
    padding-left: 1.25rem;
  }

  .usage-data-list li + li {
    margin-top: 0.25rem;
  }

  .usage-data-preview {
    max-height: 18rem;
    overflow: auto;
    tab-size: 2;
  }
</style>

<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" role="dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">{$_('components.modals.usage-data.title')}</h5>
        <button aria-label={$_('buttons.close')} class="btn-close" type="button" onclick={hide}
        ></button>
      </div>
      <div class="modal-body">
        <ul class="usage-data-list mb-3">
          <li>{$_('components.modals.usage-data.sent-platform')}</li>
          <li>{$_('components.modals.usage-data.sent-system')}</li>
          <li>{$_('components.modals.usage-data.sent-website')}</li>
          <li>{$_('components.modals.usage-data.sent-ip')}</li>
          <li>{$_('components.modals.usage-data.sent-resources')}</li>
          <li>{$_('components.modals.usage-data.sent-counts')}</li>
          <li>{$_('components.modals.usage-data.sent-account')}</li>
          <li>{$_('components.modals.usage-data.sent-install')}</li>
        </ul>

        <p class="text-body-secondary mb-0">
          {turnOffParts[0]}<code>{turnOffOption}</code>{turnOffParts[1] ?? ''}
        </p>

        {#if $previewOpen}
          <hr />

          {#if $previewLoading}
            <div class="text-center py-4">
              <span class="spinner-border spinner-border-sm text-primary" role="status"></span>
            </div>
          {:else if $previewFailed}
            <p class="text-body-secondary small mb-0">
              {$_('components.modals.usage-data.preview-error')}
            </p>
          {:else}
            <pre
              class="usage-data-preview bg-body-tertiary border rounded small mb-0 p-3">{$previewPayload}</pre>
          {/if}
        {/if}
      </div>
      <div class="modal-footer justify-content-between">
        <div class="hstack gap-3">
          <a href={PRIVACY_POLICY_URL} rel="noopener" target="_blank">
            {$_('components.modals.usage-data.privacy-policy')}
          </a>
          <a href={TELEMETRY_DOCS_URL} rel="noopener" target="_blank">
            {$_('components.modals.usage-data.learn-more')}
          </a>
        </div>
        <button
          aria-expanded={$previewOpen}
          class="btn btn-primary"
          type="button"
          onclick={togglePreview}>
          {$_('components.modals.usage-data.preview')}
        </button>
      </div>
    </div>
  </div>
</div>

<svelte:options runes={true} />

<script module>
  import { get, writable } from 'svelte/store';

  import ApiUtil from '$lib/api.util.js';

  // Public panomc.com pages rather than PANO_WEBSITE_URL: the policy and the documentation
  // this consent text points at only ever live on panomc.com, whatever the platform is
  // configured to talk to.
  const PRIVACY_POLICY_URL = 'https://panomc.com/privacy-policy';
  const TELEMETRY_DOCS_URL = 'https://panomc.com/docs/platform/configuration/telemetry/';

  const modalElement = writable();
  const previewOpen = writable(false);
  const previewLoading = writable(false);
  const previewFailed = writable(false);
  const previewPayload = writable('');

  let modal;

  export function show() {
    const element = get(modalElement);

    if (!element) {
      console.error('UsageDataModal is not mounted');

      return;
    }

    modal = new window.bootstrap.Modal(element, {
      backdrop: true,
      keyboard: true,
    });

    previewOpen.set(false);

    modal.show();
  }

  export function hide() {
    modal?.hide();
  }

  function togglePreview() {
    if (get(previewOpen)) {
      previewOpen.set(false);

      return;
    }

    previewOpen.set(true);

    if (!get(previewPayload)) {
      loadPreview();
    }
  }

  async function loadPreview() {
    previewLoading.set(true);
    previewFailed.set(false);

    // Deliberately no `handler`: ApiUtil only escalates to the global network-error splash
    // when one is given, and this is an illustration inside an explanatory modal — it must
    // never take the settings page over when the platform cannot build it.
    const body = await ApiUtil.get({ path: '/api/panel/telemetry/preview' });

    previewLoading.set(false);

    if (!body || body.error || !body.payload) {
      previewFailed.set(true);

      return;
    }

    previewPayload.set(JSON.stringify(body.payload, null, 2));
  }
</script>

<script>
  import { _ } from 'svelte-i18n';

  // The config option is the only part of the sentence that wants monospace. Translating it
  // as a placeholder and splitting the sentence around it keeps one natural sentence per
  // locale and avoids putting markup (and {@html}) inside a translated string.
  const OPTION_TOKEN = '\u0000';

  const turnOffParts = $derived(
    $_('components.modals.usage-data.turn-off', {
      values: { option: OPTION_TOKEN },
    }).split(OPTION_TOKEN),
  );

  const turnOffOption = $derived($_('components.modals.usage-data.turn-off-option'));
</script>
