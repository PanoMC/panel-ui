<!-- Set or change the passphrase Pano Backups are encrypted with; needs the account password. -->
<BsModal bind:this={modal}>
  <form
    onsubmit={(event) => {
      event.preventDefault();
      void save();
    }}>
    <div class="modal-body text-center vstack gap-3">
      <div>
        <div class="pb-3">
          <i class="fas fa-key fa-3x d-block m-auto text-gray"></i>
        </div>
        <div class="text-capitalize">{$_('pages.settings.backups.passphrase-title')}</div>
      </div>
      <div>{$_('pages.settings.backups.passphrase-description')}</div>
      {#if passphraseSet}
        <div>{$_('pages.settings.backups.passphrase-change-hint')}</div>
      {/if}
      {#key formKey}
        <PassphraseFields bind:passphrase bind:valid />
      {/key}
      <div class="form-floating text-start">
        <input
          id="pano-passphrase-password"
          class="form-control"
          type="password"
          placeholder=" "
          autocomplete="current-password"
          bind:value={password} />
        <label class="text-capitalize" for="pano-passphrase-password">
          {$_('pages.settings.backups.current-password')}
        </label>
      </div>
      {#if error}
        <div class="alert alert-danger mb-0 d-flex align-items-start">
          <i class="fa-solid fa-circle-exclamation me-3 mt-1" aria-hidden="true"></i>
          <div>{$_(error.key, { values: error.values })}</div>
        </div>
      {/if}
    </div>
    <div class="modal-footer flex-nowrap text-capitalize">
      <button
        type="button"
        class="btn btn-link text-decoration-none col-6 m-0"
        data-bs-dismiss="modal">
        {$_('buttons.cancel')}
      </button>
      <button
        type="submit"
        class="btn btn-primary col-6 m-0"
        disabled={!valid || !password || saving}>
        {#if saving}
          <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
        {/if}
        {$_('buttons.save')}
      </button>
    </div>
  </form>
</BsModal>

<script>
  import { _ } from 'svelte-i18n';

  import ApiUtil from '$lib/api.util.js';
  import { describeBackupError as describeError } from '$lib/pano-backup-error.js';

  import { showSuccess } from '$lib/components/ToastContainer.svelte';
  import BsModal from './BsModal.svelte';
  import PassphraseFields from './PassphraseFields.svelte';

  /** @type {{ passphraseSet?: boolean, onsaved?: () => void }} */
  let { passphraseSet = false, onsaved } = $props();

  /** @type {BsModal | undefined} */
  let modal = $state();

  let passphrase = $state('');
  let valid = $state(false);
  let password = $state('');
  let formKey = $state(0);
  let saving = $state(false);
  /** @type {ReturnType<typeof describeError>} */
  let error = $state(null);

  export function open() {
    passphrase = '';
    password = '';
    error = null;
    formKey++;

    modal?.show();
  }

  async function save() {
    saving = true;

    try {
      const response = await ApiUtil.put({
        path: '/panel/pano-backups/remote/passphrase',
        body: { currentPassword: password, passphrase },
      }).catch(() => ({ error: { code: 'NETWORK_ERROR' } }));

      error = response?.error ? describeError(response) : null;

      if (!error) {
        passphrase = '';
        password = '';
        modal?.hide();
        void showSuccess('pages.settings.backups.passphrase-saved');
        onsaved?.();
      }
    } finally {
      saving = false;
    }
  }
</script>
