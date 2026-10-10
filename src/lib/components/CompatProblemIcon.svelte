{#if text}
  <!-- Same look as the problem icon on a server card: the exclamation, red or amber, and the
       details on hover. The tippy goes to the body so the next card in a grid never paints over it. -->
  <span
    class="{level === 'warning' ? 'text-warning' : 'text-danger'} flex-shrink-0"
    role="img"
    aria-label={text}
    data-compat-problem={level}
    use:tooltip={[text, { appendTo: TOOLTIP_HOST }]}>
    <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
  </span>
{/if}

<script>
  import tooltip from '$lib/tooltip.util';

  const TOOLTIP_HOST = () => document.body;

  /**
   * An exclamation icon whose hover tooltip says what is wrong and what to do. Draws nothing for
   * an empty text.
   * @type {{ text?: string, level?: 'danger' | 'warning' }}
   */
  export let text = '';
  export let level = 'danger';
</script>
