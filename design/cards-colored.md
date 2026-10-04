# Colored cards

A card with a colored background that shows one statistic. Reference: the vitals cards on the
server overview page (`panel-ui/src/lib/pages/servers/ServerOverview.svelte`, `ServerVitalCard`)
and `src/lib/components/charts/SummaryStatCard.svelte`. Reuse those components; copy their style
when a new one is needed.

## Card

- Colored background through Bootstrap's `text-bg-{variant}` on the `card` (`text-bg-primary`,
  `text-bg-warning`, `text-bg-info`, `text-bg-secondary`…). It sets a contrasting text color; do
  not set text colors by hand.

## Text

- **Title** — unstyled text: no size class, no weight, no color. It may sit on the left or on the
  right.
- **Statistic** — the value is shown in large type (`fs-2 lh-1`). A secondary value beside it stays
  small.

## Chart (optional)

A chart may fill the bottom of the card.

- Colors must suit the card's background and keep enough contrast against it.
- **Minimal**: no axis labels, ticks, legend, grid or any other small text on the chart.
- Details appear **only on hover**, as a short summary tooltip.

## Example

```svelte
<div class="card text-bg-primary overflow-hidden">
  <div class="card-body p-0 d-flex flex-column">
    <div class="px-3 pt-3 pb-2">
      <p class="text-truncate m-0">{title}</p>
      <div class="d-flex align-items-baseline gap-2">
        <span class="fs-2 lh-1">{value}</span>
        {#if secondary}
          <span class="text-truncate small">{secondary}</span>
        {/if}
      </div>
    </div>
    <div class="mt-auto" style="height: 64px;">
      <canvas bind:this={canvas}></canvas>
    </div>
  </div>
</div>
```

## Don't

- A bold, resized or hand-colored title.
- The statistic in normal-size text.
- Axis numbers, legends, data labels or grid lines on the chart.
- Chart colors that clash with, or disappear into, the card's background.
