<style>
  .auth-shell {
    background-image: radial-gradient(circle at 50% 0%, var(--bs-body-bg) 0%, transparent 500%);
    background-attachment: fixed;
  }

  .auth-logo {
    border-radius: 12px;
    width: 56px;
    height: 56px;
  }
</style>

<div class="auth-shell d-flex flex-column w-100 overflow-auto">
  <main class="flex-grow-1 d-flex align-items-center justify-content-center px-3 py-5">
    <div class="w-100">
      <div class="text-center mb-4">
        <span
          class="auth-logo bg-primary p-2 shadow-sm d-inline-flex align-items-center justify-content-center">
          <img src="{base}/assets/img/logo.svg" alt="Pano" class="w-100 h-100 object-fit-contain" />
        </span>
        <div class="h6 mt-3 mb-0 text-break">{websiteName}</div>
        <div class="small text-body-secondary">{$_('pages.auth.panel-name')}</div>
      </div>

      {@render children?.()}
    </div>
  </main>

  <footer class="text-center small text-body-secondary pb-4">
    Pano{$siteInfo?.panoVersion ? ` ${$siteInfo.panoVersion}` : ''}
  </footer>
</div>

<script>
  /**
   * The chrome-free shell the panel's own login and logout pages render in (U-06): the Pano
   * mark, the site's name, and nothing that needs a session.
   */
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { base } from '$app/paths';

  let { children } = $props();

  const siteInfo = getContext('siteInfo');

  const websiteName = $derived(String($siteInfo?.websiteName || '').trim() || 'Pano');
</script>
