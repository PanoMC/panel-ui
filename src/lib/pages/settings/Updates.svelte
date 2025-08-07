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
        type="button"
        class="btn btn-primary"
        class:disabled={loading ||
          (!data.platformUpdate && data.resourceUpdates?.length === 0)}
        >Update All</button>

      <button
        class="btn btn-secondary"
        class:disabled={loading}
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
          <li class="list-group-item p-4">
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
                        <span class="badge text-bg-light">{data.platformUpdate.oldVersion} <i class="fas fa-arrow-right"></i> {data.platformUpdate.version}</span>

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
                        class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1">
                        <i class="fas fa-download"></i>
                        Update
                      </button>
                      {#if data.platformUpdate.error}
                        <a
                          href="#"
                          tabindex="0"
                          class="text-danger"
                          data-bs-toggle="popover"
                          data-bs-trigger="focus"
                          data-bs-custom-class="font-monospace"
                          data-bs-title="Error Log"
                          data-bs-content={data.platformUpdate.error}>
                          <i class="fa-solid fa-circle-exclamation fa-lg"></i>
                        </a>
                      {/if}
                    </div>
                  </div>

                  <!-- Progress -->
                  {#if data.platformUpdate.progress !== undefined}
                    <div class="progress my-3" style="height: 5px;">
                      <div
                        class="progress-bar bg-secondary progress-bar-striped progress-bar-animated"
                        style="width: {data.platformUpdate.progress + '%'}">
                      </div>
                    </div>
                  {/if}

                  <!-- Changelog -->
                  <details class="mt-3">
                    <summary class="fw-bold link-primary"> Changelog </summary>
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
    <div class="card-header">
      Resource Updates {#if data.resourceUpdates.length > 0}({data
          .resourceUpdates.length}){/if}
    </div>
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
            <li class="list-group-item p-4">
              <div class="d-flex gap-3">
                <!-- Logo -->
                <img
                  class="border rounded"
                  src={`${PANO_WEBSITE_API_URL}/resources/${update.id}/icon`}
                  alt="Pano"
                  width="60"
                  height="60" />

                <!-- Content -->
                <div class="flex-grow-1">
                  <!-- Header -->
                  <div
                    class="d-flex justify-content-between flex-wrap align-items-start">
                    <div>
                      <h5 class="mb-1">
                        <a href="{`${PANO_WEBSITE_URL}/${update.type === 'PLUGIN' ? 'addons' : 'themes'}/${update.id}`}" target="_blank">
                          {update.id}
                        </a>
                        <span class="badge bg-light text-dark fw-normal ms-2">
                          {update.oldVersion} <i class="fas fa-arrow-right"></i> {update.version}
                        </span>
                        <VerifiedStatus
                          status={getVerifiedStatus(update.verified)} />
                      </h5>
                      <small class="text-muted"
                        >by <a href="{`${PANO_WEBSITE_URL}/users/${update.developer}`}" target="_blank"><span class="fw-semibold text-dark"
                          >{update.developer}</span
                        ></a></small>
                    </div>

                    <div class="d-flex align-items-center gap-2 mt-2 mt-md-0">
                      <button
                        class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1">
                        <i class="fas fa-download"></i>
                        Update
                      </button>
                      {#if update.error}
                        <a
                          href="#"
                          tabindex="0"
                          class="text-danger"
                          data-bs-toggle="popover"
                          data-bs-trigger="focus"
                          data-bs-custom-class="font-monospace"
                          data-bs-title="Error Log"
                          data-bs-content={update.error}>
                          <i class="fa-solid fa-circle-exclamation fa-lg"></i>
                        </a>
                      {/if}
                    </div>
                  </div>

                  <!-- Meta -->
                  <div class="d-flex flex-wrap gap-4 text-muted small mt-2">
                    <div>
                      <i class="fas fa-database me-1"></i>{formatBytes(
                        update.size,
                      )}
                    </div>
                    <div>
                      <i class="fas fa-calendar me-1"></i><Date
                        time={update.createdAt} />
                    </div>
                  </div>

                  <!-- Progress -->
                  {#if update.progress !== undefined}
                    <div class="progress my-3" style="height: 6px;">
                      <div
                        class="progress-bar bg-secondary progress-bar-striped progress-bar-animated"
                        style="width: {update.progress + '%'}">
                      </div>
                    </div>
                  {/if}

                  <!-- Hash -->
                  <div class="text-muted small mt-1">
                    <i class="fas fa-fingerprint me-1"></i>
                    <code class="text-break">sha256:{update.hash}</code>
                  </div>

                  <!-- Changelog -->
                  <details class="mt-3">
                    <summary class="fw-semibold text-primary">
                      <i class="fas fa-clipboard-list me-1"></i>
                      Changelog
                    </summary>
                    <div class="pt-2 markdown-renderer">
                      <MarkdownRenderer content={update.changelog} />
                    </div>
                  </details>
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
  import { getContext } from "svelte";

  import { base } from "$app/paths";
  import { invalidateAll } from "$app/navigation";

  import { formatBytes } from "$lib/string.util";
  import { PANO_WEBSITE_API_URL, PANO_WEBSITE_URL } from "$lib/variables";

  import tooltip from "$lib/tooltip.util";

  import PageActions from "$lib/component/PageActions.svelte";
  import NoContent from "$lib/component/NoContent.svelte";
  import Date from "$lib/component/Date.svelte";
  import MarkdownRenderer from "$lib/component/MarkdownRenderer.svelte";
  import VerifiedStatus from "$lib/component/VerifiedStatus.svelte";

  export let data;

  const pageTitle = getContext("pageTitle");

  pageTitle.set("Güncellemeler");

  let loading;

  async function checkUpdate() {
    loading = true;
    await Promise.all([
      ApiUtil.get({
        path: "/api/panel/updates/platform",
        handler: async (body) => {
          await invalidateAll();
          loading = false;

          if (body.error === "NOT_FOUND") {
            // TODO: not found toast
            return;
          }

          if (body.result !== "ok") {
            // TODO: failed to check updates
          }
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
</script>
