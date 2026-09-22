<style>
  .property-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 0.5rem 1.5rem;
    align-items: center;
    padding: 0.6rem 0;
    border-bottom: 1px solid var(--bs-border-color-translucent);
  }

  .property-row:last-child {
    border-bottom: 0;
  }

  @media (max-width: 767.98px) {
    .property-row {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .property-key {
    font-size: 0.78rem;
  }

  .property-help {
    font-size: 0.8rem;
  }

  .property-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }

  .property-control > .form-control,
  .property-control > .form-select,
  .property-control > .input-group {
    min-width: 0;
  }

  .changed-dot {
    display: inline-block;
    width: 0.45rem;
    height: 0.45rem;
    border-radius: 50%;
    background: var(--bs-warning);
    vertical-align: middle;
  }

  .property-search {
    max-width: 250px;
  }
</style>

<!-- §2.4.30 — every server.properties key, grouped, prefilled from the file on the node. Only
     what the admin changes is sent, and it lands in the file on the next start. -->
<div class="vstack gap-3">
  <div class="card">
    <div class="card-body vstack gap-2">
      <div class="d-flex flex-wrap align-items-center gap-2">
        <div class="me-auto">
          <div class="fw-semibold">{$_('pages.servers.properties.title')}</div>
          <div class="text-body-secondary small">
            {$_('pages.servers.properties.description')}
          </div>
        </div>
        <span class="property-search w-100">
          <SearchInput showSpinner={false} onchange={(value) => (query = value)} />
        </span>
      </div>

      <div class="d-flex flex-wrap align-items-center gap-2 small">
        <span class="badge rounded-pill {fromFile ? 'text-bg-success' : 'text-bg-warning'}">
          <i class="fa-solid {fromFile ? 'fa-file-lines' : 'fa-database'} me-1" aria-hidden="true"
          ></i>
          {$_(
            fromFile
              ? 'pages.servers.properties.source-file'
              : 'pages.servers.properties.source-stored',
          )}
        </span>
        <span class="text-body-secondary">
          <i class="fa-solid fa-circle-info me-1" aria-hidden="true"></i>
          {$_('pages.servers.properties.applies-next-start')}
        </span>
        {#if changedCount}
          <span class="text-warning ms-auto">
            <span class="changed-dot me-1"></span>
            {$_('pages.servers.properties.changed-count', { values: { count: changedCount } })}
          </span>
        {/if}
      </div>
    </div>
  </div>

  {#each visibleGroups as group (group.key)}
    <div class="card">
      <div class="card-header d-flex align-items-center gap-2">
        <i class="{group.icon} text-body-secondary" aria-hidden="true"></i>
        {$_(`pages.servers.properties.groups.${group.key}`)}
      </div>
      <div class="card-body py-1">
        {#each group.keys as key (key)}
          {@const spec = PROPERTY_SPECS[key]}
          {@const id = `prop-${key.replace(/[^a-z0-9]/g, '-')}`}
          <div class="property-row">
            <div class="min-w-0">
              <label class="form-label mb-0 d-flex align-items-center gap-2" for={id}>
                {$_(`pages.servers.properties.keys.${key}.label`)}
                {#if isChanged(key)}
                  <span
                    class="changed-dot"
                    role="img"
                    aria-label={$_('pages.servers.properties.changed')}
                    use:tooltip={[$_('pages.servers.properties.changed'), { placement: 'top' }]}
                  ></span>
                {/if}
              </label>
              <div class="property-key font-monospace text-body-secondary">{key}</div>
              <div class="property-help text-body-secondary">
                {$_(`pages.servers.properties.keys.${key}.help`)}
              </div>
            </div>

            <div class="property-control">
              {#if RESERVED_PROPERTY_KEYS.includes(key)}
                <input
                  {id}
                  type="text"
                  class="form-control font-monospace"
                  readonly
                  value={String($server?.gamePort ?? form[key] ?? '')} />
                <a
                  class="btn btn-sm btn-outline-secondary text-nowrap"
                  href="{base}/servers/{serverId}/settings/startup">
                  {$_('pages.servers.properties.port-managed')}
                </a>
              {:else if spec.type === 'bool'}
                <div class="form-check form-switch m-0">
                  <input
                    {id}
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    checked={form[key] === 'true'}
                    onchange={(event) =>
                      set(key, event.currentTarget.checked ? 'true' : 'false')} />
                </div>
              {:else if spec.type === 'enum'}
                <select
                  {id}
                  class="form-select"
                  value={form[key]}
                  onchange={(event) => set(key, event.currentTarget.value)}>
                  {#if spec.options && !spec.options.includes(form[key])}
                    <!-- A value the catalogue does not list (a fork's own) is kept rather than
                         snapped to the first option. -->
                    <option value={form[key]}>{form[key]}</option>
                  {/if}
                  {#each spec.options || [] as option (option)}
                    <option value={option}>
                      {$_(`pages.servers.properties.options.${key}.${option}`, {
                        default: option,
                      })}
                    </option>
                  {/each}
                </select>
              {:else if spec.type === 'int'}
                <input
                  {id}
                  type="number"
                  class="form-control font-monospace"
                  class:is-invalid={!isPropertyValueValid(key, form[key] ?? '')}
                  min={spec.min}
                  max={spec.max}
                  step="1"
                  value={form[key]}
                  oninput={(event) => set(key, event.currentTarget.value)} />
              {:else if spec.type === 'secret'}
                <div class="input-group">
                  <input
                    {id}
                    type={revealed.has(key) ? 'text' : 'password'}
                    class="form-control font-monospace"
                    autocomplete="off"
                    value={form[key]}
                    oninput={(event) => set(key, event.currentTarget.value)} />
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    aria-label={$_('pages.servers.properties.reveal')}
                    onclick={() => toggleReveal(key)}>
                    <i
                      class="fa-regular {revealed.has(key) ? 'fa-eye-slash' : 'fa-eye'}"
                      aria-hidden="true"></i>
                  </button>
                </div>
              {:else}
                <input
                  {id}
                  type="text"
                  class="form-control"
                  class:font-monospace={key !== 'motd'}
                  value={form[key]}
                  oninput={(event) => set(key, event.currentTarget.value)} />
              {/if}

              {#if !RESERVED_PROPERTY_KEYS.includes(key) && form[key] !== spec.def}
                <button
                  type="button"
                  class="btn btn-sm btn-link text-body-secondary p-1 flex-shrink-0"
                  aria-label={$_('pages.servers.properties.reset')}
                  use:tooltip={[
                    $_('pages.servers.properties.reset-to', {
                      values: { value: spec.def || '""' },
                    }),
                    { placement: 'top' },
                  ]}
                  onclick={() => set(key, spec.def)}>
                  <i class="fa-solid fa-rotate-left" aria-hidden="true"></i>
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/each}

  {#if !query.trim() || visibleOtherKeys.length}
    <!-- Keys the catalogue does not know: a fork's own, or ones a newer server added. Plain
         text, kept as they are. -->
    <div class="card">
      <div class="card-header d-flex align-items-center gap-2">
        <i class="fa-solid fa-ellipsis text-body-secondary" aria-hidden="true"></i>
        {$_('pages.servers.properties.other-title')}
      </div>
      <div class="card-body py-1">
        <p class="text-body-secondary small my-2">
          {$_('pages.servers.properties.other-description')}
        </p>

        {#each visibleOtherKeys as key (key)}
          <div class="property-row">
            <div class="min-w-0">
              <label class="form-label mb-0 d-flex align-items-center gap-2" for="prop-other-{key}">
                <span class="font-monospace">{key}</span>
                {#if isChanged(key)}
                  <span
                    class="changed-dot"
                    role="img"
                    aria-label={$_('pages.servers.properties.changed')}></span>
                {/if}
              </label>
            </div>
            <div class="property-control">
              <input
                id="prop-other-{key}"
                type="text"
                class="form-control font-monospace"
                value={form[key]}
                oninput={(event) => set(key, event.currentTarget.value)} />
            </div>
          </div>
        {/each}

        {#if !query.trim()}
          <form
            class="property-row"
            onsubmit={(event) => {
              event.preventDefault();
              addKey();
            }}>
            <div class="property-control">
              <input
                type="text"
                class="form-control font-monospace"
                class:is-invalid={newKey !== '' && !isPropertyKeyWritable(newKey)}
                placeholder={$_('pages.servers.properties.add-key-placeholder')}
                aria-label={$_('pages.servers.properties.add-key')}
                bind:value={newKey} />
            </div>
            <div class="property-control">
              <input
                type="text"
                class="form-control font-monospace"
                placeholder={$_('pages.servers.properties.add-value-placeholder')}
                aria-label={$_('pages.servers.properties.add-value-placeholder')}
                bind:value={newValue} />
              <button
                type="submit"
                class="btn btn-outline-secondary text-nowrap"
                disabled={!isPropertyKeyWritable(newKey) || newKey in form}>
                <i class="fa-solid fa-plus me-1" aria-hidden="true"></i>
                {$_('pages.servers.properties.add-key')}
              </button>
            </div>
          </form>
        {/if}
      </div>
    </div>
  {/if}

  {#if query.trim() && !visibleGroups.length && !visibleOtherKeys.length}
    <div class="card">
      <div class="card-body">
        <NoContent
          icon="fa-solid fa-magnifying-glass fa-3x"
          text={$_('pages.servers.properties.no-matches')} />
      </div>
    </div>
  {/if}

  <div class="d-flex flex-wrap align-items-center gap-2">
    <button
      type="button"
      class="btn btn-secondary"
      disabled={saving || !changedCount || !valid}
      onclick={() => void save()}>
      {#if saving}
        <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
      {/if}
      {$_('buttons.save')}
    </button>
    {#if changedCount}
      <button type="button" class="btn btn-link" disabled={saving} onclick={discard}>
        {$_('pages.servers.properties.discard')}
      </button>
    {/if}
  </div>
</div>

<script context="module">
  import { redirect } from '@sveltejs/kit';

  import { base } from '$app/paths';

  import ApiUtil from '$lib/api.util.js';
  import { hasPermission, Permissions } from '$lib/auth.util.js';
  import { isManaged } from '$lib/servers.util.js';

  /**
   * The page belongs to a server Pano runs — a linked server's file is not Pano's to write — and
   * takes the startup permission, the same one the port and the heap take.
   *
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    const { parent, params } = event;
    const { server, user } = await parent();

    if (!isManaged(server) || !hasPermission(Permissions.MANAGE_SERVER_STARTUP, user)) {
      throw redirect(302, `${base}/servers/${params.id}/settings`);
    }

    // The file as it is on the node right now, and what Pano stores as a fallback. A backend or
    // a node that cannot answer leaves `file` null and the page says it is showing stored values.
    const properties = await ApiUtil.get({
      path: `/api/panel/servers/${params.id}/startup/properties`,
      request: event,
      handler: (response) => response,
    });

    return {
      serverId: Number(params.id),
      properties:
        properties && typeof properties === 'object' && !properties.error ? properties : null,
    };
  }
</script>

<script>
  import { getContext } from 'svelte';
  import { _ } from 'svelte-i18n';

  import tooltip from '$lib/tooltip.util';
  import { isEndpointUnavailable, showServerActionError } from '$lib/servers.util.js';
  import {
    PROPERTY_GROUPS,
    PROPERTY_SPECS,
    RESERVED_PROPERTY_KEYS,
    changedProperties,
    initialPropertyValues,
    isPropertyKeyWritable,
    isPropertyValueValid,
    otherPropertyKeys,
  } from '$lib/serverProperties.util.js';

  import NoContent from '$lib/components/NoContent.svelte';
  import SearchInput from '$lib/components/SearchInput.svelte';
  import { showError, showSuccess } from '$lib/components/ToastContainer.svelte';

  let { data } = $props();

  const server = getContext('server');

  const serverId = $derived(data?.serverId ?? $server?.id);
  const fromFile = $derived(!!data?.properties?.file);

  /** What the form started from, so a save only carries what changed. */
  let initial = $state(initialPropertyValues(data?.properties?.stored, data?.properties?.file));
  /** @type {Record<string, string>} */
  let form = $state({ ...initial });
  let query = $state('');
  let saving = $state(false);
  let newKey = $state('');
  let newValue = $state('');
  /** Secrets shown in clear, per key. */
  let revealed = $state(new Set());

  const changed = $derived(changedProperties(initial, form));
  const changedCount = $derived(Object.keys(changed).length);
  const valid = $derived(
    Object.entries(form).every(([key, value]) => isPropertyValueValid(key, value ?? '')),
  );
  const needle = $derived(query.trim().toLowerCase());

  /**
   * The groups with only the rows the search matches — the key itself, or its label.
   */
  const visibleGroups = $derived(
    PROPERTY_GROUPS.map((group) => ({
      ...group,
      keys: group.keys.filter((key) => matches(key)),
    })).filter((group) => group.keys.length),
  );
  const visibleOtherKeys = $derived(otherPropertyKeys(form).filter((key) => matches(key)));

  /**
   * @param {string} key
   */
  function matches(key) {
    if (!needle) {
      return true;
    }

    if (key.toLowerCase().includes(needle)) {
      return true;
    }

    const label = key in PROPERTY_SPECS ? $_(`pages.servers.properties.keys.${key}.label`) : '';

    return label.toLowerCase().includes(needle);
  }

  /**
   * @param {string} key
   */
  function isChanged(key) {
    return key in changed;
  }

  /**
   * @param {string} key
   * @param {string} value
   */
  function set(key, value) {
    form[key] = value;
  }

  /**
   * @param {string} key
   */
  function toggleReveal(key) {
    const next = new Set(revealed);

    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }

    revealed = next;
  }

  function addKey() {
    const key = newKey.trim();

    if (!isPropertyKeyWritable(key) || key in form) {
      return;
    }

    form[key] = newValue;
    newKey = '';
    newValue = '';
  }

  function discard() {
    form = { ...initial };
  }

  async function save() {
    if (saving || !changedCount || !valid || serverId == null) {
      return;
    }

    saving = true;

    const properties = { ...changed };

    try {
      const body = await ApiUtil.put({
        path: `/api/panel/servers/${serverId}/startup`,
        body: { properties },
        handler: (response) => response,
      });

      // `undefined`/`null` is the network-error path — ApiUtil already raised the splash.
      if (body === undefined || body === null) {
        return;
      }

      if (isEndpointUnavailable(body)) {
        await showError('pages.servers.startup.unavailable');

        return;
      }

      if (body.error) {
        await showServerActionError(body.error);

        return;
      }

      initial = { ...form };

      server.update((current) => ({
        ...current,
        properties: { ...(current?.properties || {}), ...properties },
      }));

      await showSuccess('pages.servers.properties.saved');
    } finally {
      saving = false;
    }
  }
</script>
