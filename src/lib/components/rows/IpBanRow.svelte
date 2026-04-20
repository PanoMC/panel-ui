<tr>
  <td class="align-middle">
    <code class="user-select-all">{bannedIp.ip}</code>
  </td>
  <td class="align-middle text-nowrap">
    {#if bannedIp.bannedUntil}
      <span
        use:tooltip={[
          format(new Date(bannedIp.bannedUntil), 'dd/MM/yyyy, HH:mm'),
          {
            placement: 'bottom',
            locale: locales[$currentLanguage.dateFnsCode],
          },
        ]}>
        {isActive(bannedIp.bannedUntil)
          ? getRemainingDurationText(bannedIp.bannedUntil)
          : $_('pages.ip-bans.expired')}
      </span>
    {:else}
      <span>{$_('pages.player-detail.permanent-ban')}</span>
    {/if}
  </td>
  <td class="align-middle" style="max-width: 280px;">
    <div class="text-truncate">
      {#if bannedIp.reason}
        <span use:tooltip={[bannedIp.reason]}>{bannedIp.reason}</span>
      {:else}
        <span>{$_('pages.player-detail.no-reason')}</span>
      {/if}
    </div>
  </td>
  <td class="align-middle">
    {#if bannedIp.source}
      <SourceBadge source={bannedIp.source} />
    {:else}
      <span class="opacity-50">-</span>
    {/if}
  </td>
  <td class="align-middle" style="max-width: 180px;">
    <div class="text-truncate d-flex align-items-center">
      {#if bannedIp.bannedBy}
        <a
          href="{base}/players/detail/{bannedIp.bannedBy}"
          use:tooltip={[$_('buttons.view')]}
          class="rounded focus-ring text-decoration-none text-truncate d-flex align-items-center">
          <img
            src="/api/profile/picture/{bannedIp.bannedBy}?{$avatarVersion}"
            alt={bannedIp.bannedBy}
            class="rounded-circle me-2 flex-shrink-0"
            height="24"
            width="24" />
          <span class="text-truncate">{bannedIp.bannedBy}</span>
        </a>
      {:else}
        <span class="badge text-bg-primary">{$_('pages.player-detail.system-ban')}</span>
      {/if}
    </div>
  </td>
  <td class="align-middle text-nowrap">
    <DateComponent time={bannedIp.createdAt} />
  </td>
  <td class="align-middle text-end">
    {#if hasPermission(Permissions.MANAGE_PLAYERS)}
      <button
        class="btn btn-link link-danger btn-sm"
        on:click={() => dispatch('unban', { bannedIp })}
        use:tooltip={[$_('pages.ip-bans.remove')]}
        aria-label={$_('pages.ip-bans.remove')}>
        <i class="fas fa-trash"></i>
      </button>
    {/if}
  </td>
</tr>

<script>
  import { _ } from 'svelte-i18n';
  import { createEventDispatcher } from 'svelte';
  import { avatarVersion } from '$lib/Store';
  import { format, formatDuration, intervalToDuration } from 'date-fns';
  import * as locales from 'date-fns/locale';

  import { base } from '$app/paths';

  import { currentLanguage } from '$lib/language.util.js';
  import tooltip from '$lib/tooltip.util';
  import { hasPermission, Permissions } from '$lib/auth.util.js';

  import DateComponent from '$lib/components/Date.svelte';
  import SourceBadge from '$lib/components/badges/BanSourceBadge.svelte';

  export let bannedIp;

  const dispatch = createEventDispatcher();

  function isActive(bannedUntil) {
    return bannedUntil > Date.now();
  }

  function getRemainingDurationText(bannedUntil) {
    const now = Date.now();
    const duration = intervalToDuration({ start: now, end: new Date(bannedUntil) });

    const obj = {};
    if (duration.years) obj.years = duration.years;
    if (duration.months) obj.months = duration.months;
    if (duration.days) obj.days = duration.days;
    if (duration.hours) obj.hours = duration.hours;
    if (duration.minutes && !duration.years && !duration.months) obj.minutes = duration.minutes;

    if (Object.keys(obj).length === 0) obj.minutes = 1;

    return formatDuration(obj, {
      locale: locales[$currentLanguage.dateFnsCode],
    });
  }
</script>
