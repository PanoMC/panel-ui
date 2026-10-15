<style>
  .splash-logo-layer {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .splash-pano-logo {
    border-radius: 12px;
    width: 64px;
    height: 64px;
  }

  .splash-minecraft-logo {
    width: 80px;
    height: 80px;
  }

  .splash-hytale-logo {
    width: 80px;
    height: 80px;
  }

  .splash-cycle-pano {
    animation: splash-logo-cycle-pano 4.5s infinite ease-in-out;
  }

  .splash-cycle-minecraft {
    animation: splash-logo-cycle-minecraft 4.5s infinite ease-in-out;
  }

  .splash-cycle-hytale {
    animation: splash-logo-cycle-hytale 4.5s infinite ease-in-out;
  }

  @keyframes splash-logo-cycle-pano {
    0%,
    28% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    33%,
    95% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.6);
    }
    100% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  @keyframes splash-logo-cycle-minecraft {
    0%,
    28% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.6);
    }
    33%,
    61% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.1);
    }
    66%,
    100% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.6);
    }
  }

  @keyframes splash-logo-cycle-hytale {
    0%,
    61% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.6);
    }
    66%,
    95% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.1);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.6);
    }
  }

  /* The splash lies over the page instead of standing in front of it in the flow. While it fades
     out it is still in the document; as a block it kept its full-height place at the top for that
     moment and the page appeared under it, then jumped up when it was gone (an empty band at the
     top that came and went). As a cover it takes no room, and the page shows through the fade. */
  .splash-cover {
    position: fixed;
    inset: 0;
    /* Over the navbar and the sidebar, under the dialogs that say why Pano is away (restarting,
       a restore in progress). */
    z-index: 1050;
    /* The servers workspace names its own surface (`--splash-bg`, src/styles/_workspace.scss). */
    background-color: var(--splash-bg, var(--bs-body-bg));
  }

  /* An error is on screen and nothing is being tried: no loading animation, just the Pano mark. */
  .splash-logo-stage.splash-logo-still .splash-logo-layer {
    animation: none;
    opacity: 0;
  }

  .splash-logo-stage.splash-logo-still .splash-cycle-pano {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }

  .splash-stuck-help {
    opacity: 0;
    pointer-events: none;
    animation: splash-stuck-help-reveal 0.3s ease-in forwards;
    animation-delay: 10s;
  }

  .splash-stuck-help.splash-stuck-help-hidden {
    display: none !important;
    animation: none;
  }

  @keyframes splash-stuck-help-reveal {
    to {
      opacity: 1;
      pointer-events: auto;
    }
  }
</style>

