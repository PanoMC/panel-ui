<style>
  .merged-grid {
    display: grid;
    grid-template-columns: 1fr;
    overflow: visible;
  }

  .merged-grid .form-control {
    border-radius: 0;
  }

  .merged-grid > .form-floating {
    position: relative;
    z-index: 1;
  }

  .merged-grid > .form-floating:focus-within {
    z-index: 3;
  }

  /* Mobile: stacked 1x2 */
  @media (max-width: 768px) {
    .merged-grid > :first-child .form-control {
      border-top-left-radius: var(--bs-border-radius) !important;
      border-top-right-radius: var(--bs-border-radius) !important;
    }
    .merged-grid > :last-child .form-control {
      border-bottom-left-radius: var(--bs-border-radius) !important;
      border-bottom-right-radius: var(--bs-border-radius) !important;
    }
    .merged-grid > :not(:last-child) {
      margin-bottom: -1px;
    }
    .merged-grid > :not(:last-child) .form-control:not(:focus) {
      border-bottom-color: transparent;
    }
  }

  /* Desktop: 1x2 grid side by side */
  @media (min-width: 769px) {
    .merged-grid {
      grid-template-columns: 1fr 1fr;
    }

    .merged-grid > :nth-child(1) .form-control {
      border-top-left-radius: var(--bs-border-radius) !important;
      border-bottom-left-radius: var(--bs-border-radius) !important;
    }
    .merged-grid > :nth-child(2) .form-control {
      border-top-right-radius: var(--bs-border-radius) !important;
      border-bottom-right-radius: var(--bs-border-radius) !important;
    }

    .merged-grid > :nth-child(1) {
      margin-right: -1px;
    }

    .merged-grid > :nth-child(1) .form-control:not(:focus) {
      border-right-color: transparent;
    }
  }
</style>

