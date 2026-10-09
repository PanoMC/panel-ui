/**
 * The page object every list endpoint answers with (doc 04 section 4) and the helpers the panel
 * reads it with. A numbered list has `{ number, size, totalItems }` (and a page count the panel works out
 * itself); a cursor list has `{ size, nextCursor }`. Lists that page on the client build the same object with {@link pageOf}.
 *
 * @typedef {{ number?: number, size?: number, totalItems?: number, nextCursor?: string | null }} PageInfo
 */

/**
 * The 1-based number of the page shown.
 *
 * @param {PageInfo | null | undefined} page
 * @returns {number}
 */
export function pageNumber(page) {
  return Math.max(1, Math.floor(Number(page?.number)) || 1);
}

/**
 * How many pages there are, at least 1: an empty list reports 0 pages and the pager still shows
 * page 1. Worked out from `totalItems` and `size`, which every numbered page object carries.
 *
 * @param {PageInfo | null | undefined} page
 * @returns {number}
 */
export function pageCount(page) {
  const items = Number(page?.totalItems);
  const size = Number(page?.size);

  if (!(items > 0) || !(size > 0)) {
    return 1;
  }

  return Math.max(1, Math.ceil(items / size));
}

/**
 * Whether a list has a page after the one shown: a numbered list knows from its item count, a
 * list that cannot count (a search on somebody else's catalogue) says so with `nextCursor`.
 *
 * @param {PageInfo | null | undefined} page
 * @returns {boolean}
 */
export function hasNextPage(page) {
  if (page && 'nextCursor' in page) {
    return Boolean(page.nextCursor);
  }

  return pageNumber(page) < pageCount(page);
}

/**
 * Whether a list that grows by loading more has anything left to load: a cursor list says so with
 * `nextCursor`, a numbered one with its item count.
 *
 * @param {PageInfo | null | undefined} page
 * @param {number} loaded how many items are shown now.
 * @returns {boolean}
 */
export function hasMoreItems(page, loaded) {
  if (page && 'nextCursor' in page) {
    return Boolean(page.nextCursor);
  }

  const items = Number(page?.totalItems);

  return Number.isFinite(items) && loaded < items;
}

/**
 * The page object of a list the panel pages itself.
 *
 * @param {number} number the page shown, 1-based.
 * @param {number} totalItems the length of the whole list.
 * @param {number} size items per page.
 * @returns {Required<Pick<PageInfo, 'number' | 'size' | 'totalItems'>>}
 */
export function pageOf(number, totalItems, size) {
  return { number, size, totalItems };
}

/**
 * The slice of a client-paged list that belongs on page [number].
 *
 * @template T
 * @param {T[]} items
 * @param {number} number
 * @param {number} size
 * @returns {T[]}
 */
export function pageSlice(items, number, size) {
  return items.slice((number - 1) * size, number * size);
}
