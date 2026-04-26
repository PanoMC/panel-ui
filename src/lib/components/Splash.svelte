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

  .stuck-ui {
    opacity: 0;
    pointer-events: none;
    animation: show-stuck 0.3s ease-in forwards;
    animation-delay: 10s;
  }

  .stuck-ui.stuck-hidden {
    display: none !important;
    animation: none;
  }

  @keyframes show-stuck {
    to {
      opacity: 1;
      pointer-events: auto;
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
  </div>

  {#if networkErrors}
    <div class="mt-4 text-center">
      {#if notLoggedIn}
        <small>{$_('components.splash.errors.session')}</small>
      {:else if noPermission}
        {$_('components.splash.errors.permission')}
      {:else}
        {$_('components.splash.errors.connection')}
      {/if}
      <br />
      <div class="d-flex flex-wrap align-items-center justify-content-center gap-2 mt-3">
        <button
          class="btn btn-sm btn-outline-secondary"
          on:click={onManualRefreshClick}
          type="button">
          {$_('components.splash.manual-refresh')}
        </button>
        {#if !notLoggedIn && !noPermission}
          <button
            class="btn btn-sm btn-primary"
            on:click={onRetryClick}
            class:disabled={$retryingNetworkErrors}
            type="button">
            {$retryingNetworkErrors
              ? $_('components.splash.refreshing')
              : $_('components.splash.retry')}
          </button>
        {/if}
      </div>
    </div>
  {/if}

  <div class="mt-4 text-center stuck-ui" class:stuck-hidden={networkErrors || jsLoaded}>
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
  import { base } from '$app/paths';

  let networkErrors = false;
  let jsLoaded = false;

  const session = getContext('session');

  $: basicData = $session.basicData;

  $: notLoggedIn = basicData.error === 'NOT_LOGGED_IN';
  $: noPermission = basicData.error === 'NO_PERMISSION';

  onMount(() => {
    jsLoaded = true;
  });

  onDestroy(() => {
    if (unsubscribe) unsubscribe();
  });

  const unsubscribe = networkErrorCallbacks.subscribe((value) => {
    networkErrors = value.length !== 0;
  });

  function onManualRefreshClick() {
    location.reload();
  }

  async function onRetryClick() {
    if (get(retryingNetworkErrors)) {
      return;
    }

    await resumeAfterNetworkError();
  }
</script>
