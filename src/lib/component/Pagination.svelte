<nav>
  <ul class="pagination pagination-sm mb-0 justify-content-start">
    <li class="page-item" class:disabled={parseInt(page) === 1}>
      <a
        class="page-link"
        href="javascript:void(0);"
        title={$_('components.pagination.previous-page')}
        on:click={onFirstPageClick}
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
          on:click={onPageLinkClick(index)}
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
        on:click={onLastPageClick}
        aria-hidden={parseInt(page) === totalPage}>
        <i class="fa-solid fa-caret-right"></i>
      </a>
    </li>
  </ul>
</nav>

<script>
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  const dispatch = createEventDispatcher();
  let pages;

  export let page;
  export let totalPage = 1;

  $: {
    pages = [];

    for (let i = 1; i <= totalPage; i++) {
      pages.push(i);
    }
  }

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
