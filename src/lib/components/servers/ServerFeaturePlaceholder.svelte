<div class="container">
  <div class="card">
    <CardHeader>
      <span slot="left">{$_(title)}</span>
    </CardHeader>
    <div class="card-body text-center vstack gap-3 py-5">
      <div>
        <i class="{icon} fa-3x text-body-secondary" aria-hidden="true"></i>
      </div>
      <div class="fw-semibold">{$_('pages.servers.placeholder.title')}</div>
      <div class="text-body-secondary">{$_(description)}</div>
    </div>
  </div>
</div>

<script>
  import { _ } from 'svelte-i18n';

  import CardHeader from '$lib/components/CardHeader.svelte';

  /** i18n key of the card heading. */
  export let title;
  /** i18n key of the "what will land here" sentence. */
  export let description;
  export let icon = 'fa-solid fa-screwdriver-wrench';
</script>
