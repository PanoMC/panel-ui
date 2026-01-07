<tr>
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
        {getBanDurationText(banHistory.createdAt, banHistory.bannedUntil)}
      </span>
    {:else}
      <span>{$_('pages.player-detail.permanent-ban')}</span>
    {/if}
  </td>
  <td class="align-middle">
    {#if banHistory.reason}
      <span title={banHistory.reason}
        >{banHistory.reason.length > 36
          ? banHistory.reason.substring(0, 36) + '...'
          : banHistory.reason}</span>
    {:else}
      <span>{$_('pages.player-detail.no-reason')}</span>
    {/if}
  </td>
  <td class="align-middle text-center">
    {#if banHistory.emailNotified}
      <i
        class="fas fa-check text-success"
        use:tooltip={[$_('pages.player-detail.email-notified'), { placement: 'bottom' }]}></i>
    {:else}
      <i
        class="fas fa-times text-danger"
        use:tooltip={[$_('pages.player-detail.email-not-notified'), { placement: 'bottom' }]}></i>
    {/if}
  </td>
  <td class="align-middle text-nowrap">
    {#if banHistory.bannedBy}
      <a
        href="{base}/players/detail/{banHistory.bannedBy}"
        title={$_('buttons.view')}
        class="d-inline-block rounded-circle focus-ring me-2">
        <img
          src="https://minotar.net/avatar/{banHistory.bannedBy}/24"
          alt={banHistory.bannedBy}
          class="rounded-circle"
          height="24"
          width="24" />
      </a>
      <a
        href="{base}/players/detail/{banHistory.bannedBy}"
        title={$_('buttons.view')}
        class="rounded focus-ring">
        {banHistory.bannedBy}
      </a>
    {:else}
      <span class="badge text-bg-primary">{$_('pages.player-detail.system-ban')}</span>
    {/if}
  </td>
  <td class="align-middle text-nowrap">
    <DateComponent time={banHistory.createdAt} />
  </td>
</tr>

<script>
  import { _ } from 'svelte-i18n';
  import { format, formatDuration, intervalToDuration } from 'date-fns';
  import * as locales from 'date-fns/locale';

  import { base } from '$app/paths';

  import { currentLanguage } from '$lib/language.util.js';
  import tooltip from '$lib/tooltip.util';

  import DateComponent from '$lib/component/Date.svelte';

  export let banHistory;

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
