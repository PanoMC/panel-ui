<nav>
  <ul class="pagination pagination-sm mb-0 justify-content-start flex-wrap">
    <li class="page-item" class:disabled={parseInt(page) === 1}>
      <button
        type="button"
        class="page-link"
        use:tooltip={[$_('components.pagination.previous-page')]}
        aria-label={$_('components.pagination.previous-page')}
        onclick={onFirstPageClick}
        aria-hidden={parseInt(page) === 1}>
        <i class="fa-solid fa-caret-left"></i>
      </button>
    </li>

    {#each displayedPages as index}
      <li
        class="page-item"
        class:active={parseInt(page) === index}
        aria-current={parseInt(page) === index ? 'page' : ''}>
        {#if index === '...'}
          <button type="button" class="page-link" onclick={onDotsClick}>
            ...
          </button>
        {:else}
          <button
            type="button"
            class="page-link"
            onclick={() => onPageLinkClick(index)}
            aria-hidden={parseInt(page) === index}>
            {index}
          </button>
        {/if}
      </li>
    {/each}

    <li class="page-item" class:disabled={parseInt(page) === totalPage}>
      <button
        type="button"
        class="page-link"
        use:tooltip={[$_('components.pagination.next-page')]}
        aria-label={$_('components.pagination.next-page')}
        onclick={onLastPageClick}
        aria-hidden={parseInt(page) === totalPage}>
        <i class="fa-solid fa-caret-right"></i>
      </button>
    </li>
  </ul>
</nav>

<JumpToPageModal />

<script>
  import { createEventDispatcher } from 'svelte';
  import tooltip from '$lib/tooltip.util';
  import { _ } from 'svelte-i18n';
  import JumpToPageModal, { show as showJumpModal } from './modals/JumpToPageModal.svelte';

  const dispatch = createEventDispatcher();

  let { page = 1, totalPage = 1 } = $props();

  const displayedPages = $derived.by(() => {
    if (totalPage <= 5) {
      return Array.from({ length: totalPage }, (_, i) => i + 1);
    }

    const current = parseInt(page);
    const range = [];
    const rangeWithDots = [];

    range.push(1);

    let start = Math.max(2, current - 1);
    let end = Math.min(totalPage - 1, current + 1);

    if (current <= 3) {
      end = Math.min(totalPage - 1, 4);
    } else if (current >= totalPage - 2) {
      start = Math.max(2, totalPage - 3);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    if (totalPage > 1) {
      range.push(totalPage);
    }

    let l;
    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  });

  function onFirstPageClick() {
    dispatch('firstPageClick', {});
  }

  function onLastPageClick() {
    dispatch('lastPageClick', {});
  }

  function onPageLinkClick(index) {
    if (index === page) {
      return;
    }

    dispatch('pageLinkClick', {
      page: index,
    });
  }

  function onDotsClick() {
    showJumpModal(page, totalPage, (newPage) => {
      onPageLinkClick(newPage);
    });
  }
</script>

