<style>
  .connect-account-board {
    background-size: cover;
    background-position: center;
    position: relative;
    overflow: hidden;
  }

  :global([data-bs-theme='light']) .connect-account-board {
    --welcome-gradient: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.95) 20%,
      rgba(255, 255, 255, 0.5) 100%
    );
  }

  :global([data-bs-theme='dark']) .connect-account-board,
  :global([data-bs-theme='copper']) .connect-account-board {
    --welcome-gradient: linear-gradient(
      90deg,
      rgba(20, 22, 25, 0.95) 20%,
      rgba(20, 22, 25, 0.5) 100%
    );
  }

  @media (max-width: 991.98px) {
    .connect-account-board {
      --welcome-gradient: linear-gradient(
        180deg,
        rgba(var(--bs-body-bg-rgb), 0.95) 40%,
        rgba(var(--bs-body-bg-rgb), 0.8) 100%
      ) !important;
    }
  }

  .connect-account-board .alert-link {
    text-decoration: none;
  }

  .connect-account-board.interactive {
    cursor: pointer;
  }
</style>

<div class="w-100 flex-grow-1 d-flex flex-column">
  {#if !data.accountConnected}
    <div class="container mt-3">
      <PageActions leftClasses="d-flex">
        <button class="btn btn-link" on:click={onCancelClick} slot="left">
          <i class="fas fa-arrow-left"></i>
          <span class="d-lg-inline d-none ms-2">
            {$_(data.pageType === PageTypes.ADDON ? 'buttons.addons' : 'buttons.themes')}
          </span>
        </button> 
      </PageActions>
    </div>
  {/if}

  <div class="flex-grow-1 d-flex flex-column justify-content-center align-items-center">
    <div class="container">
      <div class="col-lg-10 mx-auto vstack gap-3">
        {#if !data.accountConnected}
          {@render accountNotConnectedSnippet()}
        {:else if !modalOpen}
          {@render loadingSnippet()}
        {/if}
      </div>
    </div>
  </div>
</div>

<ConfirmInstallResourceModal />

{#snippet accountNotConnectedSnippet()}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div
    class="alert alert-secondary connect-account-board border mb-0 focus-ring"
    class:interactive={!connecting}
    role="alert"
    on:click={!connecting ? onConnectClick : null}
    style="background-image: var(--welcome-gradient), url('{base}/assets/img/connect-pano-bg.png');">
    <div class="row align-items-center">
      <div class="col-lg-9">
        <h5 class="alert-heading mb-2">
          <i class="fa-solid fa-user-circle me-2"></i>
          {$_('pages.settings.platform.online-account')}
        </h5>
        <p class="mb-0 text-body">
          {$_('pages.settings.platform.connect-online-account-alert')}
        </p>
      </div>
      <div class="col-lg-3 text-lg-end mt-3 mt-lg-0">
        <div class="alert-link rounded border-0 bg-transparent p-0">
          {connecting ? $_('buttons.connecting') : $_('buttons.connect')}

          {#if connecting}
            <span class="spinner-border spinner-border-sm text-primary" role="status"></span>
          {:else}
            <i class="fa-solid fa-arrow-right ms-1"></i>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/snippet}


{#snippet loadingSnippet()}
  <div class="vstack gap-3 text-center">
    <div
      class="spinner-border text-primary mx-auto"
      role="status"
      style="width: 1.5rem; height: 1.5rem;">
      <span class="visually-hidden">{$_('components.store-loading.loading')}</span>
    </div>

    <div>
      <strong>
        {#if data.installingView}
          {$_('components.store-loading.version-loading')}
        {:else}
          {$_('components.store-loading.store-loading')}
        {/if}
      </strong><br />
      <small>{$_('components.store-loading.please-wait')}</small>
    </div>
  </div>
{/snippet}

<script context="module">
  import { redirect } from '@sveltejs/kit';

  import { base } from '$app/paths';

  export const PageTypes = Object.freeze({
    ADDON: 'ADDON',
    THEME: 'THEME',
  });

  const DEFAULT_ACCOUNT_NOT_CONNECTED_VIEW = false;
  const DEFAULT_INSTALLING_VIEW = false;

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event, pageType) {
    const {
      parent,
      url: { searchParams },
    } = event;
    await parent();

    const back = searchParams.has('back');
    const install = searchParams.get('install');
    const fromInstall = searchParams.get('fromInstall');

    const previousPage = base + `/` + (pageType === PageTypes.ADDON ? 'addons' : 'view');

    if (back) {
      throw redirect(302, previousPage);
    }

    const failedLogin = searchParams.has('failedLogin');

    if (failedLogin) {
      throw redirect(302, previousPage + '?failedLogin');
    }

    return {
      pageType,
      accountConnected: !DEFAULT_ACCOUNT_NOT_CONNECTED_VIEW,
      installingView: !!install,
      install,
      fromInstall,
    };
  }
</script>

<script>
  import { getContext, tick } from 'svelte';
  import { _ } from 'svelte-i18n';

  import PageActions from '$lib/components/PageActions.svelte';

  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { browser } from '$app/environment';

  import { PANO_WEBSITE_URL } from '$lib/variables.js';
  import ApiUtil from '$lib/api.util.js';
  import { currentLanguage } from '$lib/language.util.js';

  import { show as showInstallingResourceModal } from '$lib/components/modals/InstallingResourceModal.svelte';
  import ConfirmInstallResourceModal, {
    show as showConfirmInstallResourceModal,
    setCallback as setConfirmInstallResourceCallback,
    onHide as onConfirmInstallResourceHide,
  } from '$lib/components/modals/ConfirmInstallResourceModal.svelte';

  export let data;

  const showSplash = getContext('showSplash');
  const panelTheme = getContext('panelTheme');

  let versionInfo;
  let connecting;
  let storeLoading;
  let modalOpen = false;

  async function waitSplash() {
    while ($showSplash) {
      await tick();
    }
  }

  async function waitWindow() {
    while (!window) {
      await tick();
    }
  }

  async function getStoreTokenResponse() {
    const getStoreTokenResponse = await ApiUtil.get({
      path: `/api/panel/platform/store/authorize/token`,
    });

    if (getStoreTokenResponse.error === 'PANO_NOT_CONNECTED') {
      data.accountConnected = false;

      return null;
    }

    if (getStoreTokenResponse.error === 'PANO_CONNECT_FAILED') {
      await goto('?failedLogin');

      return null;
    }

    if (getStoreTokenResponse.error) {
      data.error = getStoreTokenResponse.error;

      return null;
    }

    return getStoreTokenResponse.data;
  }

  async function getVersionInfo() {
    data.installingView = true;

    const getStoreTokenResponse = await ApiUtil.get({
      path: `/api/panel/install/store/${data.install}/info`,
    });

    if (getStoreTokenResponse.error === 'PANO_NOT_CONNECTED') {
      data.accountConnected = false;

      return;
    }

    if (
      getStoreTokenResponse.error === 'NOT_FOUND' ||
      getStoreTokenResponse.error === 'BAD_REQUEST'
    ) {
      await goto('/error-404');

      return;
    }

    if (getStoreTokenResponse.error) {
      data.error = getStoreTokenResponse.error;

      return;
    }

    data.installingView = true;

    versionInfo = getStoreTokenResponse.data;

    modalOpen = true;

    setConfirmInstallResourceCallback(startInstall);
    onConfirmInstallResourceHide(onCancelClick);
    showConfirmInstallResourceModal(versionInfo, data.pageType === PageTypes.ADDON ? 'ADDON' : 'THEME');
  }

  async function goToStore(getStoreTokenResponse) {
    const { token, state } = getStoreTokenResponse;

    // Encode dynamic parts to ensure the URL is safe
    const storeAuthToken = encodeURIComponent(token);
    const encodedRedirectUrl = encodeURIComponent(page.url.origin + page.url.pathname);
    const encodedState = encodeURIComponent(state);

    // Redirect to the constructed URL
    window.location = `${PANO_WEBSITE_URL}/auth?storeAuthorizeToken=${storeAuthToken}&panoCallback=${encodedRedirectUrl}&state=${encodedState}&type=${data.pageType}&hl=${$currentLanguage.code}&theme=${$panelTheme}`;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function onCancelClick() {
    goto(base + `/` + (data.pageType === PageTypes.ADDON ? 'addons' : 'view'));
  }

  function startInstall() {
    showInstallingResourceModal(
      data.pageType === PageTypes.ADDON ? 'PLUGIN' : 'THEME',
      null,
      data.install,
      async () => {
        const storeTokenResponse = await getStoreTokenResponse();

        if (storeTokenResponse === null) {
          return;
        }

        await goToStore(storeTokenResponse);
      },
      versionInfo.action
    );
  }

  (async () => {
    if (storeLoading) return;
    if (!browser) {
      return;
    }

    await waitSplash();
    await waitWindow();

    await sleep(500);

    if (data.install) {
      data.installingView = true;
      await getVersionInfo();

      return;
    }

    if (data.accountConnected && !data.installingView) {
      const storeTokenResponse = await getStoreTokenResponse();

      if (storeTokenResponse === null) {
        return;
      }

      await goToStore(storeTokenResponse);
    }
  })();

  function onConnectClick() {
    connecting = true;

    ApiUtil.post({
      path: '/api/panel/platform/code',
      handler: async (body, reject) => {
        if (body.error) {
          location.reload();
          return;
        }

        const { publicKey, state } = body;

        // Encode dynamic parts to ensure the URL is safe
        const encodedPublicKey = encodeURIComponent(publicKey);
        const encodedRedirectUrl = encodeURIComponent(
          page.url.origin + base + '/settings/platform',
        );
        const encodedState = encodeURIComponent(state);

        // Redirect to the constructed URL
        window.location = `${PANO_WEBSITE_URL}/auth?loginPanoPlatform=${encodedPublicKey}&redirectUrl=${encodedRedirectUrl}&state=${encodedState}&hl=${$currentLanguage.code}&theme=${$panelTheme}`;
      },
    });
  }
</script>
