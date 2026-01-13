{#if loading || alwaysLoading}
  <div class="d-flex align-items-center justify-content-center" style="height: 500px;">
    <div class="spinner-border text-primary" role="status" aria-label="Loading"></div>
  </div>
{/if}

{#if error}
  <div class="alert alert-danger text-center mb-0" role="alert">
    <i class="fas fa-exclamation-triangle me-2"></i>
    {$_('pages.theme-settings.error')}
  </div>
  <div class="d-flex justify-content-center">
    <button class="btn btn-secondary" on:click={load}>
      <i class="fas fa-redo me-2"></i>
      {$_('buttons.try-again')}
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

  const pageTitle = getContext('pageTitle');
  const panelTheme = getContext('panelTheme');
  pageTitle.set('pages.theme-settings.title');

  let frame = null;

  let src;
  let childOrigin = '*';
  let loading = true;
  let error;

  let alwaysLoading = false;

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
    if (!frame?.contentWindow || !childOrigin) return;

    // Collect global CSS (non-scoped styles)
    // Get all style tags present in DOM at runtime
    const allStyles = Array.from(document.querySelectorAll('style'));
    const globalStyles = allStyles
      .filter((style) => {
        // Exclude scoped styles (those with data-svelte-h attribute)
        return !style.hasAttribute('data-svelte-h');
      })
      .map((style) => {
        // Use textContent or innerHTML
        return style.textContent || style.innerHTML || '';
      })
      .filter((css) => css.trim().length > 0) // Filter out empty ones
      .join('\n\n');

    // If we have inline styles, send them
    if (globalStyles) {
      console.log('Sending inline CSS to iframe:', globalStyles.substring(0, 100) + '...');
      frame.contentWindow.postMessage(
        {
          type: 'inject-css',
          css: globalStyles,
        },
        childOrigin,
      );
    } else {
      // If no inline styles, check for link tags (build mode)
      const cssLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      const baseUrl = window.location.origin + base;
      const globalLinks = cssLinks
        .filter((link) => {
          // Include only global CSS links (exclude theme-specific ones)
          const href = link.href || '';
          // Exclude theme-specific links, include _app links (build output)
          return href.includes('_app') && !href.includes('theme');
        })
        .map((link) => {
          const href = link.href || '';
          try {
            const url = new URL(href);
            // If URL doesn't start with base + /_app, remove the part between base and /_app
            if (url.origin === window.location.origin && url.pathname.includes('/_app')) {
              const appIndex = url.pathname.indexOf('/_app');
              const expectedBasePath = base + '/_app';
              if (appIndex > 0 && !url.pathname.startsWith(expectedBasePath)) {
                // Remove everything between origin+base and /_app
                return (
                  baseUrl +
                  '/_app' +
                  url.pathname.substring(appIndex + '/_app'.length) +
                  (url.search || '') +
                  (url.hash || '')
                );
              }
            }
            return href;
          } catch (e) {
            return href;
          }
        });

      if (globalLinks.length > 0) {
        console.log('Sending CSS links to iframe:', globalLinks);
        frame.contentWindow.postMessage(
          {
            type: 'inject-css-links',
            links: globalLinks,
          },
          childOrigin,
        );
      } else {
        console.warn('No global CSS found to send (neither style tags nor link tags)');
      }
    }
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
    window.removeEventListener('message', handleMessage);
    window.addEventListener('message', handleMessage);

    loading = true;
    error = null;

    try {
      src = '/theme-settings';
      const url = new URL(src, window.location.href);
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
      window.removeEventListener('message', handleMessage);
    };
  }

  let unsubscribeTheme;

  onMount(() => {
    load();

    unsubscribeTheme = panelTheme.subscribe((value) => {
      sendTheme(value);
    });
  });

  onDestroy(() => {
    if (unsubscribeTheme) {
      unsubscribeTheme();
    }
  });
</script>
