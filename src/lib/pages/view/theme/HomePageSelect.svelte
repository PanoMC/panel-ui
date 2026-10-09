<div class="card" data-home-select>
  <div class="card-body">
    <div class="row g-3 align-items-start">
      <div class="col-lg-4">
        <label for="homePageSelect" class="form-label mb-1"
          >{$_('pages.theme-settings.home.label')}</label>
        <div class="form-text mt-0">{$_('pages.theme-settings.home.description')}</div>
      </div>
      <div class="col-lg-8">
        <div class="hstack gap-2 align-items-start">
          <div class="flex-grow-1 vstack gap-2">
            <select
              id="homePageSelect"
              class="form-select"
              value={$selected}
              disabled={$saving}
              onchange={(event) => controller.select(event.currentTarget.value)}>
              {#each $saved.options as option (option.id)}
                <option
                  value={option.id}
                  disabled={!option.available}
                  selected={option.id === $selected}>
                  {optionLabel(option, locale)}{option.id === $saved.default
                    ? ` (${$_('pages.theme-settings.home.default')})`
                    : ''}{option.available
                    ? ''
                    : ` (${$_('pages.theme-settings.home.unavailable')})`}
                </option>
              {/each}
            </select>

            {#if $customSelected}
              <input
                type="text"
                class="form-control font-monospace"
                class:is-invalid={$pathInvalid && $customPath !== ''}
                id="homePageCustomPath"
                maxlength={MAX_CUSTOM_PATH}
                placeholder={$_('pages.theme-settings.home.custom-path-placeholder')}
                aria-label={$_('pages.theme-settings.home.custom-path')}
                bind:value={$customPath}
                disabled={$saving} />
              {#if $pathInvalid && $customPath !== ''}
                <div class="invalid-feedback d-block" data-path-error>
                  {$_('pages.theme-settings.home.custom-path-invalid')}
                </div>
              {/if}
            {/if}

            {#if $problem}
              <div class="text-danger" role="alert" data-home-problem>{$_($problem.key)}</div>
            {/if}
          </div>
          <button
            type="button"
            class="btn btn-secondary"
            data-save-home
            disabled={!$canSave}
            onclick={() => controller.save()}>
            {#if $saving}<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"
              ></span
              >{/if}
            {$_('buttons.save')}
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
  import { _, locale as activeLocale } from 'svelte-i18n';

  import { MAX_CUSTOM_PATH, optionLabel } from './home.controller.js';

  /**
   * The select above the theme settings: which page the front page of the site shows.
   * @type {{ controller: ReturnType<typeof import('./home.controller.js').createHomeController> }}
   */
  let { controller } = $props();

  // The stores are read once; the controller owns them.
  // svelte-ignore state_referenced_locally
  const { saved, selected, customPath, customSelected, pathInvalid, canSave, saving, problem } =
    controller;

  const locale = $derived($activeLocale ?? 'en-US');
</script>
