<style>
  /* An icon button: no caret, although it is a dropdown-toggle for the input-group's corners. */
  .translations-toggle::after {
    display: none;
  }

  .translations-popover {
    width: min(22rem, calc(100vw - 2rem));
    /* above the modal and its backdrop; placed by `float` next to the button */
    position: fixed;
    z-index: 1090;
    margin: 0;
  }

  .translations-popover-list {
    max-height: min(50vh, 24rem);
    overflow-y: auto;
  }
</style>

<!-- The translations of one admin-written text: a globe button with the number of filled languages,
     opening a popover with one input per language except the platform's own (its text is the default,
     typed in the normal input). Placed in an `input-group` next to that input (the button is a
     `dropdown-toggle` and the popover a `dropdown-menu`, so Bootstrap keeps the group's corners right),
     or on its own with `group={false}` (next to a label, for a large editor). Edits `i18n[code][prop]`;
     a blank text means "use the default". -->
<svelte:window onpointerdown={onWindowPointerDown} onkeydown={onWindowKeydown} />

{#if group}
  {@render toggle()}
{:else}
  <span class="d-inline-block">
    {@render toggle()}
  </span>
{/if}

<!-- the popover is moved out of the modal body by `float`, so it never makes the modal scroll -->
{#if open}
  {@render popover()}
{/if}

{#snippet toggle()}
  <button
    bind:this={button}
    type="button"
    class="btn dropdown-toggle translations-toggle {btnClass}"
    class:btn-outline-secondary={!invalid}
    class:btn-outline-danger={invalid}
    title={$_('components.translations-button.title')}
    aria-label={$_('components.translations-button.title')}
    aria-expanded={open}
    aria-haspopup="true"
    {disabled}
    onclick={toggleOpen}>
    <i class="fa-solid fa-language" aria-hidden="true"></i>
    {#if count > 0}
      <span
        class="badge rounded-pill ms-1"
        class:text-bg-primary={!invalid}
        class:text-bg-danger={invalid}>{count}</span>
    {/if}
  </button>
{/snippet}

{#snippet popover()}
  <div
    bind:this={menu}
    use:float={button}
    class="dropdown-menu show p-3 translations-popover"
    role="dialog"
    aria-label={$_('components.translations-button.title')}>
    <div class="small text-body-secondary mb-2">{$_('components.translations-button.hint')}</div>
    {#if locales === null}
      <div class="small text-body-secondary">
        <i class="fas fa-circle-notch fa-spin me-1" aria-hidden="true"></i>
        {$_('components.translations-button.loading')}
      </div>
    {:else if others.length === 0}
      <div class="small text-body-secondary">{$_('components.translations-button.no-locales')}</div>
    {:else}
      <div class="vstack gap-2 translations-popover-list">
        {#each others as locale, index (locale.code)}
          {@const id = `${uid}-${index}`}
          {@const error = errorOf(locale.code)}
          <div>
            <label class="form-label small mb-1" for={id}>
              {locale.name}
              <span class="text-body-secondary font-monospace ms-1">{locale.code}</span>
            </label>
            {#if multiline}
              <textarea
                class="form-control form-control-sm"
                class:is-invalid={error}
                {id}
                rows="4"
                maxlength={maxlength ?? undefined}
                placeholder={defaultText}
                value={textOf(locale.code)}
                oninput={(event) => setText(locale.code, event.currentTarget.value)}></textarea>
            {:else}
              <input
                class="form-control form-control-sm"
                class:is-invalid={error}
                {id}
                type="text"
                maxlength={maxlength ?? undefined}
                placeholder={defaultText}
                value={textOf(locale.code)}
                oninput={(event) => setText(locale.code, event.currentTarget.value)} />
            {/if}
            {#if error}
              <div class="invalid-feedback">
                {$_('components.translations-button.errors.' + error, { default: error })}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/snippet}

<script module>
  import { get } from 'svelte/store';

  import ApiUtil, { buildQueryParams } from '$lib/api.util.js';
  import { Languages } from '$lib/language.util.js';

  /** @type {Promise<{ code: string, name: string }[]> | null} the panel's languages, once a session */
  let localesPromise = null;

  /**
   * The languages content can be translated into. `GET /panel/locales` needs the translations
   * permission; without it the site's enabled languages (loaded at start) are offered instead.
   */
  export function loadContentLocales() {
    if (localesPromise) return localesPromise;

    const fallback = () =>
      Object.values(get(Languages) ?? {}).map((item) => ({ code: item.code, name: item.name }));

    localesPromise = ApiUtil.get({
      path: '/panel/locales' + buildQueryParams({ pageSize: 100 }),
    })
      .then((body) =>
        Array.isArray(body?.items) && !body.error
          ? body.items.map((item) => ({ code: item.code, name: item.name }))
          : fallback(),
      )
      .catch(() => fallback());

    return localesPromise;
  }

  let instances = 0;
</script>

<script>
  import { getContext, tick } from 'svelte';
  import { _ } from 'svelte-i18n';

  import { countTranslations } from '$lib/contentI18n.util.js';

  /**
   * @type {{
   *   i18n?: Record<string, Record<string, any>>,
   *   prop: string,
   *   defaultText?: string,
   *   multiline?: boolean,
   *   maxlength?: number | null,
   *   errors?: Record<string, string>,
   *   errorKey?: (code: string) => string,
   *   group?: boolean,
   *   btnClass?: string,
   *   disabled?: boolean,
   * }}
   */
  let {
    /** locale code → { prop: text }; replaced (not mutated) on every change. */
    i18n = $bindable(),
    /** The prop of `i18n[code]` this button edits, e.g. `title`. */
    prop,
    /** The default text, shown as the placeholder of every language's input. */
    defaultText = '',
    /** A textarea per language instead of a one-line input. */
    multiline = false,
    maxlength = null,
    /** Server errors (`error.fields`); [errorKey] names the key of a language's error. */
    errors = {},
    errorKey = undefined,
    /** False: not inside an input-group, the popover gets its own positioned wrapper. */
    group = true,
    btnClass = '',
    disabled = false,
  } = $props();

  const uid = `translations-${++instances}`;
  const siteInfo = getContext('siteInfo');

  let open = $state(false);
  /** @type {{ code: string, name: string }[] | null} */
  let locales = $state(null);
  /** @type {HTMLButtonElement | undefined} */
  let button = $state();
  /** @type {HTMLElement | undefined} */
  let menu = $state();

  let platformLocale = $derived($siteInfo?.platformLocale);
  let others = $derived((locales ?? []).filter((locale) => locale.code !== platformLocale));
  let count = $derived(countTranslations(i18n, prop, undefined, platformLocale));
  let invalid = $derived(
    !!errorKey && (locales ?? []).some((locale) => !!errors?.[errorKey(locale.code)]),
  );

  // Errors may name a language before the list is loaded: load it so the button can show them.
  $effect(() => {
    if (errorKey && Object.keys(errors ?? {}).length > 0 && locales === null) void ensureLocales();
  });

  async function ensureLocales() {
    if (locales !== null) return;

    locales = await loadContentLocales();
  }

  function textOf(code) {
    return i18n?.[code]?.[prop] ?? '';
  }

  function errorOf(code) {
    return errorKey ? errors?.[errorKey(code)] : undefined;
  }

  function setText(code, text) {
    i18n = { ...(i18n ?? {}), [code]: { ...(i18n?.[code] ?? {}), [prop]: text } };
  }

  async function toggleOpen() {
    open = !open;

    if (!open) return;

    await ensureLocales();
    await tick();
    menu?.querySelector('input, textarea')?.focus();
  }

  const GAP = 4;
  const EDGE = 8;

  /**
   * Moves the popover out of the scrolling modal body and pins it next to [anchor] with fixed
   * coordinates: below and right-aligned, above when there is no room below, kept on screen. It goes
   * to the top of the surrounding `.modal` (not to `body`), so Bootstrap's focus trap keeps letting
   * its inputs take the focus; without a modal it goes to `body`.
   *
   * @param {HTMLElement} node
   * @param {HTMLElement | undefined} anchor
   */
  function float(node, anchor) {
    const host = anchor?.closest('.modal') ?? document.body;

    host.appendChild(node);

    function place() {
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const width = node.offsetWidth;
      const height = node.offsetHeight;
      const below = window.innerHeight - rect.bottom - GAP - EDGE;
      const top =
        below >= height || rect.top < height ? rect.bottom + GAP : rect.top - GAP - height;
      const left = Math.min(Math.max(EDGE, rect.right - width), window.innerWidth - width - EDGE);

      node.style.top = `${Math.max(EDGE, top)}px`;
      node.style.left = `${Math.max(EDGE, left)}px`;
    }

    place();

    // follow the button when the modal body scrolls or the window changes size
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);

    const observer = new ResizeObserver(place);

    observer.observe(node);

    return {
      destroy() {
        window.removeEventListener('scroll', place, true);
        window.removeEventListener('resize', place);
        observer.disconnect();
        node.remove();
      },
    };
  }

  /** @param {PointerEvent} event */
  function onWindowPointerDown(event) {
    const target = /** @type {Node} */ (event.target);

    if (open && !button?.contains(target) && !menu?.contains(target)) open = false;
  }

  /** @param {KeyboardEvent} event */
  function onWindowKeydown(event) {
    if (open && event.key === 'Escape') {
      event.stopPropagation();
      open = false;
      button?.focus();
    }
  }
</script>
