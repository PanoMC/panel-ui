<!-- Set or change the passphrase Pano Backups are encrypted with; needs the account password. -->
<BsModal bind:this={modal}>
  <form
    onsubmit={(event) => {
      event.preventDefault();
      void save();
    }}>
    <div class="modal-header">
      <h5 class="modal-title">{$_('pages.settings.backups.passphrase-title')}</h5>
      <button
        type="button"
        class="btn-close"
        data-bs-dismiss="modal"
        aria-label={$_('buttons.close')}></button>
    </div>
    <div class="modal-body vstack gap-3">
      <div class="small text-body-secondary">
        {$_('pages.settings.backups.passphrase-description')}
      </div>
      {#if passphraseSet}
        <div class="small text-body-secondary">
          {$_('pages.settings.backups.passphrase-change-hint')}
        </div>
      {/if}
      {#key formKey}
        <PassphraseFields bind:passphrase bind:valid />
      {/key}
      <div>
        <label class="form-label small" for="pano-passphrase-password">
          {$_('pages.settings.backups.current-password')}
        </label>
        <input
          id="pano-passphrase-password"
          class="form-control"
          type="password"
          autocomplete="current-password"
          bind:value={password} />
      </div>
      {#if error}
        <div class="alert alert-danger small mb-0">
          {$_(error.key, { values: error.values })}
        </div>
      {/if}
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-link" data-bs-dismiss="modal">
        {$_('buttons.cancel')}
      </button>
      <button type="submit" class="btn btn-primary" disabled={!valid || !password || saving}>
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
        path: '/api/panel/pano-backups/remote/passphrase',
        body: { currentPassword: password, passphrase },
      }).catch(() => ({ error: 'NETWORK_ERROR' }));

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
