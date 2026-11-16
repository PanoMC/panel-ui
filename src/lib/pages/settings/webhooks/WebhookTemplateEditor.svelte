<!-- The message of one event in one format: a visual editor or the JSON text, the tokens, and a live preview. -->
<div class="row g-3" data-template-editor={event}>
  <div class="col-12 col-xl-7">
    <div class="card h-100" bind:this={editorElement} onfocusin={rememberFocus}>
      <div class="card-header d-flex flex-wrap align-items-center gap-2">
        <ul
          class="nav nav-pills gap-1 flex-grow-1"
          role="tablist"
          aria-label={$_('pages.webhooks.template.mode')}>
          {#each ['visual', 'json'] as item (item)}
            <li class="nav-item" role="presentation">
              <button
                type="button"
                class="nav-link text-capitalize"
                class:active={mode === item}
                role="tab"
                aria-selected={mode === item}
                data-template-mode={item}
                onclick={() => switchMode(item)}>
                {$_(`pages.webhooks.template.${item}`)}
              </button>
            </li>
          {/each}
        </ul>
        <button
          class="btn btn-link"
          type="button"
          data-template-reset
          title={$_('pages.webhooks.template.reset')}
          aria-label={$_('pages.webhooks.template.reset')}
          disabled={!info?.defaultTemplate}
          onclick={reset}>
          <i class="fa-solid fa-rotate-left" aria-hidden="true"></i>
        </button>
        {#if tokens.length > 0}
          <div class="dropdown" data-template-tokens>
            <button
              class="btn btn-link text-decoration-none text-capitalize"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false">
              {$_('pages.webhooks.template.insert')}
            </button>
            <div class="dropdown-menu dropdown-menu-end" style="max-height: 360px; overflow-y: auto;">
              <h6 class="dropdown-header text-capitalize">
                {$_('pages.webhooks.template.tokens')}
              </h6>
              {#each tokens as token (token.name)}
                <button
                  class="dropdown-item"
                  type="button"
                  title={token.sample}
                  onmousedown={(event) => event.preventDefault()}
                  onclick={() => insertToken(token.name)}>
                  <code>{`{${token.name}}`}</code>
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <div class="card-body vstack gap-3">
        <code>{event}</code>

        {#if visualRefused}
          <div
            class="alert alert-warning d-flex align-items-start mb-0"
            role="alert"
            data-visual-refused>
            <i class="fa-solid fa-triangle-exclamation me-3 mt-1" aria-hidden="true"></i>
            <div>{$_('pages.webhooks.template.visual-unavailable')}</div>
          </div>
        {/if}

        {#if mode === 'visual' && model}
          <adapter.Visual bind:model />
        {:else}
          <textarea
            class="form-control font-monospace"
            class:is-invalid={error}
            rows="16"
            spellcheck="false"
            data-field="template"
            aria-label={$_('pages.webhooks.form.template')}
            placeholder={$_('pages.webhooks.form.template')}
            bind:value={text}></textarea>
        {/if}

        {#if error}
          <div class="invalid-feedback d-block" data-problem={error}>
            {$_(fieldErrorKey(error))}
          </div>
        {/if}
      </div>
    </div>
  </div>

  <div class="col-12 col-xl-5">
    <div class="h-100">
      <adapter.Preview body={preview} name={webhookName} loading={previewing} />
      {#if warning}
        <div
          class="alert alert-warning d-flex align-items-start mt-2 mb-0"
          role="alert"
          data-preview-warning>
          <i class="fa-solid fa-triangle-exclamation me-3 mt-1" aria-hidden="true"></i>
          <div>{$_('pages.webhooks.template.preview-fallback')}</div>
        </div>
      {/if}
    </div>
  </div>
</div>

<script>
  import { untrack } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { insertAtCaret } from './discord.util.js';
  import { adapterOf } from './formats/index.js';
  import { fieldErrorKey } from './webhooks.util.js';

  /**
   * @type {{
   *   event: string,
   *   format: string,
   *   info?: import('./discord.util.js').TemplateInfo | null,
   *   text?: string,
   *   error?: string,
   *   webhookName?: string,
   *   previewTemplate: (event: string, template: string, format: string) => Promise<{ ok: boolean, body: any }>,
   * }}
   */
  let {
    event,
    format,
    info = null,
    text = $bindable(''),
    error = '',
    webhookName = '',
    previewTemplate,
  } = $props();

  const PREVIEW_DELAY_MS = 350;

  // The format is fixed for the life of the editor (the dialog makes a new one per event).
  // svelte-ignore state_referenced_locally
  const adapter = adapterOf(format);

  // The editor opens with the stored template, else the built-in one, else an empty message.
  // svelte-ignore state_referenced_locally
  if (!text) text = info?.defaultTemplate ?? adapter.modelToTemplate(adapter.blankModel());

  // svelte-ignore state_referenced_locally
  let model = $state(adapter.parseModel(text));
  // svelte-ignore state_referenced_locally
  let mode = $state(model ? 'visual' : 'json');
  let visualRefused = $state(false);
  let preview = $state(null);
  let warning = $state('');
  let previewing = $state(false);
  let editorElement = $state();
  /** The input the caret was in last: a token goes there. */
  let lastFocused = null;

  const tokens = $derived(info?.tokens ?? []);

  // The visual model is the source while it is shown.
  $effect(() => {
    if (mode !== 'visual' || !model) return;

    const next = adapter.modelToTemplate(model);

    untrack(() => {
      if (next !== text) text = next;
    });
  });

  // A debounced preview of whatever the text is now.
  $effect(() => {
    const template = text;
    const name = event;
    const kind = format;
    let cancelled = false;

    previewing = true;

    const timer = setTimeout(async () => {
      const result = await previewTemplate(name, template, kind);

      if (cancelled) return;

      previewing = false;
      preview = result.ok ? (result.body?.body ?? null) : null;
      warning = result.ok ? (result.body?.warning ?? '') : '';
    }, PREVIEW_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  });

  function switchMode(next) {
    visualRefused = false;

    if (next === 'visual') {
      const parsed = adapter.parseModel(text);

      if (!parsed) {
        visualRefused = true;
        mode = 'json';

        return;
      }

      model = parsed;
    }

    mode = next;
  }

  function rememberFocus(focusEvent) {
    const target = focusEvent.target;

    if (target instanceof HTMLInputElement && target.type === 'text') lastFocused = target;
    if (target instanceof HTMLTextAreaElement) lastFocused = target;
  }

  function insertToken(name) {
    const target =
      lastFocused && editorElement?.contains(lastFocused)
        ? lastFocused
        : editorElement?.querySelector('textarea, input[type="text"]');

    insertAtCaret(target, `{${name}}`);
  }

  function reset() {
    if (!info?.defaultTemplate) return;

    text = info.defaultTemplate;
    visualRefused = false;

    const parsed = adapter.parseModel(text);

    model = parsed;
    mode = parsed ? 'visual' : 'json';
  }
</script>
