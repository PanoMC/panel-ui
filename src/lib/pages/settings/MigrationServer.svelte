<div class="card">
  <div class="card-header pb-0 vstack gap-2">
    <!-- Nav tabs -->
    <ul class="nav nav-tabs border-bottom-0" id="serverMigrateTabs" role="tablist">
      <li class="nav-item" role="presentation">
        <button
          class="nav-link active"
          id="vanilla-tab"
          data-bs-toggle="tab"
          data-bs-target="#vanilla"
          type="button"
          role="tab"
          aria-controls="vanilla"
          aria-selected="true">
          {$_('pages.migration.banned')}
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          id="spigot-tab"
          data-bs-toggle="tab"
          data-bs-target="#spigot"
          type="button"
          role="tab"
          aria-controls="spigot"
          aria-selected="false">
          {$_('pages.migration.whitelist')}
        </button>
      </li>
    </ul>
  </div>

  <div class="card-body">
    <!-- Tab panes -->
    <div class="tab-content">
      <div class="tab-pane active" id="vanilla" role="tabpanel" aria-labelledby="vanilla-tab">
        <NoContent text={$_('pages.migration.not-available')} />
      </div>
      <div class="tab-pane" id="spigot" role="tabpanel" aria-labelledby="spigot-tab">
        <NoContent text={$_('pages.migration.not-available')} />
      </div>
    </div>
  </div>
</div>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import NoContent from '$lib/components/NoContent.svelte';

  const pageTitle = getContext('pageTitle');

  if (pageTitle) {
    pageTitle.set('components.settings-layout.migration');
  }
</script>
