<div class="position-relative">
  <input
    {id}
    class="form-control font-monospace"
    class:border-danger={invalid}
    type="text"
    autocomplete="off"
    spellcheck="false"
    {maxlength}
    {placeholder}
    {disabled}
    bind:value
    onfocus={onFocus}
    oninput={onInput}
    onblur={onBlur}
    onkeydown={onKeyDown} />

  {#if open && !disabled && filtered.length > 0}
    <div
      class="list-group position-absolute w-100 shadow-lg"
      role="listbox"
      tabindex="-1"
      onmousedown={(event) => event.preventDefault()}
      style="z-index: 1000; max-height: 280px; overflow: auto; top: calc(100% + 4px);">
      {#each filtered as permission, index (permission.key)}
        <button
          type="button"
          role="option"
          tabindex="-1"
          aria-selected={index === activeIndex}
          class="list-group-item list-group-item-action"
          class:active={index === activeIndex}
          onmouseenter={() => (activeIndex = index)}
          onclick={() => pick(permission.node)}>
          <div class="overflow-hidden vstack gap-1">
            <p class="fw-bold text-truncate mb-0">
              <i class="fa {permission.icon || 'fa-key'} me-2 opacity-75"></i>
              {permission.title}
            </p>
            <div class="text-truncate font-monospace small opacity-75">{permission.node}</div>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<script>
  import { _ } from 'svelte-i18n';

  import ApiUtil from '$lib/api.util.js';

  let {
    id = undefined,
    value = $bindable(''),
    disabled = false,
    invalid = false,
    maxlength = undefined,
    placeholder = '',
  } = $props();

  let registered = $state({});
  let loaded = false;
  let open = $state(false);
  // -1 means "the user has not picked anything yet"; nothing is highlighted and nothing is
  // ever written into the field on its own.
  let activeIndex = $state(-1);
  let blurTimeout;

  const suggestions = $derived(
    Object.entries(registered).flatMap(([scope, permissions]) =>
      (permissions || []).map((permission) => {
        const title =
          scope === 'platform'
            ? $_(`permissions.${permission.key}.title`)
            : $_(`plugins.${scope}.permissions.${permission.key}.title`);

        return {
          key: `${scope}:${permission.node}`,
          node: permission.node || '',
          icon: permission.icon,
          title,
          searchString: `${permission.node} ${permission.key} ${title}`.toLowerCase(),
        };
      }),
    ),
  );

  const query = $derived(
    String(value || '')
      .trim()
      .toLowerCase(),
  );

  const filtered = $derived(
    suggestions
      .filter((suggestion) => !query || suggestion.searchString.includes(query))
      .slice(0, 30),
  );

  function load() {
    if (loaded) {
      return;
    }

    loaded = true;

    ApiUtil.get({
      path: '/api/panel/permission/registered',
      handler: (body) => {
        if (body.result === 'ok') {
          registered = body.data || {};
        }
      },
    });
  }

  function onFocus() {
    load();
    open = true;
  }

  function onInput() {
    activeIndex = -1;
    open = true;
  }

  function onBlur() {
    // The suggestion list lives outside the input, so give the click a chance to land first.
    clearTimeout(blurTimeout);
    blurTimeout = setTimeout(closeSuggestions, 300);
  }

  function closeSuggestions() {
    open = false;
    activeIndex = -1;
  }

  function pick(node) {
    value = node;
    closeSuggestions();
  }

  function onKeyDown(event) {
    if (event.key === 'Tab') {
      // Tab belongs to the form, never to this widget: closing here (instead of waiting for
      // the blur timeout) makes sure the options are gone before focus moves on.
      closeSuggestions();

      return;
    }

    if (!open || filtered.length === 0) {
      if (event.key === 'ArrowDown') {
        open = true;
      }

      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      activeIndex = activeIndex < 0 ? 0 : (activeIndex + 1) % filtered.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      activeIndex =
        activeIndex < 0
          ? filtered.length - 1
          : (activeIndex - 1 + filtered.length) % filtered.length;
    } else if (event.key === 'Enter') {
      const selected = activeIndex < 0 ? undefined : filtered[activeIndex];

      if (selected?.node) {
        event.preventDefault();
        pick(selected.node);
      }
    } else if (event.key === 'Escape') {
      closeSuggestions();
    }
  }
</script>
