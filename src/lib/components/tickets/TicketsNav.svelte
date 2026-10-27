<!-- The submenu every tickets page shows the same way (the list, a category's tickets, a ticket, categories, templates),
     with the hook `panel:tickets:nav` at its end: a plugin adds its own `PageNavItem` there and it shows on all of them. -->
<PageNav>
  <PageNavItem href="/tickets" active={active === 'tickets'}>
    {$_('pages.ticket-categories.tickets')}
  </PageNavItem>
  <PageNavItem href="/tickets/categories" active={active === 'categories'}>
    {$_('buttons.categories')}
  </PageNavItem>
  <PageNavItem href="/tickets/templates" active={active === 'templates'}>
    {$_('pages.ticket-templates.nav')}
  </PageNavItem>
  <Hook name="panel:tickets:nav" />
</PageNav>

<script>
  import { _ } from 'svelte-i18n';

  import Hook from '$lib/components/Hook.svelte';
  import PageNav from '$lib/components/PageNav.svelte';
  import PageNavItem from '$lib/components/PageNavItem.svelte';

  /** @type {{ active?: 'tickets' | 'categories' | 'templates' | null }} */
  let { active = null } = $props();
</script>
