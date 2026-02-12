<div class="card border-0 opacity-50 bg-transparent">
  <div class="card-body vstack gap-3 text-center">
    <span class={icon}></span>
    <p class="mb-0">{text}</p>
  </div>
</div>

<slot />

<script>
  import { _ } from 'svelte-i18n';

  export let icon = 'fa-solid fa-square fa-3x';
  export let text = $_('components.no-content.here-is-empty');
</script>
