<tr class:table-active={category.selected}>
  <th scope="row" class="align-middle text-center">
    <button
      type="button"
      aria-label={$_('buttons.delete')}
      title={$_('buttons.delete')}
      class="btn btn-sm btn-link"
      on:click={onDeleteClick}>
      <i class="fas fa-trash"></i>
    </button>
  </th>
  <Hook name="panel:post-categories:table:row:start" category={category} tag="td" class="align-middle text-nowrap" />
  <td class="align-middle text-nowrap">
    <button
      class="btn btn-link p-0"
      type="button"
      title={$_('buttons.edit')}
      on:click={onEditClick}>
      {category.title}
    </button>
  </td>
  <Hook name="panel:post-categories:table:row:after-category" category={category} tag="td" class="align-middle text-nowrap" />
  <td class="align-middle text-nowrap">
    {category.description && category.description.length > 50
      ? category.description.slice(0, 50) + '...'
      : category.description}
  </td>
  <Hook name="panel:post-categories:table:row:after-description" category={category} tag="td" class="align-middle text-nowrap" />
  <td class="align-middle">
    <a
      class="rounded focus-ring"
      href="{UI_URL === '/' ? '' : UI_URL}/blog/category/{category.url}"
      target="_blank"
      title={$_('buttons.view')}>
      /category/{category.url}
    </a>
  </td>
  <Hook name="panel:post-categories:table:row:after-url" category={category} tag="td" class="align-middle text-nowrap" />
  <td class="d-none">
    <input
      value="#{category.color}"
      class="form-control form-control-sm bg-transparent"
      disabled
      type="color" />
  </td>
  <Hook name="panel:post-categories:table:row:end" category={category} tag="td" class="align-middle text-nowrap" />
</tr>

<script>
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { UI_URL } from '$lib/variables';
  import Hook from '$lib/component/Hook.svelte';

  export let category;
  export let index;

  const dispatch = createEventDispatcher();

  function onEditClick() {
    dispatch('editClick', { index });
  }

  function onDeleteClick() {
    dispatch('deleteClick', { index });
  }
</script>
