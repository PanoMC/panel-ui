# Pano Panel — design guidelines

Rules for any UI rendered inside the Pano panel: `panel-ui`, `setup-ui` and the panel side of
official and third-party plugins. Themes are out of scope.

The source of truth is `panel-ui/design/`. Every other repo carries a synced copy — do not edit a
copy, change it in `panel-ui` and run `bun scripts/sync-design.js` there.

## How to use

Before designing or changing panel UI, open **only** the topic file that matches what you are
building. Do not load every file.

| Building…                                          | Read                     |
| -------------------------------------------------- | ------------------------ |
| Alerts, inline notices, banners, buttons in alerts | `alerts.md`              |
| A modal that confirms / verifies an action         | `modals-confirmation.md` |
| A modal with inputs: create / save / edit          | `modals-form.md`         |
| A card with a table: lists, data, statistics rows  | `cards-table.md`         |
| A data table: columns, header row, row controls    | `tables.md`              |
| A colored statistic card, with or without a chart  | `cards-colored.md`       |
| Tooltips                                           | `tooltips.md`            |
| A filter dropdown in a card header                 | `filter-dropdown.md`     |

If no topic file covers the element, follow the closest existing screen in `panel-ui`.

## Typography

- The default text weight of `list-group-item` elements is declared with the `fw-normal` class.
  Plain list items do not use `fw-semibold` or `fw-bold`.
- A `list-group-item` title is capitalized (add `text-capitalize` when the string cannot carry it)
  and uses `text-body`; its description uses `text-body-secondary`. These theme-token classes keep
  both legible in dark and light mode.
- All button labels are capitalized. Add `text-capitalize` when the translation string cannot carry
  it.

## Badges

- **The default badge colour is primary** (`badge text-bg-primary`). A badge with no state to
  express (a count, a code, a type, a tag, a source, a phase) is primary.
- **Never fall back to secondary.** A status-to-class map returns `text-bg-primary` for an unknown
  value, not `text-bg-secondary`.
- `text-bg-secondary` is only for a passive state the grey itself means: inactive, hidden,
  cancelled, expired, skipped, offline.
- State colours keep their meaning: `success` done / active, `warning` waiting / needs a look,
  `danger` failed / blocking, `info` neutral information that is not the default.