<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">{$_('components.modals.edit-player.title')}</h5>
        <button
          aria-label={$_('buttons.close')}
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          on:click={hide}></button>
      </div>
      <form on:submit|preventDefault={onSubmit}>
        <div class="modal-body">
          {#each $resolvedCardRowItems as row (row.id)}
            {#if !row.permission || hasPermission(row.permission, $page.data.user)}
              <ViewComponent
                component={row.component}
                playerData={playerDataForPlugins}
                onHookRegister={(handler) => registerPluginHandler(row.id, handler)} />
            {/if}
          {/each}
          <div class="row">
            <div class="col-12">
              <div class="form-floating mb-3">
                <input
                  class="form-control"
                  id="username"
                  placeholder={$_('components.modals.edit-player.inputs.username.placeholder')}
                  type="text"
                  bind:value={$player.username}
                  class:is-invalid={!!$errors.username}
                  aria-describedby="validationEditUsernameInModal" />
                <label for="username"
                  >{$_('components.modals.edit-player.inputs.username.placeholder')}</label>
              </div>
              <div id="validationEditUsernameInModal" class="invalid-feedback">
                {#if !!$errors['username']}
                  {#if $errors['username'] === 'INVALID'}
                    {$_('components.modals.edit-player.inputs.username.errors.invalid')}
                  {/if}
                  {#if $errors['username'] === 'EXISTS'}
                    {$_('components.modals.edit-player.inputs.username.errors.exists')}
                  {/if}
                {/if}
              </div>
            </div>
            <div class="col-12 mb-3">
              <div class="form-floating">
                <input
                  class="form-control"
                  id="email"
                  type="text"
                  placeholder="email@example.com"
                  bind:value={$player.email}
                  disabled={$player.clearPassword}
                  class:is-invalid={!!$errors.email}
                  aria-describedby="validationEditEmailInModal" />
                <label for="email">{$_('components.modals.edit-player.inputs.email.title')}</label>
              </div>
              <div id="validationEditEmailInModal" class="invalid-feedback">
                {#if !!$errors['email']}
                  {#if $errors['email'] === 'INVALID'}
                    {$_('components.modals.edit-player.inputs.email.errors.invalid')}
                  {/if}
                  {#if $errors['email'] === 'EXISTS'}
                    {$_('components.modals.edit-player.inputs.email.errors.exists')}
                  {/if}
                {/if}
              </div>
              {#if !$player.clearPassword && !String($player.email ?? '').trim()}
                <div class="alert alert-info mt-2 mb-0 py-2 px-3" role="status">
                  <i class="fa-solid fa-circle-info me-1"></i>
                  <small
                    >{$_('components.modals.edit-player.inputs.email.empty-login-notice')}</small>
                </div>
              {/if}
            </div>
            <div class="col-12 mb-3">
              <div class="merged-grid w-100">
                <div class="form-floating">
                  <input
                    class="form-control"
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    bind:value={$player.newPassword}
                    disabled={$player.clearPassword}
                    class:is-invalid={!!$errors.newPassword}
                    aria-describedby="validationEditPasswordInModal" />
                  <label for="newPassword"
                    >{$_('components.modals.edit-player.inputs.new-password.title')}</label>
                </div>
                <div class="form-floating">
                  <input
                    class="form-control"
                    id="newPasswordRepeat"
                    type="password"
                    placeholder="••••••••"
                    bind:value={$player.newPasswordRepeat}
                    disabled={$player.clearPassword}
                    class:is-invalid={!!$errors.newPasswordRepeat}
                    aria-describedby="validationEditNewPasswordInModal" />
                  <label for="newPasswordRepeat"
                    >{$_('components.modals.edit-player.inputs.new-password-repeat.title')}</label>
                </div>
              </div>
              {#if hasPermission(Permissions.MANAGE_PLAYERS, $page.data.user)}
                <div class="form-check form-switch mt-2">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="clearPasswordInEditPlayerModal"
                    checked={$player.clearPassword}
                    on:change={onClearPasswordToggle} />
                  <label class="form-check-label" for="clearPasswordInEditPlayerModal">
                    {$_('components.modals.edit-player.inputs.clear-password.label')}
                  </label>
                </div>
                {#if $player.clearPassword}
                  <div class="alert alert-warning mt-2 mb-0 py-2 px-3" role="status">
                    <i class="fa-solid fa-triangle-exclamation me-1"></i>
                    <small>{$_('components.modals.edit-player.inputs.clear-password.help')}</small>
                  </div>
                {/if}
              {/if}
              <div id="validationEditPasswordInModal" class="invalid-feedback">
                {#if !!$errors['newPassword']}
                  {#if $errors['newPassword'] === 'INVALID'}
                    {$_('components.modals.edit-player.inputs.new-password.errors.invalid')}
                  {/if}
                  {#if $errors['newPassword'] === 'CONFLICT'}
                    {$_(
                      'components.modals.edit-player.inputs.new-password.errors.conflict-with-clear',
                    )}
                  {/if}
                {/if}
              </div>
              <div id="validationEditNewPasswordInModal" class="invalid-feedback">
                {#if !!$errors['newPasswordRepeat']}
                  {#if $errors['newPasswordRepeat'] === 'NOT_MATCH'}
                    {$_(
                      'components.modals.edit-player.inputs.new-password-repeat.errors.not-match',
                    )}
                  {/if}
                {/if}
              </div>
            </div>
            <div class="col-12 mb-3">
              <div class="form-floating">
                <select
                  class="form-control form-select"
                  id="userLocaleCode"
                  bind:value={$player.localeCode}>
                  <option value={null}
                    >{$_('components.modals.edit-player.inputs.locale.default', {
                      values: { defaultLocaleName: $Languages[$siteInfo.platformLocale].name },
                    })}</option>
                  {#each Object.keys($Languages) as language, index (language)}
                    <option value={$Languages[language].code}>{$Languages[language].name}</option>
                  {/each}
                </select>
                <label for="userLocaleCode">
                  {$_('components.modals.edit-player.inputs.locale.label')}
                </label>
              </div>

              {#if $player.localeCode && $player.localeCode !== $siteInfo.platformLocale}
                <div class="alert alert-info mt-2 mb-0 py-2 px-3" role="alert">
                  <i class="fa-solid fa-circle-info me-1"></i>
                  <small
                    >{$_('components.modals.edit-player.inputs.locale.mismatch-warning')}</small>
                </div>
              {/if}
            </div>
            <div class="col-6">
              <div class="form-check form-switch">
                <input
                  class="form-check-input"
                  type="checkbox"
                  aria-checked="true"
                  role="switch"
                  id="canCreateTicketCheckbox"
                  bind:checked={$player.canCreateTicket}
                  disabled={$playerBackup.username === $user.username} />
                <label class="form-check-label" for="canCreateTicketCheckbox"
                  >{$_('components.modals.edit-player.inputs.can-open-ticket')}</label>
              </div>
            </div>
            <div class="col-6">
              <div class="form-check form-switch">
                <input
                  class="form-check-input"
                  type="checkbox"
                  role="switch"
                  aria-checked="true"
                  id="emailVerifiedCheckbox"
                  bind:checked={$player.isEmailVerified}
                  disabled={$playerBackup.username === $user.username} />
                <label class="form-check-label" for="emailVerifiedCheckbox"
                  >{$_('components.modals.edit-player.inputs.email-verified')}</label>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button
            class="btn btn-primary w-100"
            type="submit"
            class:disabled={loading || saveDisabled}>
            {$_('buttons.save')}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from 'svelte/store';
  import { executeLifecycle, panoApiClient } from '$lib/PluginAPI.js';

  const modalElement = writable();
  const player = writable({});
  const playerBackup = writable({});
  const defaultErrors = {
    'username': '',
    'email': '',
    'newPassword': '',
    'newPasswordRepeat': '',
  };
  const errors = writable(defaultErrors);

  let callback = async (player) => {};
  let hideCallback = (player) => {};
  let modal;

  // Plugin save/isDirty handler storage
  const pluginHandlers = writable({});

  // Resolved cardRow items (lazy components resolved to modules)
  const resolvedCardRowItems = writable([]);

  export async function show(newPlayer) {
    player.set({ ...newPlayer });
    player.update((player) => {
      player.newPassword = '';
      player.newPasswordRepeat = '';
      player.clearPassword = false;

      return player;
    });
    playerBackup.set({ ...get(player) });

    errors.set(defaultErrors);
    pluginHandlers.set({});

    // Execute lifecycle so plugins can load data for this player
    await executeLifecycle('panel:player-detail:edit-modal:load', { player: get(player) });

    // Resolve lazy cardRow components
    const items = get(panoApiClient.ui.player.editModal.cardRows.get());
    const resolved = await Promise.all(
      items.map(async (item) => {
        let comp = item.component;
        if (typeof comp === 'function' && !comp.prototype) {
          try {
            const module = await comp();
            return { ...item, component: module };
          } catch (e) {
            console.error(`[EditPlayerModal] Failed to resolve component ${item.id}`, e);
            return null;
          }
        }
        return item;
      }),
    );
    resolvedCardRowItems.set(resolved.filter(Boolean));

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: 'static',
      keyboard: false,
    });
    modal.show();
  }

  export function hide() {
    hideCallback(get(player));

    modal.hide();
  }

  export function setCallback(newCallback) {
    callback = newCallback;
  }

  export function onHide(newCallback) {
    hideCallback = newCallback;
  }
</script>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';
  import tooltip from '$lib/tooltip.util';

  import ApiUtil from '$lib/api.util';

  import { showSuccess as showSuccessToast } from '$lib/components/ToastContainer.svelte';
  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import { page } from '$app/stores';
  import ViewComponent from '$lib/components/ViewComponent.svelte';

  function registerPluginHandler(id, handler) {
    if (handler) {
      pluginHandlers.update((h) => {
        h[id] = handler;
        return { ...h };
      });
    }
  }

  import { changeLanguage, getLanguageByLocale, Languages } from '$lib/language.util';

  const siteInfo = getContext('siteInfo');

  /** Plugins key off username; keep saved username until form save (avoid draft reactivity). */
  $: playerDataForPlugins =
    ($player.username ?? '') !== ($playerBackup.username ?? '')
      ? { ...$player, username: $playerBackup.username }
      : $player;

  function refreshBrowserPage() {
    location.reload();
  }

  let loading = false;
  let emailBeforeClearPassword = '';

  const user = getContext('user');

  function onClearPasswordToggle(e) {
    const checked = e.currentTarget.checked;
    player.update((p) => {
      p.clearPassword = checked;
      if (checked) {
        emailBeforeClearPassword = p.email ?? '';
        p.email = '';
        p.newPassword = '';
        p.newPasswordRepeat = '';
      } else if (!p.email && emailBeforeClearPassword) {
        p.email = emailBeforeClearPassword;
        emailBeforeClearPassword = '';
      }
      return p;
    });
  }

  // Check if any plugin handler reports dirty state
  $: pluginsDirty = Object.values($pluginHandlers).some((h) => h && h.isDirty);

  $: saveDisabled =
    !$player.username ||
    (!pluginsDirty &&
      !$player.clearPassword &&
      $player.username === $playerBackup.username &&
      $player.email === $playerBackup.email &&
      (!$player.newPassword ||
        ($player.newPassword && $player.newPassword !== $player.newPasswordRepeat)) &&
      $player.canCreateTicket === $playerBackup.canCreateTicket &&
      $player.isEmailVerified === $playerBackup.isEmailVerified &&
      $player.localeCode === $playerBackup.localeCode);

  async function onSubmit() {
    loading = true;

    // Execute all plugin save handlers first
    const handlers = Object.values(get(pluginHandlers));
    for (const handler of handlers) {
      if (handler && handler.save) {
        try {
          await handler.save();
        } catch (e) {
          console.error('[EditPlayerModal] Plugin save failed:', e);
        }
      }
    }

    const payloadPlayer = get(player);
    ApiUtil.put({
      path: `/api/panel/players/${payloadPlayer.id}`,
      body: {
        username: payloadPlayer.username,
        email: payloadPlayer.email == null ? '' : String(payloadPlayer.email),
        newPassword: payloadPlayer.newPassword ?? '',
        newPasswordRepeat: payloadPlayer.newPasswordRepeat ?? '',
        isEmailVerified: !!payloadPlayer.isEmailVerified,
        canCreateTicket: !!payloadPlayer.canCreateTicket,
        localeCode: payloadPlayer.localeCode || '',
        clearPassword: !!payloadPlayer.clearPassword,
      },
      handler: async (body, reject) => {
        if (body.result === 'ok') {
          if (get(playerBackup).username === get(user).username) {
            user.update((user) => {
              user.username = get(player).username;
              user.email = get(player).email;

              return user;
            });

            await changeLanguage(
              getLanguageByLocale($player.localeCode || $siteInfo.platformLocale),
            );
          }

          loading = false;

          hide();

          player.update((player) => {
            player.newPassword = '';
            player.newPasswordRepeat = '';
            player.clearPassword = false;

            return player;
          });

          await callback(get(player));

          await showSuccessToast('components.toasts.player-info-saved-success');

          return;
        } else if (body.result === 'NOT_EXISTS') {
          refreshBrowserPage();

          return;
        } else if (body.errors) {
          loading = false;
          errors.set(body.errors);

          return;
        } else if (body.error) {
          console.log(body.error);
          //location.reload();

          return;
        }

        reject();
      },
    });
  }
</script>
