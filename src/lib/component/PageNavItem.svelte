<li class="nav-item {liClazz || ''}">
  <svelte:element
    this={button ? 'button' : 'a'}
    class="nav-link {disabled && 'disabled'} {classes}"
    aria-current="page"
    aria-disabled={disabled}
    class:active={active || matching($page.url.pathname, base + href, startsWith)}
    {...aProps}
    {...buttonProps}
    {onclick}>
    <slot />
  </svelte:element>
</li>

<script>
  import { page } from '$app/stores';
  import { base } from '$app/paths';

  let { href, startsWith, disabled, active, button, onclick, classes, liClazz } = $props();

  const aProps = $derived(!button && { href: base + href });
  const buttonProps = $derived(button && { type: 'button' });

  function matching(path, pathName = '', startsWith = false) {
    return (
      path.toUpperCase() === pathName.toUpperCase() ||
      path.toUpperCase() === (pathName + '/').toUpperCase() ||
      (startsWith && path.startsWith(pathName))
    );
  }
</script>
