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

Dropdown items are capitalized (`View Details`, `Delete`; add `text-capitalize` when the string
is not) and carry a leading icon (`me-2`). A destructive item (delete, remove) is `link-danger`
and comes last.

### Row click

The whole row is the way into the item: clicking an empty part of a row opens its edit modal (or
its detail page). Add `row-action` to the `<tr>` (cursor and press effect, `src/styles/_row-action.scss`)
and use the `rowLink` action in panel-ui: `<tr use:rowLink={onEditClick}>` (a function opens a
modal, a string goes to a page). Plugins cannot import it, so they put `class="row-action"` and a
`click` handler on the `<tr>` that ignores presses on `a, button, input, select, textarea, label,
[role="button"], [data-bs-toggle], .dropdown-menu` and text selections.

- Links, buttons, checkboxes and the actions dropdown inside the row keep their own click.
- The row is never the only way in: the title cell is always a real link or button (below), so the
  keyboard and screen readers still reach the item.

### Links and badges in cells

- **Title cell** — a link to the item's page: `rounded focus-ring text-decoration-none d-block
  text-truncate`; or, when it opens a modal, `btn btn-link p-0 text-start text-decoration-none
  text-truncate rounded focus-ring`.
- **Any other link** (a public address, a player) gets `rounded focus-ring text-decoration-none`.
- **A link to another site or tab** (`target="_blank"` with `rel="noopener noreferrer"`) ends with
  the open-in-new-tab icon: `<i class="fa-solid fa-arrow-up-right-from-square small
  flex-shrink-0">` after the text, which sits in a `text-truncate` span; the link is `d-flex
  align-items-center gap-2`.
- **Badges inside a cell** are `badge text-bg-primary` for informational values (a type, a role, a
  category) — not `rounded-pill`, not gray. A **status** badge keeps its state color (`text-bg-success`,
  `text-bg-danger`…). Badges do not shrink (`flex-shrink-0`) next to a truncated title.

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
- A rounded-pill or gray badge in a cell, or a link that underlines.
