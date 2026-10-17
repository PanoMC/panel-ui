<div class="vstack gap-3">
  {#if !data.list}
    <div class="alert alert-danger d-flex align-items-start mb-0" role="alert">
      <i class="fa-solid fa-circle-exclamation me-3 mt-1" aria-hidden="true"></i>
      <div>
        <div>{$_('pages.mail-templates.load-failed')}</div>
        <button
          type="button"
          class="btn alert-btn text-capitalize mt-2"
          onclick={() => invalidateAll()}>
          {$_('buttons.try-again')}
        </button>
      </div>
    </div>
  {:else}
    <div class="d-flex justify-content-center">
      <div style="width: 250px;">
        <SearchInput autofocus showSpinner={false} onchange={(value) => (search = value)} />
      </div>
    </div>

    <!-- The frames the mails are wrapped in: Pano's main one, plugins' and the admin's own. -->
    <div class="card">
      <CardHeader>
        <div slot="left" class="text-capitalize">
          {$_('pages.mail-templates.layouts.title', { values: { count: layouts.length } })}
        </div>
        <div slot="right">
          <button
            type="button"
            class="btn btn-sm btn-primary"
            onclick={() => newLayoutModal?.show()}>
            <i class="fas fa-plus me-2" aria-hidden="true"></i>
            {$_('pages.mail-templates.layouts.new')}
          </button>
        </div>
      </CardHeader>
      {#if layouts.length === 0}
        <NoContent icon="" />
      {:else}
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th class="align-middle" scope="col"></th>
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
                <tr use:rowLink={() => editor?.showLayout(layout.id)}>
                  <th scope="row" class="align-middle text-center">
                    <div class="dropdown position-static">
                      <button
                        type="button"
                        class="btn btn-link"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        title={$_('pages.servers.nodes.column-actions')}
                        aria-label={$_('pages.servers.nodes.column-actions')}>
                        <span class="fas fa-ellipsis-v"></span>
                      </button>
                      <div class="dropdown-menu dropdown-menu-start">
                        <button
                          type="button"
                          class="dropdown-item text-capitalize"
                          onclick={() => editor?.showLayout(layout.id)}>
                          <i class="fas fa-pen me-2"></i>
                          {$_('buttons.edit')}
                        </button>
                      </div>
                    </div>
                  </th>
                  <td class="align-middle">
                    <button
                      type="button"
                      class="btn btn-link p-0 text-reset text-decoration-none text-start align-baseline text-capitalize"
                      onclick={() => editor?.showLayout(layout.id)}>
                      {layout.name || layout.id}
                    </button>
                    {#if layout.customized}
                      <span class="badge text-bg-primary text-capitalize ms-1">
                        {$_('pages.mail-templates.customized')}
                      </span>
                    {/if}
                  </td>
                  <td class="align-middle text-nowrap text-capitalize">{sourceName(layout)}</td>
                  <td class="align-middle text-nowrap text-capitalize">
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

    <NewMailLayoutModal bind:this={newLayoutModal} {layouts} oncreated={onLayoutCreated} />

    <MailEditorModal bind:this={editor} />

    {#each groups as group (group.owner)}
      <div class="card">
        <CardHeader>
          <div slot="left" class="text-capitalize">
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
            <table class="table table-hover">
              <thead>
                <tr>
                  <th class="align-middle" scope="col"></th>
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
                  {@const customized = customizedLocalesOf(mail)}
                  <tr use:rowLink={() => editor?.showMail(mail)}>
                    <th scope="row" class="align-middle text-center">
                      <div class="dropdown position-static">
                        <button
                          type="button"
                          class="btn btn-link"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                          title={$_('pages.servers.nodes.column-actions')}
                          aria-label={$_('pages.servers.nodes.column-actions')}>
                          <span class="fas fa-ellipsis-v"></span>
                        </button>
                        <div class="dropdown-menu dropdown-menu-start">
                          <button
                            type="button"
                            class="dropdown-item text-capitalize"
                            onclick={() => editor?.showMail(mail)}>
                            <i class="fas fa-pen me-2"></i>
                            {$_('buttons.edit')}
                          </button>
                        </div>
                      </div>
                    </th>
                    <td class="align-middle">
                      <button
                        type="button"
                        class="btn btn-link p-0 text-reset text-decoration-none text-start align-baseline text-capitalize"
                        onclick={() => editor?.showMail(mail)}>
                        {mail.name || mail.key}
                      </button>
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
                            <span class="badge text-bg-primary text-capitalize"
                              >{localeName(code)}</span>
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

  import CardHeader from '$lib/components/CardHeader.svelte';
  import NoContent from '$lib/components/NoContent.svelte';
  import SearchInput from '$lib/components/SearchInput.svelte';
  import { rowLink } from '$lib/rowLink.util.js';

  import { customizedLocalesOf, groupByOwner, layoutSource } from './mail-templates.api.js';
  import MailEditorModal from './MailEditorModal.svelte';
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

  /** @type {any} */
  let editor = $state();

  /**
   * A new layout opens in the editor once the dialog that made it has faded out (two modals do not
   * fade at the same time), and the table learns about it.
   *
   * @param {{ id: string }} layout
   */
  function onLayoutCreated(layout) {
    invalidateAll();
    setTimeout(() => editor?.showLayout(layout.id), 350);
  }
</script>
