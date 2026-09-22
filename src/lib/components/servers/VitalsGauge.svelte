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
    stroke: var(--bs-secondary-bg);
  }

  .gauge-arc {
    transition:
      stroke-dashoffset 0.3s ease,
      stroke 0.3s ease;
  }

  .gauge-value {
    line-height: 1;
    white-space: nowrap;
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
  <div class="gauge-ring position-relative">
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <circle class="gauge-track" cx="18" cy="18" r={RADIUS} fill="none" stroke-width={STROKE} />
      {#if dashOffset != null}
        <!-- Rotated so the arc starts at twelve o'clock instead of at three. -->
        <circle
          class="gauge-arc"
          cx="18"
          cy="18"
          r={RADIUS}
          fill="none"
          stroke={arcColor}
          stroke-width={STROKE}
          stroke-linecap="round"
          stroke-dasharray={CIRCUMFERENCE}
          stroke-dashoffset={dashOffset}
          transform="rotate(-90 18 18)" />
      {/if}
    </svg>
    <span
      class="gauge-value position-absolute top-50 start-50 translate-middle fw-semibold"
      style={valueStyle}>
      {text}
    </span>
  </div>
</div>

<script>
  /**
   * One vital as a small donut: a track, an arc for the ratio, the figure in the middle and the
   * name of the vital underneath (§2.4.18 C, revised).
   *
   * It is plain SVG rather than a chart instance, because a servers modal draws a dozen of these
   * at once and none of them is interactive beyond its tooltip.
   *
   * A vital can be known without being a ratio — a server that reports the bytes it uses but no
   * limit to compare them against — and then the ring is simply left empty with the figure still
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
   * @property value The ratio in percent, or null when there is nothing to fill the ring with.
   * @property text What the middle of the ring reads, e.g. `42%`, `1.3 GB` or `—`.
   * @property label The name of the vital; read by assistive tech and the tooltip fallback.
   * @property detail The tooltip; falls back to the label.
   * @property dangerAbove Percentage from which the arc turns red, or null to keep it primary.
   * @property dim Whether this gauge belongs to a server that is offline.
   * @property size Any CSS length; the ring is square and everything scales with it.
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

  const RADIUS = 15.5;
  const STROKE = 3.5;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  const percent = $derived.by(() => {
    const number = value == null ? Number.NaN : Number(value);

    return Number.isFinite(number) ? Math.max(0, Math.min(100, number)) : null;
  });

  const dashOffset = $derived(
    percent == null ? null : CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE,
  );

  const arcColor = $derived(
    dangerAbove != null && percent != null && percent >= dangerAbove
      ? 'var(--bs-danger)'
      : 'var(--bs-primary)',
  );

  const sizeStyle = $derived(`--vitals-gauge-size: ${size}`);

  // `1.3 GB` needs more room inside the ring than `42%` does, so the figure is sized to its own
  // length instead of being clipped by a one-size-fits-all rule.
  const valueStyle = $derived.by(() => {
    const length = String(text ?? '').length;
    const scale = length >= 6 ? 0.17 : length >= 4 ? 0.2 : 0.23;

    return `font-size: calc(var(--vitals-gauge-size) * ${scale})`;
  });
  const ariaLabel = $derived([label, text, detail].filter(Boolean).join(' · '));
</script>
