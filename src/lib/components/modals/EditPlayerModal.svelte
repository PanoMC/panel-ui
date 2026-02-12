<!-- Edit Player Modal -->
<div aria-hidden="true" class="modal fade" bind:this={$modalElement} role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">{$_('components.modals.edit-player.title')}</h5>
        <button
          title={$_('buttons.close')}
          aria-label={$_('buttons.close')}
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          on:click={hide}></button>
      </div>
      <form on:submit|preventDefault={onSubmit}>
        <div class="modal-body">
          <div class="row">
            <div class="col-12">
              <input
                class="form-control form-control-lg"
                id="username"
                placeholder={$_('components.modals.edit-player.inputs.username.placeholder')}
                type="text"
                bind:value={$player.username}
                class:is-invalid={!!$errors.username}
                aria-describedby="validationEditUsernameInModal" />
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
            <div class="col-12 mb-3"></div>
            <div class="col-12 mb-3">
              <label for="email">{$_('components.modals.edit-player.inputs.email.title')}</label>
              <input
                class="form-control"
                id="email"
                type="text"
                bind:value={$player.email}
                class:is-invalid={!!$errors.email}
                aria-describedby="validationEditEmailInModal" />
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
            </div>
            <div class="col-6 mb-3">
              <label for="newPassword"
                >{$_('components.modals.edit-player.inputs.new-password.title')}</label>
              <input
                class="form-control"
                id="newPassword"
                type="password"
                bind:value={$player.newPassword}
                class:is-invalid={!!$errors.newPassword}
                aria-describedby="validationEditPasswordInModal" />
              <div id="validationEditPasswordInModal" class="invalid-feedback">
                {#if !!$errors['newPassword']}
                  {#if $errors['newPassword'] === 'INVALID'}
                    {$_('components.modals.edit-player.inputs.new-password.errors.invalid')}
                  {/if}
                {/if}
              </div>
            </div>
            <div class="col-6 mb-3">
              <label for="newPasswordRepeat"
                >{$_('components.modals.edit-player.inputs.new-password-repeat.title')}</label>
              <input
                class="form-control"
                id="newPasswordRepeat"
                type="password"
                bind:value={$player.newPasswordRepeat}
                class:is-invalid={!!$errors.newPasswordRepeat}
                aria-describedby="validationEditNewPasswordInModal" />
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
              <label for="userLocaleCode">
                {$_('components.modals.edit-player.inputs.locale.label')}
              </label>
              <select class="form-control" id="userLocaleCode" bind:value={$player.localeCode}>
                <option value={null}
                  >{$_('components.modals.edit-player.inputs.locale.default', {
                    values: { defaultLocaleName: $Languages[$siteInfo.platformLocale].name },
                  })}</option>
                {#each Object.keys($Languages) as language, index (language)}
                  <option value={$Languages[language].code}>{$Languages[language].name}</option>
                {/each}
              </select>
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

  export function show(newPlayer) {
    player.set({ ...newPlayer });
    player.update((player) => {
      player.newPassword = '';
      player.newPasswordRepeat = '';

      return player;
    });
    playerBackup.set({ ...get(player) });

    errors.set(defaultErrors);

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

  import ApiUtil from '$lib/api.util';

  import { show as showToast } from '$lib/components/ToastContainer.svelte';

  import { changeLanguage, getLanguageByLocale, Languages } from '$lib/language.util';

  const siteInfo = getContext('siteInfo');

  function refreshBrowserPage() {
    location.reload();
  }

  let loading = false;

  const user = getContext('user');

  $: saveDisabled =
    !$player.username ||
    !$player.email ||
    ($player.username === $playerBackup.username &&
      $player.email === $playerBackup.email &&
      (!$player.newPassword ||
        ($player.newPassword && $player.newPassword !== $player.newPasswordRepeat)) &&
      $player.canCreateTicket === $playerBackup.canCreateTicket &&
      $player.isEmailVerified === $playerBackup.isEmailVerified &&
      $player.localeCode === $playerBackup.localeCode);

  function onSubmit() {
    loading = true;

    ApiUtil.put({
      path: `/api/panel/players/${get(player).id}`,
      body: { ...get(player), localeCode: $player.localeCode || '' },
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

            return player;
          });

          await callback(get(player));

          await showToast('components.toasts.player-info-saved-success');

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
