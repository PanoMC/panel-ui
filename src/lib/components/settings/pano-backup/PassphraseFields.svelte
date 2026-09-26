<!-- New passphrase + confirmation + the "lost = unrecoverable" acknowledgement. -->
<div class="vstack gap-2">
  <div class="alert alert-warning small mb-0">
    <i class="fa-solid fa-triangle-exclamation me-1" aria-hidden="true"></i>
    {$_('pages.settings.backups.passphrase-warning')}
  </div>
  <div>
    <label class="form-label small" for="{id}-passphrase">
      {$_('pages.settings.backups.passphrase')}
    </label>
    <input
      id="{id}-passphrase"
      class="form-control"
      type="password"
      autocomplete="new-password"
      bind:value={passphrase}
      class:is-invalid={touched && problem === 'too-short'} />
    <div class="form-text">
      {$_('pages.settings.backups.passphrase-min', { values: { min: MIN_PASSPHRASE_LENGTH } })}
    </div>
  </div>
  <div>
    <label class="form-label small" for="{id}-confirm">
      {$_('pages.settings.backups.passphrase-confirm')}
    </label>
    <input
      id="{id}-confirm"
      class="form-control"
      type="password"
      autocomplete="new-password"
      bind:value={confirmation}
      onblur={() => (touched = true)}
      class:is-invalid={touched && problem === 'mismatch'} />
    {#if touched && problem === 'mismatch'}
      <div class="invalid-feedback">{$_('pages.settings.backups.passphrase-mismatch')}</div>
    {/if}
  </div>
  <div class="form-check">
    <input
      id="{id}-understood"
      class="form-check-input"
      type="checkbox"
      bind:checked={understood} />
    <label class="form-check-label small" for="{id}-understood">
      {$_('pages.settings.backups.passphrase-understood')}
    </label>
  </div>
</div>

<script>
  import { _ } from 'svelte-i18n';

  import { MIN_PASSPHRASE_LENGTH, passphraseProblem } from '$lib/pano-backup.util.js';

  /** @type {{ passphrase?: string, valid?: boolean }} */
  let { passphrase = $bindable(''), valid = $bindable(false) } = $props();

  const id = $props.id();

  let confirmation = $state('');
  let understood = $state(false);
  let touched = $state(false);

  const problem = $derived(passphraseProblem(passphrase, confirmation));

  $effect(() => {
    valid = problem === null && understood;
  });
</script>
