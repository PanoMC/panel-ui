{#if banned}
  <div class="badge rounded-pill text-bg-danger">
    {$_('components.player-status-badge.banned')}
  </div>
{:else if isOnline}
  <div
    class="badge rounded-pill text-bg-success"
    use:tooltip={[
      (inGame
        ? $_('components.player-status-badge.in-game')
        : $_('components.player-status-badge.in-website')) +
        ' ' +
        $_('components.player-status-badge.online'),
      { placement: 'bottom' },
    ]}>
    <span>{$_('components.player-status-badge.online')}</span>
  </div>
{:else}
  <div
    class="badge rounded-pill text-bg-primary"
    use:tooltip={[getOfflineRelativeDateText(checkTime), { placement: 'bottom' }]}>
    <span>{$_('components.player-status-badge.offline')}</span>
  </div>
{/if}

<script context="module">
  String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
  };
</script>

<script>
  import { formatRelative } from 'date-fns';

  import tooltip from '$lib/tooltip.util';
  import { _ } from 'svelte-i18n';

  export let banned = false;
  export let lastActivityTime = 0;
  export let inGame = 0;
  export let checkTime = 0;

  $: isOnline = lastActivityTime > Date.now() - 5 * 60 * 1000 || inGame;

  function getOfflineRelativeDateText(checkTime) {
    return formatRelative(new Date(parseInt(lastActivityTime)), new Date()).capitalize();
  }
</script>
