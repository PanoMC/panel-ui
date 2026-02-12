<style>
  .center-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logo-wrapper {
    background-color: var(--bs-primary);
    padding: 8px;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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

  .logo-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .mc-img {
    height: 100%;
    width: 100%;
    object-fit: contain;
  }

  .hytale-img {
    height: 100%;
    width: 100%;
    object-fit: contain;
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
        class="logo-wrapper position-absolute center-content"
        class:pulse={$retryingNetworkErrors}>
        <img alt="Pano" src="{base}/assets/img/logo.svg" class="logo-img" />
      </div>
    {:else}
      <div class="logo-wrapper pano-anim center-content">
        <img alt="Pano" src="{base}/assets/img/logo.svg" class="logo-img" />
      </div>
      <div class="mc-img-wrapper mc-anim center-content">
        <img alt="Minecraft" src="{base}/assets/img/minecraft-icon.png" class="mc-img" />
      </div>
      <div class="hytale-img-wrapper hytale-anim center-content">
        <img alt="Hytale" src="{base}/assets/img/hytale-icon.png" class="hytale-img" />
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
  {/if}
</div>

<script>
  import { getContext, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import { _ } from 'svelte-i18n';

  import {
    networkErrorCallbacks,
    resumeAfterNetworkError,
    retryingNetworkErrors,
  } from '$lib/Store';
  import { base } from '$app/paths';

  let networkErrors = false;

  const session = getContext('session');

  $: basicData = $session.basicData;

  $: notLoggedIn = basicData.error === 'NOT_LOGGED_IN';
  $: noPermission = basicData.error === 'NO_PERMISSION';

  onDestroy(
    networkErrorCallbacks.subscribe((value) => {
      networkErrors = value.length !== 0;
    }),
  );

  async function onResumeClick() {
    if (notLoggedIn || noPermission) {
      location.reload();

      return;
    }

    await resumeAfterNetworkError();
  }
</script>
