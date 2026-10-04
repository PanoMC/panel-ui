# Table cards

The panel is an admin dashboard: show data, statistics and lists as tables wherever possible. A
table card is a `card` holding a `CardHeader`, a table and an optional footer. References:
`panel-ui/src/lib/pages/Players.svelte` and `Tickets.svelte` (rows in `src/lib/components/rows/`);
for a header action menu, the card in `src/lib/pages/servers/ServerConsole.svelte`. Copy their
markup and style.

## Header — `CardHeader`

Three slots, always in this order:

- **`left` — title with the count.** Plain text: no color class, no size class, no heading tag, no
  bold. It names the content and its amount: `12 Tickets`, `0/20 Players`.
- **`middle` — `SearchInput`**, 250px wide. It is focused when the page opens: pass `autofocus`.
- **`right` — filters**: `CardFilters` with `CardFiltersItem`s.

## Body

- **No data → only `NoContent`**, in place of the table (no empty table, no header row). Use it
  **without an icon**.
- Otherwise the data table — its columns, header row and row actions follow `tables.md`.

## Footer

- `card-footer` with the `Pagination` component on the **left**, only when the list is paginated.
  No footer otherwise.

## No informational content

Nothing explanatory goes in the header, body or footer of a table card: no alerts, hints,
descriptions, help text or legends. Put those outside the card.

## Card actions (CTA)

Page-level CTAs belong to the page's `PageActions`. A card may carry its **own** actions only when
the page already uses `PageActions` for its CTAs, or there is a lot of content above the card.
Then:

- the card has **no filters**, and the actions take the `right` slot instead;
- they are one **dropdown menu**, not a row of buttons: trigger `btn btn-sm btn-link` with
  `fa-ellipsis-vertical`, menu `dropdown-menu dropdown-menu-end`, items `dropdown-item` — as in the
  console card.

## Example

```svelte
<div class="card">
  <CardHeader>
    <div slot="left">
      {$_('pages.tickets.table-title', { values: { ticketCount: data.ticketCount } })}
    </div>
    <div slot="middle" style="width: 250px;">
      <SearchInput autofocus initialValue={search} searching={isSearching} on:change={onSearch} />
    </div>
    <CardFilters slot="right">
      <CardFiltersItem href="/tickets" active={pageType === 'ALL'}>
        {$_('pages.tickets.all')}
      </CardFiltersItem>
    </CardFilters>
  </CardHeader>

  {#if data.ticketCount === 0}
    <NoContent icon="" />
  {:else}
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th scope="col"></th>
            <th class="align-middle text-nowrap" scope="col">{$_('pages.tickets.table.title')}</th>
          </tr>
        </thead>
        <tbody>
          {#each data.tickets as ticket (ticket.id)}
            <tr>
              <th scope="row" class="align-middle text-center">
                <div class="dropdown position-static">
                  <button
                    type="button"
                    class="btn btn-link"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    title={$_('components.ticket-row.actions')}
                    aria-label={$_('components.ticket-row.actions')}>
                    <span class="fas fa-ellipsis-v"></span>
                  </button>
                  <div class="dropdown-menu dropdown-menu-start">
                    <button type="button" class="dropdown-item link-danger" onclick={remove}>
                      <i class="fas fa-trash me-2"></i>
                      {$_('buttons.delete')}
                    </button>
                  </div>
                </div>
              </th>
              <td class="align-middle">{ticket.title}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <div class="card-footer">
      <Pagination page={data.page} totalPage={data.totalPage} />
    </div>
  {/if}
</div>
```

## Don't

- A colored, bold, resized or `<h5>` header title, or a title without the count.
- Search missing, not in the middle, or not focused on load.
- Action buttons in a row, an actions column on the right, or a titled actions column.
- An empty table, or `NoContent` with an icon, when there is no data.
- Alerts / hint text inside the card. Pagination centered or on the right.
- Several CTA buttons in the card header instead of one dropdown menu.
