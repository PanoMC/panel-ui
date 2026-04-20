<span class="badge" class:text-bg-primary={variant === 'panel'} class:text-bg-secondary={variant === 'migration'} class:text-bg-info={variant === 'server'} class:text-bg-light={variant === 'other'} use:tooltip={[tooltipText]}>
  <i class={icon} class:me-1={!!label}></i>{label}
</span>

<script>
  import { _ } from 'svelte-i18n';
  import tooltip from '$lib/tooltip.util';

  export let source;

  $: variant = deriveVariant(source);
  $: label = deriveLabel(source);
  $: icon = deriveIcon(variant);
  $: tooltipText = source || '';

  function deriveVariant(src) {
    if (!src) return 'other';
    const upper = src.toUpperCase();
    if (upper === 'PANEL') return 'panel';
    if (upper.startsWith('MIGRATION')) return 'migration';
    if (upper === 'SERVER') return 'server';
    return 'other';
  }

  function deriveLabel(src) {
    if (!src) return '';
    const upper = src.toUpperCase();
    if (upper === 'PANEL') return $_('pages.player-detail.source-panel');
    if (upper.startsWith('MIGRATION')) return $_('pages.player-detail.source-migration');
    if (upper === 'SERVER') return $_('pages.player-detail.source-server');
    return src;
  }

  function deriveIcon(v) {
    switch (v) {
      case 'panel':
        return 'fas fa-desktop';
      case 'migration':
        return 'fas fa-file-import';
      case 'server':
        return 'fas fa-server';
      default:
        return 'fas fa-circle';
    }
  }
</script>
