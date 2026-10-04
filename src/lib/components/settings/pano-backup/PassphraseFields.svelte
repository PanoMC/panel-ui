<!-- New passphrase + confirmation. -->
<div class="vstack gap-3 text-start">
  <div>
    <div class="form-floating">
      <input
        id="{id}-passphrase"
        class="form-control"
        type="password"
        placeholder=" "
        autocomplete="new-password"
        bind:value={passphrase}
        class:is-invalid={touched && problem === 'too-short'} />
      <label class="text-capitalize" for="{id}-passphrase">
        {$_('pages.settings.backups.passphrase')}
      </label>
    </div>
    <div class="mt-1">
      {$_('pages.settings.backups.passphrase-min', { values: { min: MIN_PASSPHRASE_LENGTH } })}
    </div>
  </div>
  <div>
    <div class="form-floating">
      <input
        id="{id}-confirm"
        class="form-control"
        type="password"
        placeholder=" "
        autocomplete="new-password"
        bind:value={confirmation}
        onblur={() => (touched = true)}
        class:is-invalid={touched && problem === 'mismatch'} />
      <label class="text-capitalize" for="{id}-confirm">
        {$_('pages.settings.backups.passphrase-confirm')}
      </label>
    </div>
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
