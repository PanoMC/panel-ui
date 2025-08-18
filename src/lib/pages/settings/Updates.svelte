<!-- Updates Sub Page -->

<div class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions middleClasses="d-lg-flex d-none">
    <div slot="left">
      <span class="small" use:tooltip={["Last Check", { placement: "bottom" }]}>
        <i class="fa-regular fa-clock me-2"></i>
        {#if data.lastCheckedAt}
          <Date
            time={data.lastCheckedAt.value}
            relativeFormat={true}
            tooltip={false} />
        {:else}
          Never
        {/if}
      </span>
    </div>
    <div class="hstack gap-2" slot="right">
      <button
        class="btn btn-secondary"
        class:disabled={loading || $platformUpdating || inProgressResource}
        on:click={checkUpdate}>
        <i class="fa-regular fa-arrows-rotate me-2" class:fa-spin={loading}></i>
        Check Updates
      </button>
    </div>
  </PageActions>

  <div
    class="alert alert-warning animate__animated animate__slideInUp mb-0"
    role="alert"
    hidden>
    <h5 class="alert-heading">Yenide başlat</h5>

    <p>
      Platform güncellemesinin uygulanabilmesi için yeniden başlatma gerekiyor.
    </p>
    <p>
      Tahmini süre: <b>TIME</b>
    </p>
    <a class="btn btn-outline-warning" type="button">
      <i class="fa-solid fa-power-off me-2"></i>
      Yeniden Başlat</a>
  </div>

  <div class="card">
    <div class="card-header">
      Platform Updates {#if data.platformUpdate}(1){/if}
    </div>
    <!-- Pending Update List -->
    {#if !data.platformUpdate}
      <NoContent
        icon="fas fa-check fa-3x"
        text="You are using latest version of Pano." />
    {:else}
      <div class="card-body">
        <ul class="list-group">
          <li class="list-group-item">
            <div class="row gx-3">
              <div class="col-md-auto">
                <!-- Logo -->
                <div
                  class="d-inline-flex rounded justify-content-start align-items-start bg-primary ps-2 pt-2"
                  style="width: 64px; height: 64px;">
                  <img
                    style="transform: rotate(-0.05turn);"
                    src={base + "/assets/img/logo.svg"}
                    width="auto"
                    height="60"
                    alt="Pano"
                    title="Pano" />
                </div>
              </div>
              <div class="col">
                <div class="flex-grow-1 w-100">
                  <div
                    class="d-flex justify-content-between flex-wrap align-items-start gap-3">
                    <!-- Left: Info -->
                    <div class="vstack gap-2">
                      <div class="d-flex align-items-center gap-2 flex-wrap">
                        <h5 class="mb-0">Pano</h5>
                        <i
                          class="fa-regular fa-circle-check text-success"
                          title="Verified"></i>

                        <span class="badge text-bg-light">
                          {data.platformUpdate.channel.capitalize()}
                        </span>
                        <span class="badge text-bg-light"
                          >{data.platformUpdate.oldVersion}
                          <i class="fas fa-arrow-right"></i>
                          {data.platformUpdate.version}</span>

                        <div>
                          by <strong>Pano</strong>
                        </div>
                      </div>

                      <div class="d-flex flex-wrap gap-2 text-muted small mb-0">
                        <div>
                          <i class="fas fa-database me-1"></i>
                          {formatBytes(data.platformUpdate.size)}
                        </div>
                        <div>
                          <i class="fas fa-calendar me-1"></i>
                          <Date time={data.platformUpdate.releaseDate} />
                        </div>
                        <!-- Hash -->
                        <div class="user-select-all font-monospace">
                          <i class="fas fa-fingerprint me-1"></i>
                          <code class="text-break"
                            >{data.platformUpdate.hash}</code>
                        </div>
                      </div>
                    </div>
                    <!-- Right: Actions -->
                    <div class="d-flex align-items-center gap-2">
                      <button
                        class="btn btn-sm btn-secondary d-flex align-items-center gap-1"
                        on:click={installPlatformUpdate}
                        class:disabled={loading ||
                          $platformUpdating ||
                          inProgressResource ||
                          updatingAll}>
                        <i class="fas fa-download"></i>
                        Update
                      </button>
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
                        class="progress-bar progress-bar-striped {platformUpdateError
                          ? 'bg-danger'
                          : !isPlatformUpdateFinished(platformUpdatingStep)
                            ? 'progress-bar-animated bg-primary'
                            : 'bg-success'}"
                        style="width: {(Math.min(
                          platformUpdatingStep - 1,
                          platformUpdateProcesses.length,
                        ) /
                          platformUpdateProcesses.length) *
                          100}%">
                      </div>
                    </div>

                    <p class="text-muted small mb-0" in:fade out:fade>
                      {#if platformUpdateError}
                        <span class="text-danger"
                          >{$_(
                            "components.modals.installing-resource.error-text",
                            { values: { error: platformUpdateError } },
                          )}</span>
                      {:else if !isPlatformUpdateFinished(platformUpdatingStep)}
                        {platformUpdateProcesses[platformUpdatingStep - 1]}
                      {:else}
                        🎉 Install complete! Restarting... <i
                          class="me-2 fas fa-spinner fa-spin"></i>
                      {/if}
                    </p>
                  {/if}

                  <!-- Changelog -->
                  <details class="mt-3">
                    <summary class="fw-bold link-primary">Changelog </summary>
                    <div class="pt-2 markdown-renderer">
                      <MarkdownRenderer
                        content={data.platformUpdate.changelog} />
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    {/if}
  </div>

  <div class="card">
    <CardHeader>
      <div slot="left">
        Resource Updates {#if data.resourceUpdates.length > 0}({data
            .resourceUpdates.length}){/if}
      </div>
      <div slot="right">
        {#if data.resourceUpdates?.length > 1}
          <button
            type="button"
            class="btn btn-sm btn-outline-primary"
            class:disabled={loading ||
              $platformUpdating ||
              inProgressResource ||
              updatingAll}
            on:click={updateAll}>Update All</button>
        {/if}
      </div>
    </CardHeader>
    <div class="card-body">
      {#if !data.panoAccount}
        <NoContent
          icon="fas fa-sync fa-3x"
          text="Kaynak güncellemeleri alabilmek için lütfen Çevrimiçi Hesap bağlayın."
          dark={false} />
      {:else if data.resourceUpdates.length === 0}
        <NoContent
          icon="fas fa-sync fa-3x"
          text="No updates found."
          dark={false} />
      {:else}
        <ul class="list-group">
          {#each data.resourceUpdates as update, index (update)}
            <li class="list-group-item">
              <div class="row gx-3">
                <div class="col-md-auto">
                  <!-- Logo -->
                  <div
                    class="d-inline-flex rounded justify-content-start align-items-start"
                    style="width: 64px; height: 64px;">
                    <a
                      href={`${PANO_WEBSITE_URL}/${update.type === "PLUGIN" ? "addons" : "themes"}/${update.id}`}
                      target="_blank">
                      <img
                        width="64"
                        height="64"
                        class="rounded"
                        src={`${PANO_WEBSITE_API_URL}/resources/${update.id}/` +
                          (update.type === "THEME"
                            ? `screenshots/${update.screenshot?.id}`
                            : "icon")}
                        title={update.id}
                        alt={update.id} />
                    </a>
                  </div>
                </div>
                <div class="col">
                  <div class="flex-grow-1 w-100">
                    <div
                      class="d-flex justify-content-between flex-wrap align-items-start gap-3">
                      <!-- Left: Info -->
                      <div class="vstack gap-2">
                        <div class="d-flex align-items-center gap-2 flex-wrap">
                          <h5 class="mb-0">
                            <a
                              href={`${PANO_WEBSITE_URL}/${update.type === "PLUGIN" ? "addons" : "themes"}/${update.id}`}
                              target="_blank"
                              >{update.id}<i
                                class="fa-solid fa-arrow-up-right-from-square ms-2"
                              ></i
                              ></a>
                          </h5>
                          <VerifiedStatus
                            status={getVerifiedStatus(update.verified)} />

                          <span class="badge text-bg-light"
                            >{update.oldVersion}
                            <i class="fas fa-arrow-right"></i>
                            {update.version}</span>

                          <div>
                            by <a
                              href={`${PANO_WEBSITE_URL}/users/${update.developer}`}
                              target="_blank"
                              ><strong
                                >{update.developer}<i
                                  class="fa-solid fa-arrow-up-right-from-square ms-2"
                                ></i
                                ></strong
                              ></a>
                          </div>
                        </div>

                        <div
                          class="d-flex flex-wrap gap-2 text-muted small mb-0">
                          <div>
                            <i class="fas fa-database me-1"></i>
                            {formatBytes(update.size)}
                          </div>
                          <div>
                            <i class="fas fa-calendar me-1"></i>
                            <Date time={update.createdAt} />
                          </div>
                          <!-- Hash -->
                          <div class="user-select-all font-monospace">
                            <i class="fas fa-fingerprint me-1"></i>
                            <code class="text-break">sha256:{update.hash}</code>
                          </div>
                        </div>
                      </div>
                      <!-- Right: Actions -->
                      <button
                        class="btn btn-sm btn-secondary"
                        class:disabled={loading ||
                          $platformUpdating ||
                          inProgressResource ||
                          updatingAll}
                        on:click={() => updateResource(update)}>
                        Update
                      </button>
                    </div>

                    <!-- Progress -->
                    {#if inProgressResource?.id === update.id || resourceUpdateError?.id === update.id}
                      <div
                        class="progress my-3"
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
                            resourceUpdateStep - 1,
                            resourceUpdateProcesses.length,
                          ) /
                            resourceUpdateProcesses.length) *
                            100}%">
                        </div>
                      </div>

                      <p class="text-muted small mb-0" in:fade out:fade>
                        {#if resourceUpdateError}
                          <span class="text-danger"
                            >{$_(
                              "components.modals.installing-resource.error-text",
                              { values: { error: resourceUpdateError.error } },
                            )}</span>
                        {:else if !isResourceUpdateFinished(resourceUpdateStep)}
                          {resourceUpdateProcesses[resourceUpdateStep - 1]}
                        {:else}
                          🎉 Install complete!
                        {/if}
                      </p>
                    {/if}

                    <!-- Changelog -->
                    <details class="mt-3">
                      <summary class="fw-bold link-primary">
                        Changelog
                      </summary>
                      <div class="pt-2 markdown-renderer">
                        <MarkdownRenderer content={update.changelog} />
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
</div>

<script context="module">
  import ApiUtil, { buildQueryParams } from "$lib/api.util";

  /**
   * @type {import("@sveltejs/kit").Load}
   */
  export async function load(event) {
    const { parent } = event;
    await parent();

    const queryParams = buildQueryParams({
      type: "UPDATES",
    });

    return await ApiUtil.get({
      path: "/api/panel/settings" + queryParams,
      request: event,
    });
  }
</script>

<script>
  import { getContext, onDestroy, onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { _ } from "svelte-i18n";

  import { base } from "$app/paths";
  import { beforeNavigate, invalidateAll } from "$app/navigation";
  import { browser } from "$app/environment";

  import { formatBytes } from "$lib/string.util";
  import { PANO_WEBSITE_API_URL, PANO_WEBSITE_URL } from "$lib/variables";

  import tooltip from "$lib/tooltip.util";

  import { show as showToast } from "$lib/component/ToastContainer.svelte";

  import PageActions from "$lib/component/PageActions.svelte";
  import NoContent from "$lib/component/NoContent.svelte";
  import Date from "$lib/component/Date.svelte";
  import MarkdownRenderer from "$lib/component/MarkdownRenderer.svelte";
  import VerifiedStatus from "$lib/component/VerifiedStatus.svelte";
  import CardHeader from "$lib/component/CardHeader.svelte";

  export let data;

  const pageTitle = getContext("pageTitle");

  pageTitle.set("Güncellemeler");

  let loading, platformUpdateError, confetti;
  let platformUpdatingStep = 1;

  let inProgressResource;
  let resourceUpdateError;
  let resourceUpdateStep = 1;
  let updatingAll;

  const platformUpdating = getContext("platformUpdating");

  const platformUpdateProcesses = [
    "Getting platform update info...",
    "Downloading update...",
    "Verifying hash...",
    "Extracting updater...",
    "Installing new update...",
  ];

  const resourceUpdateProcesses = [
    "Getting version info...",
    "Downloading update...",
    "Preparing...",
    "Installing new update...",
  ];

  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  async function isPanoHealthy() {
    try {
      const getHealthResponse = await ApiUtil.get({ path: "/api/health" });

      return getHealthResponse.result === "ok";
    } catch (_) {
      return false;
    }
  }

  if (browser) {
    (async () => {
      confetti = await import("canvas-confetti");
    })();
  }

  async function handlePlatformUpdateSSEMessage(message) {
    if (message.result === "ok") {
      platformUpdatingStep++;

      if (platformUpdatingStep === platformUpdateProcesses.length + 1) {
        await showToast("components.toasts.platform-update-success");

        confetti.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          zIndex: 999999,
        });

        await delay(1000);

        while (!(await isPanoHealthy())) {
          await delay(1000);
        }

        location.reload();
      }
    } else {
      await showToast("components.toasts.platform-update-failed");

      platformUpdateError = message.error;
      console.error(message.error, message.message);
      $platformUpdating = false;
    }
  }

  async function handleResourceUpdateSSEMessage(update, message) {
    if (message.result === "ok") {
      resourceUpdateStep++;

      if (resourceUpdateStep === resourceUpdateProcesses.length + 1) {
        await showToast("components.toasts.resource-update-success", {
          id: update.id,
        });

        confetti.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          zIndex: 999999,
        });

        await delay(1000);

        data.resourceUpdates = data.resourceUpdates.filter(
          (item) => item.id !== update.id,
        );
        inProgressResource = null;
      }
    } else {
      await showToast("components.toasts.resource-update-failed", {
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
    $platformUpdating = true;
    platformUpdateError = null;

    await delay(500);

    const eventSource = new EventSource(
      `/api/panel/updates/platform/stream?state=${data.platformUpdate.state}`,
    );

    handlePlatformUpdateEventSource(eventSource);
  }

  async function updateResource(update) {
    resourceUpdateError = null;
    inProgressResource = update;
    resourceUpdateStep = 1;
    await delay(500);

    const eventSource = new EventSource(
      `/api/panel/updates/resources/${update.id}/stream?state=${update.state}`,
    );

    handleResourceUpdateEventSource(update, eventSource);
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

    updatingAll = false;
  }

  async function checkUpdate() {
    loading = true;
    await Promise.all([
      ApiUtil.get({
        path: "/api/panel/updates/platform",
        handler: async (body) => {
          await invalidateAll();
          loading = false;

          if (body.error === "PANO_CONNECT_FAILED") {
            await showToast(
              "components.toasts.check-resources-update-failed-pano-account",
            );
            return;
          }

          if (body.result !== "ok") {
            await showToast("components.toasts.check-update-failed");
            return;
          }

          await showToast("components.toasts.check-update-success");
        },
      }),
    ]);
  }

  String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
  };

  function getVerifiedStatus(status) {
    if (typeof status === "undefined") {
      return "UNKNOWN";
    } else if (status) {
      return "VERIFIED";
    } else {
      return "NOT_VERIFIED";
    }
  }

  const leaveHandler = (e) => {
    if (($platformUpdating || inProgressResource)) {
      e.preventDefault();
      e.returnValue = ""; // Necessary for some browsers
    }
  };

  onMount(() => {
    if (browser) {
      window?.addEventListener("beforeunload", leaveHandler);
    }
  });

  onDestroy(() => {
    if (browser) {
      window?.removeEventListener("beforeunload", leaveHandler);
    }
  });

  beforeNavigate((nav) => {
    if (
      browser &&
      ($platformUpdating || inProgressResource) &&
      !confirm($_("pages.settings.updates.updating-leave-alert"))
    ) {
      nav.cancel();
    }
  });
</script>
