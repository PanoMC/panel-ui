{#if status !== "UNKNOWN"}{/if}
{#if status === "VERIFIED"}
  <span
    class="text-success"
    use:tooltip={[
      $_('components.verified-status.verified'),
      { placement: "bottom" },
    ]}>
    <i class="fa-regular fa-circle-check"></i>
  </span>
{:else if status === "NOT_VERIFIED"}
  <span
    class="text-warning"
    use:tooltip={[
                            $_('components.verified-status.not-verified'),
                            { placement: "bottom" },
                          ]}>
    <i class="fa-solid fa-circle-exclamation me-1"></i>
  </span>
{/if}

<script>
  import { _ } from "svelte-i18n";
  import tooltip from "$lib/tooltip.util";

  export let status;
</script>