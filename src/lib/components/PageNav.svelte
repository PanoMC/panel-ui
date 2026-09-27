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

  /* The page that is open is the one this submenu is about, so its pill is the panel's primary
     rather than Bootstrap's hard-coded default. Only the surface is overridden: the text colour
     is left to the theme, which is what keeps the pill legible on it. */
  .nav-pills {
    --bs-nav-pills-link-active-bg: var(--bs-primary);
  }
</style>

<ul class="nav nav-pills d-flex flex-nowrap overflow-x-auto text-nowrap no-scrollbar scroll-center">
  <slot />
</ul>
