<!-- Server Settings Contents -->
<div class="container">
  <PageActions leftClasses="d-none" rightClasses="d-none">
    <div slot="middle">
      <PageNav>
        <PageNavItem href="/server/settings">
          {$_('components.server-settings-layout.server')}
        </PageNavItem>
        <PageNavItem href="/server/settings/game-integration" startsWith>
          {$_('components.server-settings-layout.game-integration')}
        </PageNavItem>
      </PageNav>
    </div>
  </PageActions>

  <div class="mt-3">
    <slot />
  </div>
</div>

<script>
  import { _ } from 'svelte-i18n';

  import PageActions from '$lib/components/PageActions.svelte';
  import PageNav from '$lib/components/PageNav.svelte';
  import PageNavItem from '$lib/components/PageNavItem.svelte';
</script>
