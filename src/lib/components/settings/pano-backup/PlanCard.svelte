<div class="card text-bg-info blocks">
  <div class="card-body pb-5">
    <div class="d-flex flex-wrap align-items-center gap-2">
      <div class="vstack min-w-0">
        {#if label}
          <span class="small opacity-75">{label}</span>
        {/if}
        <div class="d-flex align-items-center gap-2">
          <span class="h5 mb-0">{name}</span>
          {#if badge}
            <span class="badge text-bg-{badge.variant}">{badge.text}</span>
          {/if}
        </div>
      </div>
      {#if action}
        <div class="ms-auto">
          {@render action()}
        </div>
      {/if}
    </div>

    {#each usages as usage (usage.id)}
      <div class="mt-3">
        <div class="d-flex small mb-1 gap-2">
          <span>{usage.label}</span>
          {#if usage.percent != null}
            <span class="ms-auto opacity-75">{usage.percent}%</span>
          {/if}
        </div>
        <div
          class="progress"
          style="height: 10px;"
          role="progressbar"
          aria-label={usage.ariaLabel ?? usage.label}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={usage.percent ?? 0}>
          <div class="progress-bar bg-white" style="width: {usage.percent ?? 0}%"></div>
        </div>
        {#if usage.note}
          <div class="form-text text-reset">{usage.note}</div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<script>
  /**
   * A plan and how much of it is used, on the info colour: the Pano Backup account and the Pano
   * Mail plan share it.
   */

  /**
   * @type {{
   *   label?: string,
   *   name: string,
   *   badge?: { text: string, variant: string } | null,
   *   usages?: Array<{ id: string, label: string, percent?: number | null, note?: string, ariaLabel?: string }>,
   *   action?: import('svelte').Snippet,
   * }}
   */
  let { label = '', name, badge = null, usages = [], action } = $props();
</script>
