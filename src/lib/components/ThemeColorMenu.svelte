<style>
  .color-dot {
    width: 20px;
    height: 20px;
    padding: 0;
    transition: transform 0.2s ease, border-color 0.2s ease;
    border: 2px solid transparent;
  }

  .color-dot:hover {
    transform: scale(1.2);
  }

  .color-dot.active {
    border-color: var(--bs-primary);
    transform: scale(1.1);
  }
</style>

<div class="d-none d-lg-flex align-items-center gap-2 px-2">
  {#each themeColors as color}
    <button
      type="button"
      class="btn color-dot rounded-circle d-flex align-items-center justify-content-center p-0 border"
      class:active={currentTheme === color.id}
      style="background-color: {color.id === 'system' ? 'transparent' : color.hex}; 
             border: {color.id === 'system' ? '2px solid var(--bs-border-color)' : '2px solid transparent'};"
      on:click={() => onThemeSelect(color.id)}
      title={$_(`components.navbar.theme_names.${color.id}`)}
      aria-label={$_(`components.navbar.theme_names.${color.id}`)}>
    </button>
  {/each}
</div>

<script>
  import { _ } from "svelte-i18n";

  export let currentTheme;
  export let onThemeSelect;

  const themeColors = [
    { id: "light", hex: "#f8f9fa" },
    { id: "dark", hex: "#0a1931" },
    { id: "copper", hex: "#b87333" }
  ];
</script>
