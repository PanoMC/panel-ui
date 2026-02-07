<style>
  @media (max-width: 767.98px) {
    .mobile-absolute-actions {
      position: absolute !important;
      top: 0;
      right: 0;
    }
    .mobile-info-padding {
      padding-right: 110px !important;
    }
  }
</style>

<!-- Updates Sub Page -->

<!-- Action Menu -->
<PageActions middleClasses="d-lg-flex d-none">
  <div slot="left">
    <span class="small" use:tooltip={['Last Check', { placement: 'bottom' }]}>
      <i class="fa-regular fa-clock me-2"></i>
      {#if data.lastCheckedAt}
        <DateTime time={data.lastCheckedAt.value} relativeFormat={true} tooltip={false} />
      {:else}
        {$_('pages.settings.updates.never')}
      {/if}
    </span>
  </div>
  <div class="hstack gap-2" slot="right">
    <button
      class="btn btn-secondary"
      class:disabled={loading || $platformUpdating || inProgressResource}
      on:click={checkUpdate}>
      <i class="fa-regular fa-arrows-rotate" class:fa-spin={loading}></i>
      <span class="d-lg-inline d-none ms-2">{$_('buttons.check-updates')}</span>
    </button>
  </div>
</PageActions>

{#if refreshRequired}
  <div class="mb-3">
    <RefreshRequiredAlert />
  </div>
{/if}

<div class="card">
  <div class="card-header">
    {#if data.platformUpdate}
      {$_('pages.settings.updates.platform-updates-count', { values: { count: 1 } })}
    {:else}
      {$_('pages.settings.updates.platform-updates')}
    {/if}
  </div>
  <!-- Pending Update List -->
  {#if !data.platformUpdate}
    <NoContent icon="fas fa-check fa-3x" text={$_('pages.settings.updates.using-latest-pano')} />
  {:else}
    <div class="card-body">
      <ul class="list-group">
        <li class="list-group-item">
          <div class="d-flex gap-3 flex-wrap position-relative">
            <div class="flex-shrink-0">
              <!-- Logo -->
              <div
                class="d-inline-flex rounded justify-content-center align-items-center bg-primary"
                style="width: 64px; height: 64px;">
                <i class="fas fa-box fa-2x text-white" title="Pano"></i>
              </div>
            </div>
            <div class="flex-grow-1 min-w-0 mobile-info-padding">
              <div class="d-flex justify-content-between align-items-start gap-3">
                  <!-- Left: Info -->
                  <div class="vstack gap-2">
                    <div class="d-flex align-items-center gap-2 flex-wrap">
                      <h5 class="mb-0">Pano</h5>
                      <i
                        class="fa-regular fa-circle-check text-success"
                        title={$_('pages.settings.updates.verified')}></i>

                      <span class="badge text-bg-secondary">
                        {data.platformUpdate.channel.capitalize()}
                      </span>
                      <span class="badge text-bg-gray"
                        >{data.platformUpdate.oldVersion}
                        <i class="fas fa-arrow-right fa-xs"></i>
                        {data.platformUpdate.version}</span>
                    </div>

                    <div class="d-flex flex-wrap gap-2 small mb-0">
                      <div>
                        <i class="fas fa-database me-1"></i>
                        {formatBytes(data.platformUpdate.size)}
                      </div>
                      <div>
                        <i class="fas fa-calendar me-1"></i>
                        <DateTime time={data.platformUpdate.releaseDate} />
                      </div>
                    </div>
                  </div>
                  <!-- Right: Actions -->
                  <div class="d-flex align-items-center gap-1 flex-shrink-0 mobile-absolute-actions">
                    <button
                      class="btn btn-sm btn-link"
                      title={$_('pages.settings.updates.changelog')}
                      aria-label={$_('pages.settings.updates.changelog')}
                      class:disabled={loading ||
                        $platformUpdating ||
                        inProgressResource ||
                        updatingAll}
                      on:click={() => showChangelogModal(data.platformUpdate.changelog)}>
                      <i class="fa-regular fa-file-lines fa-lg"></i>
                    </button>

                    <button
                      class="btn btn-sm btn-link"
                      aria-label={$_('pages.settings.updates.copy-hash')}
                      title={$_('pages.settings.updates.copy-hash')}
                      class:disabled={loading ||
                        $platformUpdating ||
                        inProgressResource ||
                        updatingAll}
                      on:click={() => copyHashToClipboard(data.platformUpdate.hash)}>
                      <i class="fa-solid fa-hashtag fa-lg"></i>
                    </button>
                    <button
                      class="btn btn-sm btn-secondary d-flex align-items-center gap-2"
                      on:click={onUpdatePlatformClick}
                      class:disabled={loading ||
                        $platformUpdating ||
                        inProgressResource ||
                        updatingAll}>
                      {#if $platformUpdating}
                        <i class="fas fa-circle-notch fa-spin"></i>
                      {:else}
                        <i class="fas fa-download"></i>
                      {/if}
                    </button>
                    <!-- Dropped btn-group since only one button remains in the main action area -->
                  </div>
                </div>

                <!-- Progress -->
                {#if $platformUpdating || platformUpdateError}
                  <div
                    class="progress my-3"
                    role="progressbar"
                    aria-valuenow={platformUpdatingStep}
                    aria-valuemin="0"
                    aria-valuemax={platformUpdateProcesses.length + 1}
                    style="height: 5px;">
                    <div
                      class="progress-bar bg-secondary progress-bar-striped {platformUpdateError
                        ? 'bg-danger'
                        : !isPlatformUpdateFinished(platformUpdatingStep)
                          ? 'progress-bar-animated bg-primary'
                          : 'bg-success'}"
                      style="width: {(Math.min(
                        platformUpdatingStep >= 2
                          ? platformUpdatingStep - 2 + currentPlatformProgress
                          : 0,
                        platformUpdateProcesses.length - 1,
                      ) /
                        (platformUpdateProcesses.length - 1)) *
                        100}%">
                    </div>
                  </div>

                  <p class="small mb-0" in:fade out:fade>
                    {#if platformUpdateError}
                      <span class="text-danger"
                        >{$_('components.modals.installing-resource.error-text', {
                          values: {
                            error: $_('errors.' + platformUpdateError),
                          },
                        })}</span>
                    {:else if !isPlatformUpdateFinished(platformUpdatingStep)}
                      {$_(
                        'pages.settings.updates.platform-update-steps.' +
                          platformUpdateProcesses[platformUpdatingStep - 1],
                      )}
                    {:else}
                      {$_('pages.settings.updates.install-complete-restarting')}
                      <i class="me-2 fas fa-arrows-rotate fa-spin"></i>
                    {/if}
                  </p>
                {/if}
            </div>
          </div>
        </li>
      </ul>
    </div>
  {/if}
</div>

<div class="card">
  <CardHeader showRight={data.resourceUpdates.length > 1}>
    <div slot="left">
      {#if data.resourceUpdates.length > 0}
        {$_('pages.settings.updates.resource-updates-count', {
          values: {
            count: data.resourceUpdates.length,
          },
        })}
      {:else}
        {$_('pages.settings.updates.resource-updates')}
      {/if}
    </div>
    <div slot="right">
      <button
        class="btn btn-sm btn-secondary"
        on:click={onUpdateAllClick}
        class:disabled={loading ||
          $platformUpdating ||
          inProgressResource ||
          updatingAll ||
          data.resourceUpdates.length === 0}>
        <i class="fas fa-download me-2"></i>
        {$_('buttons.update-all')}
      </button>
    </div>
  </CardHeader>
  <div class="card-body">
    {#if !data.panoAccount}
      <NoContent
        icon="fas fa-sync fa-3x"
        text={$_('pages.settings.updates.connect-pano-account')}
        dark={false} />
    {:else if data.resourceUpdates.length === 0}
      <NoContent
        icon="fas fa-sync fa-3x"
        text={$_('pages.settings.updates.no-update-found')}
        dark={false} />
    {:else}
      <ul class="list-group">
        {#each data.resourceUpdates as update, index (update)}
          <li class="list-group-item">
            <div class="d-flex gap-3 flex-wrap position-relative">
              <div class="flex-shrink-0">
                <!-- Logo -->
                <a
                  href={`${PANO_WEBSITE_URL}/${update.type === 'PLUGIN' ? 'addons' : 'themes'}/${update.id}`}
                  target="_blank">
                  {#if update.iconFileName}
                    <img
                      width={update.type === 'THEME' ? 114 : 64}
                      height="64"
                      class="rounded"
                      src={`/api/panel/updates/icon/${update.iconFileName}?type=${update.type}`}
                      alt={update.name || update.id} />
                  {:else}
                    <div
                      class="rounded text-body overflow-hidden position-relative"
                      style="width: {update.type === 'THEME' ? 114 : 64}px; height: 64px;">
                      <i
                        class="fas fa-{update.type === 'THEME'
                          ? 'palette'
                          : 'puzzle-piece'} position-absolute"
                        style="font-size: 100px; bottom: -35px; right: -30px; opacity: 0.15;"></i>
                    </div>
                  {/if}
                </a>
              </div>

              <div class="flex-grow-1 min-w-0 mobile-info-padding">
                <div class="d-flex justify-content-between align-items-start gap-3">
                  <!-- Left: Info -->
                  <div class="vstack gap-1 min-w-0">
                    <div class="d-flex flex-wrap align-items-center gap-2">
                      <a
                        href={`${PANO_WEBSITE_URL}/${update.type === 'PLUGIN' ? 'addons' : 'themes'}/${update.id}`}
                        target="_blank"
                        class="text-decoration-none focus-ring rounded d-inline-flex align-items-center gap-2">
                        <h5 class="text-truncate mb-0">
                          {update.resourceTitle || update.name || update.id}
                          <i class="fas fa-external-link-alt fa-xs ms-1"></i>
                        </h5>
                        <VerifiedStatus status={getVerifiedStatus(update.verified)} />
                      </a>
                      <span class="badge text-bg-gray">
                        {update.oldVersion}
                        <i class="fas fa-arrow-right fa-xs"></i>
                        {update.version}
                      </span>
                    </div>
                    <div class="small font-monospace d-flex align-items-center gap-2">
                      {update.id}
                      {#if update.incompatible}
                        <span class="text-danger small hstack gap-1">
                          <i class="fas fa-triangle-exclamation"></i>
                          {$_('pages.settings.updates.incompatible-version', {
                            default: 'Pano version incompatible',
                          })}
                          {#if update.requiredPanoVersion}
                            ({update.requiredPanoVersion}+)
                          {/if}
                        </span>
                      {/if}
                    </div>
                    <div class="hstack gap-3 small flex-wrap">
                      <span>
                        {$_('pages.settings.updates.by')}
                        <a
                          href={`${PANO_WEBSITE_URL}/users/${update.developer}`}
                          target="_blank"
                          class="text-decoration-none">{update.developer}</a>
                      </span>
                      <span>
                        <i class="fas fa-database me-2"></i>{formatBytes(update.size)}
                      </span>
                      <span>
                        <i class="fa-regular fa-calendar me-2"></i><DateTime
                          time={update.createdAt} />
                      </span>
                    </div>
                  </div>

                  <!-- Right: Actions -->
                  <div
                    class="d-flex align-items-center gap-1 flex-shrink-0 mobile-absolute-actions">
                    <button
                      class="btn btn-sm btn-link"
                      title={$_('pages.settings.updates.changelog')}
                      aria-label={$_('pages.settings.updates.changelog')}
                      class:disabled={loading ||
                        $platformUpdating ||
                        inProgressResource ||
                        updatingAll}
                      on:click={() => showChangelogModal(update.changelog)}>
                      <i class="fa-regular fa-file-lines fa-lg"></i>
                    </button>

                    <button
                      class="btn btn-sm btn-link"
                      aria-label={$_('pages.settings.updates.copy-hash')}
                      title={$_('pages.settings.updates.copy-hash')}
                      class:disabled={loading ||
                        $platformUpdating ||
                        inProgressResource ||
                        updatingAll}
                      on:click={() => copyHashToClipboard(`sha256:${update.hash}`)}>
                      <i class="fa-solid fa-hashtag fa-lg"></i>
                    </button>

                    <button
                      title={$_('pages.settings.updates.download')}
                      aria-label={$_('pages.settings.updates.download')}
                      class="btn btn-sm btn-secondary d-flex align-items-center gap-2"
                      class:disabled={loading ||
                        $platformUpdating ||
                        inProgressResource ||
                        updatingAll ||
                        update.incompatible}
                      on:click={() => onUpdateResourceClick(update)}>
                      <i class="fas fa-download"></i>
                    </button>
                  </div>
                </div>

                <!-- Progress -->
                {#if inProgressResource?.id === update.id || resourceUpdateError?.id === update.id}
                  <div
                    class="progress mt-3"
                    role="progressbar"
                    aria-valuenow={resourceUpdateStep}
                    aria-valuemin="0"
                    aria-valuemax={resourceUpdateProcesses.length + 1}
                    style="height: 5px;">
                    <div
                      class="progress-bar progress-bar-striped {resourceUpdateError
                        ? 'bg-danger'
                        : !isResourceUpdateFinished(resourceUpdateStep)
                          ? 'progress-bar-animated bg-primary'
                          : 'bg-success'}"
                      style="width: {(Math.min(
                        resourceUpdateStep >= 2
                          ? resourceUpdateStep - 2 + currentResourceProgress
                          : 0,
                        resourceUpdateProcesses.length - 1,
                      ) /
                        (resourceUpdateProcesses.length - 1)) *
                        100}%">
                    </div>
                  </div>

                  <p class="small mb-0 mt-2" in:fade out:fade>
                    {#if resourceUpdateError}
                      <span class="text-danger"
                        >{$_('components.modals.installing-resource.error-text', {
                          values: {
                            error: $_('errors.' + resourceUpdateError.error),
                          },
                        })}</span>
                    {:else if !isResourceUpdateFinished(resourceUpdateStep)}
                      {$_(
                        'pages.settings.updates.resource-update-steps.' +
                          resourceUpdateProcesses[resourceUpdateStep - 1],
                      )}
                    {:else}
                      {$_('pages.settings.updates.install-complete')}
                    {/if}
                  </p>
                {/if}
              </div>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<ConfirmUpdatePlatformModal />
<ConfirmUpdateResourceModal />
<ConfirmUpdateResourcesModal />
<ChangelogModal />

<script context="module">
  import ApiUtil, { buildQueryParams } from '$lib/api.util';

  /**
   * @type {import("@sveltejs/kit").Load}
   */
  export async function load(event) {
    const { parent } = event;
    await parent();

    const queryParams = buildQueryParams({
      type: 'UPDATES',
    });

    return await ApiUtil.get({
      path: '/api/panel/settings' + queryParams,
      request: event,
    });
  }
</script>

<script>
  import { getContext, onDestroy, onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { _ } from 'svelte-i18n';
  import copy from 'copy-to-clipboard';

  import { base } from '$app/paths';
  import { beforeNavigate, invalidateAll } from '$app/navigation';
  import { browser } from '$app/environment';

  import { formatBytes } from '$lib/string.util';
  import { PANO_WEBSITE_URL } from '$lib/variables';

  import tooltip from '$lib/tooltip.util';

  import { show as showToast } from '$lib/component/ToastContainer.svelte';

  import PageActions from '$lib/component/PageActions.svelte';
  import NoContent from '$lib/component/NoContent.svelte';
  import DateTime from '$lib/component/Date.svelte';
  import MarkdownRenderer from '$lib/component/MarkdownRenderer.svelte';
  import VerifiedStatus from '$lib/component/VerifiedStatus.svelte';
  import CardHeader from '$lib/component/CardHeader.svelte';
  import RefreshRequiredAlert from '$lib/component/RefreshRequiredAlert.svelte';

  import ConfirmUpdatePlatformModal, {
    show as showUpdatePlatformModal,
  } from '$lib/component/modals/ConfirmUpdatePlatformModal.svelte';

  import ConfirmUpdateResourceModal, {
    show as showUpdateResourceModal,
  } from '$lib/component/modals/ConfirmUpdateResourceModal.svelte';

  import ConfirmUpdateResourcesModal, {
    show as showUpdateResourcesModal,
  } from '$lib/component/modals/ConfirmUpdateResourcesModal.svelte';

  import ChangelogModal, {
    show as showChangelogModal,
  } from '$lib/component/modals/ChangelogModal.svelte';

  export let data;

  const pageTitle = getContext('pageTitle');

  pageTitle.set('pages.settings.updates.title');

  let loading, platformUpdateError, confetti;
  let platformUpdatingStep = 1;

  let inProgressResource;
  let resourceUpdateError;
  let resourceUpdateStep = 1;
  let updatingAll;
  let platformUpdateFinished;
  let currentPlatformProgress = 0;
  let currentResourceProgress = 0;

  let demoMode = false;
  let refreshRequired = false;
  const demoUpdates = [
    {
      id: 'pano-plugin-demo',
      type: 'PLUGIN',
      resourceTitle: 'Demo Plugin',
      verified: true,
      oldVersion: '1.0.0',
      version: '2.0.0',
      developer: 'PanoMC',
      size: 1024 * 1024 * 5,
      createdAt: new Date().toISOString(),
      changelog: '### Yenilikler\n- Bu bir demo güncellemedir.\n- Arayüz geliştirmeleri yapıldı.',
      hash: 'demo-hash-123',
      incompatible: true,
      requiredPanoVersion: '1.1.0',
    },
    {
      id: 'pano-theme-demo',
      type: 'THEME',
      resourceTitle: 'Demo Theme',
      verified: false,
      oldVersion: '1.2.3',
      version: '1.3.0',
      developer: 'Selim',
      size: 1024 * 1024 * 2.5,
      createdAt: new Date().toISOString(),
      changelog: '### Değişiklikler\n- Tema renkleri güncellendi.',
      hash: 'demo-hash-456',
      incompatible: true,
      requiredPanoVersion: '1.2.0',
    },
  ];

  $: if (demoMode && data) {
    if (data.resourceUpdates && !data.resourceUpdates.find((u) => u.id.endsWith('-demo'))) {
      data.resourceUpdates = [...demoUpdates, ...data.resourceUpdates];
    }

    if (!data.platformUpdate) {
      data.platformUpdate = {
        channel: 'stable',
        oldVersion: '1.0.0',
        version: '1.1.0-demo',
        size: 1024 * 1024 * 50,
        releaseDate: new Date().toISOString(),
        changelog: '### Yenilikler\n- Demo platform güncellemesi.',
        hash: 'demo-platform-hash',
        state: 'demo',
      };
    }

    if (!data.panoAccount) {
      data.panoAccount = { username: 'demo' };
    }
  }

  const platformUpdating = getContext('platformUpdating');
  const platformRestarting = getContext('platformRestarting');

  const platformUpdateProcesses = [
    'getting-platform-update-info',
    'downloading-update',
    'verifying-hash',
    'extracting-updater',
    'installing-new-update',
  ];

  const resourceUpdateProcesses = [
    'getting-version-info',
    'downloading-update',
    'preparing',
    'installing-new-update',
  ];

  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  async function copyHashToClipboard(hash) {
    try {
      copy(hash);
      await showToast('components.toasts.hash-copied');
    } catch (err) {
      console.error('Failed to copy hash:', err);
      await showToast('components.toasts.hash-copy-failed');
    }
  }

  async function isPanoHealthy() {
    try {
      const getHealthResponse = await ApiUtil.get({ path: '/api/health' });

      return getHealthResponse.result === 'ok';
    } catch (_) {
      return false;
    }
  }

  if (browser) {
    (async () => {
      confetti = await import('canvas-confetti');
    })();
  }

  async function handlePlatformUpdateSSEMessage(message) {
    if (message.result === 'ok') {
      if (message.status === 'progress') {
        currentPlatformProgress = message.progress;
        return;
      }

      currentPlatformProgress = 0;
      platformUpdatingStep++;

      if (platformUpdatingStep === platformUpdateProcesses.length + 1) {
        await showToast('components.toasts.platform-update-success');

        confetti.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          zIndex: 999999,
        });

        await delay(1000);

        $platformRestarting = true;
        while (!(await isPanoHealthy())) {
          await delay(1000);
        }

        platformUpdateFinished = true;
        location.reload();
      }
    } else {
      await showToast('components.toasts.platform-update-failed');

      platformUpdateError = message.error;
      console.error(message.error, message.message);
      $platformUpdating = false;
    }
  }

  async function handleResourceUpdateSSEMessage(update, message) {
    if (message.result === 'ok') {
      if (message.status === 'progress') {
        currentResourceProgress = message.progress;
        return;
      }

      currentResourceProgress = 0;
      resourceUpdateStep++;

      if (resourceUpdateStep === resourceUpdateProcesses.length + 1) {
        await showToast('components.toasts.resource-update-success', {
          id: update.id,
        });

        refreshRequired = true;

        if (!updatingAll) {
          confetti.default({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            zIndex: 999999,
          });
        }

        await delay(1000);

        data.resourceUpdates = data.resourceUpdates.filter((item) => item.id !== update.id);
        inProgressResource = null;
      }
    } else {
      await showToast('components.toasts.resource-update-failed', {
        id: update.id,
      });

      resourceUpdateError = { ...update, error: message.error };
      console.error(message.error, message.message);
      inProgressResource = null;
    }
  }

  function handlePlatformUpdateEventSource(eventSource) {
    eventSource.onmessage = (event) => {
      handlePlatformUpdateSSEMessage(JSON.parse(event.data));
    };

    eventSource.onerror = () => {
      eventSource.close();
    };
  }

  function handleResourceUpdateEventSource(update, eventSource) {
    eventSource.onmessage = (event) => {
      handleResourceUpdateSSEMessage(update, JSON.parse(event.data));
    };

    eventSource.onerror = () => {
      eventSource.close();
    };
  }

  function isPlatformUpdateFinished(installingStep) {
    return installingStep === platformUpdateProcesses.length + 1;
  }

  function isResourceUpdateFinished(installingStep) {
    return installingStep === resourceUpdateProcesses.length + 1;
  }

  async function installPlatformUpdate() {
    platformUpdatingStep = 1;
    currentPlatformProgress = 0;
    $platformUpdating = true;
    platformUpdateError = null;

    await delay(500);

    const eventSource = new EventSource(
      `/api/panel/updates/platform/stream?state=${data.platformUpdate.state}`,
    );

    handlePlatformUpdateEventSource(eventSource);
  }

  function onUpdatePlatformClick() {
    showUpdatePlatformModal(() => {
      installPlatformUpdate();
    });
  }

  async function updateResource(update) {
    resourceUpdateError = null;
    inProgressResource = update;
    resourceUpdateStep = 1;
    currentResourceProgress = 0;
    await delay(500);

    const eventSource = new EventSource(
      `/api/panel/updates/resources/${update.id}/stream?state=${update.state}`,
    );

    handleResourceUpdateEventSource(update, eventSource);
  }

  function onUpdateResourceClick(update) {
    showUpdateResourceModal(() => {
      updateResource(update);
    });
  }

  async function updateAll() {
    for (const update of [...data.resourceUpdates]) {
      if (updatingAll && resourceUpdateError) {
        updatingAll = false;
        return;
      }
      updatingAll = true;

      await updateResource(update);

      while (inProgressResource?.id === update.id) {
        await delay(100);
      }
    }

    confetti.default({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      zIndex: 999999,
    });

    updatingAll = false;
  }

  function onUpdateAllClick() {
    showUpdateResourcesModal(() => {
      updateAll();
    });
  }

  async function checkUpdate() {
    loading = true;
    await Promise.all([
      ApiUtil.get({
        path: '/api/panel/updates/platform',
        handler: async (body) => {
          await invalidateAll();
          loading = false;

          if (body.error === 'PANO_CONNECT_FAILED') {
            await showToast('components.toasts.check-resources-update-failed-pano-account');
            return;
          }

          if (body.error === 'PANO_NOT_CONNECTED') {
            await invalidateAll();
            await showToast('components.toasts.check-resources-update-failed-pano-account-needed');
            return;
          }

          if (body.result !== 'ok') {
            await showToast('components.toasts.check-update-failed');
            return;
          }

          await showToast('components.toasts.check-update-success');
        },
      }),
    ]);
  }

  String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
  };

  function getVerifiedStatus(status) {
    if (typeof status === 'undefined') {
      return 'UNKNOWN';
    } else if (status) {
      return 'VERIFIED';
    } else {
      return 'NOT_VERIFIED';
    }
  }

  const leaveHandler = (e) => {
    if (!platformUpdateFinished && ($platformUpdating || inProgressResource)) {
      e.preventDefault();
      e.returnValue = ''; // Necessary for some browsers
    }
  };

  onMount(() => {
    if (browser) {
      window?.addEventListener('beforeunload', leaveHandler);
    }
  });

  onDestroy(() => {
    if (browser) {
      window?.removeEventListener('beforeunload', leaveHandler);
    }
  });

  beforeNavigate((nav) => {
    if (
      browser &&
      !platformUpdateFinished &&
      ($platformUpdating || inProgressResource) &&
      !confirm($_('pages.settings.updates.updating-leave-alert'))
    ) {
      nav.cancel();
    }
  });
</script>
