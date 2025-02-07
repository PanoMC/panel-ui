<a
  class="badge rounded-pill text-bg-secondary"
  title="{$_('components.player-permission-badge.filter')}"
  href="{base}/players/by-perm-group/{permissionGroup}">
  {permissionGroup === "-"
    ? $_("components.player-permission-badge.player")
    : permissionGroup.capitalize()}
</a>

<script context="module">
  String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
  };
</script>

<script>
  import { _ } from "svelte-i18n";

  import { base } from "$app/paths";

  export let permissionGroup;

  String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
  };
</script>
