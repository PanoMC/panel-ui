<div class="card">
  <div class="card-header pb-0 vstack gap-2">
    <div class="card-title">{$_('pages.migration.platforms-title')}</div>
    <!-- Nav tabs -->
    <ul class="nav nav-tabs border-bottom-0" id="migrateTabs" role="tablist">
      <li class="nav-item" role="presentation">
        <button
          class="nav-link active"
          id="azuriom-tab"
          data-bs-toggle="tab"
          data-bs-target="#azuriom"
          type="button"
          role="tab"
          aria-controls="azuriom"
          aria-selected="true">
          Azuriom
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          id="namelessmc-tab"
          data-bs-toggle="tab"
          data-bs-target="#namelessmc"
          type="button"
          role="tab"
          aria-controls="namelessmc"
          aria-selected="false">
          NamelessMC
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          id="craftweb-tab"
          data-bs-toggle="tab"
          data-bs-target="#craftweb"
          type="button"
          role="tab"
          aria-controls="craftweb"
          aria-selected="false">
          <i class="fas fa-award me-1"></i> CraftWeb
        </button>
      </li>
    </ul>
  </div>

  <div class="card-body">
    <!-- Tab panes -->
    <div class="tab-content">
      <div class="tab-pane active" id="azuriom" role="tabpanel" aria-labelledby="azuriom-tab">
        <NoContent text={$_('pages.migration.not-available')} />
      </div>
      <div class="tab-pane" id="namelessmc" role="tabpanel" aria-labelledby="namelessmc-tab">
        <NoContent text={$_('pages.migration.not-available')} />
      </div>
      <div class="tab-pane" id="craftweb" role="tabpanel" aria-labelledby="craftweb-tab">
        <CraftWebTribute />
      </div>
    </div>
  </div>
</div>

<div class="card">
  <div class="card-header pb-0 vstack gap-2">
    <div class="card-title">{$_('pages.migration.plugins-title')}</div>
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
          aria-selected="false"
          disabled>
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
        <NoContent text="Not available yet." />
      </div>

      <div class="tab-pane" id="other" role="tabpanel" aria-labelledby="other-tab">
        <NoContent text="Not available yet." />
      </div>
    </div>
  </div>
</div>

<script>
  import { _ } from 'svelte-i18n';

  import NoContent from '$lib/components/NoContent.svelte';
  import CraftWebTribute from './migration/CraftWebTribute.svelte';
  import AuthMeMigration from './migration/AuthMeMigration.svelte';
</script>
