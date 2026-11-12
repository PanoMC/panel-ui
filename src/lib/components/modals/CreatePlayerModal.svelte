<!-- Create a player by hand: the account a visitor gets from the register form, made by an admin.
     The username is the first thing typed, so the caret waits in it once the dialog is up. -->
<svelte:window on:pointerdown={onWindowPointerDown} on:keydown={onWindowKeydown} />

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
          <div class="position-relative" bind:this={passwordGroup}>
            <!-- has-validation only with a message after the buttons: without one Bootstrap would
                 round the eye button's right corners in the middle of the group -->
            <div class="input-group" class:has-validation={$errors.password}>
              <input
                class="form-control"
                class:is-invalid={$errors.password}
                type={$showPassword ? 'text' : 'password'}
                autocomplete="new-password"
                placeholder={$_('components.modals.create-player.inputs.password')}
                bind:value={$player.password} />
              <button
                class="btn btn-outline-secondary"
                type="button"
                title={$_(
                  'components.modals.create-player.password-tools.' +
                    ($showPassword ? 'hide' : 'show'),
                )}
                aria-label={$_(
                  'components.modals.create-player.password-tools.' +
                    ($showPassword ? 'hide' : 'show'),
                )}
                aria-pressed={$showPassword}
                on:click={() => showPassword.update((value) => !value)}>
                <i class="fa-regular {$showPassword ? 'fa-eye-slash' : 'fa-eye'}" aria-hidden="true"
                ></i>
              </button>
              <button
                class="btn btn-outline-secondary"
                type="button"
                title={$_('components.modals.create-player.password-tools.generate')}
                aria-label={$_('components.modals.create-player.password-tools.generate')}
                aria-expanded={$generatorOpen}
                aria-haspopup="true"
                on:click={toggleGenerator}>
                <i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>
              </button>
              {#if $errors.password}
                <div class="invalid-feedback">
                  {$_('components.modals.create-player.errors.password')}
                </div>
              {/if}
            </div>
            {#if $generatorOpen}
              <div
                class="dropdown-menu show top-100 start-0 w-100 p-3 mt-1"
                role="dialog"
                aria-label={$_('components.modals.create-player.password-tools.generated')}>
                <div class="vstack gap-3">
                  <div class="input-group">
                    <input
                      class="form-control font-monospace"
                      type="text"
                      readonly
                      aria-label={$_('components.modals.create-player.password-tools.generated')}
                      value={generated} />
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      title={$_('components.modals.create-player.password-tools.regenerate')}
                      aria-label={$_('components.modals.create-player.password-tools.regenerate')}
                      on:click={regenerate}>
                      <i class="fa-solid fa-rotate" aria-hidden="true"></i>
                    </button>
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      title={$_(
                        'components.modals.create-player.password-tools.' +
                          (copied ? 'copied' : 'copy'),
                      )}
                      aria-label={$_(
                        'components.modals.create-player.password-tools.' +
                          (copied ? 'copied' : 'copy'),
                      )}
                      on:click={copyGenerated}>
                      <i
                        class="fa-solid"
                        class:fa-copy={!copied}
                        class:fa-check={copied}
                        class:text-success={copied}
                        aria-hidden="true"></i>
                    </button>
                  </div>
                  <div>
                    <label class="form-label small mb-1" for="createPlayerPasswordLength">
                      {$_('components.modals.create-player.password-tools.length', {
                        values: { length: generatorLength },
                      })}
                    </label>
                    <input
                      class="form-range"
                      id="createPlayerPasswordLength"
                      type="range"
                      min={MIN_LENGTH}
                      max={MAX_LENGTH}
                      step="1"
                      bind:value={generatorLength} />
                  </div>
                  <div class="d-flex flex-wrap gap-3">
                    <div class="form-check form-switch">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="createPlayerPasswordDigits"
                        bind:checked={generatorDigits} />
                      <label class="form-check-label" for="createPlayerPasswordDigits">
                        {$_('components.modals.create-player.password-tools.digits')}
                      </label>
                    </div>
                    <div class="form-check form-switch">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="createPlayerPasswordSymbols"
                        bind:checked={generatorSymbols} />
                      <label class="form-check-label" for="createPlayerPasswordSymbols">
                        {$_('components.modals.create-player.password-tools.symbols')}
                      </label>
                    </div>
                  </div>
                  <button class="btn btn-secondary w-100" type="button" on:click={useGenerated}>
                    {$_('components.modals.create-player.password-tools.use')}
                  </button>
                </div>
              </div>
            {/if}
          </div>
          <div>
            <input
              class="form-control"
              class:is-invalid={$errors.passwordRepeat}
              type={$showPassword ? 'text' : 'password'}
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
  const showPassword = writable(false);
  const generatorOpen = writable(false);

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
    showPassword.set(false);
    generatorOpen.set(false);

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
  import copy from 'copy-to-clipboard';

  import {
    DEFAULT_LENGTH,
    MAX_LENGTH,
    MIN_LENGTH,
    generatePassword,
  } from './password-generator.js';

  let loading = false;

  /** @type {HTMLElement} */
  let passwordGroup;
  let generatorLength = DEFAULT_LENGTH;
  let generatorDigits = true;
  let generatorSymbols = true;
  let generated = '';
  let copied = false;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let copiedTimer;

  // A new password whenever the popover opens or one of its options changes.
  $: if ($generatorOpen) {
    regenerate(generatorLength, generatorDigits, generatorSymbols);
  }

  function regenerate(
    length = generatorLength,
    digits = generatorDigits,
    symbols = generatorSymbols,
  ) {
    generated = generatePassword({ length, digits, symbols });
    copied = false;
  }

  function toggleGenerator() {
    generatorOpen.update((open) => !open);
  }

  function copyGenerated() {
    copy(generated);
    copied = true;

    if (copiedTimer) {
      clearTimeout(copiedTimer);
    }

    copiedTimer = setTimeout(() => {
      copied = false;
    }, 1500);
  }

  function useGenerated() {
    player.update((value) => ({ ...value, password: generated, passwordRepeat: generated }));
    showPassword.set(true);
    generatorOpen.set(false);
  }

  /** @param {PointerEvent} event */
  function onWindowPointerDown(event) {
    if (
      $generatorOpen &&
      passwordGroup &&
      !passwordGroup.contains(/** @type {Node} */ (event.target))
    ) {
      generatorOpen.set(false);
    }
  }

  /** @param {KeyboardEvent} event */
  function onWindowKeydown(event) {
    if ($generatorOpen && event.key === 'Escape') {
      event.stopPropagation();
      generatorOpen.set(false);
    }
  }

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
