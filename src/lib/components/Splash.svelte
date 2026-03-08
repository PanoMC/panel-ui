<style>
  .center-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .logo-wrapper {
    border-radius: 12px;
    width: 64px;
    height: 64px;
  }

  .mc-img-wrapper {
    width: 80px;
    height: 80px;
  }

  .hytale-img-wrapper {
    width: 80px;
    height: 80px;
  }

  .pano-anim {
    animation: logo-swap-pano 4.5s infinite ease-in-out;
  }

  .mc-anim {
    animation: logo-swap-mc 4.5s infinite ease-in-out;
  }

  .hytale-anim {
    animation: logo-swap-hytale 4.5s infinite ease-in-out;
  }

  @keyframes logo-swap-pano {
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

  @keyframes logo-swap-mc {
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

  @keyframes logo-swap-hytale {
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

  .pulse {
    animation: pulse 1.5s infinite ease-in-out;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
  }
</style>

<svelte:head>
  {#if networkErrors}
    <style>
      .show {
        display: none !important;
      }
    </style>
  {/if}
</svelte:head>

<div
  class="d-flex align-items-center justify-content-center vh-100 w-100 flex-column"
  role="status"
  in:fade
  out:fade>
  <div class="loader-content position-relative" style="height: 100px; width: 100px;">
    {#if networkErrors}
      <div
        class="logo-wrapper bg-primary p-2 shadow-sm position-absolute center-content d-flex align-items-center justify-content-center"
        class:pulse={$retryingNetworkErrors}>
        <img alt="Pano" src="{base}/assets/img/logo.svg" class="w-100 h-100 object-fit-contain" />
      </div>
    {:else}
      <div
        class="logo-wrapper bg-primary p-2 shadow-sm pano-anim center-content d-flex align-items-center justify-content-center">
        <img alt="Pano" src="{base}/assets/img/logo.svg" class="w-100 h-100 object-fit-contain" />
      </div>
      <div
        class="mc-img-wrapper mc-anim center-content d-flex align-items-center justify-content-center">
        <img
          alt="Minecraft"
          src="{base}/assets/img/minecraft-icon.png"
          class="w-100 h-100 object-fit-contain" />
      </div>
      <div
        class="hytale-img-wrapper hytale-anim center-content d-flex align-items-center justify-content-center">
        <img
          alt="Hytale"
          src="{base}/assets/img/hytale-icon.png"
          class="w-100 h-100 object-fit-contain" />
      </div>
    {/if}
  </div>

  {#if networkErrors}
    <div class="mt-4 text-center">
      {#if notLoggedIn}
        {$_('components.splash.errors.session')}
      {:else if noPermission}
        {$_('components.splash.errors.permission')}
      {:else}
        {$_('components.splash.errors.connection')}
      {/if}
      <br />
      <button
        class="btn btn-secondary mt-3"
        on:click={onResumeClick}
        class:disabled={$retryingNetworkErrors}>
        {$retryingNetworkErrors
          ? $_('components.splash.refreshing')
          : $_('components.splash.refresh')}
      </button>
    </div>
  {:else if showStuckUI}
    <div class="mt-4 text-center" in:fade>
      <small class="text-secondary d-block mb-3">
        {$_('components.splash.stuck-text')}
      </small>
      <button class="btn btn-outline-secondary btn-sm" on:click={() => location.reload()}>
        <i class="fas fa-sync-alt me-2"></i>
        {$_('components.splash.manual-refresh')}
      </button>
    </div>
  {/if}
</div>

<script>
  import { getContext, onDestroy, onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { _ } from 'svelte-i18n';

  import {
    networkErrorCallbacks,
    resumeAfterNetworkError,
    retryingNetworkErrors,
  } from '$lib/Store';
  import { base } from '$app/paths';
  import { browser } from '$app/environment';

  let networkErrors = false;
  let showStuckUI = false;
  let stuckTimer;

  const session = getContext('session');

  $: basicData = $session.basicData;

  $: notLoggedIn = basicData.error === 'NOT_LOGGED_IN';
  $: noPermission = basicData.error === 'NO_PERMISSION';

  if (browser) {
    stuckTimer = setTimeout(() => {
      showStuckUI = true;
    }, 6000);
  }

  onDestroy(() => {
    clearTimeout(stuckTimer);
    if (unsubscribe) unsubscribe();
  });

  const unsubscribe = networkErrorCallbacks.subscribe((value) => {
    networkErrors = value.length !== 0;
  });

  async function onResumeClick() {
    if (notLoggedIn || noPermission) {
      location.reload();

      return;
    }

    await resumeAfterNetworkError();
  }
</script>
