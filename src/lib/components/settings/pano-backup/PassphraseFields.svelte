<!-- New passphrase + confirmation. -->
<div class="vstack gap-3 text-start">
  <div>
    <input
      id="{id}-passphrase"
      class="form-control form-control-lg text-capitalize"
      type="password"
      autocomplete="new-password"
      placeholder={$_('pages.settings.backups.passphrase')}
      aria-label={$_('pages.settings.backups.passphrase')}
      bind:value={passphrase}
      class:is-invalid={touched && problem === 'too-short'} />
    <div class="form-text">
      {$_('pages.settings.backups.passphrase-min', { values: { min: MIN_PASSPHRASE_LENGTH } })}
    </div>
  </div>
  <div>
    <input
      id="{id}-confirm"
      class="form-control form-control-lg text-capitalize"
      type="password"
      autocomplete="new-password"
      placeholder={$_('pages.settings.backups.passphrase-confirm')}
      aria-label={$_('pages.settings.backups.passphrase-confirm')}
      bind:value={confirmation}
      onblur={() => (touched = true)}
      class:is-invalid={touched && problem === 'mismatch'} />
    {#if touched && problem === 'mismatch'}
      <div class="invalid-feedback d-block">{$_('pages.settings.backups.passphrase-mismatch')}</div>
    {/if}
  </div>
</div>

<script>
  import { _ } from 'svelte-i18n';

  import { MIN_PASSPHRASE_LENGTH, passphraseProblem } from '$lib/pano-backup.util.js';

  /** @type {{ passphrase?: string, valid?: boolean }} */
  let { passphrase = $bindable(''), valid = $bindable(false) } = $props();

  const id = $props.id();

  let confirmation = $state('');
  let touched = $state(false);

  const problem = $derived(passphraseProblem(passphrase, confirmation));

  $effect(() => {
    valid = problem === null;
  });
</script>
