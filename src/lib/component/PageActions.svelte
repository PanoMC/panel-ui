<div
  class="row gy-1 d-flex align-items-center animate__animated animate__slideInDown">
  <div
    class="col-lg-4 col-12 d-flex justify-content-lg-start justify-content-center">
    <slot name="left" />
  </div>
  <div class="col-lg-4 col-12 order-lg-2 order-last">
    <slot name="middle" />
  </div>
  <div
    class="col-lg-4 col-12 order-3 d-flex justify-content-lg-end justify-content-center">
    <slot name="right" />
  </div>
</div>
