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
  <div class="loader-content d-flex align-items-center justify-content-center position-relative" style="height: 100px; width: 100px;">
    {#if networkErrors}
      <div class="logo-wrapper" class:pulse={$retryingNetworkErrors}>
        <img alt="Pano" src="{base}/assets/img/logo.svg" class="logo-img" />
      </div>
    {:else}
      {#key currentStep}
        {#if currentStep === 0}
          <div class="logo-wrapper zoom-in">
            <img alt="Pano" src="{base}/assets/img/logo.svg" class="logo-img" />
          </div>
        {:else}
          <div class="zoom-in">
            <img alt="Minecraft" src="{base}/assets/img/minecraft-icon.png" class="mc-img" />
          </div>
        {/if}
      {/key}
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

<style>
  .logo-wrapper {
    background-color: var(--bs-primary);
    padding: 8px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    width: 64px;
    height: 64px;
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

  .logo-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .mc-img {
    height: 80px;
    width: auto;
    object-fit: contain;
  }

  .zoom-in {
    animation: zoom-in 0.8s ease-out forwards;
  }

  @keyframes zoom-in {
    0% {
      transform: scale(0.7);
      opacity: 0;
    }
    100% {
      transform: scale(1.1);
      opacity: 1;
    }
  }
</style>

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

  let networkErrors = false;
  let currentStep = 0;

  const session = getContext('session');

  $: basicData = $session.basicData;

  $: notLoggedIn = basicData.error === 'NOT_LOGGED_IN';
  $: noPermission = basicData.error === 'NO_PERMISSION';

  onDestroy(
    networkErrorCallbacks.subscribe((value) => {
      networkErrors = value.length !== 0;
    }),
  );

  onMount(() => {
    const interval = setInterval(() => {
      currentStep = (currentStep + 1) % 2;
    }, 800);

    return () => clearInterval(interval);
  });

  async function onResumeClick() {
    if (notLoggedIn || noPermission) {
      location.reload();

      return;
    }

    await resumeAfterNetworkError();
  }
</script>
