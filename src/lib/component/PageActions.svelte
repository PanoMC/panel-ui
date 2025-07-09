<div class="row gy-3 d-flex align-items-center">
  <div
    class="col-lg-4 col-12 d-flex justify-content-lg-start justify-content-center {leftClasses}">
    <slot name="left" />
  </div>
  <div
    class="col-lg-4 col-12 order-lg-2 order-last d-flex justify-content-center {middleClasses}">
    <slot name="middle" />
  </div>
  <div
    class="col-lg-4 col-12 order-3 d-flex justify-content-lg-end justify-content-center {rightClasses}">
    <slot name="right" />
  </div>
</div>

<script>
  export let leftClasses;
  export let middleClasses;
  export let rightClasses;
</script>
