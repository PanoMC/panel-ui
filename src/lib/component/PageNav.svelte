<style>
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  /* Robust centering for scrollable flex containers */
  .scroll-center {
    justify-content: center;
  }
  .scroll-center::before,
  .scroll-center::after {
    content: '';
    margin: auto;
  }
</style>

<ul class="nav nav-pills d-flex flex-nowrap overflow-x-auto text-nowrap no-scrollbar scroll-center">
  <slot />
</ul>
