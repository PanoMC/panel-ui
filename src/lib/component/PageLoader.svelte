<script>
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { navigating } from "$app/stores";

  const progress = tweened(0, { easing: cubicOut });
  const opacity = tweened(1, { easing: cubicOut });

  $: {
    if ($navigating) {
      opacity.set(1, { duration: 0 });
      progress.set(0.7, { duration: 3500 });
    } else {
      const duration = 1000;

      progress.set(1, { duration });
      opacity.set(0, { duration: duration / 2, delay: duration / 2 });

      setTimeout(() => {
        progress.set(0, { duration: 0 });
      }, duration);
    }
  }
</script>


<div class="progress-bar" style={`opacity: ${$opacity}`}>
  <div class="progress-sliver" style={`--width: ${$progress * 100}%`}></div>
</div>

<style>
    .progress-bar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 0.25rem;
        z-index: 999;
        pointer-events: none; /* this is important since we aren't dismounting */
    }

    .progress-sliver {
        width: var(--width);
        background-color: #1e96fc;
        height: 100%;
    }
</style>