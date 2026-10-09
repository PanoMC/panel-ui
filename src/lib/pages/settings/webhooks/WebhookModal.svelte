<!-- Create or edit a webhook endpoint. After a save that made a signing secret the same dialog shows it once. -->
<div class="modal fade" bind:this={element} role="dialog" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">
          {#if secret}
            {$_('pages.webhooks.secret.title')}
          {:else if editing !== null}
            {$_('pages.webhooks.form.title-edit')}
          {:else}
            {$_('pages.webhooks.form.title-create')}
          {/if}
        </h5>
        <button type="button" class="btn-close" aria-label={$_('buttons.close')} onclick={hide}
        ></button>
      </div>

      {#if secret}
        <div class="modal-body">
          <WebhookSecretReveal {secret} {notify} />
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary w-100" type="button" data-secret-done onclick={hide}>
            {$_('pages.webhooks.secret.done')}
          </button>
        </div>
      {:else}
        <form onsubmit={submit} novalidate>
          <div class="modal-body">
            <div class="vstack gap-3">
              <div>
                <input
                  class="form-control form-control-lg"
                  class:is-invalid={shown.name}
                  type="text"
                  maxlength="128"
                  autocomplete="off"
                  data-field="name"
                  placeholder={$_('pages.webhooks.form.name')}
                  bind:value={form.name} />
                {@render problem(shown.name)}
              </div>

              <div>
                <div class="btn-group" role="group" aria-label={$_('pages.webhooks.form.format')}>
                  {#each WEBHOOK_FORMATS as format (format)}
                    <input
                      type="radio"
                      class="btn-check"
                      name="webhookFormat"
                      id="webhookFormat{format}"
                      autocomplete="off"
                      checked={form.format === format}
                      onchange={() => (form = withFormat(form, format))} />
                    <label class="btn btn-outline-secondary" for="webhookFormat{format}">
                      {#if format === 'DISCORD'}
                        <i class="fa-brands fa-discord me-1" aria-hidden="true"></i>
                      {/if}
                      {$_(`pages.webhooks.format.${format}`)}
                    </label>
                  {/each}
                </div>
              </div>

              <div>
                <input
                  class="form-control"
                  class:is-invalid={shown.url}
                  type="text"
                  inputmode="url"
                  maxlength="1024"
                  autocomplete="off"
                  data-field="url"
                  placeholder={$_('pages.webhooks.form.url')}
                  bind:value={form.url} />
                {@render problem(shown.url)}
              </div>

              <WebhookEvents bind:form {catalogue} {initialEvents} error={shown.events ?? ''} />

              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label" for="webhookSigning">
                    {$_('pages.webhooks.form.signing')}
                  </label>
                  <select
                    id="webhookSigning"
                    class="form-select"
                    disabled={discord}
                    value={form.signing}
                    onchange={(event) => (form = { ...form, signing: event.currentTarget.value })}>
                    {#each WEBHOOK_SIGNINGS as signing (signing)}
                      <option value={signing}>{$_(`pages.webhooks.signing.${signing}`)}</option>
                    {/each}
                  </select>
                  {#if discord}
                    <div class="form-text">{$_('pages.webhooks.form.signing-discord')}</div>
                  {:else if form.signing === 'HMAC_SHA256'}
                    <div class="form-text">{$_('pages.webhooks.form.signing-hint')}</div>
                  {/if}
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="webhookMaxAttempts">
                    {$_('pages.webhooks.form.max-attempts')}
                  </label>
                  <input
                    id="webhookMaxAttempts"
                    class="form-control"
                    class:is-invalid={shown.maxAttempts}
                    type="text"
                    inputmode="numeric"
                    autocomplete="off"
                    data-field="maxAttempts"
                    bind:value={form.maxAttempts} />
                  {@render problem(shown.maxAttempts)}
                </div>
              </div>

              <div>
                <div class="mb-1">{$_('pages.webhooks.form.headers')}</div>
                <div class="vstack gap-2" data-headers>
                  {#each form.headers as row, index (index)}
                    <div>
                      <div class="input-group">
                        <input
                          class="form-control"
                          class:is-invalid={headerProblem(index, row)}
                          type="text"
                          autocomplete="off"
                          aria-label={$_('pages.webhooks.form.header-name')}
                          placeholder={$_('pages.webhooks.form.header-name')}
                          bind:value={row.key} />
                        <input
                          class="form-control"
                          class:is-invalid={headerProblem(index, row)}
                          type="text"
                          autocomplete="off"
                          aria-label={$_('pages.webhooks.form.header-value')}
                          placeholder={$_('pages.webhooks.form.header-value')}
                          bind:value={row.value} />
                        <button
                          class="btn btn-secondary"
                          type="button"
                          title={$_('buttons.remove')}
                          aria-label={$_('buttons.remove')}
                          onclick={() => removeHeader(index)}>
                          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                        </button>
                      </div>
                      {@render problem(headerProblem(index, row))}
                    </div>
                  {/each}
                  {#if shown.headers?.tooMany}
                    {@render problem('TOO_MANY')}
                  {/if}
                  <div>
                    <button
                      class="btn btn-sm btn-link px-0"
                      type="button"
                      data-add-header
                      disabled={form.headers.length >= MAX_HEADERS}
                      onclick={addHeader}>
                      <i class="fa-solid fa-plus me-1" aria-hidden="true"></i>
                      {$_('pages.webhooks.form.add-header')}
                    </button>
                  </div>
                </div>
              </div>

              {#if discord}
                <div>
                  <div class="form-check form-switch mb-2">
                    <input
                      id="webhookCustomTemplate"
                      class="form-check-input"
                      type="checkbox"
                      role="switch"
                      bind:checked={form.customTemplate} />
                    <label class="form-check-label" for="webhookCustomTemplate">
                      {$_('pages.webhooks.form.custom-template')}
                    </label>
                  </div>
                  {#if form.customTemplate}
                    <textarea
                      class="form-control font-monospace"
                      class:is-invalid={shown.template}
                      rows="8"
                      spellcheck="false"
                      data-field="template"
                      aria-label={$_('pages.webhooks.form.template')}
                      placeholder={$_('pages.webhooks.form.template')}
                      bind:value={form.template}></textarea>
                    {@render problem(shown.template)}
                  {/if}
                </div>
              {/if}

              <div class="form-check form-switch m-0">
                <input
                  id="webhookEnabled"
                  class="form-check-input"
                  type="checkbox"
                  role="switch"
                  bind:checked={form.enabled} />
                <label class="form-check-label" for="webhookEnabled">
                  {$_('pages.webhooks.form.enabled')}
                </label>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary w-100" type="submit" disabled={$saving}>
              {#if $saving}
                <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
              {/if}
              {editing !== null ? $_('buttons.save') : $_('buttons.create')}
            </button>
          </div>
        </form>
      {/if}
    </div>
  </div>
</div>

{#snippet problem(code)}
  {#if code}
    <div class="invalid-feedback d-block" data-problem={code}>{$_(fieldErrorKey(code))}</div>
  {/if}
{/snippet}

<script>
  import { _ } from 'svelte-i18n';

  import WebhookEvents from './WebhookEvents.svelte';
  import WebhookSecretReveal from './WebhookSecretReveal.svelte';
  import {
    MAX_HEADERS,
    WEBHOOK_FORMATS,
    WEBHOOK_SIGNINGS,
    blankForm,
    buildBody,
    fieldErrorKey,
    formFromEndpoint,
    withFormat,
  } from './webhooks.util.js';

  /**
   * @type {{ controller: ReturnType<typeof import('./endpoints.controller.js').createEndpointsController>, notify?: any }}
   */
  let { controller, notify = undefined } = $props();

  // The controller is fixed for the life of the page.
  // svelte-ignore state_referenced_locally
  const { saving, serverErrors, catalogue: catalogueStore } = controller;

  let element = $state();
  let form = $state(blankForm());
  /** The id of the endpoint being edited, or null while creating. */
  let editing = $state(/** @type {number | null} */ (null));
  let initialEvents = $state(/** @type {string[]} */ ([]));
  let submitted = $state(false);
  /** The signing secret just made; the dialog shows it instead of the form while it is set. */
  let secret = $state('');
  let modal;

  const catalogue = $derived($catalogueStore);
  const discord = $derived(form.format === 'DISCORD');
  const local = $derived(submitted ? (buildBody(form).errors ?? {}) : {});
  const shown = $derived({ ...local, ...$serverErrors });

  /** The error of one header row: from the checks, or from the server by header name. */
  function headerProblem(index, row) {
    return shown.headers?.byIndex?.[index] ?? shown.headers?.byName?.[row.key] ?? '';
  }

  function open() {
    if (!window.bootstrap?.Modal) return;

    modal = window.bootstrap.Modal.getOrCreateInstance(element, {
      backdrop: 'static',
      keyboard: false,
    });
    modal.show();
  }

  /** @param {any} [endpoint] the endpoint to edit, or nothing to create one */
  export function show(endpoint = null) {
    secret = '';
    submitted = false;
    controller.serverErrors.set({});
    editing = endpoint ? endpoint.id : null;
    form = endpoint ? formFromEndpoint(endpoint) : blankForm();
    initialEvents = endpoint ? form.events : [];
    open();
  }

  /** Shows a secret that was made outside the form (regenerate). */
  export function reveal(value) {
    secret = value;
    open();
  }

  export function hide() {
    modal?.hide();
    // The secret must not outlive the dialog: it is shown once.
    secret = '';
  }

  function addHeader() {
    form.headers = [...form.headers, { key: '', value: '' }];
  }

  function removeHeader(index) {
    form.headers = form.headers.filter((row, i) => i !== index);
  }

  async function submit(event) {
    event.preventDefault();

    if ($saving) return;

    submitted = true;

    const result = await controller.save(form, editing);

    if (!result.ok) return;

    if (result.secret) {
      secret = result.secret;
    } else {
      hide();
    }
  }
</script>
