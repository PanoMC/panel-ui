{#if banned}
  <div class="badge rounded-pill text-bg-danger">
    <i class="fa-solid fa-hammer me-1"></i>
    {$_('components.player-status-badge.banned')}
  </div>
{:else if isOnline}
  <div
    class="badge rounded-pill text-bg-success"
    use:tooltip={[
      inGame
        ? $_('components.player-status-badge.online-in-game')
        : $_('components.player-status-badge.online-in-website'),
      { placement: 'bottom' },
    ]}>
    <span>
      {#if inGame}
        <i class="fa-solid fa-gamepad me-1"></i>
      {:else}
        <i class="fa-solid fa-globe me-1"></i>
      {/if}
      {$_('components.player-status-badge.online')}
    </span>
  </div>
{:else}
  <div
    class="badge rounded-pill text-bg-primary"
    use:tooltip={[
      getOfflineRelativeDateText(checkTime, $currentLanguage),
      { placement: 'bottom' },
    ]}>
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
  import * as locales from 'date-fns/locale';

  import tooltip from '$lib/tooltip.util';
  import { _ } from 'svelte-i18n';
  import { currentLanguage } from '$lib/language.util.js';

  export let banned = false;
  export let lastActivityTime = 0;
  export let inGame = 0;
  export let checkTime = 0;

  $: isOnline = lastActivityTime > Date.now() - 5 * 60 * 1000 || inGame;

  function getOfflineRelativeDateText(checkTime, language) {
    return formatRelative(new Date(parseInt(lastActivityTime)), new Date(), {
      locale: locales[language?.dateFnsCode],
    }).capitalize();
  }
</script>
