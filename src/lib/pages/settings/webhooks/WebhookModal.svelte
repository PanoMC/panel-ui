<!-- Create or edit a webhook endpoint. After a save that made a signing secret the same dialog shows it once. -->
<div class="modal fade" bind:this={element} role="dialog" tabindex="-1" aria-hidden="true">
  <div
    class="modal-dialog modal-dialog-centered modal-dialog-scrollable"
    class:modal-xl={templateEvent !== null}
    role="document">
    <div class="modal-content">
      <div class="modal-header">
        {#if templateEvent !== null && !secret}
          <button
            class="btn btn-link px-1 me-2"
            type="button"
            data-template-back
            title={$_('buttons.back')}
            aria-label={$_('buttons.back')}
            onclick={closeTemplate}>
            <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
          </button>
        {/if}
        <h5 class="modal-title text-capitalize">
          {#if templateEvent !== null && !secret}
            {$_('pages.webhooks.template.title')}
          {:else if secret}
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
      {:else if templateEvent !== null}
        <div class="modal-body">
          {#key templateEvent}
            <WebhookTemplateEditor
              event={templateEvent}
              format={form.format}
              info={templateInfoFor(templateInfo[templateEvent], form.format)}
              bind:text={templateText}
              error={shown.templates?.[templateEvent] ?? ''}
              webhookName={form.name}
              previewTemplate={controller.previewTemplate} />
          {/key}
        </div>
        <div class="modal-footer">
          <button
            class="btn btn-primary w-100"
            type="button"
            data-template-apply
            onclick={applyTemplate}>
            {$_('pages.webhooks.template.apply')}
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

              <div
                class="row row-cols-2 row-cols-sm-3 g-2"
                role="radiogroup"
                aria-label={$_('pages.webhooks.form.format')}>
                {#each WEBHOOK_FORMATS as format (format)}
                  <div class="col">
                    <input
                      type="radio"
                      class="btn-check"
                      name="webhookFormat"
                      id="webhookFormat{format}"
                      autocomplete="off"
                      checked={form.format === format}
                      onchange={() => changeFormat(format)} />
                    <label
                      class="btn btn-outline-primary text-capitalize w-100 text-nowrap"
                      for="webhookFormat{format}">
                      <i class="{FORMAT_ICONS[format]} me-1" aria-hidden="true"></i>
                      {$_(`pages.webhooks.format.${format}`)}
                    </label>
                  </div>
                {/each}
              </div>

              {#if form.format === 'TELEGRAM'}
                <div>
                  <div class="input-group">
                    <input
                      class="form-control"
                      class:is-invalid={shown.url}
                      type="text"
                      autocomplete="off"
                      spellcheck="false"
                      data-field="telegramToken"
                      aria-label={$_('pages.webhooks.form.telegram-token')}
                      placeholder={$_('pages.webhooks.form.telegram-token')}
                      value={telegram.token}
                      oninput={(event) => setTelegram({ token: event.currentTarget.value })} />
                    <input
                      class="form-control"
                      class:is-invalid={shown.url}
                      type="text"
                      autocomplete="off"
                      spellcheck="false"
                      data-field="telegramChat"
                      aria-label={$_('pages.webhooks.form.telegram-chat')}
                      placeholder={$_('pages.webhooks.form.telegram-chat')}
                      value={telegram.chat}
                      oninput={(event) => setTelegram({ chat: event.currentTarget.value })} />
                  </div>
                  {@render problem(shown.url)}
                </div>
              {:else}
                <div>
                  <input
                    class="form-control"
                    class:is-invalid={shown.url}
                    type="text"
                    inputmode="url"
                    maxlength="1024"
                    autocomplete="off"
                    data-field="url"
                    placeholder={$_(`pages.webhooks.form.url-${form.format}`)}
                    bind:value={form.url} />
                  {@render problem(shown.url)}
                </div>
              {/if}

              <WebhookEvents bind:form {catalogue} {initialEvents} error={shown.events ?? ''} />

              <div>
                <div class="input-group">
                  <div class="form-floating">
                    <select
                      id="webhookSigning"
                      class="form-select"
                      disabled={unsigned}
                      value={form.signing}
                      onchange={(event) =>
                        (form = { ...form, signing: event.currentTarget.value })}>
                      {#each WEBHOOK_SIGNINGS as signing (signing)}
                        <option value={signing}>{$_(`pages.webhooks.signing.${signing}`)}</option>
                      {/each}
                    </select>
                    <label class="text-capitalize" for="webhookSigning">
                      {$_('pages.webhooks.form.signing')}
                    </label>
                  </div>
                  <div class="form-floating">
                    <input
                      id="webhookMaxAttempts"
                      class="form-control"
                      class:is-invalid={shown.maxAttempts}
                      type="text"
                      inputmode="numeric"
                      autocomplete="off"
                      data-field="maxAttempts"
                      placeholder={$_('pages.webhooks.form.max-attempts')}
                      bind:value={form.maxAttempts} />
                    <label class="text-capitalize" for="webhookMaxAttempts">
                      {$_('pages.webhooks.form.max-attempts')}
                    </label>
                  </div>
                </div>
                {@render problem(shown.maxAttempts)}
              </div>

              <div>
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
                          class="btn btn-primary"
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
                      class="btn btn-sm btn-link text-capitalize px-0"
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

              {#if templated}
                <div data-templates>
                  <div class="small text-muted mb-1 text-capitalize">
                    {$_('pages.webhooks.template.list')}
                  </div>
                  <div class="list-group">
                    {#each templateRows as row (row.key)}
                      <div
                        class="list-group-item d-flex align-items-center gap-2"
                        class:border-danger={shown.templates?.[row.key]}
                        data-template-row={row.key}>
                        <div class="me-auto text-truncate">
                          {#if row.key === WILDCARD}
                            {$_('pages.webhooks.template.every-event')}
                          {:else}
                            <code>{row.key}</code>
                          {/if}
                          <span
                            class="badge ms-1"
                            class:text-bg-primary={row.state === 'custom'}
                            class:text-bg-secondary={row.state !== 'custom'}>
                            {$_(`pages.webhooks.template.state.${row.state}`)}
                          </span>
                          {#if shown.templates?.[row.key]}
                            <div class="invalid-feedback d-block">
                              {$_(fieldErrorKey(shown.templates[row.key]))}
                            </div>
                          {/if}
                        </div>
                        <button
                          class="btn btn-sm btn-link"
                          type="button"
                          data-template-edit={row.key}
                          title={$_('buttons.edit')}
                          aria-label={$_('buttons.edit')}
                          onclick={() => openTemplate(row.key)}>
                          <i class="fa-solid fa-pen" aria-hidden="true"></i>
                        </button>
                        {#if row.state === 'custom'}
                          <button
                            class="btn btn-sm btn-link text-danger"
                            type="button"
                            data-template-remove={row.key}
                            title={$_('pages.webhooks.template.reset')}
                            aria-label={$_('pages.webhooks.template.reset')}
                            onclick={() => removeTemplate(row.key)}>
                            <i class="fa-solid fa-rotate-left" aria-hidden="true"></i>
                          </button>
                        {/if}
                      </div>
                    {/each}
                  </div>
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
            <button
              class="btn w-100"
              class:btn-primary={editing !== null}
              class:btn-secondary={editing === null}
              type="submit"
              disabled={$saving}>
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
  import WebhookTemplateEditor from './WebhookTemplateEditor.svelte';
  import { coveredEvents, templateInfoFor } from './discord.util.js';
  import {
    FORMAT_ICONS,
    MAX_HEADERS,
    WEBHOOK_FORMATS,
    WEBHOOK_SIGNINGS,
    WILDCARD,
    isTemplatedFormat,
    isUnsignedFormat,
    telegramParts,
    telegramUrl,
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
  const {
    saving,
    serverErrors,
    catalogue: catalogueStore,
    templateInfo: templateInfoStore,
  } = controller;

  let element = $state();
  let form = $state(blankForm());
  /** The id of the endpoint being edited, or null while creating. */
  let editing = $state(/** @type {number | null} */ (null));
  let initialEvents = $state(/** @type {string[]} */ ([]));
  let submitted = $state(false);
  /** The signing secret just made; the dialog shows it instead of the form while it is set. */
  let secret = $state('');
  /** The event whose Discord message is being edited (the dialog shows the editor), or null. */
  let templateEvent = $state(/** @type {string | null} */ (null));
  let templateText = $state('');
  let modal;

  const catalogue = $derived($catalogueStore);
  const templateInfo = $derived($templateInfoStore ?? {});

  /**
   * One row per event the endpoint covers, plus the older single template of every event while it
   * is there. `custom`: its own template; `inherited`: the `source.*` or `*` one; `default`: built in.
   */
  const templateRows = $derived.by(() => {
    const templates = form.templates ?? {};
    const rows = [];

    if (templates[WILDCARD]) rows.push({ key: WILDCARD, state: 'custom' });

    for (const name of coveredEvents(form, catalogue)) {
      const own = templates[name];
      const inherited = templates[`${name.split('.')[0]}.*`] ?? templates[WILDCARD];

      rows.push({ key: name, state: own ? 'custom' : inherited ? 'inherited' : 'default' });
    }

    return rows;
  });
  const templated = $derived(isTemplatedFormat(form.format));
  const unsigned = $derived(isUnsignedFormat(form.format));
  /** The bot token and chat of a Telegram endpoint: the URL is made from them. */
  const telegram = $derived(telegramParts(form.url));

  function setTelegram(change) {
    const next = { ...telegram, ...change };

    form.url = telegramUrl(next.token, next.chat);
  }

  function changeFormat(format) {
    form = withFormat(form, format);
  }
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
    templateEvent = null;
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
    templateEvent = null;
    // The secret must not outlive the dialog: it is shown once.
    secret = '';
  }

  /** The template an event uses now: its own, else the inherited one, else '' (the built-in one). */
  function templateOf(key) {
    const templates = form.templates ?? {};

    if (key === WILDCARD) return templates[WILDCARD] ?? '';

    return templates[key] ?? templates[`${key.split('.')[0]}.*`] ?? templates[WILDCARD] ?? '';
  }

  function openTemplate(key) {
    templateText = templateOf(key);
    templateEvent = key;
  }

  function closeTemplate() {
    templateEvent = null;
  }

  /** Keeps the edited text as the event's own template; the built-in text unchanged keeps none. */
  function applyTemplate() {
    const key = templateEvent;

    if (key === null) return;

    const builtIn = templateInfoFor(templateInfo[key], form.format)?.defaultTemplate ?? null;
    const next = { ...(form.templates ?? {}) };

    if (key !== WILDCARD && (templateText.trim() === '' || templateText === builtIn)) {
      delete next[key];
    } else {
      next[key] = templateText;
    }

    form.templates = next;

    // a fixed template no longer shows the server's complaint
    if ($serverErrors.templates?.[key]) {
      const { [key]: _fixed, ...rest } = $serverErrors.templates;

      controller.serverErrors.set({ ...$serverErrors, templates: rest });
    }

    templateEvent = null;
  }

  function removeTemplate(key) {
    const { [key]: _removed, ...rest } = form.templates ?? {};

    form.templates = rest;
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
