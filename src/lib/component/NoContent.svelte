{#if dark}
  <div
    class="card border-0 opacity-50 bg-transparent animate__animated animate__zoomIn"
    data-bs-theme="dark">
    <div class="card-body vstack gap-3 text-center">
      <span class="{icon}"></span>
      <p class="mb-0">{text}</p>
    </div>
  </div>
{:else}
  <div
    class="card border-0 opacity-50 bg-transparent animate__animated animate__zoomIn">
    <div class="card-body vstack gap-3 text-center">
      <span class="{icon}"></span>
      <p class="mb-0">{text}</p>
    </div>
  </div>
{/if}

<slot />

<script>
  import { _ } from "svelte-i18n";

  export let dark = false;
  export let icon = "fa-solid fa-ghost fa-3x";
  export let text = $_("components.no-content.here-is-empty");
</script>
