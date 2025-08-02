<div class="container py-4">
  <!-- Action Menu -->
  <section
    class="row justify-content-between align-items-center mb-3 animate__animated animate__slideInUp"
  >
    <div class="col-auto">
      <a href="{base}/addons" class="btn btn-link" role="button">
        <i class="fas fa-arrow-left me-2"></i>
        {$_('buttons.addons')}
      </a>
    </div>
    <div class="col-auto d-flex align-items-center gap-2">
      {#if addon.verifyStatus !== "UNKNOWN"}
        <a
          href={`${PANO_WEBSITE_URL}/addons/${addon.id}`}
          target="_blank"
          class="btn btn-outline-primary">
          <i class="fas fa-store me-2"></i>
          {$_('buttons.show-in-store')}
        </a>
      {/if}
      <button
        aria-label="{$_('buttons.remove')}"
        class="btn btn-link text-danger"
        type="button"
        on:click={onRemoveClick}
        title="{$_('buttons.remove')}"
        class:disabled={removing}>
        <i class="fas fa-trash"></i>
      </button>
      <button class="btn btn-link" type="button">
        <i class="fa-solid fa-eraser"></i>
      </button>
      <button class="btn btn-link" type="button">
        <i class="fa-solid fa-arrows-rotate"></i>
      </button>
    </div>
  </section>

  <!-- Addon Details -->
  <div class="card shadow-lg border-0">
    <div class="row g-0">
      <div class="col-md-3 d-flex justify-content-center align-items-center bg-light p-4">
        <img
          src="/api/panel/plugins/{addon.id}/logo"
          class="img-fluid"
          alt="{addon.name}"
          style="max-width: 100px; max-height: 100px"
        />
      </div>

      <div class="col-md-9">
        <div class="card-body">
          <h3 class="card-title d-flex align-items-center gap-2">
            {addon.name} <VerifiedStatus status="{addon.verifyStatus}"/>
          </h3>
          <p class="text-muted">{addon.description}</p>

          <ul class="list-group list-group-flush my-3">
            <li class="list-group-item">
              <strong>ID:</strong> {addon.id}
            </li>
            <li class="list-group-item">
              <strong>{$_('pages.addon-detail.version')}:</strong> {addon.version}
            </li>
            <li class="list-group-item">
              <strong>{$_('pages.addon-detail.pano-version')}:</strong> {addon.panoVersion}
            </li>
            <li class="list-group-item">
              <strong>{$_('pages.addon-detail.developer')}:</strong> {addon.developer}
            </li>
            <li class="list-group-item">
              <strong>{$_('pages.addon-detail.license')}:</strong> {addon.license || $_('pages.addon-detail.unknown')}
            </li>
            <li class="list-group-item">
              <strong>{$_('pages.addon-detail.source')}:</strong>
              <a href={addon.sourceUrl} target="_blank">{addon.sourceUrl}</a>
            </li>
            <li class="list-group-item">
              <strong>{$_('pages.addon-detail.dependencies')}:</strong> {isBlank(addon.dependencies) ? '-' : addon.dependencies}
            </li>
            <li class="list-group-item">
              <strong>{$_('pages.addon-detail.requires')}:</strong> {isBlank(addon.dependencies) ? '-' : addon.requires}
            </li>
            <li class="list-group-item">
              <strong>Hash:</strong>
              <code class="text-break d-block">{addon.hash}</code>
            </li>
            <li
              class="list-group-item">
              <strong>{$_('pages.addon-detail.size')}:</strong>
              {formatBytes(addon.size)}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>

<script context="module">
  import ApiUtil from "$lib/api.util.js";
  import { error } from "@sveltejs/kit";

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const {
      parent,
    } = event;
    await parent();

    const addonId = event.params.addonId;

    const body = await ApiUtil.get({
      path: `/api/panel/plugins/${addonId}`,
      request: event,
    });

    if (body.error === "NOT_FOUND") {
      throw error(404, body.error);
    }

    return { addon: body.data };
  }
</script>

<script>
  import { getContext } from "svelte";
  import { _ } from "svelte-i18n";

  import { base } from "$app/paths";

  import { formatBytes } from "$lib/string.util";
  import { PANO_WEBSITE_URL } from "$lib/variables";

  import VerifiedStatus from "$lib/component/VerifiedStatus.svelte";

  export let data;
  let addon, removing;

  $: {
    addon = data.addon;
  }

  const pageTitle = getContext("pageTitle");

  pageTitle.set("pages.addon-detail.title");

  function onRemoveClick() {
    alert(`'${addon.name}' eklentisi kaldırıldı!`);
  }

  function isBlank(value) {
    return value === null || value === undefined || value.toString().trim() === "";
  }
</script>
