<div class="card">
  <div class="card-header pb-0 vstack gap-2">
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

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import NoContent from '$lib/components/NoContent.svelte';
  import CraftWebTribute from './migration/CraftWebTribute.svelte';

  const pageTitle = getContext('pageTitle');

  if (pageTitle) {
    pageTitle.set('components.settings-layout.migration');
  }
</script>
