<div class="vstack gap-3">
  {#if data.failed}
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
    {#key `${data.owner}|${data.key}|${data.variant}|${data.locale}`}
      <MailTemplateForm
        owner={data.owner}
        mailKey={data.key}
        mail={data.mail}
        variant={data.variant}
        locale={data.locale}
        locales={data.locales}
        entry={data.entry} />
    {/key}
  {/if}
</div>

<script module>
  import { error } from '@sveltejs/kit';
  import { get } from 'svelte/store';

  import ApiUtil from '$lib/api.util';
  import { currentLanguage } from '$lib/language.util.js';

  import { createMailTemplatesApi, DEFAULT_VARIANT, pickLocale } from './mail-templates.api.js';

  /**
   * The mail (`owner`, `key` from the path) in one variant and language (`?variant=`, `?locale=`).
   * Without them: the first variant, and the panel's language when it is enabled.
   *
   * @type {import('@sveltejs/kit').PageLoad}
   */
  export async function load(event) {
    await event.parent();

    const { owner, key } = event.params;
    const api = createMailTemplatesApi(ApiUtil, event);
    const list = await api.list();

    if (!list.ok) return { failed: true };

    const mail = (list.body.items ?? []).find((item) => item.owner === owner && item.key === key);

    if (!mail) throw error(404);

    const params = event.url.searchParams;
    const variants = mail.variants ?? [];
    const variant =
      variants.find((item) => item.key === params.get('variant'))?.key ??
      variants[0]?.key ??
      DEFAULT_VARIANT;
    const locales = list.body.locales ?? [];
    const locale = pickLocale(locales, params.get('locale'), get(currentLanguage)?.code);
    const entry = await api.get(owner, key, variant, locale);

    if (!entry.ok) {
      if (entry.error.code === 'NOT_EXISTS') throw error(404);

      return { failed: true };
    }

    return { failed: false, owner, key, mail, variant, locale, locales, entry: entry.body };
  }
</script>

<script>
  import { _ } from 'svelte-i18n';

  import { invalidateAll } from '$app/navigation';

  import MailTemplateForm from './MailTemplateForm.svelte';

  let { data } = $props();
</script>
