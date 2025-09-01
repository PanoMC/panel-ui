<PageActions>
  <CardMenu slot="middle">
    <CardMenuItem href="/view">{$_('buttons.themes')}</CardMenuItem>
    <CardMenuItem href="/view/theme-settings">{$_('buttons.theme-settings')}</CardMenuItem>
  </CardMenu>
</PageActions>

{#if loading || alwaysLoading}
  <div class="position-relative" style="height: 500px;">
    <div
      class="position-absolute top-0 start-0 w-100 h-50 d-flex align-items-center justify-content-center bg-white"
      style="opacity:.8;"
    >
      <div class="spinner-border text-primary" role="status" aria-label="Loading"></div>
    </div>
  </div>
{/if}

{#if error}
  <div class="d-flex flex-column align-items-center justify-content-center w-100 h-100 p-4 rounded">
    <div class="alert alert-danger text-center w-100 mb-3" role="alert">
      <i class="fas fa-exclamation-triangle me-2"></i>
      {$_('pages.theme-settings.error')}
    </div>
    <button class="btn btn-secondary" on:click={load}>
      <i class="fas fa-redo me-2"></i> {$_('buttons.try-again')}
    </button>
  </div>
{/if}

{#if !error}
  <div hidden="{loading || alwaysLoading}" in:fade>
    <iframe
      bind:this={frame}
      src={src}
      title="{$_('pages.theme-settings.title')}"
      style="width:100%; border:0; display:block; background:transparent;"
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

  let alwaysLoading = false;

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