<style>
  /* Robust centering for scrollable flex containers */
  .scroll-center::before,
  .scroll-center::after {
    content: '';
    margin: auto;
  }
</style>

<div class="row d-flex align-items-center gy-3 justify-content-lg-between justify-content-center">
  {#if (leftClasses !== null && $$slots.left) || (leftClasses !== null && leftClasses !== undefined)}
    <div
      class="col-lg-auto col-12 d-flex justify-content-lg-start overflow-x-auto scroll-center {leftClasses ||
        ''}">
      <slot name="left" />
    </div>
  {/if}
  {#if (middleClasses !== null && $$slots.middle) || (middleClasses !== null && middleClasses !== undefined)}
    <div
      class="col-lg-auto col-12 order-lg-2 order-last d-flex justify-content-center overflow-x-auto scroll-center {middleClasses ||
        ''}">
      <slot name="middle" />
    </div>
  {/if}
  {#if (rightClasses !== null && $$slots.right) || (rightClasses !== null && rightClasses !== undefined)}
    <div
      class="col-lg-auto col-12 order-3 d-flex justify-content-lg-end overflow-x-auto scroll-center {rightClasses ||
        ''}">
      <slot name="right" />
    </div>
  {/if}
</div>

<script>
  export let leftClasses = undefined;
  export let middleClasses = undefined;
  export let rightClasses = undefined;
</script>
