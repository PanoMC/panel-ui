<div class="card-header py-3">
  <div class="row d-flex align-items-center gx-0 gy-2 {rowClasses}">
    <div
      class="{$$slots.middle
        ? $$slots.right && showRight
          ? 'col-lg-3'
          : 'col-lg-6'
        : $$slots.right && showRight
          ? 'col-lg-6'
          : 'col-12'} d-flex {$$slots.right && showRight && !$$slots.middle
        ? 'justify-content-lg-between'
        : 'justify-content-lg-start'} justify-content-center text-center text-lg-start min-w-0 {truncateLeftSlot
        ? 'text-truncate text-nowrap'
        : 'text-wrap'} {leftClasses}">
      <slot name="left" />
    </div>
    {#if $$slots.middle}
      <div class="col-lg-6 d-flex justify-content-center {middleClasses}">
        <slot name="middle" />
      </div>
    {/if}
    {#if $$slots.right && showRight}
      <div
        class="{$$slots.middle
          ? 'col-lg-3'
          : 'col-lg-6'} d-flex justify-content-lg-end justify-content-center {rightClasses}">
        <!-- Filters -->
        <slot name="right" />
      </div>
    {/if}
  </div>
</div>

<script>
  /** When false, the left slot can wrap (e.g. narrow cards / long titles). */
  export let truncateLeftSlot = true;
  export let leftClasses = '';
  export let rightClasses = '';
  export let middleClasses = '';
  /**
   * The row the columns sit in. It has no `justify-content` of its own, so by default they pack
   * to the left; a header whose columns are content-sized passes `justify-content-lg-between`
   * here to deal the rest of the width out between them.
   */
  export let rowClasses = '';
  export let showRight = true;
</script>
