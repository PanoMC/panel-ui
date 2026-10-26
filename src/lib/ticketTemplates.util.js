import ApiUtil from '$lib/api.util.js';

/**
 * Every ticket template, for the places that offer all of them (the reply's ready replies, the
 * auto-reply selects). The list endpoint is paged (`{ items, page }`), so the pages are read one
 * after another at the largest page size. A failed read gives what was read so far.
 *
 * @param {any} [request] the load event, so the server side sends the visitor's cookies
 * @returns {Promise<any[]>}
 */
export async function loadAllTicketTemplates(request) {
  const templates = [];
  let totalPages = 1;

  for (let page = 1; page <= totalPages; page++) {
    const body = await ApiUtil.get({
      path: `/panel/ticket/templates?page=${page}&pageSize=100`,
      request,
    }).catch(() => null);

    if (!body || body.error || !Array.isArray(body.items)) break;

    templates.push(...body.items);
    totalPages = body.page?.totalPages ?? 1;
  }

  return templates;
}
