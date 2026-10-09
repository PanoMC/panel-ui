<nav>
  <ul class="pagination pagination-sm mb-0 justify-content-start flex-wrap">
    <li class="page-item" class:disabled={current === 1}>
      <button
        type="button"
        class="page-link"
        title={$_('components.pagination.previous-page')}
        aria-label={$_('components.pagination.previous-page')}
        onclick={onFirstPageClick}
        aria-hidden={current === 1}>
        <i class="fa-solid fa-caret-left"></i>
      </button>
    </li>

    {#each displayedPages as index}
      <li
        class="page-item"
        class:active={current === index}
        aria-current={current === index ? 'page' : ''}>
        {#if index === '...'}
          <button type="button" class="page-link" onclick={onDotsClick}> ... </button>
        {:else}
          <button
            type="button"
            class="page-link"
            onclick={() => onPageLinkClick(index)}
            aria-hidden={current === index}>
            {index}
          </button>
        {/if}
      </li>
    {/each}

    <li class="page-item" class:disabled={current === pages}>
      <button
        type="button"
        class="page-link"
        title={$_('components.pagination.next-page')}
        aria-label={$_('components.pagination.next-page')}
        onclick={onLastPageClick}
        aria-hidden={current === pages}>
        <i class="fa-solid fa-caret-right"></i>
      </button>
    </li>
  </ul>
</nav>

<JumpToPageModal />

<script>
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';
  import JumpToPageModal, { show as showJumpModal } from './modals/JumpToPageModal.svelte';

  import { pageCount, pageNumber } from './pagination.util.js';

  const dispatch = createEventDispatcher();

  /**
   * `page` is the page object of the list (`{ number, size, totalItems }` and the rest of doc 04
   * section 4); a list the panel pages itself builds one with `localPage`.
   */
  let { page = { number: 1 } } = $props();

  const current = $derived(pageNumber(page));
  const pages = $derived(pageCount(page));

  const displayedPages = $derived.by(() => {
    if (pages <= 5) {
      return Array.from({ length: pages }, (_, i) => i + 1);
    }

    const range = [];
    const rangeWithDots = [];

    range.push(1);

    let start = Math.max(2, current - 1);
    let end = Math.min(pages - 1, current + 1);

    if (current <= 3) {
      end = Math.min(pages - 1, 4);
    } else if (current >= pages - 2) {
      start = Math.max(2, pages - 3);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    if (pages > 1) {
      range.push(pages);
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
    if (index === current) {
      return;
    }

    dispatch('pageLinkClick', {
      page: index,
    });
  }

  function onDotsClick() {
    showJumpModal(current, pages, (newPage) => {
      onPageLinkClick(newPage);
    });
  }
</script>
