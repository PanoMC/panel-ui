{#if status !== "UNKNOWN"}{/if}
{#if status === "VERIFIED"}
                        <span
                          class="text-success"
                          use:tooltip={[
                            "Verified by Pano",
                            { placement: "bottom" },
                          ]}>
                          <i class="fa-regular fa-circle-check"></i>
                        </span>
{:else if status === "NOT_VERIFIED"}
  <div
    class="text-warning"
    use:tooltip={[
                            "Not verified by Pano, use at your own risk!",
                            { placement: "bottom" },
                          ]}>
    <i class="fa-solid fa-circle-exclamation me-1"></i>
  </div>
{/if}

<script>
  import tooltip from "$lib/tooltip.util"

  export let status;
</script>