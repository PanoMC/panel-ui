<div class="vstack gap-3">
  <AddonLicenseCard addon={data.addon} />
  <AddonLicenseEmbed addon={data.addon} />

  <div class="card">
    <div class="card-header">
      {$_('buttons.toggle-details')}
    </div>
    <div class="card-body p-0">
      <dl class="list-group list-group-flush mb-0">
        <div class="list-group-item">
          <div class="row">
            <dt class="col-sm-4 fw-normal text-body-secondary">
              {$_('pages.addon-detail.developer')}
            </dt>
            <dd class="col-sm-8 text-sm-end text-break mb-0">{data.addon.developer}</dd>
          </div>
        </div>
        <div class="list-group-item">
          <div class="row">
            <dt class="col-sm-4 fw-normal text-body-secondary">
              {$_('pages.addon-detail.open-source-license')}
            </dt>
            <dd class="col-sm-8 text-sm-end text-break mb-0">
              {data.addon.openSourceLicense ||
                data.addon.license ||
                $_('pages.addon-detail.unknown')}
            </dd>
          </div>
        </div>
        <div class="list-group-item">
          <div class="row">
            <dt class="col-sm-4 fw-normal text-body-secondary">
              {$_('pages.addon-detail.source')}
            </dt>
            <dd class="col-sm-8 text-sm-end text-break mb-0">
              <a href={data.addon.sourceUrl} target="_blank">
                {data.addon.sourceUrl || $_('pages.addon-detail.unknown')}
                <i class="fa-solid fa-arrow-up-right-from-square ms-2"></i>
              </a>
            </dd>
          </div>
        </div>
        <div class="list-group-item">
          <div class="row">
            <dt class="col-sm-4 fw-normal text-body-secondary">
              {$_('pages.addon-detail.dependencies')}
            </dt>
            <dd class="col-sm-8 text-sm-end text-break mb-0">
              {@html isBlank(data.addon.dependencies)
                ? '-'
                : data.addon.dependencies
                    .map((dependency) => getDependencyText(dependency))
                    .join(', ')}
            </dd>
          </div>
        </div>
        <div class="list-group-item">
          <div class="row">
            <dt class="col-sm-4 fw-normal text-body-secondary">
              {$_('pages.addon-detail.requires')}
            </dt>
            <dd class="col-sm-8 text-sm-end text-break mb-0">
              {isBlank(data.addon.requires) ? '-' : data.addon.requires}
            </dd>
          </div>
        </div>
        {#if held}
          <div class="list-group-item" data-held-by={held.pluginId}>
            <div class="row">
              <dt class="col-sm-4 fw-normal text-body-secondary">
                {$_('pages.addon-detail.api-level')}
              </dt>
              <dd class="col-sm-8 text-sm-end mb-0">
                <AddonApiLevel plugin={data.addon} />
                <div class="text-body-secondary mt-1">{heldReason(data.addon, $_)}</div>
              </dd>
            </div>
          </div>
        {:else if hasApiLevel(data.addon)}
          <div class="list-group-item">
            <div class="row">
              <dt class="col-sm-4 fw-normal text-body-secondary">
                {$_('pages.addon-detail.api-level')}
              </dt>
              <dd class="col-sm-8 text-sm-end mb-0">
                <AddonApiLevel plugin={data.addon} />
              </dd>
            </div>
          </div>
        {/if}
        <div class="list-group-item">
          <div class="row">
            <dt class="col-sm-4 fw-normal text-body-secondary">Hash</dt>
            <dd class="col-sm-8 text-sm-end mb-0">
              <code
                class="d-block text-truncate font-monospace user-select-all"
                title="sha256:{data.addon.hash}">sha256:{data.addon.hash}</code>
            </dd>
          </div>
        </div>
        <div class="list-group-item rounded-bottom">
          <div class="row">
            <dt class="col-sm-4 fw-normal text-body-secondary">{$_('pages.addon-detail.size')}</dt>
            <dd class="col-sm-8 text-sm-end text-break mb-0">{formatBytes(data.addon.size)}</dd>
          </div>
        </div>
      </dl>
    </div>
  </div>
</div>

<script>
  import { _ } from 'svelte-i18n';
  import { formatBytes } from '$lib/string.util';
  import AddonApiLevel from './AddonApiLevel.svelte';
  import { heldReason, isRefused, normalizeHeldBy } from './compat/compat.util.js';
  import AddonLicenseCard from '$lib/components/AddonLicenseCard.svelte';
  import AddonLicenseEmbed from '$lib/components/AddonLicenseEmbed.svelte';

  let { data } = $props();

  const held = $derived(normalizeHeldBy(data.addon?.heldBy));

  // The level and verdict come with the answer of platforms that know them; nothing renders without.
  function hasApiLevel(addon) {
    return Number.isFinite(addon?.apiLevel) || isRefused(addon?.verdict);
  }

  function isBlank(value) {
    return value === null || value === undefined || value.toString().trim() === '';
  }

  function getDependencyText(dependency) {
    let text = dependency.pluginId;

    if (dependency.pluginVersionSupport !== '*') {
      text += `@<span class="font-monospace">${dependency.pluginVersionSupport}</span>`;
    }

    if (dependency.optional) {
      text = `[${text}]`;
    }

    return text;
  }
</script>
