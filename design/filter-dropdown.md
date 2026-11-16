# Filter dropdown

A single-choice filter in a card header or page actions. Component:
`src/lib/components/FilterDropdown.svelte` — use it instead of a `<select class="form-select">`.

## Rules

- **The dropdown title (header) is capitalized**: every word starts with an uppercase letter.
- **The items are capitalized** the same way. Names that are data, not labels (a username, an
  event name), are shown exactly as they are.
- The first item is the "all" choice; the trigger shows the selected item.
- Titles and items are short, technical and concise, like every other title in the panel.
- The icon is always the default filter icon (`fa-filter`); do not pass a custom `icon`.
- Do not add a color, size or weight class to the trigger, the title or the items.

## Don't

- A `<select>` as a card header filter.
- A lowercase or sentence-case title or item.
