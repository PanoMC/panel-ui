{#snippet left()}
  <a href="{base}/view" class="btn btn-link">
    <i class="fas fa-arrow-left"></i>
    <span class="d-lg-inline d-none ms-2"> {$_('buttons.themes')}</span>
  </a>
{/snippet}

{#snippet right()}
  {#if theme.installedBy !== 'SYSTEM'}
    <button
      aria-label={$_('buttons.remove')}
      class="btn btn-link"
      type="button"
      onclick={onRemoveClick}
      title={$_('buttons.remove')}
      class:disabled={removing}>
      <i class="fas fa-trash"></i>
    </button>
  {/if}
  {#if theme.verifyStatus !== 'UNKNOWN'}
    <a
      href={`${PANO_WEBSITE_URL}/themes/${theme.id}`}
      target="_blank"
      class="btn btn-link"
      title={$_('buttons.show-in-store')}
      aria-label={$_('buttons.show-in-store')}>
      <i class="fas fa-store"></i>
    </a>
  {/if}
  {#if theme.updateVersion}
    <button
      type="button"
      class="btn btn-link position-relative"
      title={$_('pages.themes.update-available') + ' (v' + theme.updateVersion + ')'}
      aria-label={$_('pages.themes.update-available')}
      onclick={() => goto(`${base}/settings/updates`)}>
      <i class="fas fa-sync"></i>
      <span
        class="position-absolute top-0 start-100 translate-middle mt-2 badge rounded-pill bg-secondary p-1">
        <span class="visually-hidden">{$_('pages.themes.update-available')}</span>
      </span>
    </button>
  {/if}
  {#if theme.running}
    <button
      class="btn btn-danger"
      type="button"
      aria-label={$_('buttons.stop')}
      onclick={onStopClick}
      class:disabled={stoping}>
      <i class="fas fa-stop"></i>
      <span class="d-lg-inline d-none ms-2">{$_('buttons.stop')}</span>
    </button>
  {/if}
  {#if !theme.running && theme.active}
    <button class="btn btn-secondary" type="button" onclick={onStartClick} class:disabled={stoping}>
      <i class="fas fa-play"></i>
      <span class="d-lg-inline d-none ms-2">{$_('buttons.start')}</span>
    </button>
  {/if}
  {#if !theme.active}
    <button class="btn btn-secondary" onclick={activate} disabled={activating}>
      {$_('buttons.activate')}{#if activating}<i class="fas fa-spinner fa-spin ms-2"></i>{/if}
    </button>
  {/if}
{/snippet}

<div class="card">
  <div class="card-body">
    <div class="row g-3">
      <div class="col-lg-6">
        <div
          id="themeCarousel"
          class="carousel carousel-dark slide rounded overflow-hidden"
          data-bs-ride="carousel">
          <div class="carousel-indicators">
            {#each theme.screenshots.length === 0 ? { 'screenshot.png': '' } : Object.keys(theme.screenshots) as src, i}
              <button
                type="button"
                data-bs-target="#themeCarousel"
                data-bs-slide-to="i"
                class="active"
                aria-current="true"
                aria-label={$_('pages.theme-detail.screenshot') + ` ${i + 1}`}></button>
            {/each}
          </div>
          <div class="carousel-inner">
            {#each theme.screenshots.length === 0 ? { 'screenshot.png': '' } : Object.keys(theme.screenshots) as key, i}
              <div class={'carousel-item' + (i === 0 ? ' active' : '')}>
                <div class="ratio ratio-16x9">
                  <img
                    src={`/api/panel/themes/${theme.id}/screenshots/${key}?hash=${theme.screenshots[key]}`}
                    class="d-block w-100"
                    style="object-fit: cover; object-position: top;"
                    alt={$_('pages.theme-detail.screenshot') + ` ${i + 1}`} />
                </div>
              </div>
            {/each}
          </div>
          {#if theme.screenshots.length > 1}
            <button
              class="carousel-control-prev"
              type="button"
              data-bs-target="#themeCarousel"
              data-bs-slide="prev"
              aria-label={$_('buttons.previous')}>
              <span class="carousel-control-prev-icon"></span>
            </button>
            <button
              class="carousel-control-next"
              type="button"
              data-bs-target="#themeCarousel"
              data-bs-slide="next"
              aria-label={$_('buttons.next')}>
              <span class="carousel-control-next-icon"></span>
            </button>
          {/if}
        </div>
      </div>

      <div class="col-lg-6">
        <div class="d-flex flex-column h-100 justify-content-between">
          <!-- Title & Status -->
          <div>
            <div class="d-flex justify-content-between align-items-start">
              <h5 class="card-title d-flex align-items-center gap-2">
                {theme.title}<VerifiedStatus status={theme.verifyStatus} />
              </h5>
              {#if theme.active}
                <span class="badge text-bg-success">{$_('pages.theme-detail.in-use')}</span>
              {/if}
            </div>

            <div class="small mb-2 hstack gap-2">
              <span class="user-select-all font-monospace">{theme.id}</span>
              <span class="vr"></span>
              <span use:tooltip={[$_('pages.theme-detail.version')]} class="user-select-all font-monospace">
                {theme.version}
              </span>
              <span class="vr"></span>
              <span
                use:tooltip={[$_('pages.theme-detail.pano-version')]}
                class="user-select-all font-monospace">
                {theme.panoVersion}
              </span>
            </div>

            <p>{theme.description}</p>
          </div>

          <!-- Metadata -->
          <ul class="list-group">
            <li class="list-group-item">
              <strong>{$_('pages.theme-detail.developer')}:</strong>
              <a target="_blank" href="{PANO_WEBSITE_URL}/users/{theme.author}"
                >{theme.author}
                <i class="fa-solid fa-arrow-up-right-from-square ms-1"></i>
              </a>
            </li>
            <li class="list-group-item">
              <strong>{$_('pages.theme-detail.license')}:</strong>
              {theme.license || $_('pages.theme-detail.unknown')}
            </li>
            <li class="list-group-item">
              <strong>{$_('pages.theme-detail.source')}:</strong>
              <a
                class="text-truncate d-block"
                aria-label={$_('pages.theme-detail.source')}
                href={theme.sourceUrl ? theme.sourceUrl : null}
                target="_blank">
                {theme.sourceUrl || $_('pages.theme-detail.unknown')}
                <i class="fa-solid fa-arrow-up-right-from-square ms-1"></i>
              </a>
            </li>
            <li class="list-group-item">
              <strong>Hash:</strong>
              <code class="overflow-auto text-nowrap d-block user-select-all py-1"
                >sha256:{theme.hash}</code>
            </li>
            <li class="list-group-item">
              <strong>{$_('pages.theme-detail.installed-at')}:</strong>
              <Date time={theme.createdAt} relativeFormat={true} />
            </li>
            <li class="list-group-item">
              <strong>{$_('pages.theme-detail.updated-at')}:</strong>
              <Date time={theme.updatedAt} relativeFormat={true} />
            </li>
            <li class="list-group-item">
              <strong>{$_('pages.theme-detail.installed-by')}:</strong>
              {$_('pages.theme-detail.installed-by-types.' + theme.installedBy)}
            </li>
            <li class="list-group-item">
              <strong>{$_('pages.theme-detail.size')}:</strong>
              {formatBytes(theme.size)}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>

<ConfirmRemoveThemeModal />
<ConfirmStopThemeModal />

<script context="module">
  import ApiUtil from '$lib/api.util.js';
  import { error } from '@sveltejs/kit';

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const { parent } = event;
    await parent();

    const themeId = event.params.themeId;

    const body = await ApiUtil.get({
      path: `/api/panel/themes/${themeId}`,
      request: event,
    });

    if (body.error === 'NOT_FOUND') {
      throw error(404, body.error);
    }

    return { theme: body.data };
  }
</script>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';
  import tooltip from '$lib/tooltip.util';

  import { goto, invalidate } from '$app/navigation';
  import { base } from '$app/paths';

  import { formatBytes } from '$lib/string.util';
  import { PANO_WEBSITE_URL } from '$lib/variables.js';

  import { show as showToast } from '$lib/components/ToastContainer.svelte';

  import PageActions from '$lib/components/PageActions.svelte';
  import Date from '$lib/components/Date.svelte';
  import ConfirmRemoveThemeModal, {
    show as showRemoveModal,
  } from '$lib/components/modals/ConfirmRemoveThemeModal.svelte';
  import VerifiedStatus from '$lib/components/VerifiedStatus.svelte';
  import ConfirmStopThemeModal, {
    show as showStopModal,
    passwordError,
  } from '$lib/components/modals/ConfirmStopThemeModal.svelte';

  const pageTitle = getContext('pageTitle');

  export let data;
  let theme;

  $: {
    theme = data.theme;
  }

  const slots = getContext('layout-slots');
  Object.assign(slots, { left, right });

  let activating, removing, stoping, starting;

  pageTitle.set('pages.theme-detail.title');

  function onRemoveClick() {
    showRemoveModal(theme.active, () => {
      removing = true;

      ApiUtil.delete({
        path: `/api/panel/themes/${theme.id}`,
        handler: async (activateResponse) => {
          if (activateResponse.result !== 'ok') {
            location.reload();
            return;
          }

          await goto(base + '/view');

          await showToast('components.toasts.removed-theme-success');

          removing = false;
        },
      });
    });
  }

  function onStopClick() {
    showStopModal((password) => {
      stoping = true;

      return new Promise((resolve) => {
        ApiUtil.customRequest({
          path: `/api/panel/themes`,
          data: {
            method: 'DELETE',
            body: { password },
          },
          handler: async (stopResponse) => {
            if (stopResponse.result !== 'ok') {
              if (stopResponse.error === 'NO_PERMISSION') {
                stoping = false;
                passwordError.set(true);
                resolve(false);
                return;
              }

              location.reload();
              resolve(false);
              return;
            }

            await invalidate((_) => true);

            await showToast('components.toasts.stop-theme-success');

            stoping = false;
            resolve(true);
          },
        });
      });
    });
  }

  function onStartClick() {
    starting = true;

    ApiUtil.post({
      path: `/api/panel/themes`,
      handler: async (stopResponse) => {
        if (stopResponse.result !== 'ok') {
          location.reload();
          return;
        }

        await invalidate((_) => true);

        await showToast('components.toasts.start-theme-success');

        starting = false;
      },
    });
  }

  async function activate() {
    activating = true;

    const activateResponse = await ApiUtil.put({
      path: `/api/panel/themes/${theme.id}`,
    });

    if (activateResponse.result !== 'ok') {
      location.reload();
      return;
    }

    await invalidate((_) => true);

    await showToast('components.toasts.activate-theme-success');

    activating = false;
  }
</script>
