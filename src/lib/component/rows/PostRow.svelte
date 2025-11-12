<tr class:table-active={post.selected}>
  <th scope="row" class="align-middle text-center">
    <div class="dropdown position-static">
      <button
        type="button"
        class="btn btn-sm btn-link"
        data-bs-toggle="dropdown"
        title={$_("components.post-row.actions")}
        aria-label={$_("components.post-row.actions")}>
        <span class="fas fa-ellipsis-v"></span>
      </button>
      <div
        class="dropdown-menu dropdown-menu-start animate__animated animate__fadeIn">
        <a
          class="dropdown-item"
          target="_blank"
          href="{UI_URL === '/' ? '' : UI_URL}/preview/post/{post.id}">
          <i class="fas fa-eye me-2"></i>
          {$_("buttons.view")}
        </a>
        {#if pageType !== PageTypes.DRAFT}
          <button
            type="button"
            class="dropdown-item"
            on:click={onMoveToDraft}
            class:disabled={buttonsLoading}>
            <span>
              <i class="fa-solid fa-sheet-plastic me-2"></i>
              {$_("components.post-row.move-to-draft")}
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
              {$_("components.post-row.publish")}
            </span>
          </button>
        {/if}

        <button
          type="button"
          class="dropdown-item"
          on:click={onDeletePostClick}>
          <i class="fas fa-trash me-2"></i>
          {#if pageType !== PageTypes.TRASH}
            {$_("components.post-row.move-to-trash")}
          {:else}
            {$_("buttons.delete")}
          {/if}
        </button>
      </div>
    </div>
  </th>
  <td>
    {#if post.thumbnailUrl}
      <a href="{base}/posts/detail/{post.id}" class="focus-ring">
        <img
          src={post.thumbnailUrl + "?preview=true"}
          style="object-fit: contain;"
          alt={post.title}
          title={post.title}
          width="50"
          height="40" />
      </a>
    {:else}
      <!-- DEFAULT, this is used as space aligning for others -->
      <img
        src=""
        style="object-fit: contain;"
        alt={post.title}
        title={post.title}
        width="50"
        height="40"
        hidden />
    {/if}
  </td>
  <td class="align-middle text-nowrap">
    <a
      href={base + "/posts/detail/" + post.id}
      title={$_("buttons.edit")}
      class="rounded focus-ring">
      {post.title}
    </a>
  </td>
  <td class="align-middle text-nowrap">
    <a
      class="rounded focus-ring"
      title={$_("components.post-row.filter")}
      href="{base}/posts?categoryUrl={post.category.url}">
      {post.category.title === "-"
        ? $_("components.post-row.no-category")
        : post.category.title}
    </a>
  </td>
  <td class="align-middle text-nowrap">{post.views}</td>
  <td class="align-middle">
    <a
      href="{base}/players/detail/{post.writer.username}"
      class="d-inline-block focus-ring rounded-circle"
      use:tooltip={[post.writer.username, { placement: "bottom" }]}>
      <img
        alt={post.writer.username}
        class="rounded-circle"
        width="32"
        height="32"
        src="https://minotar.net/avatar/{post.writer.username}" />
    </a>
  </td>
  <td class="align-middle text-nowrap">
    <Date time={post.date} />
  </td>
</tr>

<script>
  import { createEventDispatcher } from "svelte";
  import { _ } from "svelte-i18n";

  import { base } from "$app/paths";

  import Date from "$lib/component/Date.svelte";

  import tooltip from "$lib/tooltip.util.js";
  import { UI_URL } from "$lib/variables.js";

  import { PageTypes } from "$lib/pages/Posts.svelte";

  export let post;
  export let pageType;
  export let buttonsLoading;

  const dispatch = createEventDispatcher();

  function onMoveToDraft() {
    dispatch("moveToDraft", { id: post.id });
  }

  function onPublishClick() {
    dispatch("publish", { id: post.id });
  }

  function onDeletePostClick() {
    dispatch("deletePost", { post });
  }
</script>