<svelte:head>
  {#if showErrors}
    <style>
      .show {
        display: none !important;
      }
    </style>
  {/if}
</svelte:head>

<!-- Opened for a servers page it wears that workspace's surface (src/styles/_workspace.scss). -->
<div
  class="splash-screen splash-cover d-flex align-items-center justify-content-center vh-100 w-100 flex-column"
  class:workspace-game={serversSplash}
  data-bs-theme={serversSplash ? 'dark' : undefined}
  role="status"
  in:fade
  out:fade>
  <div
    class="splash-logo-stage position-relative"
    class:splash-logo-still={logoStill}
    style="height: 100px; width: 100px;">
    <!-- Pano Host wears the same mark on its own color (as the website's Pano Host brand). -->
    <div
      class="splash-pano-logo p-2 shadow-sm splash-cycle-pano splash-logo-layer d-flex align-items-center justify-content-center"
      class:bg-primary={!$page.data.hosted}
      style:background-image={$page.data.hosted
        ? 'linear-gradient(135deg, var(--bs-primary) 0%, var(--bs-info) 100%)'
        : undefined}>
      <img
        alt={$page.data.hosted ? 'Pano Host' : 'Pano'}
        src="{base}/assets/img/logo.svg"
        class="w-100 h-100 object-fit-contain" />
    </div>
    <div
      class="splash-minecraft-logo splash-cycle-minecraft splash-logo-layer d-flex align-items-center justify-content-center">
      <img
        alt="Minecraft"
        src="{base}/assets/img/minecraft-icon.png"
        class="w-100 h-100 object-fit-contain" />
    </div>
    <div
      class="splash-hytale-logo splash-cycle-hytale splash-logo-layer d-flex align-items-center justify-content-center">
      <img
        alt="Hytale"
        src="{base}/assets/img/hytale-icon.png"
        class="w-100 h-100 object-fit-contain" />
    </div>
  </div>

  {#if showErrors}
    <div class="mt-4 text-center">
      <span class="badge rounded-pill text-bg-danger text-wrap fw-normal fs-6">
        {#if showNotLoggedIn}
          {$_('components.splash.errors.session')}
        {:else if showNoPermission}
          {$_('components.splash.errors.permission')}
        {:else}
          {$_('components.splash.errors.connection')}
        {/if}
      </span>
      <div class="d-flex flex-wrap align-items-center justify-content-center gap-2 mt-3">
        <button class="btn btn-sm btn-outline-secondary" on:click={reloadPage} type="button">
          {$_('components.splash.manual-refresh')}
        </button>
        <!-- Trying again only helps a lost connection: a missing session or permission stays missing. -->
        {#if !showNotLoggedIn && !showNoPermission}
          <button
            class="btn btn-sm btn-primary"
            on:click={onRetryClick}
            disabled={retrying}
            type="button">
            {retrying ? $_('components.splash.refreshing') : $_('components.splash.retry')}
          </button>
        {/if}
      </div>
    </div>
  {/if}

  <div
    class="mt-4 text-center splash-stuck-help"
    class:splash-stuck-help-hidden={showErrors || isHydrated}>
    <small class="d-block mb-3">
      {$_('components.splash.stuck-text')}
    </small>
    <a href="." class="btn btn-outline-secondary btn-sm">
      <i class="fas fa-sync-alt me-2"></i>
      {$_('components.splash.manual-refresh')}
    </a>
  </div>
</div>

<script>
  import { getContext, onDestroy, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { fade } from 'svelte/transition';
  import { _ } from 'svelte-i18n';

  import {
    networkErrorCallbacks,
    resumeAfterNetworkError,
    retryingNetworkErrors,
  } from '$lib/Store';
  import { base } from '@panomc/sdk/core/js/basePath.js';
  import { sidebarTabForPath } from '$lib/navigation.util.js';
  import { page } from '@panomc/sdk/core/js/appStores.js';

  let hasNetworkErrors = false;
  let isHydrated = false;

  const session = getContext('session');
  const sidebarTabsState = getContext('sidebarTabsState');

  // A servers page is told by its address, not by the sidebar's workspace alone: that one waits for
  // the session (it answers "website" until the permission to manage servers is known), and the
  // splash is exactly what is on screen while the session loads.
  $: serversSplash =
    sidebarTabForPath($page.url.pathname, base) === 'game' || $sidebarTabsState === 'game';

  $: basicData = $session.basicData;

  $: notLoggedIn = basicData.error?.code === 'NOT_LOGGED_IN';
  $: noPermission = basicData.error?.code === 'NO_PERMISSION';

  // TEMPORARY: while true the splash plays its three error messages (session, permission,
  // connection) one after the other, so they can be looked at. Set to false for the real ones.
  const DEMO_ERRORS = false;
  const DEMO_KINDS = ['session', 'permission', 'connection'];
  let demoIndex = 0;

  $: demoKind = DEMO_ERRORS ? DEMO_KINDS[demoIndex % DEMO_KINDS.length] : null;
  $: showErrors = hasNetworkErrors || demoKind !== null;
  $: showNotLoggedIn = demoKind ? demoKind === 'session' : notLoggedIn;
  $: showNoPermission = demoKind ? demoKind === 'permission' : noPermission;
  // The logos cycle while something is loading. With an error on screen nothing is, so the cycle
  // stops on the Pano mark; "try again" starts it again for as long as the retry runs. The "stuck
  // here?" help is not an error: the page is still loading under it.
  $: logoStill = showErrors && !retrying;

  onMount(() => {
    isHydrated = true;

    if (!DEMO_ERRORS) {
      return;
    }

    const demoTimer = setInterval(() => (demoIndex += 1), 3500);

    return () => clearInterval(demoTimer);
  });

  onDestroy(() => {
    if (unsubscribeNetworkErrors) unsubscribeNetworkErrors();
  });

  const unsubscribeNetworkErrors = networkErrorCallbacks.subscribe((value) => {
    hasNetworkErrors = value.length !== 0;
  });

  function reloadPage() {
    location.reload();
  }

  /** A retry is shown for at least this long: a refused connection answers at once, and a button
   *  that flickers back gives no sign that anything was tried. */
  const MIN_RETRY_MS = 1000;
  let retryHeld = false;

  $: retrying = retryHeld || $retryingNetworkErrors;

  async function onRetryClick() {
    if (retryHeld || get(retryingNetworkErrors)) {
      return;
    }

    retryHeld = true;

    const shownFor = new Promise((resolve) => setTimeout(resolve, MIN_RETRY_MS));

    try {
      await resumeAfterNetworkError();
    } finally {
      await shownFor;

      retryHeld = false;
    }
  }
</script>
