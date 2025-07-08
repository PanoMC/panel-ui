<div class="modal fade" bind:this="{$modalElement}" role="dialog" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered" role="dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">
          {$mode === "edit" ? $_('components.modals.add-edit-language.edit-language') : $_('components.modals.add-edit-language.create-language')}
        </h5>
        <button
          title="{$_('buttons.close')}"
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          on:click="{hide}"></button>
      </div>
      <form on:submit|preventDefault="{onSubmit}">
        <div class="modal-body">
          <input
            class="form-control form-control-lg mb-3"
            placeholder="{$_('components.modals.add-edit-language.inputs.name')}"
            id="name"
            type="text"
            bind:value="{$locale.name}"
            on:input={onNameChange}
            class:border-danger="{$error === 'INVALID_LOCALE_NAME'}" />
          <input
            class="form-control form-control-lg mb-3"
            placeholder="{$_('components.modals.add-edit-language.inputs.code')}"
            id="code"
            type="text"
            bind:value="{$locale.code}"
            class:border-danger="{$error === 'INVALID_LOCALE_CODE'}" />
          <input
            class="form-control form-control-lg mb-3"
            placeholder="{$_('components.modals.add-edit-language.inputs.date-fns-code')}"
            id="dateFnsCode"
            type="text"
            bind:value="{$locale.dateFnsCode}"
            class:border-danger="{$error === 'INVALID_DATE_FNS_CODE'}" />

          <input
            id="derivatives"
            class="form-control mb-3"
            class:border-danger="{$error === 'derivatives' || $error === 'INVALID_LOCALE_DERIVATIVE'}"
            placeholder="{$_(
            'components.modals.add-edit-language.inputs.derivatives',
          )}"
            type="text"
            name="derivative"
            bind:value="{$derivative}"
            on:input={onDerivativeChange}
            on:keydown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addKeyWord();
              }
            }} />
          {#each $locale.derivatives as derivative, index (derivative)}
            <a
              use:tooltip="{[
              $_('buttons.remove'),
              { placement: 'bottom' },
            ]}"
              href="javascript:void(0);"
              on:click="{() => removeKeyWord(index)}">
            <span class="badge rounded-pill bg-light link-primary">
              {derivative}
            </span>
            </a>
          {/each}
        </div>
        <div class="modal-footer">
          <button
            class="btn w-100"
            type="submit"
            class:btn-secondary="{$mode === 'create'}"
            class:btn-primary="{$mode === 'edit'}"
            class:disabled="{loading || buttonDisabled}">
            {$mode === "edit" ? $_('buttons.save') : $_('buttons.create')}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<script context="module">
  import { writable, get } from "svelte/store";

  const modalElement = writable();
  const mode = writable("create");
  const locale = writable({derivatives: []});
  const error = writable();
  const derivative = writable()

  let callback = (routeFirstPage) => {};
  let hideCallback = (locale) => {};
  let modal;

  export function show(
    newMode,
    newLocale = { id: -1, name: "", code: "", dateFnsCode: "", derivatives: [] }
  ) {
    mode.set(newMode);

    if (newLocale.description === null) newLocale.description = "";

    locale.set({ ...newLocale });
    error.set([]);
    derivative.set(null);

    modal = new window.bootstrap.Modal(get(modalElement), {
      backdrop: "static",
      keyboard: false,
    });
    modal.show();
  }

  export function hide() {
    if (get(mode) === "edit") hideCallback(get(locale));

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
  import { _ } from "svelte-i18n";

  import ApiUtil from "$lib/api.util";
  import tooltip from "$lib/tooltip.util";

  import {
    show as showToast,
    limitTitle,
  } from "$lib/component/ToastContainer.svelte";

  let loading = false;
  $: buttonDisabled = !$locale.name || !$locale.code || !$locale.dateFnsCode;

  function onSubmit() {
    loading = true;

    const bodyHandler = (body, reject) => {
      if (body.result === "ok") {
        loading = false;

        hide();

        callback(true);

        showToast('components.toasts.' + (get(mode) === "edit" ? "language-updated-successfully" : "language-created-successfully"), {
          name: limitTitle(get(locale).name),
        });

        return
      } else if (body.result === "error") {
        loading = false;

        error.set(body.error);

        return
      }

      reject();
    };

    if (get(mode) === "edit") {
      ApiUtil.put({
        path: `/api/panel/locales/${get(locale).id}`,
        body: get(locale),
        handler: bodyHandler
      })

      return;
    }

    ApiUtil.post({
      path: "/api/panel/locales",
      body: get(locale),
      handler: bodyHandler
    })
  }

  function addKeyWord() {
    if (!$derivative || $derivative.length < 2) {
      $error = "derivatives"
      return;
    }

    if ($locale.derivatives.indexOf($derivative) !== -1) {
      $error = "derivatives";

      return;
    }

    if ($error === "derivatives") {
      $error = null;
    }

    const keywords = $derivative.split(/,\s*/);

    keywords.forEach(keyword => {
      $locale.derivatives.push(keyword.trim());
    });

    $locale.derivatives = $locale.derivatives;

    $derivative = "";
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
