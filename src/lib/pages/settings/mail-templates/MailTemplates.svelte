<div class="vstack gap-3">
  {#if !data.list}
    <div class="alert alert-danger d-flex align-items-center mb-0" role="alert">
      <i class="fa-solid fa-circle-exclamation me-3" aria-hidden="true"></i>
      <div class="flex-grow-1">{$_('pages.mail-templates.load-failed')}</div>
      <button
        type="button"
        title={$_('buttons.try-again')}
        aria-label={$_('buttons.try-again')}
        class="btn alert-btn ms-3"
        onclick={() => invalidateAll()}>
        <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>
      </button>
    </div>
  {:else}
    <PageActions>
      <div slot="middle" style="width: 250px;">
        <SearchInput autofocus showSpinner={false} onchange={(value) => (search = value)} />
      </div>
    </PageActions>

    <!-- The frames the mails are wrapped in: Pano's main one, plugins' and the admin's own. -->
    <div class="card">
      <CardHeader>
        <div slot="left">
          {$_('pages.mail-templates.layouts.title', { values: { count: layouts.length } })}
        </div>
        <div slot="right">
          <button type="button" class="btn btn-sm btn-link" onclick={() => newLayoutModal?.show()}>
            <i class="fas fa-plus me-2" aria-hidden="true"></i>
            {$_('pages.mail-templates.layouts.new')}
          </button>
        </div>
      </CardHeader>
      {#if layouts.length === 0}
        <NoContent icon="" />
      {:else}
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead>
              <tr>
                <th class="align-middle text-nowrap" scope="col">
                  {$_('pages.mail-templates.layouts.table.name')}
                </th>
                <th class="align-middle text-nowrap" scope="col">
                  {$_('pages.mail-templates.layouts.table.source')}
                </th>
                <th class="align-middle text-nowrap" scope="col">
                  {$_('pages.mail-templates.layouts.table.used-by')}
                </th>
              </tr>
            </thead>
            <tbody>
              {#each layouts as layout (layout.id)}
                {@const href = layoutEditHref(base, layout.id)}
                <tr use:rowLink={href}>
                  <td class="align-middle">
                    <a class="text-reset text-decoration-none" {href}>{layout.name || layout.id}</a>
                    {#if layout.customized}
                      <span class="badge text-bg-primary ms-1">
                        {$_('pages.mail-templates.customized')}
                      </span>
                    {/if}
                  </td>
                  <td class="align-middle text-nowrap">{sourceName(layout)}</td>
                  <td class="align-middle text-nowrap">
                    {$_('pages.mail-templates.layouts.used-by', {
                      values: { count: (layout.usedBy ?? []).length },
                    })}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>

    <NewMailLayoutModal
      bind:this={newLayoutModal}
      {layouts}
      oncreated={(layout) => goto(layoutEditHref(base, layout.id))} />

    {#each groups as group (group.owner)}
      <div class="card">
        <CardHeader>
          <div slot="left">
            {$_('pages.mail-templates.group-title', {
              values: {
                name: group.pluginName ?? $_('pages.mail-templates.core'),
                count: group.items.length,
              },
            })}
          </div>
        </CardHeader>
        {#if group.items.length === 0}
          <NoContent icon="" />
        {:else}
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead>
                <tr>
                  <th class="align-middle text-nowrap" scope="col">
                    {$_('pages.mail-templates.table.mail')}
                  </th>
                  <th class="align-middle text-nowrap" scope="col">
                    {$_('pages.mail-templates.table.variants')}
                  </th>
                  <th class="align-middle text-nowrap" scope="col">
                    {$_('pages.mail-templates.table.customized-languages')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {#each group.items as mail (mail.key)}
                  {@const href = editHref(mail)}
                  {@const customized = customizedLocalesOf(mail)}
                  <tr use:rowLink={href}>
                    <td class="align-middle">
                      <a class="text-reset text-decoration-none" {href}>{mail.name || mail.key}</a>
                      {#if mail.description}
                        <div class="small text-body-secondary">{mail.description}</div>
                      {/if}
                    </td>
                    <td class="align-middle text-nowrap">
                      {(mail.variants ?? []).length}
                    </td>
                    <td class="align-middle">
                      {#if customized.length === 0}
                        <span class="text-body-secondary">—</span>
                      {:else}
                        <div class="d-flex flex-wrap gap-1">
                          {#each customized as code (code)}
                            <span class="badge text-bg-primary">{localeName(code)}</span>
                          {/each}
                        </div>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    {:else}
      <div class="card">
        <NoContent icon="" />
      </div>
    {/each}
  {/if}
</div>

<script module>
  import ApiUtil from '$lib/api.util';

  import { createMailTemplatesApi } from './mail-templates.api.js';

  /**
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    await event.parent();

    const result = await createMailTemplatesApi(ApiUtil, event).list();

    return { list: result.ok ? result.body : null };
  }
</script>

<script>
  import { _ } from 'svelte-i18n';

  import { goto, invalidateAll } from '$app/navigation';
  import { base } from '@panomc/sdk/core/js/basePath.js';

  import CardHeader from '$lib/components/CardHeader.svelte';
  import NoContent from '$lib/components/NoContent.svelte';
  import PageActions from '$lib/components/PageActions.svelte';
  import SearchInput from '$lib/components/SearchInput.svelte';
  import { rowLink } from '$lib/rowLink.util.js';

  import {
    customizedLocalesOf,
    groupByOwner,
    layoutEditHref,
    layoutSource,
  } from './mail-templates.api.js';
  import NewMailLayoutModal from './NewMailLayoutModal.svelte';

  let { data } = $props();

  let search = $state('');
  /** @type {any} */
  let newLayoutModal = $state();

  const layouts = $derived(data.list?.layouts ?? []);

  const localeNames = $derived(
    Object.fromEntries(
      (data.list?.locales ?? []).map((item) => [item.code, item.name || item.code]),
    ),
  );

  const groups = $derived.by(() => {
    const query = search.trim().toLowerCase();
    const items = (data.list?.items ?? []).filter(
      (mail) =>
        !query ||
        [mail.key, mail.name, mail.description, mail.pluginName]
          .filter(Boolean)
          .some((text) => String(text).toLowerCase().includes(query)),
    );

    return groupByOwner(items);
  });

  /** @param {{ owner: string, pluginId?: string | null, pluginName?: string | null }} layout */
  function sourceName(layout) {
    const source = layoutSource(layout);

    return source === 'plugin'
      ? layout.pluginName || layout.pluginId || layout.owner
      : $_(`pages.mail-templates.layouts.source.${source}`);
  }

  /** @param {string} code */
  function localeName(code) {
    return localeNames[code] ?? code;
  }

  /** @param {{ owner: string, key: string }} mail */
  function editHref(mail) {
    return `${base}/settings/mail-templates/${encodeURIComponent(mail.owner)}/${encodeURIComponent(mail.key)}`;
  }
</script>
