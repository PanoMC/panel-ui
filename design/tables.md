# Data tables

The table inside a card (see `cards-table.md` for the card around it). Reference: the tickets table
in `panel-ui/src/lib/pages/Tickets.svelte` with `src/lib/components/rows/TicketRow.svelte`; for an
actions column, `PlayerRow.svelte`.

## Markup

`div.table-responsive > table.table.table-hover`. Header cells are
`<th class="align-middle text-nowrap" scope="col">`, data cells `<td class="align-middle">`.

## Header row

- Column titles are **capitalized** (`Last Reply`, not `Last reply`) and otherwise **unstyled**: no
  color class, no size class, no extra weight, no icons.
- The **control column** (the actions button or the selection checkbox) has **no title**: its `<th>`
  shows no text. With multi-select it holds only the select-all checkbox.

## Data rows

Column order is fixed:

1. **Control cell first** — the row's action dropdown, or the multi-select checkbox. It is a
   `<th scope="row" class="align-middle">`.
2. **Then the data cells.**

Row actions are always one dropdown (`btn btn-link` + `fa-ellipsis-v`, `dropdown-menu-start`),
never loose buttons. A selected row gets `table-active`.

## Example

```svelte
<div class="table-responsive">
  <table class="table table-hover">
    <thead>
      <tr>
        <th class="align-middle" scope="col">
          <div class="form-check d-flex justify-content-center align-items-center">
            <input class="form-check-input" type="checkbox" onclick={selectAll} />
          </div>
        </th>
        <th class="align-middle text-nowrap" scope="col">{$_('pages.tickets.table.title')}</th>
        <th class="align-middle text-nowrap" scope="col">{$_('pages.tickets.table.last-reply')}</th>
      </tr>
    </thead>
    <tbody>
      {#each tickets as ticket (ticket.id)}
        <tr class:table-active={ticket.selected}>
          <th scope="row" class="align-middle">
            <div class="form-check d-flex justify-content-center align-items-center">
              <input class="form-check-input" type="checkbox" bind:checked={checked[ticket.id]} />
            </div>
          </th>
          <td class="align-middle">{ticket.title}</td>
          <td class="align-middle text-nowrap"><Date time={ticket.lastUpdate} /></td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
```

## Don't

- A titled control column (`Actions`, `Select`), or the control column anywhere but first.
- Lowercase, colored, resized, bold-on-top or icon-decorated column titles.
- Action buttons spread across a row or placed in the last column.
