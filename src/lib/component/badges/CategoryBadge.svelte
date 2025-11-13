<a
  class="badge focus-ring text-decoration-none {category.title === '-' ? 'text-bg-primary' : 'text-bg-secondary'}"
  title={filterTitle}
  href="{base}/{pageType}?categoryUrl={category.url}">
  {category.title === "-"
    ? noCategoryText
    : category.title}
</a>

<script>
  import { _ } from "svelte-i18n";
  import { base } from "$app/paths";

  export let category;
  export let pageType; // "posts" or "tickets"
  export let filterTitle;
  export let noCategoryText;
</script>

