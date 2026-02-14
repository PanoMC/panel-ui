<a
  class="badge rounded-pill text-bg-secondary focus-ring text-decoration-none"
  use:tooltip={[$_('components.player-permission-badge.filter')]}
  href="{base}/players?permissionGroup={permissionGroup.name}">
  {permissionGroup.displayName.capitalize()}
</a>

<script context="module">
  String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
  };
</script>

<script>
  import { _ } from 'svelte-i18n';
  import tooltip from '$lib/tooltip.util';

  import { base } from '$app/paths';

  export let permissionGroup;

  String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
  };
</script>
