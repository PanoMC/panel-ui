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

    <!-- The shared frame of every mail: logo, card, button and footer. -->
    <div class="card">
      <CardHeader>
        <div slot="left">{$_('pages.mail-templates.layout.title')}</div>
        <div slot="right">
          <a class="btn btn-sm btn-link" href="{base}/settings/mail-templates/layout">
            <i class="fas fa-pen me-2" aria-hidden="true"></i>
            {$_('pages.mail-templates.layout.edit')}
          </a>
        </div>
      </CardHeader>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <tbody>
            <tr use:rowLink={`${base}/settings/mail-templates/layout`}>
              <th scope="row" class="align-middle text-center" style="width: 1%;">
                <a
                  class="btn btn-link"
                  href="{base}/settings/mail-templates/layout"
                  title={$_('buttons.edit')}
                  aria-label={$_('buttons.edit')}>
                  <i class="fas fa-pen" aria-hidden="true"></i>
                </a>
              </th>
              <td class="align-middle">
                <div>{$_('pages.mail-templates.layout.name')}</div>
                <div class="small text-body-secondary">
                  {$_('pages.mail-templates.layout.description')}
                </div>
              </td>
              <td class="align-middle text-end text-nowrap">
                {#if data.list.layoutCustomized}
                  <span class="badge text-bg-primary">{$_('pages.mail-templates.customized')}</span>
                {:else}
                  <span class="badge text-bg-secondary">{$_('pages.mail-templates.default')}</span>
                {/if}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

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
                  <th scope="col"></th>
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
                    <th scope="row" class="align-middle text-center" style="width: 1%;">
                      <div class="dropdown position-static">
                        <button
                          type="button"
                          class="btn btn-link"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                          title={$_('pages.mail-templates.table.actions')}
                          aria-label={$_('pages.mail-templates.table.actions')}>
                          <span class="fas fa-ellipsis-v"></span>
                        </button>
                        <div class="dropdown-menu dropdown-menu-start">
                          <a class="dropdown-item" {href}>
                            <i class="fas fa-pen me-2" aria-hidden="true"></i>
                            {$_('buttons.edit')}
                          </a>
                        </div>
                      </div>
                    </th>
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
                        <span class="text-body-secondary"
                          >{$_('pages.mail-templates.default')}</span>
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

  import { invalidateAll } from '$app/navigation';
  import { base } from '$app/paths';

  import CardHeader from '$lib/components/CardHeader.svelte';
  import NoContent from '$lib/components/NoContent.svelte';
  import PageActions from '$lib/components/PageActions.svelte';
  import SearchInput from '$lib/components/SearchInput.svelte';
  import { rowLink } from '$lib/rowLink.util.js';

  import { customizedLocalesOf, groupByOwner } from './mail-templates.api.js';

  let { data } = $props();

  let search = $state('');

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

  /** @param {string} code */
  function localeName(code) {
    return localeNames[code] ?? code;
  }

  /** @param {{ owner: string, key: string }} mail */
  function editHref(mail) {
    return `${base}/settings/mail-templates/${encodeURIComponent(mail.owner)}/${encodeURIComponent(mail.key)}`;
  }
</script>
