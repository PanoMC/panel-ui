<div class="vstack gap-3">
  {#if $error}
    <div class="alert alert-danger d-flex align-items-start mb-0" role="alert" data-mode-error>
      <i class="fa-solid fa-circle-exclamation me-3 mt-1" aria-hidden="true"></i>
      <div>
        <div data-error-code={$error.code}>{$_($error.key, { values: $error.values })}</div>
        {#if $canForce}
          <button
            class="btn alert-btn mt-2"
            type="button"
            disabled={$saving}
            data-force-save
            onclick={() => controller.save({ force: true })}>
            {$_('pages.frontend.mode.save-anyway')}
          </button>
        {/if}
      </div>
    </div>
  {/if}

  {#if $saved.devUrlActive}
    <div class="alert alert-info d-flex align-items-start mb-0" role="alert" data-dev-url-note>
      <i class="fa-solid fa-circle-info me-3 mt-1" aria-hidden="true"></i>
      <div>{$_('pages.frontend.mode.dev-url-active', { values: { url: $saved.devUrl } })}</div>
    </div>
  {/if}

  <div class="card">
    <div class="card-body vstack gap-3">
      <div role="radiogroup" aria-label={$_('pages.frontend.mode.label')}>
        <div class="list-group">
          {#each frontendModeOptions as option (option.value)}
            <button
              type="button"
              role="radio"
              aria-checked={$draft.mode === option.value}
              class="list-group-item list-group-item-action flex-fill text-start"
              class:active={$draft.mode === option.value}
              data-mode={option.value}
              onclick={() => controller.setMode(option.value)}>
              <span class="d-block fw-semibold text-capitalize">
                {$_(option.titleKey)}
              </span>
              <small class="d-block">{$_(option.descriptionKey)}</small>
            </button>
          {/each}
        </div>
      </div>

      {#if $draft.mode === FrontendModes.CUSTOM_APP}
        <div data-section="custom-app">
          {#if $saved.customApps.length === 0}
            <NoContent icon="" text={$_('pages.frontend.custom-apps.empty')} />
          {:else}
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead>
                  <tr>
                    <th class="align-middle text-nowrap" scope="col"></th>
                    <th class="align-middle text-nowrap" scope="col">
                      {$_('pages.frontend.custom-apps.table.name')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {#each $saved.customApps as app (app.id)}
                    <tr class:table-active={$draft.customAppId === app.id} data-app-row={app.id}>
                      <th scope="row" class="align-middle text-center">
                        <div class="dropdown position-static">
                          <button
                            type="button"
                            class="btn btn-link"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            title={$_('pages.frontend.custom-apps.actions')}
                            aria-label={$_('pages.frontend.custom-apps.actions')}>
                            <span class="fas fa-ellipsis-v"></span>
                          </button>
                          <div class="dropdown-menu dropdown-menu-start">
                            <button
                              type="button"
                              class="dropdown-item link-danger"
                              disabled={app.active || $deleting === app.id}
                              data-delete-app={app.id}
                              onclick={() => controller.requestDeleteApp(app)}>
                              <i class="fas fa-trash me-2"></i>
                              {$_('pages.frontend.custom-apps.delete.button')}
                            </button>
                          </div>
                        </div>
                      </th>
                      <td class="align-middle">
                        <div class="form-check">
                          <input
                            class="form-check-input"
                            class:is-invalid={$fieldErrors.customAppId}
                            type="radio"
                            name="customApp"
                            id="customApp-{app.id}"
                            value={app.id}
                            checked={$draft.customAppId === app.id}
                            onchange={() => draft.update((d) => ({ ...d, customAppId: app.id }))} />
                          <label class="form-check-label" for="customApp-{app.id}">
                            {app.title}
                            {#if app.active}
                              <span class="badge text-bg-success ms-2">
                                {$_('pages.frontend.custom-apps.active')}
                              </span>
                            {/if}
                          </label>
                        </div>
                        <small class="d-block text-body-secondary ms-4">
                          {$_('pages.frontend.custom-apps.table.version')}: {app.version}
                          &middot;
                          {$_('pages.frontend.custom-apps.table.author')}: {app.author}
                        </small>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}

          <!-- An uploaded site can run code on the server: only with the add-ons permission. -->
          {#if canUpload}
            <div class="mt-3" data-upload-zone>
              <DragAndDropZone
                class="w-100"
                style="min-height: 10rem;"
                disabled={$uploading}
                icon="fa-solid fa-upload fa-2x"
                title={$_('pages.frontend.custom-apps.upload')}
                accept={['.zip', 'application/zip']}
                on:drop={(event) => controller.upload(event.detail)}
                on:error={(event) => controller.upload(event.detail.file)} />
            </div>
          {/if}
        </div>
      {/if}

      {#if $draft.mode === FrontendModes.EXTERNAL}
        <div class="vstack gap-1" data-section="external">
          <div class="form-floating">
            <input
              id="frontendUpstreamUrl"
              class="form-control font-monospace"
              class:is-invalid={$fieldErrors.upstreamUrl}
              type="url"
              autocomplete="off"
              placeholder="http://127.0.0.1:4000"
              value={$draft.upstreamUrl}
              oninput={(event) => setField('upstreamUrl', event.currentTarget.value)} />
            <label class="text-capitalize" for="frontendUpstreamUrl">
              {$_('pages.frontend.mode.fields.upstream-url')}
            </label>
          </div>
          <div class="form-text">{$_('pages.frontend.mode.fields.upstream-url-hint')}</div>
        </div>
      {/if}

      {#if $draft.mode !== FrontendModes.THEME}
        <div class="vstack gap-1" data-section="site-url">
          <div class="form-floating">
            <input
              id="frontendSiteUrl"
              class="form-control font-monospace"
              class:is-invalid={$fieldErrors.siteUrl}
              type="url"
              autocomplete="off"
              placeholder="https://example.com"
              value={$draft.siteUrl}
              oninput={(event) => setField('siteUrl', event.currentTarget.value)} />
            <label class="text-capitalize" for="frontendSiteUrl">
              {$_('pages.frontend.mode.fields.site-url')}
            </label>
          </div>
          <div class="form-text">{$_('pages.frontend.mode.fields.site-url-hint')}</div>
        </div>
      {/if}

      {#if $draft.mode === FrontendModes.EXTERNAL || $draft.mode === FrontendModes.NONE}
        <div class="vstack gap-1" data-section="descriptor-url">
          <div class="form-floating">
            <input
              id="frontendDescriptorUrl"
              class="form-control font-monospace"
              class:is-invalid={$fieldErrors.descriptorUrl}
              type="url"
              autocomplete="off"
              placeholder=" "
              value={$draft.descriptorUrl}
              oninput={(event) => setField('descriptorUrl', event.currentTarget.value)} />
            <label class="text-capitalize" for="frontendDescriptorUrl">
              {$_('pages.frontend.mode.fields.descriptor-url')}
            </label>
          </div>
          <div class="form-text">{$_('pages.frontend.mode.fields.descriptor-url-hint')}</div>
        </div>
      {/if}
    </div>

    <div class="card-footer">
      <button
        type="button"
        class="btn btn-primary w-100"
        disabled={$saving || !dirty}
        data-save-mode
        onclick={() => controller.save()}>
        {#if $saving}
          <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
        {/if}
        {$_('buttons.save')}
      </button>
    </div>
  </div>
</div>

<script>
  import { _ } from 'svelte-i18n';

  import DragAndDropZone from '$lib/components/DragAndDropZone.svelte';
  import NoContent from '$lib/components/NoContent.svelte';

  import { frontendModeOptions, FrontendModes, isModeDirty } from './frontend.util.js';

  /**
   * The Mode tab: THEME / CUSTOM_APP / EXTERNAL / NONE with the fields of each, the custom-app
   * upload and delete, and the message of the last refused call. All state lives in the controller.
   * `canUpload` shows the custom-app upload (it needs the add-ons permission).
   * @type {{ controller: ReturnType<typeof import('./mode.controller.js').createModeController>, canUpload?: boolean }}
   */
  let { controller, canUpload = true } = $props();

  // The controller is fixed for the life of the page.
  // svelte-ignore state_referenced_locally
  const { saved, draft, saving, uploading, deleting, error, fieldErrors, canForce } = controller;

  const dirty = $derived(isModeDirty($saved, $draft));

  /** @param {'upstreamUrl' | 'siteUrl' | 'descriptorUrl'} name */
  function setField(name, value) {
    draft.update((d) => ({ ...d, [name]: value }));
  }
</script>
