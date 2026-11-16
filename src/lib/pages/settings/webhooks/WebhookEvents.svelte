<div class="vstack gap-2" data-events>
  <div class="form-check form-switch">
    <input
      id="webhookAllEvents"
      class="form-check-input"
      type="checkbox"
      role="switch"
      checked={form.allEvents}
      onchange={(event) => (form = { ...form, allEvents: event.currentTarget.checked })} />
    <label class="form-check-label text-capitalize" for="webhookAllEvents">
      {$_('pages.webhooks.form.all-events')}
    </label>
  </div>

  {#if !form.allEvents}
    {#if catalogue.length > 0 || unlisted.length > 0}
      <ul class="nav nav-pills gap-1" role="tablist">
        {#each catalogue as group (group.source)}
          <li class="nav-item" role="presentation">
            <button
              class="nav-link"
              class:active={current?.source === group.source}
              type="button"
              role="tab"
              aria-selected={current?.source === group.source}
              data-event-tab={group.source}
              onclick={() => (tab = group.source)}>
              {group.title}
            </button>
          </li>
        {/each}
        {#if unlisted.length > 0}
          <li class="nav-item" role="presentation">
            <button
              class="nav-link"
              class:active={current === null}
              type="button"
              role="tab"
              aria-selected={current === null}
              data-event-tab="unlisted"
              onclick={() => (tab = UNLISTED)}>
              {$_('pages.webhooks.form.unlisted-tab')}
            </button>
          </li>
        {/if}
      </ul>
    {/if}

    {#if current}
      {@const wildcard = sourceWildcard(current.source)}
      {@const whole = form.events.includes(wildcard)}
      <div data-event-source={current.source}>
        <div class="form-check">
          <input
            id="webhookSource-{current.source}"
            class="form-check-input"
            type="checkbox"
            checked={whole}
            onchange={(event) =>
              (form = withSource(form, current.source, event.currentTarget.checked))} />
          <label class="form-check-label text-capitalize" for="webhookSource-{current.source}">
            {$_('pages.webhooks.form.source-all', { values: { source: current.title } })}
          </label>
        </div>
        <div class="row row-cols-1 g-1 mt-0 ms-2">
          {#each current.events as event (event.name)}
            <div class="col">
              <div class="form-check">
                <input
                  id="webhookEvent-{event.name}"
                  class="form-check-input"
                  type="checkbox"
                  disabled={whole}
                  checked={whole || form.events.includes(event.name)}
                  onchange={(e) => (form = withEvent(form, event.name, e.currentTarget.checked))} />
                <label class="form-check-label" for="webhookEvent-{event.name}">
                  <span class="font-monospace">{event.name}</span>
                </label>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else if unlisted.length > 0}
      <div data-event-unlisted>
        <div class="mb-1">
          {$_('pages.webhooks.form.unlisted')}
        </div>
        {#each unlisted as name (name)}
          <div class="form-check">
            <input
              id="webhookEvent-{name}"
              class="form-check-input"
              type="checkbox"
              checked={form.events.includes(name)}
              onchange={(e) => (form = withEvent(form, name, e.currentTarget.checked))} />
            <label class="form-check-label" for="webhookEvent-{name}">
              <span class="font-monospace">{name}</span>
            </label>
          </div>
        {/each}
      </div>
    {/if}
  {/if}

  {#if error}
    <div class="invalid-feedback d-block">{$_(fieldErrorKey(error))}</div>
  {/if}
</div>

<script>
  import { _ } from 'svelte-i18n';

  import {
    fieldErrorKey,
    sourceWildcard,
    unlistedEvents,
    withEvent,
    withSource,
  } from './webhooks.util.js';

  /**
   * The event picker of the endpoint form: all events, a whole source (`core.*`) or single events.
   * Subscribed names the catalogue no longer lists (a stopped plugin) stay visible so they can be
   * removed.
   * @type {{ form: any, catalogue: import('./webhooks.util.js').EventSource[], error?: string, initialEvents?: string[] }}
   */
  let { form = $bindable(), catalogue, error = '', initialEvents = [] } = $props();

  // Computed from the events the form was opened with, so unchecking an unlisted name does not
  // make it vanish before the person has saved.
  const unlisted = $derived(unlistedEvents([...initialEvents, ...form.events], catalogue));

  const UNLISTED = '\u0000unlisted';
  let tab = $state('');
  // null selects the "unlisted" tab; otherwise the chosen source, falling back to the first one.
  const current = $derived(
    tab === UNLISTED && unlisted.length > 0
      ? null
      : (catalogue.find((group) => group.source === tab) ?? catalogue[0] ?? null),
  );
</script>
