<PageActions>
  <CardMenu slot="middle">
    <CardMenuItem href="/view">{$_('buttons.themes')}</CardMenuItem>
    <CardMenuItem href="/view/theme-settings">{$_('buttons.theme-settings')}</CardMenuItem>
  </CardMenu>
</PageActions>

{#if loading || alwaysLoading}
  <div class="p-4">
    <!-- Başlık Placeholder -->
    <div class="placeholder-glow mb-4">
      <span class="placeholder col-3"></span>
    </div>

    <!-- Kart Placeholder -->
    <div class="rounded shadow-sm border p-4">
      <div class="placeholder-glow mb-3">
        <span class="placeholder col-6"></span>
      </div>

      <div class="row g-3">
        <div class="col-md-6">
          <div class="placeholder-glow mb-2">
            <span class="placeholder col-4"></span>
          </div>
          <span class="placeholder col-12 form-control"></span>
        </div>

        <div class="col-md-6">
          <div class="placeholder-glow mb-2">
            <span class="placeholder col-4"></span>
          </div>
          <span class="placeholder col-12 form-control"></span>
        </div>

        <div class="col-12">
          <div class="placeholder-glow mb-2">
            <span class="placeholder col-3"></span>
          </div>
          <span class="placeholder col-12 form-control"></span>
        </div>

        <div class="col-12">
          <div class="placeholder-glow mb-2">
            <span class="placeholder col-2"></span>
          </div>
          <span class="placeholder col-12 form-control" style="height:100px;"></span>
        </div>
      </div>

      <div class="d-flex justify-content-end mt-4">
        <span class="btn btn-success disabled placeholder col-2"></span>
      </div>
    </div>
  </div>

{/if}

{#if error}
  <div class="alert alert-danger text-center w-100 mb-3" role="alert">
    <i class="fas fa-exclamation-triangle me-2"></i>
    {$_('pages.theme-settings.error')}
  </div>
  <button class="btn btn-secondary" on:click={load}>
    <i class="fas fa-redo me-2"></i> {$_('buttons.try-again')}
  </button>
{/if}

{#if !error}
  <div hidden="{loading || alwaysLoading}" in:fade>
    <iframe
      bind:this={frame}
      src={src}
      title="{$_('pages.theme-settings.title')}"
      style="width:100%; border:0; display:block; background:transparent; bg-dark"
      scrolling="no"
      allowtransparency="true"
      sandbox="allow-same-origin allow-scripts allow-forms"
      on:load={handleLoad}
    ></iframe>
  </div>
{/if}

<script>
  import { onMount } from "svelte";
  import { getContext } from "svelte";
  import { _ } from "svelte-i18n";
  import { fade } from "svelte/transition";

  import CardMenuItem from "$lib/component/CardMenuItem.svelte";
  import PageActions from "$lib/component/PageActions.svelte";
  import CardMenu from "$lib/component/CardMenu.svelte";

  const pageTitle = getContext("pageTitle");
  pageTitle.set("pages.theme-settings.title");

  let frame = null;

  let src;
  let childOrigin = "*";
  let loading = true;
  let error;

  let alwaysLoading = true;

  function handleMessage(e) {
    if (childOrigin !== "*" && e.origin !== childOrigin) return;
    const data = e.data;
    if (!data || typeof data !== "object") return;

    if (data.type === "theme-iframe-height" && frame) {
      const h = Number(data.height) || 0;
      if (h > 0) frame.style.height = h + "px";
    }
  }

  function handleLoad() {
    setTimeout(() => {
      loading = false;
    }, 500)
  }

  async function load() {
    loading = true;
    error = null;

    try {
      src = "/theme-settings"
      const url = new URL(src, window.location.href);
      childOrigin = url.origin;
    } catch (_) {
      childOrigin = "*";
    }

    window.addEventListener("message", handleMessage);

    const onLoad = () => {
      frame?.contentWindow?.postMessage({ type: "theme-iframe-ping" }, childOrigin);
    };
    frame?.addEventListener("load", onLoad);

    setTimeout(() => {
      if (loading) {
        loading = false;
        error = true;
      }
    },5*1000) // 5 seconds;

    return () => {
      frame?.removeEventListener("load", onLoad);
      window.removeEventListener("message", handleMessage);
    };
  }

  onMount(load);
</script>