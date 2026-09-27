<style>
  .vitals-gauge {
    width: var(--vitals-gauge-size, 44px);
    flex: 0 0 auto;
  }

  .gauge-ring {
    width: 100%;
    aspect-ratio: 1;
  }

  .gauge-ring svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .gauge-track {
    fill: var(--bs-secondary-bg);
  }

  /* The slice colour lives here rather than in a `fill` attribute: browsers do not resolve
     `var()` inside SVG presentation attributes, so an attribute would silently paint nothing. */
  .gauge-arc {
    fill: var(--bs-primary);
    transition: fill 0.3s ease;
  }

  .gauge-arc.is-danger {
    fill: var(--bs-danger);
  }

  /* The figure sits on top of the solid pie, so it carries a halo in the track colour: invisible
     over the track, and enough separation over the fill to keep the digits readable. */
  .gauge-value {
    fill: currentColor;
    stroke: var(--bs-secondary-bg);
    paint-order: stroke fill;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
</style>

<div
  class="vitals-gauge text-center"
  class:opacity-50={dim}
  style={sizeStyle}
  role="img"
  aria-label={ariaLabel}
  use:tooltip={[detail || label, { placement: 'bottom', appendTo: TOOLTIP_HOST }]}>
  <div class="gauge-ring">
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <circle class="gauge-track" cx={CENTRE} cy={CENTRE} r={RADIUS} />
      {#if solid}
        <circle class="gauge-arc" class:is-danger={danger} cx={CENTRE} cy={CENTRE} r={RADIUS} />
      {:else if wedge}
        <path class="gauge-arc" class:is-danger={danger} d={wedge} />
      {/if}
      {#if text}
        <text
          class="gauge-value"
          x={CENTRE}
          y={CENTRE}
          text-anchor="middle"
          dominant-baseline="central"
          font-size={valueFontSize}
          stroke-width="1.6"
          stroke-linejoin="round">
          {text}
        </text>
      {/if}
    </svg>
  </div>
</div>

<script>
  /**
   * One vital as a small solid pie: the track behind, the slice for the ratio, the figure in the
   * middle and the name of the vital underneath (§2.4.18 C, revised).
   *
   * It is plain SVG rather than a chart instance, because a servers modal draws a dozen of these
   * at once and none of them is interactive beyond its tooltip.
   *
   * A vital can be known without being a ratio — a server that reports the bytes it uses but no
   * limit to compare them against — and then the pie is simply left empty with the figure still
   * in the centre. A vital that is not known at all arrives as `text = '—'` with the "not
   * reported yet" line as its `detail`.
   */
  import tooltip from '$lib/tooltip.util';

  /**
   * @type {{
   *   value?: number|null,
   *   text?: string,
   *   label?: string,
   *   detail?: string|null,
   *   dangerAbove?: number|null,
   *   dim?: boolean,
   *   size?: string,
   * }}
   * @property value The ratio in percent, or null when there is nothing to fill the pie with.
   * @property text What the middle of the pie reads, e.g. `42%`, `1.3 GB` or `—`.
   * @property label The name of the vital; read by assistive tech and the tooltip fallback.
   * @property detail The tooltip; falls back to the label.
   * @property dangerAbove Percentage from which the arc turns red, or null to keep it primary.
   * @property dim Whether this gauge belongs to a server that is offline.
   * @property size Any CSS length; the pie is square and everything scales with it.
   */
  let {
    value = null,
    text = '',
    label = '',
    detail = null,
    dangerAbove = null,
    dim = false,
    size = '46px',
  } = $props();

  // Interactive tippies default to the reference's parent, where the next card in the grid paints

  // over them; the body is the only host every card can share.

  const TOOLTIP_HOST = () => document.body;

  const CENTRE = 18;
  const RADIUS = 15.5;

  const percent = $derived.by(() => {
    const number = value == null ? Number.NaN : Number(value);

    return Number.isFinite(number) ? Math.max(0, Math.min(100, number)) : null;
  });

  /** A full pie is a plain disc; anything less is a wedge cut from twelve o'clock. */
  const solid = $derived(percent != null && percent >= 100);

  const wedge = $derived.by(() => {
    if (percent == null || percent <= 0) {
      return null;
    }

    // Measured clockwise from twelve o'clock, which is -90° on the circle's own axis.
    const angle = (percent / 100) * 2 * Math.PI - Math.PI / 2;
    const x = CENTRE + RADIUS * Math.cos(angle);
    const y = CENTRE + RADIUS * Math.sin(angle);

    return [
      `M ${CENTRE} ${CENTRE}`,
      `L ${CENTRE} ${CENTRE - RADIUS}`,
      `A ${RADIUS} ${RADIUS} 0 ${percent > 50 ? 1 : 0} 1 ${x} ${y}`,
      'Z',
    ].join(' ');
  });

  const danger = $derived(dangerAbove != null && percent != null && percent >= dangerAbove);

  const sizeStyle = $derived(`--vitals-gauge-size: ${size}`);

  // `1.3 GB` needs more room inside the pie than `42%` does, so the figure is sized to its own
  // length in viewBox units instead of being clipped by a one-size-fits-all rule.
  const valueFontSize = $derived.by(() => {
    const length = String(text ?? '').length;

    return length >= 6 ? 6 : length >= 4 ? 7.2 : 8.4;
  });
  const ariaLabel = $derived([label, text, detail].filter(Boolean).join(' · '));
</script>
