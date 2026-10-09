<div class="vstack gap-3">
  <AddonLicenseCard addon={data.addon} />
  <AddonLicenseEmbed addon={data.addon} />

  <div class="card">
    <div class="card-header">
      {$_('buttons.toggle-details')}
    </div>
    <div class="card-body p-0">
      <ul class="list-group list-group-flush">
        <li class="list-group-item">
          <strong>{$_('pages.addon-detail.developer')}:</strong>
          <span class="text-break">{data.addon.developer}</span>
        </li>
        <li class="list-group-item">
          <strong>{$_('pages.addon-detail.open-source-license')}:</strong>
          <span class="text-break"
            >{data.addon.openSourceLicense ||
              data.addon.license ||
              $_('pages.addon-detail.unknown')}</span>
        </li>
        <li class="list-group-item">
          <strong>{$_('pages.addon-detail.source')}:</strong>
          <a href={data.addon.sourceUrl} target="_blank" class="text-break">
            {data.addon.sourceUrl || $_('pages.addon-detail.unknown')}
            <i class="fa-solid fa-arrow-up-right-from-square ms-2"></i>
          </a>
        </li>
        <li class="list-group-item">
          <strong>{$_('pages.addon-detail.dependencies')}:</strong>
          <span class="text-break">
            {@html isBlank(data.addon.dependencies)
              ? '-'
              : data.addon.dependencies
                  .map((dependency) => getDependencyText(dependency))
                  .join(', ')}
          </span>
        </li>
        <li class="list-group-item">
          <strong>{$_('pages.addon-detail.requires')}:</strong>
          <span class="text-break">{isBlank(data.addon.requires) ? '-' : data.addon.requires}</span>
        </li>
        {#if held}
          <li class="list-group-item" data-held-by={held.pluginId}>
            <strong>{$_('pages.addon-detail.api-level')}:</strong>
            <AddonApiLevel plugin={data.addon} />
            <div class="text-body-secondary mt-1">{heldReason(data.addon, $_)}</div>
          </li>
        {:else if hasApiLevel(data.addon)}
          <li class="list-group-item">
            <strong>{$_('pages.addon-detail.api-level')}:</strong>
            <AddonApiLevel plugin={data.addon} />
          </li>
        {/if}
        <li class="list-group-item">
          <strong>Hash:</strong>
          <code class="overflow-auto text-break user-select-all">sha256:{data.addon.hash}</code>
        </li>
        <li class="list-group-item rounded-bottom">
          <strong>{$_('pages.addon-detail.size')}:</strong>
          <span class="text-break">{formatBytes(data.addon.size)}</span>
        </li>
      </ul>
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
