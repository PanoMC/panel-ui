{#if homeController}
  <div class="mb-3">
    <HomePageSelect controller={homeController} />
  </div>
{/if}

{#if loading || alwaysLoading}
  <div class="d-flex align-items-center justify-content-center" style="height: 500px;">
    <div class="spinner-border text-primary" role="status" aria-label="Loading"></div>
  </div>
{/if}

{#if error}
  <div class="alert alert-danger d-flex align-items-center mb-0" role="alert">
    <i class="fa-solid fa-circle-exclamation me-3" aria-hidden="true"></i>
    <div class="flex-grow-1">
      {$_('pages.theme-settings.error')}
    </div>
    <button
      type="button"
      title={$_('buttons.try-again')}
      aria-label={$_('buttons.try-again')}
      class="btn alert-btn ms-3"
      on:click={load}>
      <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>
    </button>
  </div>
{/if}

{#if !error}
  <div hidden={loading || alwaysLoading} in:fade>
    <iframe
      bind:this={frame}
      {src}
      title={$_('pages.theme-settings.title')}
      style="width:100%; border:0; display:block; background:transparent; bg-dark"
      scrolling="no"
      allowtransparency="true"
      sandbox="allow-same-origin allow-scripts allow-forms"
      on:load={handleLoad}></iframe>
  </div>
{/if}

<script>
  import { onMount, onDestroy } from 'svelte';
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import { base } from '$app/paths';
  import { browser } from '$app/environment';
  import {
    show as showToast,
    showError as showErrorToast,
    showSuccess as showSuccessToast,
  } from '$lib/components/ToastContainer.svelte';
  import { show as showConfirm } from '$lib/components/modals/ConfirmActionModal.svelte';
  import ApiUtil from '$lib/api.util.js';

  import HomePageSelect from './theme/HomePageSelect.svelte';
  import { createHomeController } from './theme/home.controller.js';
  import { createThemeApi } from './theme/theme.api.js';

  const pageTitle = getContext('pageTitle');
  const panelTheme = getContext('panelTheme');
  pageTitle.set('pages.theme-settings.title');

  let frame = null;

  let src;
  let childOrigin = '*';
  let loading = true;
  let error;

  let alwaysLoading = false;

  // The home page select above the settings (doc 01 section 9). It shows only when the backend
  // answers the read: an older backend or a failed call leaves the page as it was.
  let homeController = null;

  async function loadHome() {
    const themeApi = createThemeApi(ApiUtil);
    const result = await themeApi.getHome();

    if (result.ok && Array.isArray(result.body?.options)) {
      homeController = createHomeController({
        api: themeApi,
        notify: {
          success: (key, values) => showSuccessToast(key, values),
          error: (key, values) => showErrorToast(key, values),
        },
        initial: result.body,
      });
    }
  }

  function handleMessage(e) {
    if (childOrigin !== '*' && e.origin !== childOrigin) return;
    const data = e.data;
    if (!data || typeof data !== 'object') return;

    if (data.type) {
      console.log('Panel received message', data.type);
    }

    if (data.type === 'theme-iframe-height' && frame) {
      const h = Number(data.height) || 0;
      if (h > 0) frame.style.height = h + 'px';
    }

    if (data.type === 'show-confirm') {
      // A theme may send the rest of the dialog next to the title; one that predates those
      // fields sends the title alone and gets the default label and colour.
      showConfirm(
        {
          title: data.title,
          description: data.description,
          confirmLabel: data.confirmLabel,
          variant: data.variant,
        },
        () => {
          frame?.contentWindow?.postMessage({ type: 'confirm-callback', id: data.id }, childOrigin);
        },
      );
    }

    if (data.type === 'show-toast') {
      // The theme settings UI runs in an iframe, so the panel cannot tell an outcome from
      // a failure on its own — the theme tells us via `variant`. Themes on an engine that
      // predates the field send nothing, and the toast stays neutral as before.
      showToast(data.text, data.params, data.toastComponent, { variant: data.variant ?? null });
    }

    if (data.type === 'theme-settings-loaded') {
      sendTheme();
      sendCSS();
    }

    if (data.type === 'theme-settings-ready') {
      loading = false;
    }
  }

  function sendTheme(theme) {
    if (!frame?.contentWindow || !childOrigin) return;

    // Get theme from panelTheme store
    const bsTheme = theme || $panelTheme;

    console.log('Sending data-bs-theme to iframe:', bsTheme);
    frame.contentWindow.postMessage(
      {
        type: 'set-bs-theme',
        theme: bsTheme,
      },
      childOrigin,
    );
  }

  async function sendCSS() {
    if (!browser) return;
    if (!frame?.contentWindow || !childOrigin) return;

    // 1. Collect inline styles
    const allStyles = Array.from(document.querySelectorAll('style'));
    const inlineCSS = allStyles
      .filter((style) => !style.hasAttribute('data-svelte-h'))
      .map((style) => style.textContent || style.innerHTML || '')
      .filter((css) => css.trim().length > 0)
      .join('\n\n');

    // 2. Collect CSS links
    const cssLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    const baseUrl = window.location.origin + base;

    const globalLinks = cssLinks
      .map((link) => link.href || '')
      .filter((href) => {
        if (!href) return false;
        // Include SvelteKit assets or our global style.css
        // We exclude anything that might be theme-specific if we are in the panel
        const isAppAsset = href.includes('/_app/');
        const isGlobalStyle = href.includes('style.css');
        const isThemeAsset = href.includes('/theme/');
        return (isAppAsset || isGlobalStyle) && !isThemeAsset;
      })
      .map((href) => {
        try {
          const url = new URL(href);
          if (url.origin === window.location.origin) {
            // Handle SvelteKit immutable assets base path
            if (url.pathname.includes('/_app')) {
              const appIndex = url.pathname.indexOf('/_app');
              const expectedBasePath = (base || '') + '/_app';
              if (appIndex > 0 && !url.pathname.startsWith(expectedBasePath)) {
                return (
                  baseUrl +
                  '/_app' +
                  url.pathname.substring(appIndex + '/_app'.length) +
                  (url.search || '') +
                  (url.hash || '')
                );
              }
            }
          }
          return href;
        } catch (e) {
          return href;
        }
      });

    console.log(
      'Sending combined CSS to iframe. Inline length:',
      inlineCSS.length,
      'Links:',
      globalLinks.length,
    );
    console.log('Inline CSS content:', inlineCSS);
    console.log('Global Links:', globalLinks);

    frame.contentWindow.postMessage(
      {
        type: 'inject-css-all',
        css: inlineCSS,
        links: globalLinks,
      },
      childOrigin,
    );
  }

  function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  async function handleLoad() {
    if (!frame) await delay(100);

    if (childOrigin && frame.contentWindow) {
      sendTheme();
      sendCSS();
    }
  }

  async function load() {
    if (browser) {
      window.removeEventListener('message', handleMessage);
      window.addEventListener('message', handleMessage);
    }

    loading = true;
    error = null;

    try {
      src = '/theme-settings';
      const url = new URL(
        src,
        typeof window !== 'undefined' ? window.location.href : 'http://localhost',
      );
      childOrigin = url.origin;
    } catch (_) {
      childOrigin = '*';
    }

    const onLoad = () => {
      frame?.contentWindow?.postMessage({ type: 'theme-iframe-ping' }, childOrigin);
    };

    frame?.removeEventListener('load', onLoad);
    frame?.addEventListener('load', onLoad);

    setTimeout(() => {
      if (loading) {
        loading = false;
        error = true;
      }
    }, 5 * 1000); // 5 seconds;

    return () => {
      frame?.removeEventListener('load', onLoad);
      if (browser) {
        window.removeEventListener('message', handleMessage);
      }
    };
  }

  let unsubscribeTheme;
  let cleanupLoad;

  onMount(() => {
    cleanupLoad = load();
    loadHome();

    unsubscribeTheme = panelTheme.subscribe((value) => {
      sendTheme(value);
    });
  });

  onDestroy(() => {
    if (unsubscribeTheme) {
      unsubscribeTheme();
    }
    if (cleanupLoad && typeof cleanupLoad === 'function') {
      cleanupLoad();
    } else if (typeof cleanupLoad?.then === 'function') {
      cleanupLoad.then((cleanup) => {
        if (typeof cleanup === 'function') cleanup();
      });
    }
    if (browser) {
      window.removeEventListener('message', handleMessage);
    }
  });
</script>
