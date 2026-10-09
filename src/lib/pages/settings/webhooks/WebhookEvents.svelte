<div class="vstack gap-2" data-events>
  <div class="form-check form-switch">
    <input
      id="webhookAllEvents"
      class="form-check-input"
      type="checkbox"
      role="switch"
      checked={form.allEvents}
      onchange={(event) => (form = { ...form, allEvents: event.currentTarget.checked })} />
    <label class="form-check-label" for="webhookAllEvents">
      {$_('pages.webhooks.form.all-events')}
    </label>
  </div>

  {#if !form.allEvents}
    {#each catalogue as group (group.source)}
      {@const wildcard = sourceWildcard(group.source)}
      {@const whole = form.events.includes(wildcard)}
      <div class="border rounded p-2" data-event-source={group.source}>
        <div class="form-check">
          <input
            id="webhookSource-{group.source}"
            class="form-check-input"
            type="checkbox"
            checked={whole}
            onchange={(event) =>
              (form = withSource(form, group.source, event.currentTarget.checked))} />
          <label class="form-check-label" for="webhookSource-{group.source}">
            {$_('pages.webhooks.form.source-all', { values: { source: group.title } })}
          </label>
        </div>
        <div class="row row-cols-1 row-cols-md-2 g-1 mt-0 ms-2">
          {#each group.events as event (event.name)}
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
    {/each}

    {#if unlisted.length > 0}
      <div class="border rounded p-2" data-event-unlisted>
        <div class="text-body-secondary mb-1">{$_('pages.webhooks.form.unlisted')}</div>
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
</script>
