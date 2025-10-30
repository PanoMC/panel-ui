<div class="card-header">
  <div class="row d-flex align-items-center gx-0 gy-2">
    <div
      class="{$$slots.middle ? 'col-lg-3' : 'col-lg-6'} d-flex justify-content-lg-between justify-content-center {leftClasses}">
      <slot name="left" />
    </div>
    {#if $$slots.middle}
      <div
        class="col-lg-6 d-flex justify-content-center {middleClasses}">
        <slot name="middle" />
      </div>
    {/if}
    <div
      class="{$$slots.middle ? 'col-lg-3' : 'col-lg-6'} d-flex justify-content-lg-end justify-content-center {rightClasses}">
      <!-- Filters -->
      <slot name="right" />
    </div>
  </div>
</div>

<script>
  export let leftClasses = "";
  export let rightClasses = "";
  export let middleClasses = "";
</script>
