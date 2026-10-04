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

If no topic file covers the element, follow the closest existing screen in `panel-ui`.
