<a
  class="badge focus-ring text-decoration-none {category.title === '-'
    ? 'text-bg-primary'
    : 'text-bg-secondary'}"
  title={filterTitle}
  href="{base}/{pageType}{buildQueryParams({ categoryUrl: category.url, ...query })}">
  {category.title === '-' ? noCategoryText : category.title}
</a>

<script>
  import { _ } from 'svelte-i18n';
  import { base } from '@panomc/sdk/core/js/basePath.js';
  import { buildQueryParams } from '$lib/api.util.js';

  export let category;
  export let pageType; // "posts" or "tickets"
  export let filterTitle;
  export let noCategoryText;
  /** More query parameters for the filtered list, e.g. the status tab the row belongs to. */
  export let query = {};
</script>
