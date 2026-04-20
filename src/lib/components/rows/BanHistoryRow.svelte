<tr>
  {#if showBannedPlayer}
    <td class="align-middle" style="max-width: 200px;">
      <div class="text-truncate d-flex align-items-center">
        <a
          class="rounded focus-ring text-decoration-none text-truncate d-flex align-items-center"
          use:tooltip={[$_('buttons.view')]}
          title={banHistory.username}
          href="{base}/players/detail/{banHistory.username}">
          <img
            src="/api/profile/picture/{banHistory.username}?{$avatarVersion}"
            alt={banHistory.username}
            width="32"
            height="32"
            class="rounded-circle me-2 flex-shrink-0" />
          <span class="text-truncate">{banHistory.username}</span>
        </a>
      </div>
    </td>
  {/if}
  <td class="align-middle text-nowrap">
    {#if banHistory.bannedUntil}
      <span
        use:tooltip={[
          format(new Date(banHistory.bannedUntil), 'dd/MM/yyyy, HH:mm'),
          {
            placement: 'bottom',
            locale: locales[$currentLanguage.dateFnsCode],
          },
        ]}>
        {getBanDurationText(banHistory.bannedAt ?? banHistory.createdAt, banHistory.bannedUntil)}
      </span>
    {:else}
      <span>{$_('pages.player-detail.permanent-ban')}</span>
    {/if}
  </td>
  <td class="align-middle" style="max-width: 250px;">
    <div class="text-truncate">
      {#if banHistory.reason}
        <span use:tooltip={[banHistory.reason]}>{banHistory.reason}</span>
      {:else if banHistory.banReason}
        <span use:tooltip={[banHistory.banReason]}>{banHistory.banReason}</span>
      {:else}
        <span>{$_('pages.player-detail.no-reason')}</span>
      {/if}
    </div>
  </td>
  <td class="align-middle text-center">
    {#if banHistory.emailNotified}
      <span class="badge text-bg-success">{$_('pages.player-detail.email-notified')}</span>
    {:else}
      <span class="badge text-bg-danger">{$_('pages.player-detail.email-not-notified')}</span>
    {/if}
  </td>
  <td class="align-middle" style="max-width: 180px;">
    <div class="text-truncate d-flex align-items-center">
      {#if banHistory.bannedBy}
        <a
          href="{base}/players/detail/{banHistory.bannedBy}"
          use:tooltip={[$_('buttons.view')]}
          class="rounded focus-ring text-decoration-none text-truncate d-flex align-items-center">
          <img
            src="/api/profile/picture/{banHistory.bannedBy}?{$avatarVersion}"
            alt={banHistory.bannedBy}
            class="rounded-circle me-2 flex-shrink-0"
            height="24"
            width="24" />
          <span class="text-truncate">{banHistory.bannedBy}</span>
        </a>
      {:else}
        <span class="badge text-bg-primary">{$_('pages.player-detail.system-ban')}</span>
      {/if}
    </div>
  </td>
  <td class="align-middle text-nowrap">
    <DateComponent time={banHistory.bannedAt ?? banHistory.createdAt} />
  </td>
</tr>

<script>
  import { _ } from 'svelte-i18n';
  import { avatarVersion } from '$lib/Store';
  import { format, formatDuration, intervalToDuration } from 'date-fns';
  import * as locales from 'date-fns/locale';

  import { base } from '$app/paths';

  import { currentLanguage } from '$lib/language.util.js';
  import tooltip from '$lib/tooltip.util';

  import DateComponent from '$lib/components/Date.svelte';

  export let banHistory;
  export let showBannedPlayer = false;

  function getBanDurationText(createdAt, bannedUntil) {
    const createdAtDate = new Date(createdAt);
    const bannedUntilDate = new Date(bannedUntil);

    // Calculate the difference between bannedUntil - createdAt
    const duration = intervalToDuration({
      start: createdAtDate,
      end: bannedUntilDate,
    });

    // Show years, months, weeks, days, hours and minutes, no seconds
    // Only round up seconds, show all other values as is
    let years = duration.years || 0;
    let months = duration.months || 0;
    let weeks = 0;
    let days = duration.days || 0;
    let hours = duration.hours || 0;
    let minutes = duration.minutes || 0;
    const seconds = duration.seconds || 0;

    // Only add seconds to minutes (if any seconds exist, +1 minute, round up)
    if (seconds > 0) {
      minutes += 1;
    }

    // Automatic conversion between units (60 minutes = 1 hour, 24 hours = 1 day, etc.)
    // Convert minutes to hours (60 minutes = 1 hour)
    if (minutes >= 60) {
      const extraHours = Math.floor(minutes / 60);
      hours += extraHours;
      minutes = minutes % 60;
    }

    // Convert hours to days (24 hours = 1 day)
    if (hours >= 24) {
      const extraDays = Math.floor(hours / 24);
      days += extraDays;
      hours = hours % 24;
    }

    // Convert days to weeks (7 days = 1 week)
    if (days >= 7) {
      const extraWeeks = Math.floor(days / 7);
      weeks += extraWeeks;
      days = days % 7;
    }

    // Convert weeks to months (4 weeks = 1 month approximately)
    if (weeks >= 4) {
      const extraMonths = Math.floor(weeks / 4);
      months += extraMonths;
      weeks = weeks % 4;
    }

    // Convert months to years (12 months = 1 year)
    if (months >= 12) {
      const extraYears = Math.floor(months / 12);
      years += extraYears;
      months = months % 12;
    }

    // Show starting from the most important unit
    const durationObj = {};

    if (years > 0) {
      durationObj.years = years;
      if (months > 0) durationObj.months = months;
      // Don't show weeks and days if year exists (too small units)
      if (weeks > 0 && years === 0) durationObj.weeks = weeks;
      if (days > 0 && years === 0 && months === 0) durationObj.days = days;
      if (hours > 0) durationObj.hours = hours;
      if (minutes > 0) durationObj.minutes = minutes;
    } else if (months > 0) {
      durationObj.months = months;
      // Don't show days if month exists (month already shows an approximate duration)
      if (weeks > 0) durationObj.weeks = weeks;
      if (hours > 0) durationObj.hours = hours;
      if (minutes > 0) durationObj.minutes = minutes;
    } else if (weeks > 0) {
      durationObj.weeks = weeks;
      if (days > 0) durationObj.days = days;
      if (hours > 0) durationObj.hours = hours;
      if (minutes > 0) durationObj.minutes = minutes;
    } else if (days > 0) {
      durationObj.days = days;
      if (hours > 0) durationObj.hours = hours;
      if (minutes > 0) durationObj.minutes = minutes;
    } else if (hours > 0) {
      durationObj.hours = hours;
      if (minutes > 0) durationObj.minutes = minutes;
    } else if (minutes > 0) {
      durationObj.minutes = minutes;
    } else {
      durationObj.minutes = 1; // Minimum 1 minute
    }
    return formatDuration(durationObj, {
      locale: locales[$currentLanguage.dateFnsCode],
    });
  }
</script>
