<style>
  .post-row-thumbnail {
    width: calc(40px * 16 / 9);
    max-width: 100%;
  }

  .post-row-thumbnail .thumbnail-frame {
    border-radius: var(--bs-border-radius);
    overflow: hidden;
  }

  .post-row-thumbnail img {
    width: 100%;
    height: 40px;
    object-fit: cover;
  }
</style>

<tr class:table-active={post.selected}>
  <th scope="row" class="align-middle text-center">
    <div class="dropdown position-static">
      <button
        type="button"
        class="btn btn-link"
        data-bs-toggle="dropdown"
        use:tooltip={[$_('components.post-row.actions')]}
        aria-label={$_('components.post-row.actions')}>
        <span class="fas fa-ellipsis-v"></span>
      </button>
      <div class="dropdown-menu dropdown-menu-start">
        <a
          class="dropdown-item"
          target="_blank"
          href="{UI_URL === '/' ? '' : UI_URL}/preview/post/{post.id}"
          use:tooltip={[$_('buttons.view')]}>
          <i class="fas fa-eye me-2"></i>
          {$_('buttons.view')}
        </a>
        {#if pageType !== PageTypes.DRAFT}
          <button
            type="button"
            class="dropdown-item"
            on:click={onMoveToDraft}
            class:disabled={buttonsLoading}>
            <span>
              <i class="fa-solid fa-sheet-plastic me-2"></i>
              {$_('components.post-row.move-to-draft')}
            </span>
          </button>
        {/if}

        {#if pageType !== PageTypes.PUBLISHED}
          <button
            type="button"
            class="dropdown-item"
            class:disabled={buttonsLoading}
            on:click={onPublishClick}>
            <span>
              <i class="fas fa-asterisk me-2"></i>
              {$_('components.post-row.publish')}
            </span>
          </button>
        {/if}

        <button type="button" class="dropdown-item" on:click={onDeletePostClick}>
          <i class="fas fa-trash me-2"></i>
          {#if pageType !== PageTypes.TRASH}
            {$_('components.post-row.move-to-trash')}
          {:else}
            {$_('buttons.delete')}
          {/if}
        </button>
      </div>
    </div>
  </th>
  <Hook name="panel:posts:table:row:start" {post} tag="td" class="align-middle text-nowrap" />
  <td class="align-middle">
    <div class="post-row-thumbnail">
      {#if post.thumbnailUrl}
        <a
          href="{UI_URL === '/' ? '' : UI_URL}/preview/post/{post.id}"
          target="_blank"
          use:tooltip={[$_('buttons.view')]}
          class="focus-ring d-block">
          <div class="ratio ratio-16x9 thumbnail-frame">
            <img
              src={post.thumbnailUrl
                ? (() => {
                    const lastDotIndex = post.thumbnailUrl.lastIndexOf('.');
                    return lastDotIndex > 0
                      ? post.thumbnailUrl.substring(0, lastDotIndex) +
                          '-preview' +
                          post.thumbnailUrl.substring(lastDotIndex)
                      : post.thumbnailUrl + '-preview';
                  })()
                : post.thumbnailUrl}
              alt={post.title}
              title={post.title} />
          </div>
        </a>
      {:else}
        <div
          class="ratio ratio-16x9 thumbnail-frame bg-black bg-opacity-10 d-flex align-items-center justify-content-center">
        </div>
      {/if}
    </div>
  </td>
  <Hook
    name="panel:posts:table:row:after-thumbnail"
    {post}
    tag="td"
    class="align-middle text-nowrap" />
  <td class="align-middle" style="max-width: 300px;">
    <a
      href={base + '/posts/detail/' + post.id}
      use:tooltip={[$_('buttons.edit')]}
      title={post.title}
      class="rounded focus-ring text-decoration-none d-block text-truncate">
      {post.title}
    </a>
  </td>
  <Hook name="panel:posts:table:row:after-title" {post} tag="td" class="align-middle text-nowrap" />
  <td class="align-middle text-nowrap">
    <CategoryBadge
      category={post.category}
      pageType="posts"
      filterTitle={$_('components.post-row.filter')}
      noCategoryText={$_('components.post-row.no-category')} />
  </td>
  <Hook
    name="panel:posts:table:row:after-category"
    {post}
    tag="td"
    class="align-middle text-nowrap" />
  <td class="align-middle text-nowrap">{post.views}</td>
  <Hook name="panel:posts:table:row:after-views" {post} tag="td" class="align-middle text-nowrap" />
  <td class="align-middle">
    <a
      href="{base}/players/detail/{post.writer.username}"
      class="d-inline-block focus-ring rounded-circle"
      use:tooltip={[post.writer.username, { placement: 'bottom' }]}>
      <img
        alt={post.writer.username}
        class="rounded-circle"
        width="32"
        height="32"
        src="/api/profile/picture/{post.writer.username}?{$avatarVersion}" />
    </a>
  </td>
  <Hook
    name="panel:posts:table:row:after-author"
    {post}
    tag="td"
    class="align-middle text-nowrap" />
  <td class="align-middle text-nowrap">
    <Date time={post.date} />
  </td>
  <Hook name="panel:posts:table:row:end" {post} tag="td" class="align-middle text-nowrap" />
</tr>

<script>
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';
  import { avatarVersion } from '$lib/Store';

  import { base } from '$app/paths';

  import Date from '$lib/components/Date.svelte';
  import CategoryBadge from '$lib/components/badges/CategoryBadge.svelte';
  import Hook from '$lib/components/Hook.svelte';
  import tooltip from '$lib/tooltip.util.js';
  import { UI_URL } from '$lib/variables.js';

  import { PageTypes } from '$lib/pages/Posts.svelte';

  export let post;
  export let pageType;
  export let buttonsLoading;

  const dispatch = createEventDispatcher();

  function onMoveToDraft() {
    dispatch('moveToDraft', { id: post.id });
  }

  function onPublishClick() {
    dispatch('publish', { id: post.id });
  }

  function onDeletePostClick() {
    dispatch('deletePost', { post });
  }
</script>
