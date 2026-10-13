<!-- Create a player by hand: the account a visitor gets from the register form, made by an admin.
     The username is the first thing typed, so the caret waits in it once the dialog is up. -->
<div
  class="modal fade"
  bind:this={$modalElement}
  role="dialog"
  tabindex="-1"
  on:shown.bs.modal={focusUsername}>
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">{$_('components.modals.create-player.title')}</h5>
        <button
          aria-label={$_('buttons.close')}
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          on:click={hide}></button>
      </div>
      <form on:submit|preventDefault={onSubmit} autocomplete="off">
        <div class="modal-body vstack gap-3">
          <div>
            <input
              class="form-control form-control-lg"
              class:is-invalid={$errors.username}
              id="createPlayerUsername"
              type="text"
              maxlength="16"
              autocomplete="off"
              placeholder={$_('components.modals.edit-player.inputs.username.placeholder')}
              bind:value={$player.username} />
            {#if $errors.username}
              <div class="invalid-feedback">
                {$_(
                  'components.modals.edit-player.inputs.username.errors.' +
                    ($errors.username === 'EXISTS' ? 'exists' : 'invalid'),
                )}
              </div>
            {/if}
          </div>
          <div>
            <input
              class="form-control"
              class:is-invalid={$errors.email}
              type="email"
              autocomplete="off"
              placeholder={$_('components.modals.edit-player.inputs.email.title')}
              bind:value={$player.email} />
            {#if $errors.email}
              <div class="invalid-feedback">
                {$_(
                  'components.modals.edit-player.inputs.email.errors.' +
                    ($errors.email === 'EXISTS' ? 'exists' : 'invalid'),
                )}
              </div>
            {/if}
          </div>
          <div>
            <input
              class="form-control"
              class:is-invalid={$errors.password}
              type="password"
              autocomplete="new-password"
              placeholder={$_('components.modals.create-player.inputs.password')}
              bind:value={$player.password} />
            {#if $errors.password}
              <div class="invalid-feedback">
                {$_('components.modals.create-player.errors.password')}
              </div>
            {/if}
          </div>
          <div>
            <input
              class="form-control"
              class:is-invalid={$errors.passwordRepeat}
              type="password"
              autocomplete="new-password"
              placeholder={$_('components.modals.create-player.inputs.password-repeat')}
              bind:value={$player.passwordRepeat} />
            {#if $errors.passwordRepeat}
              <div class="invalid-feedback">
                {$_('components.modals.create-player.errors.password-repeat')}
              </div>
            {/if}
          </div>
          <div class="form-check form-switch">
            <input
              class="form-check-input"
              type="checkbox"
              role="switch"
              id="createPlayerEmailVerified"
              autocomplete="off"
              bind:checked={$player.isEmailVerified} />
            <label class="form-check-label" for="createPlayerEmailVerified">
              {$_('components.modals.create-player.inputs.email-verified')}
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary w-100" type="submit" disabled={loading || !filled}>
            {$_('buttons.create')}
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
  const errors = writable({});

  /** @type {(created: { id: number, username: string }) => void} */
  let callback = () => {};
  let modal;

  export function show() {
    player.set({
      username: '',
      email: '',
      password: '',
      passwordRepeat: '',
      isEmailVerified: true,
    });
    errors.set({});

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: 'static',
      keyboard: false,
    });
    modal.show();
  }

  export function hide() {
    modal?.hide();
  }

  export function setCallback(newCallback) {
    callback = newCallback;
  }
</script>

<script>
  import { _ } from 'svelte-i18n';

  import ApiUtil from '$lib/api.util';
  import {
    limitTitle,
    showError as showErrorToast,
    showSuccess as showSuccessToast,
  } from '$lib/components/ToastContainer.svelte';

  let loading = false;

  $: filled =
    !!$player.username && !!$player.email && !!$player.password && !!$player.passwordRepeat;

  function focusUsername() {
    get(modalElement)?.querySelector('#createPlayerUsername')?.focus();
  }

  async function onSubmit() {
    if (loading || !filled) {
      return;
    }

    loading = true;
    errors.set({});

    /** @type {any} */
    let body = null;

    try {
      body = await ApiUtil.post({
        path: '/panel/players',
        body: get(player),
        handler: (result) => result,
      });
    } catch (error) {
      console.error('Creating the player failed', error);
    }

    loading = false;

    if (body && !body.error) {
      hide();
      callback(body);

      void showSuccessToast('components.toasts.player-created-success', {
        name: limitTitle(get(player).username),
      });

      return;
    }

    if (body?.error?.fields) {
      errors.set(body.error.fields);

      return;
    }

    void showErrorToast('components.modals.create-player.errors.failed');
  }
</script>
