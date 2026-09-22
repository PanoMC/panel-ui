<!-- A section nothing can serve right now (§2.4.17). The page still opens with its controls
     disabled; this says what the server lacks and what would fix it — Pano's own reason for the
     feature (§2.4.35: node offline, server stopped, plugin not connected / too old / lacking the
     capability, node only, not supported by the software). Renders nothing while the feature
     has a source. -->
{#if reason}
  <div class="alert alert-warning d-flex flex-wrap align-items-start gap-2 mb-0" role="status">
    <i class="fa-solid fa-plug-circle-xmark mt-1" aria-hidden="true"></i>
    <span class="flex-grow-1">{$_(reason, { values: { section: $_(section) } })}</span>
    <!-- What the sentence asks for, one click away. -->
    {#if needsNewerPlugin}
      <PanoPluginUpdateButton {server} />
    {/if}
  </div>
{/if}

<script>
  import { _ } from 'svelte-i18n';
  import {
    FEATURE_REASON_KEYS,
    FeatureReasons,
    featureUnavailableReason,
    hasFeature,
  } from '$lib/servers.util.js';
  import PanoPluginUpdateButton from './PanoPluginUpdateButton.svelte';

  /** @type {object | null} the server row, live or from the route. */
  export let server;
  /** @type {string} the `features` path the page lives on, e.g. `console.stream`. */
  export let feature;
  /** @type {string} i18n key of the section's name, for the sentence. */
  export let section;

  $: reason = hasFeature(server, feature) ? '' : featureUnavailableReason(server, feature);
  // The two reasons a newer Pano plugin would answer.
  $: needsNewerPlugin =
    reason === FEATURE_REASON_KEYS[FeatureReasons.PLUGIN_OUTDATED] ||
    reason === FEATURE_REASON_KEYS[FeatureReasons.PLUGIN_LACKS];
</script>
