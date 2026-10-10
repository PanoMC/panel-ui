<CompatProblemIcon text={problem?.text} level={problem?.level} />

<script>
  import { _ } from 'svelte-i18n';

  import CompatProblemIcon from '$lib/components/CompatProblemIcon.svelte';
  import { pluginProblem } from './compat/compat.util.js';

  /**
   * The exclamation icon on a plugin card: refused or held by the API level gate, or addresses
   * outside Pano that changed. Draws nothing for a plugin without a problem.
   * @type {{ plugin: any, report?: any }}
   */
  export let plugin;

  /** The compatibility report the list loaded (accepted levels, changed addresses), or null. */
  export let report = null;

  $: problem = pluginProblem(plugin, report, $_);
</script>
