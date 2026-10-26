<a
  class="btn btn-light btn-sm {className}"
  class:pe-none={disabled}
  href={href ?? planUrl}
  target={href ? '_blank' : undefined}
  rel={href ? 'noopener noreferrer' : undefined}
  aria-disabled={disabled || undefined}
  tabindex={disabled ? -1 : undefined}>
  <!-- The Pano Host mark: the plan is managed on Pano Host (same tab, it comes back here). -->
  <span
    class="d-inline-flex rounded justify-content-center align-items-center bg-info me-1 align-text-bottom"
    style="width: 18px; height: 18px;">
    <img src="{base}/assets/img/logo.svg" width="11" height="11" alt="" />
  </span>
  {$_('pages.settings.backups.account.manage-plan')}
  <i class="fa-solid fa-up-right-from-square ms-1" aria-hidden="true"></i>
</a>

<script>
  /**
   * The button that takes the owner to Pano Host to pick or change the backup plan; the website
   * sends them back to the backups page afterwards.
   */
  import { _ } from 'svelte-i18n';

  import { base } from '@panomc/sdk/core/js/basePath.js';
  import { page } from '@panomc/sdk/core/js/appStores.js';

  import { PANO_WEBSITE_URL } from '$lib/variables.js';
  import { backupPlanUrl } from '$lib/pano-backup.util.js';

  /**
   * `href`: another plan page (Pano Mail's), opened in a new tab; without it the backup plan page
   * on Pano Host, in the same tab. `disabled` greys it out while its form is locked.
   *
   * @type {{ class?: string, href?: string | null, disabled?: boolean }}
   */
  let { class: className = '', href = null, disabled = false } = $props();

  const planUrl = $derived(backupPlanUrl(PANO_WEBSITE_URL, `${$page.url.origin}${base}/backups`));
</script>
