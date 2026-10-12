<!-- The part of a page that animates when a new page is put in it: put it around the content that
     swaps, and keep what stays (the navbar, a page's tab pills) outside it, or mark that element
     `data-page-static` in a layout whose own content is wrapped in one. It has no box of its own
     (`display: contents`), so the layout around it does not change.

     The animation is plain CSS on what is inserted (src/styles/style.scss): a new page's elements
     play it as they appear, while the ones already there are never replayed, so nothing flashes. -->
<div class="page-slot">
  <slot />
</div>
