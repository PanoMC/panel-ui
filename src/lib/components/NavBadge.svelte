<!-- The small count on the corner of a menu entry that needs the admin, like the notifications badge
     in the navbar: "3" on Addons, "1" on Updates. Put it in a `position-relative` wrapper around the
     icon or the text. Shown only while there is something to count. -->
{#if count > 0}
  <span
    class="position-absolute top-0 start-100 translate-middle badge rounded-pill text-bg-secondary {clazz}"
    role="img"
    aria-label={label ? `${label}: ${count}` : String(count)}
    use:tooltip={[label]}
    {...rest}>
    {count}
  </span>
{/if}

<script>
  import tooltip from '$lib/tooltip.util';

  /**
   * @type {{ count?: number, label?: string, class?: string, [key: string]: any }}
   *   `count` is what to show (hidden at 0), `label` the tooltip and the spoken name.
   */
  let { count = 0, label = '', class: clazz = '', ...rest } = $props();
</script>
