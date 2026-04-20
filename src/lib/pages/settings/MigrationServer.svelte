<div class="card">
  <div class="card-header pb-0 vstack gap-2">
    <!-- Nav tabs -->
    <ul class="nav nav-tabs border-bottom-0" id="serverMigrateTabs" role="tablist">
      <li class="nav-item" role="presentation">
        <button
          class="nav-link active"
          id="banned-tab"
          data-bs-toggle="tab"
          data-bs-target="#banned"
          type="button"
          role="tab"
          aria-controls="banned"
          aria-selected="true"
          on:click={() => (activeTab = 'banned')}>
          {$_('pages.migration.banned')}
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          id="banned-ips-tab"
          data-bs-toggle="tab"
          data-bs-target="#banned-ips"
          type="button"
          role="tab"
          aria-controls="banned-ips"
          aria-selected="false"
          on:click={() => (activeTab = 'banned-ips')}>
          {$_('pages.migration.banned-ips-title')}
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          id="whitelist-tab"
          data-bs-toggle="tab"
          data-bs-target="#whitelist"
          type="button"
          role="tab"
          aria-controls="whitelist"
          aria-selected="false"
          on:click={() => (activeTab = 'whitelist')}>
          {$_('pages.migration.whitelist')}
        </button>
      </li>
    </ul>
  </div>

  <div class="card-body">
    <div class="tab-content">
      <div class="tab-pane active" id="banned" role="tabpanel" aria-labelledby="banned-tab">
        <BannedPlayersMigration
          bind:file={bannedFile}
          bind:currentStep={bannedStep}
          bind:previewData={bannedPreview}
          bind:selectedItems={bannedSelected}
          bind:skipExpired={bannedSkipExpired}
          bind:overrideAlreadyBanned={bannedOverride}
          bind:isProcessing={bannedProcessing}
          bind:isImporting={bannedImporting}
          bind:importResult={bannedResult}
          bind:uploadError={bannedError}
          bind:resetForm={bannedResetForm}
          bind:importItems={bannedImportItems} />
      </div>
      <div
        class="tab-pane"
        id="banned-ips"
        role="tabpanel"
        aria-labelledby="banned-ips-tab">
        <BannedIpMigration
          bind:file={bannedIpFile}
          bind:currentStep={bannedIpStep}
          bind:previewData={bannedIpPreview}
          bind:selectedItems={bannedIpSelected}
          bind:skipExpired={bannedIpSkipExpired}
          bind:overrideExisting={bannedIpOverride}
          bind:isProcessing={bannedIpProcessing}
          bind:isImporting={bannedIpImporting}
          bind:importResult={bannedIpResult}
          bind:uploadError={bannedIpError}
          bind:resetForm={bannedIpResetForm}
          bind:importItems={bannedIpImportItems} />
      </div>
      <div class="tab-pane" id="whitelist" role="tabpanel" aria-labelledby="whitelist-tab">
        <NoContent text={$_('pages.migration.not-available')} />
      </div>
    </div>
  </div>
</div>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import NoContent from '$lib/components/NoContent.svelte';
  import BannedPlayersMigration from './migration/BannedPlayersMigration.svelte';
  import BannedIpMigration from './migration/BannedIpMigration.svelte';

  const pageTitle = getContext('pageTitle');

  if (pageTitle) {
    pageTitle.set('components.settings-layout.migration');
  }

  let activeTab = 'banned';

  // Banned players migration states
  let bannedFile;
  let bannedStep;
  let bannedPreview;
  let bannedSelected;
  let bannedSkipExpired;
  let bannedOverride;
  let bannedProcessing;
  let bannedImporting;
  let bannedResult;
  let bannedError;
  let bannedResetForm;
  let bannedImportItems;

  // Banned IPs migration states
  let bannedIpFile;
  let bannedIpStep;
  let bannedIpPreview;
  let bannedIpSelected;
  let bannedIpSkipExpired;
  let bannedIpOverride;
  let bannedIpProcessing;
  let bannedIpImporting;
  let bannedIpResult;
  let bannedIpError;
  let bannedIpResetForm;
  let bannedIpImportItems;
</script>
