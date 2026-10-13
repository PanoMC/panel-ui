<!-- The name is the first thing one types here, so the caret waits in it as soon as the dialog is
     up: `shown` rather than `show`, because a hidden field cannot take focus. -->
<div
  class="modal fade"
  bind:this={$modalElement}
  role="dialog"
  tabindex="-1"
  on:shown.bs.modal={focusName}>
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">
          {$mode === 'edit'
            ? $_('components.modals.add-edit-language.edit-language')
            : $_('components.modals.add-edit-language.create-language')}
        </h5>
        <button
          aria-label={$_('buttons.close')}
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          on:click={hide}></button>
      </div>
      <form on:submit|preventDefault={onSubmit}>
        <div class="modal-body">
          <div class="row">
            <div class="col-12 mb-3">
              <label for="name">{$_('components.modals.add-edit-language.inputs.name')}</label>
              <input
                class="form-control form-control-lg"
                id="name"
                type="text"
                bind:value={$locale.name}
                disabled={isSystem}
                on:input={onNameChange}
                class:is-invalid={$error === 'INVALID_LOCALE_NAME'} />
            </div>
            <div class="col-6 mb-3">
              <label for="code">{$_('components.modals.add-edit-language.inputs.code')}</label>
              <input
                class="form-control"
                id="code"
                type="text"
                bind:value={$locale.code}
                disabled={isSystem}
                class:is-invalid={$error === 'INVALID_LOCALE_CODE'} />
              <div class="form-text">
                {$_('components.modals.add-edit-language.inputs.code-helper')}
                <a
                  href={$_('components.modals.add-edit-language.inputs.code-lookup-url')}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-decoration-none">
                  <i class="fa-solid fa-external-link small ms-1"></i>
                  {$_('components.modals.add-edit-language.inputs.code-lookup-text')}
                </a>
              </div>
            </div>
            <div class="col-6 mb-3">
              <label for="dateFnsCode">
                {$_('components.modals.add-edit-language.inputs.date-fns-code')}
              </label>
              <select
                class="form-control"
                id="dateFnsCode"
                bind:value={$locale.dateFnsCode}
                disabled={isSystem}
                class:is-invalid={$error === 'INVALID_DATE_FNS_CODE'}>
                <option value="">{$_('buttons.select-option')}</option>
                {#each Object.keys(dateLocales).sort() as dateLocaleKey}
                  <option value={dateLocales[dateLocaleKey].code || dateLocaleKey}>
                    {dateLocales[dateLocaleKey].code || dateLocaleKey}
                  </option>
                {/each}
              </select>
              <div class="form-text">
                {$_('components.modals.add-edit-language.inputs.date-fns-code-helper')}
              </div>
            </div>

            <div class="col-12 mb-3">
              <label for="derivatives">{$_('pages.languages.derivatives')}</label>
              <input
                id="derivatives"
                class="form-control"
                class:is-invalid={$error === 'derivatives' ||
                  $error === 'INVALID_LOCALE_DERIVATIVE'}
                placeholder={$_('components.modals.add-edit-language.inputs.derivatives')}
                type="text"
                name="derivative"
                bind:value={$derivative}
                disabled={isSystem}
                on:input={onDerivativeChange}
                on:keydown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addKeyWord();
                  }
                }} />
              <div class="form-text">
                {$_('components.modals.add-edit-language.inputs.derivatives-helper')}
              </div>
              {#if $locale.derivatives.length > 0}
                <div class="hstack gap-2 flex-wrap">
                  {#each $locale.derivatives as derivative, index (derivative)}
                    <button
                      type="button"
                      class="btn btn-link p-0 d-inline-block mt-2 text-decoration-none"
                      aria-label={$_('buttons.remove')}
                      title={isSystem ? undefined : $_('buttons.remove')}
                      disabled={isSystem}
                      on:click={() => removeKeyWord(index)}>
                      <span class="badge text-bg-primary">
                        {derivative}
                      </span>
                    </button>
                  {/each}
                </div>
              {/if}
            </div>

            <!-- Whether visitors are offered the language. English is what a missing text falls
                 back to and the website's own language is what visitors get, so both stay on. -->
            {#if $mode === 'edit'}
              <div class="col-12">
                <div class="form-check form-switch">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="languageEnabled"
                    autocomplete="off"
                    checked={$locale.enabled !== false}
                    disabled={alwaysOn}
                    on:change={(event) => ($locale.enabled = event.currentTarget.checked)} />
                  <label class="form-check-label" for="languageEnabled">
                    {$_('components.modals.add-edit-language.inputs.enabled')}
                  </label>
                </div>
                {#if alwaysOn}
                  <div class="form-text">
                    {$_(
                      'components.modals.add-edit-language.inputs.' +
                        (isEnglish ? 'enabled-english' : 'enabled-website-language'),
                    )}
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        </div>
        <div class="modal-footer">
          <button
            class="btn w-100"
            type="submit"
            class:btn-secondary={$mode === 'create'}
            class:btn-primary={$mode === 'edit'}
            class:disabled={loading || buttonDisabled}>
            {$mode === 'edit' ? $_('buttons.save') : $_('buttons.create')}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<script context="module">
  import { errorCode } from '$lib/apiError.util.js';
  import { writable, get } from 'svelte/store';

  const modalElement = writable();
  const mode = writable('create');
  const locale = writable({ derivatives: [] });
  const error = writable();
  const derivative = writable();

  let callback = (routeFirstPage) => {};
  let hideCallback = (locale) => {};
  let modal;

  export function show(
    newMode,
    newLocale = {
      id: -1,
      name: '',
      code: '',
      dateFnsCode: '',
      derivatives: [],
    },
  ) {
    mode.set(newMode);

    if (newLocale.description === null) newLocale.description = '';

    locale.set({ ...newLocale });
    error.set([]);
    derivative.set(null);

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: 'static',
      keyboard: false,
    });
    modal.show();
  }

  export function hide() {
    if (get(mode) === 'edit') hideCallback(get(locale));

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
  import * as dateLocales from 'date-fns/locale';
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import ApiUtil from '$lib/api.util';

  import {
    showSuccess as showSuccessToast,
    limitTitle,
  } from '$lib/components/ToastContainer.svelte';

  const siteInfo = getContext('siteInfo');

  let loading = false;
  // A language Pano ships: its name, codes and derivatives are fixed, only the switch is open.
  $: isSystem = $mode === 'edit' && $locale.definedBy === 'SYSTEM';
  $: isEnglish = $locale.code === 'en-US';
  $: alwaysOn = isEnglish || $locale.code === $siteInfo?.platformLocale;
  $: buttonDisabled = !$locale.name || !$locale.code || !$locale.dateFnsCode;

  /** Puts the caret in the name field once Bootstrap reports the dialog as shown. */
  function focusName() {
    get(modalElement)?.querySelector('#name:not(:disabled)')?.focus();
  }

  function onSubmit() {
    loading = true;

    const bodyHandler = (body, reject) => {
      if (!body.error) {
        loading = false;

        hide();

        callback(true);

        showSuccessToast(
          'components.toasts.' +
            (get(mode) === 'edit'
              ? 'language-updated-successfully'
              : 'language-created-successfully'),
          {
            name: limitTitle(get(locale).name),
          },
        );

        return;
      } else if (body.error) {
        loading = false;

        error.set(errorCode(body));

        return;
      }

      reject();
    };

    if (get(mode) === 'edit') {
      ApiUtil.put({
        path: `/panel/locales/${get(locale).id}`,
        body: get(locale),
        handler: bodyHandler,
      });

      return;
    }

    ApiUtil.post({
      path: '/panel/locales',
      body: get(locale),
      handler: bodyHandler,
    });
  }

  function addKeyWord() {
    if (!$derivative || $derivative.length < 2) {
      $error = 'derivatives';
      return;
    }

    if ($locale.derivatives.indexOf($derivative) !== -1) {
      $error = 'derivatives';

      return;
    }

    if ($error === 'derivatives') {
      $error = null;
    }

    const keywords = $derivative.split(/,\s*/);

    keywords.forEach((keyword) => {
      $locale.derivatives.push(keyword.trim());
    });

    $locale.derivatives = $locale.derivatives;

    $derivative = '';
  }

  function removeKeyWord(index) {
    $locale.derivatives = $locale.derivatives.remove(index);
  }

  function onNameChange(event) {
    let value = event.target.value;

    if (value.length > 40) {
      value = value.substring(0, 40);
    }

    $locale.name = value;
  }

  function onDerivativeChange(event) {
    let value = event.target.value;

    if (value.length > 8) {
      value = value.substring(0, 8);
    }

    $derivative = value;
  }
</script>
