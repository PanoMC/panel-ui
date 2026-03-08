<div class="card">
  <div class="card-header pb-0 vstack gap-2">
    <!-- Nav tabs -->
    <ul class="nav nav-tabs border-bottom-0" id="pluginMigrateTabs" role="tablist">
      <li class="nav-item" role="presentation">
        <button
          class="nav-link active"
          id="authme-tab"
          data-bs-toggle="tab"
          data-bs-target="#authme"
          type="button"
          role="tab"
          aria-controls="authme"
          aria-selected="true">
          AuthMe Reloaded
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          id="luckperms-tab"
          data-bs-toggle="tab"
          data-bs-target="#luckperms"
          type="button"
          role="tab"
          aria-controls="luckperms"
          aria-selected="false">
          LuckPerms
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          id="other-tab"
          data-bs-toggle="tab"
          data-bs-target="#other"
          type="button"
          role="tab"
          aria-controls="other"
          aria-selected="false"
          disabled>
          Other Plugins
        </button>
      </li>
    </ul>
  </div>

  <div class="card-body">
    <!-- Tab panes -->
    <div class="tab-content">
      <div class="tab-pane active" id="authme" role="tabpanel" aria-labelledby="authme-tab">
        <AuthMeMigration />
      </div>

      <div class="tab-pane" id="luckperms" role="tabpanel" aria-labelledby="luckperms-tab">
        <LuckPermsMigration />
      </div>

      <div class="tab-pane" id="other" role="tabpanel" aria-labelledby="other-tab">
        <NoContent text="Not available yet." />
      </div>
    </div>
  </div>
</div>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import NoContent from '$lib/components/NoContent.svelte';
  import AuthMeMigration from './migration/AuthMeMigration.svelte';
  import LuckPermsMigration from './migration/LuckPermsMigration.svelte';

  const pageTitle = getContext('pageTitle');

  if (pageTitle) {
    pageTitle.set('components.settings-layout.migration');
  }
</script>
