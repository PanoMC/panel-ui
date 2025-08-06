<!-- Updates Sub Page -->

<div class="container vstack gap-3">
  <!-- Action Menu -->
  <PageActions middleClasses="d-lg-flex d-none">
    <div slot="left">
      <span
        class="small"
        use:tooltip="{['Last Check', { placement: 'bottom' }]}">
        <i class="fa-regular fa-clock me-2"></i>
        {#if data.lastCheckedAt} <Date time="{data.lastCheckedAt.value}" relativeFormat="{true}" tooltip="{false}"/> {:else} Never {/if}
      </span>
    </div>
    <div class="hstack gap-2" slot="right">
      <button type="button" class="btn btn-outline-primary" class:disabled={true || !!data.platformUpdate || loading}>Update All</button>

      <button class="btn btn-secondary" class:disabled={loading} on:click={checkUpdate}>
        <i class="fa-regular fa-arrows-rotate me-2" class:fa-spin={loading}></i> Check Updates
      </button>
    </div>
  </PageActions>

  <div
    class="alert alert-warning animate__animated animate__slideInUp mb-0"
    role="alert" hidden>
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
    <div class="card-header">Platform Updates</div>
    <div class="card-body">
      <!-- Pending Update List -->
      {#if !data.platformUpdate}
        <NoContent icon="fas fa-check fa-3x" text="You are using latest version of Pano." />
      {:else}
        <ul class="list-group">
          <li class="list-group-item">
            <div class="d-flex">
              <!-- Logo -->
              <div class="flex-shrink-0 me-3">
                <div
                  class="d-inline-flex rounded justify-content-start align-items-start bg-primary ps-2 pt-2"
                  style="width: 64px; height: 64px;">
                  <img
                    style="transform: rotate(-0.05turn);"
                    src="{base + '/assets/img/logo.svg'}"
                    width="auto"
                    height="60"
                    alt="Pano"
                    title="Pano" />
                </div>
              </div>

              <!-- Content -->
              <div class="flex-grow-1 w-100">
                <div class="row align-items-start">
                  <!-- Left: Version & Info -->
                  <div class="col-md-6">
                    <!-- Version, Channel, Author -->
                    <div class="d-flex align-items-center flex-wrap gap-2">
                      <h5 class="mb-0">Pano@{data.platformUpdate.version}</h5>
                      <span class="badge
                {data.platformUpdate.channel === 'stable' ? 'bg-success' : ''}
                {data.platformUpdate.channel === 'beta' ? 'bg-secondary' : ''}
                {data.platformUpdate.channel === 'alpha' ? 'bg-success' : ''}">
                {data.platformUpdate.channel.capitalize()}
              </span>
                      <small class="text-muted">by <span class="fw-semibold text-dark">Pano</span>  <span class="text-success"><i class="fa-regular fa-circle-check"></i></span></small>
                    </div>

                    <!-- Size + Date -->
                    <div class="d-flex gap-3 text-muted small mt-1 flex-wrap">
                      <div>
                        <i class="fas fa-database me-1"></i> {formatBytes(data.platformUpdate.size)}
                      </div>
                      <div>
                        <i class="fas fa-calendar me-1"></i> <Date time="{data.platformUpdate.releaseDate}"/>
                      </div>
                    </div>

                  </div>

                  <!-- Right: Actions -->
                  <div class="col-md-6 text-md-end mt-3 mt-md-0">
                    <div class="d-flex justify-content-md-end align-items-center gap-2">
                      <button class="btn btn-sm btn-outline-primary" type="button">
                        Update
                      </button>
                      <a
                        href="#"
                        tabindex="0"
                        class="link-danger"
                        data-bs-toggle="popover"
                        data-bs-trigger="focus"
                        data-bs-custom-class="font-monospace"
                        data-bs-title="Error Log"
                        data-bs-content="ERR LOG" hidden>
                        <i class="fa-solid fa-circle-exclamation fa-lg"></i>
                      </a>
                    </div>
                  </div>
                </div>

                <!-- Progress Bar -->
                <div
                  class="progress my-3"
                  role="progressbar"
                  aria-label="Update progress"
                  aria-valuenow="{data.platformUpdate.progress}"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  style="height: 3px;" hidden>
                  <div
                    class="progress-bar bg-secondary"
                    style="width: {data.platformUpdate.progress + '%'}"></div>
                </div>

                <!-- Hash -->
                <div class="text-muted small mb-2">
                  Hash: <code class="text-break">{data.platformUpdate.hash}</code>
                </div>

                <!-- Changelog -->
                <details>
                  <summary>Changelog</summary>
                  <p class="pt-3">
            <span class="fw-bold markdown-renderer">
              <MarkdownRenderer content={data.platformUpdate.changelog} />
            </span>
                  </p>
                </details>
              </div>
            </div>
          </li>
        </ul>

      {/if}
    </div>
  </div>

  <div class="card">
    <div class="card-header">Resource Updates</div>
    <div class="card-body">
<!--      <NoContent-->
<!--        icon="fas fa-sync fa-3x"-->
<!--        text="Kaynak güncellemeleri alabilmek için lütfen Çevrimiçi Hesap bağlayın."-->
<!--        dark="{false}" />-->
      <NoContent
        icon="fas fa-sync fa-3x"
        text="No updates found."
        dark="{false}"/>
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
  import tooltip from "$lib/tooltip.util";
  import PageActions from "$lib/component/PageActions.svelte";
  import NoContent from "$lib/component/NoContent.svelte";
  import { invalidateAll } from "$app/navigation";
  import Date from "$lib/component/Date.svelte";
  import MarkdownRenderer from "$lib/component/MarkdownRenderer.svelte";
  import { base } from "$app/paths";
  import { formatBytes } from "$lib/string.util.js";

  export let data;

  const pageTitle = getContext("pageTitle");

  pageTitle.set("Güncellemeler");

  let loading;

  async function checkUpdate() {
    loading = true;
    await Promise.all([ApiUtil.get({
      path: "/api/panel/updates/platform",
      handler: async (body) => {
        if (body.error === "NOT_FOUND") {
          // TODO: not found toast
          return
        }

        if (body.result !== "ok") {
          // TODO: failed to check updates
        }
      }
      })]);

    await invalidateAll()
    loading = false;
  }

  String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
  };
</script>
