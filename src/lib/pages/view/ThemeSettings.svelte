<PageActions>
  <CardMenu slot="middle">
    <CardMenuItem href="/view">{$_("buttons.themes")}</CardMenuItem>
    <CardMenuItem href="/view/theme-settings"
      >{$_("buttons.theme-settings")}</CardMenuItem>
  </CardMenu>
</PageActions>

{#if loading || alwaysLoading}
  <div
    class="d-flex align-items-center justify-content-center"
    style="height: 500px;">
    <div class="spinner-border text-primary" role="status" aria-label="Loading">
    </div>
  </div>
{/if}

{#if error}
  <div class="alert alert-danger text-center mb-0" role="alert">
    <i class="fas fa-exclamation-triangle me-2"></i>
    {$_("pages.theme-settings.error")}
  </div>
  <div class="d-flex justify-content-center">
    <button class="btn btn-secondary" on:click={load}>
      <i class="fas fa-redo me-2"></i>
      {$_("buttons.try-again")}
    </button>
  </div>
{/if}

{#if !error}
  <div hidden={loading || alwaysLoading} in:fade>
    <iframe
      bind:this={frame}
      src={src}
      title={$_("pages.theme-settings.title")}
      style="width:100%; border:0; display:block; background:transparent; bg-dark"
      scrolling="no"
      allowtransparency="true"
      sandbox="allow-same-origin allow-scripts allow-forms"></iframe>
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

    if (data.type === "theme-settings-loaded") {
      sendTheme()
      sendCSS()
    }

    if (data.type === "theme-settings-ready") {
      loading = false;
    }
  }

  function sendTheme() {
    if (!frame?.contentWindow || !childOrigin) return;
    
    // Get data-bs-theme value from panel
    const bsTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
    
    console.log('Sending data-bs-theme to iframe:', bsTheme);
    frame.contentWindow.postMessage({
      type: 'set-bs-theme',
      theme: bsTheme
    }, childOrigin);
  }

  function sendCSS() {
    if (!frame?.contentWindow || !childOrigin) return;
    
    // Collect global CSS (non-scoped styles)
    // Get all style tags present in DOM at runtime
    const allStyles = Array.from(document.querySelectorAll('style'));
    const globalStyles = allStyles
      .filter(style => {
        // Exclude scoped styles (those with data-svelte-h attribute)
        return !style.hasAttribute('data-svelte-h');
      })
      .map(style => {
        // Use textContent or innerHTML
        return style.textContent || style.innerHTML || '';
      })
      .filter(css => css.trim().length > 0) // Filter out empty ones
      .join('\n\n');
    
    if (globalStyles) {
      console.log('Sending CSS to iframe:', globalStyles.substring(0, 100) + '...');
      frame.contentWindow.postMessage({
        type: 'inject-css',
        css: globalStyles
      }, childOrigin);
    } else {
      console.warn('No global CSS found to send');
    }
  }

  async function load() {
    loading = true;
    error = null;

    try {
      src = "/theme-settings";
      const url = new URL(src, window.location.href);
      childOrigin = url.origin;
    } catch (_) {
      childOrigin = "*";
    }

    window.addEventListener("message", handleMessage);

    const onLoad = () => {
      frame?.contentWindow?.postMessage(
        { type: "theme-iframe-ping" },
        childOrigin,
      );
    };
    frame?.addEventListener("load", onLoad);

    setTimeout(() => {
      if (loading) {
        loading = false;
        error = true;
      }
    }, 5 * 1000); // 5 seconds;

    return () => {
      frame?.removeEventListener("load", onLoad);
      window.removeEventListener("message", handleMessage);
    };
  }

  onMount(load);
</script>
