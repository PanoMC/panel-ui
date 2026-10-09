<div class="vstack gap-3">
  {#if $error}
    <div class="alert alert-danger d-flex align-items-start mb-0" role="alert" data-settings-error>
      <i class="fa-solid fa-circle-exclamation me-3 mt-1" aria-hidden="true"></i>
      <div data-error-code={$error.code}>{$_($error.key, { values: $error.values })}</div>
    </div>
  {/if}

  {#if $saved.schema}
    <form class="card" data-settings-form onsubmit={submit}>
      <div class="card-body">
        <SchemaForm
          schema={$saved.schema}
          bind:values={form.values}
          bind:files={form.files}
          bind:removed={form.removed}
          bind:uploads={form.uploads}
          messages={$messages}
          errors={$fieldErrors}
          disabled={$saving}
          idPrefix="frontend-setting" />
      </div>
      <div class="card-footer">
        <button class="btn btn-primary" type="submit" disabled={$saving} data-save-settings>
          {#if $saving}
            <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
          {/if}
          {$_('buttons.save')}
        </button>
      </div>
    </form>
  {:else if $saved.mode === 'THEME'}
    <div class="alert alert-info d-flex align-items-start mb-0" role="alert" data-own-settings>
      <i class="fa-solid fa-circle-info me-3 mt-1" aria-hidden="true"></i>
      <div>
        <div>{$_('pages.frontend.settings.own-page')}</div>
        <a class="alert-link" href="{base}/view/theme-settings">
          {$_('pages.frontend.settings.open-theme-settings')}
        </a>
      </div>
    </div>
  {:else}
    <div class="card">
      <NoContent icon="" text={$_('pages.frontend.settings.none')} />
    </div>
  {/if}
</div>

<script>
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { base } from '$app/paths';

  import NoContent from '$lib/components/NoContent.svelte';
  import SchemaForm from '$lib/components/SchemaForm.svelte';

  import { formOf } from './settings.controller.js';

  /**
   * The Settings tab: the form of the active front-end's `settingsSchema`, or a link to the theme's own
   * settings page when it declares no `fields`. All state but the form's own lives in the controller.
   * @type {{ controller: ReturnType<typeof import('./settings.controller.js').createSettingsController> }}
   */
  let { controller } = $props();

  // The controller is fixed for the life of the page.
  // svelte-ignore state_referenced_locally
  const { state: saved, saving, messages, fieldErrors, error } = controller;

  // svelte-ignore state_referenced_locally
  let form = $state(formOf($saved));

  // A new state (a save, or the front-end changed) starts the form over.
  $effect(() => {
    form = formOf($saved);
  });

  onMount(() => {
    controller.loadTexts();
  });

  async function submit(event) {
    event.preventDefault();

    await controller.save(form);
  }
</script>
