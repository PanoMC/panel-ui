<PageActions>
  <div slot="right" class="d-flex align-items-center gap-2">
    {#if activeTab === 'authme' && authMeStep === 'upload' && authMeConfigFile && !authMeDbUpload}
      <button
        class="btn btn-primary"
        on:click={authMeUploadAndPreview}
        disabled={authMeProcessing}>
        {#if authMeProcessing}
          <span class="spinner-border spinner-border-sm me-2" role="status"></span>
        {/if}
        {#if authMeDbInfo}
          <i class="fas fa-plug me-1"></i> {$_('buttons.connect')} & {$_('buttons.view')}
        {:else}
          <i class="fas fa-upload me-1"></i> {$_('buttons.upload')} & {$_('buttons.view')}
        {/if}
      </button>
    {/if}
  </div>
</PageActions>

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
          aria-selected="true"
          on:click={() => (activeTab = 'authme')}>
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
          on:click={() => (activeTab = 'luckperms')}>
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
        <AuthMeMigration
          bind:currentStep={authMeStep}
          bind:selectedUsers={authMeSelected}
          bind:deleteUsers={authMeDelete}
          bind:isImporting={authMeImporting}
          bind:isProcessing={authMeProcessing}
          bind:configFile={authMeConfigFile}
          bind:showDatabaseUpload={authMeDbUpload}
          bind:dbConnectionInfo={authMeDbInfo}
          bind:resetForm={authMeResetForm}
          bind:importUsers={authMeImportUsers}
          bind:uploadAndPreview={authMeUploadAndPreview} />
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

  import PageActions from '$lib/components/PageActions.svelte';
  import tooltip from '$lib/tooltip.util';

  import NoContent from '$lib/components/NoContent.svelte';
  import AuthMeMigration from './migration/AuthMeMigration.svelte';
  import LuckPermsMigration from './migration/LuckPermsMigration.svelte';

  const pageTitle = getContext('pageTitle');

  if (pageTitle) {
    pageTitle.set('components.settings-layout.migration');
  }

  let activeTab = 'authme';

  // AuthMe states
  let authMeStep;
  let authMeSelected = new Set();
  let authMeDelete = new Set();
  let authMeImporting;
  let authMeProcessing;
  let authMeConfigFile;
  let authMeDbUpload;
  let authMeDbInfo;
  let authMeResetForm;
  let authMeImportUsers;
  let authMeUploadAndPreview;
</script>
