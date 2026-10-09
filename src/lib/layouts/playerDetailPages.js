import { pageOf } from '$lib/components/pagination.util.js';

/** Rows per page of the two sub-lists in `GET /panel/players/:username`. */
export const PLAYER_SUBLIST_SIZE = 10;

/**
 * Reads one sub-list of the player answer as `{ items, page }`, which is what `PlayerDetail` and the
 * shared pager read. The platform answers a plain array plus a count key (`banHistory` +
 * `banHistoryCount`, `tickets` + `ticketCount`); an answer that already carries `{ items, page }`
 * is passed through. Returns undefined when the answer has no such list (no permission, SERVERS mode).
 *
 * @param {any} list the list as the answer holds it.
 * @param {number | undefined} count the item count beside it.
 * @param {number} number the page that was asked for.
 * @returns {{ items: any[], page: import('$lib/components/pagination.util.js').PageInfo } | undefined}
 */
export function subList(list, count, number) {
  if (list && !Array.isArray(list) && Array.isArray(list.items)) {
    return list;
  }

  if (!Array.isArray(list)) {
    return undefined;
  }

  const total = Number.isFinite(Number(count)) ? Number(count) : list.length;

  return { items: list, page: pageOf(number, total, PLAYER_SUBLIST_SIZE) };
}

/**
 * Puts the page objects of both sub-lists on the answer of the player endpoint.
 *
 * @param {Record<string, any>} body
 * @param {number} ticketsPage
 * @param {number} banHistoryPage
 */
export function withPlayerPages(body, ticketsPage, banHistoryPage) {
  const tickets = subList(body.tickets, body.ticketCount, ticketsPage);
  const banHistory = subList(body.banHistory, body.banHistoryCount, banHistoryPage);

  if (tickets) body.tickets = tickets;
  if (banHistory) body.banHistory = banHistory;

  body.ticketsPage = ticketsPage;
  body.banHistoryPage = banHistoryPage;

  return body;
}
