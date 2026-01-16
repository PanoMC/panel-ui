<script>
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  const dispatch = createEventDispatcher();

  let { page = 1, totalPage = 1 } = $props();

  const pages = $derived(Array.from({ length: totalPage }, (_, i) => i + 1));

  function onFirstPageClick() {
    dispatch('firstPageClick', {});
  }

  function onLastPageClick() {
    dispatch('lastPageClick', {});
  }

  function onPageLinkClick(index) {
    dispatch('pageLinkClick', {
      page: index,
    });
  }
</script>

<nav>
  <ul class="pagination pagination-sm mb-0 justify-content-start">
    <li class="page-item" class:disabled={parseInt(page) === 1}>
      <a
        class="page-link"
        href="javascript:void(0);"
        title={$_('components.pagination.previous-page')}
        onclick={onFirstPageClick}
        aria-hidden={parseInt(page) === 1}>
        <i class="fa-solid fa-caret-left"></i>
      </a>
    </li>

    {#each pages as index}
      <li
        class="page-item"
        class:active={parseInt(page) === index}
        aria-current={parseInt(page) === index ? 'page' : ''}>
        <a
          class="page-link"
          href="javascript:void(0);"
          onclick={() => onPageLinkClick(index)}
          aria-hidden={parseInt(page) === index}>
          {index}
        </a>
      </li>
    {/each}

    <li class="page-item" class:disabled={parseInt(page) === totalPage}>
      <a
        class="page-link"
        href="javascript:void(0);"
        title={$_('components.pagination.next-page')}
        onclick={onLastPageClick}
        aria-hidden={parseInt(page) === totalPage}>
        <i class="fa-solid fa-caret-right"></i>
      </a>
    </li>
  </ul>
</nav>
