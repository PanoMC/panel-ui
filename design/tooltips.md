# Tooltips

Tooltips use the `tooltip` action (`$lib/tooltip.util`, tippy.js).

## When to use

- **Only for information.** A tooltip explains a state or shows details the page has no room for: the
  problems behind an exclamation icon, the full value of a shortened text, a summary on a chart.
- **Never to name a control.** A button, link or icon button says what it does with the native
  `title` attribute (plus `aria-label` when it has no visible text), not with a tooltip.

## Placement

- **Bottom, whenever possible.** The action already defaults to `placement: 'bottom'`, so do not
  pass a placement at all.
- **Avoid `top`.** A tooltip goes on top only when it would leave the screen below — and tippy does
  that flip by itself, so there is no need to set `placement: 'top'` by hand.
- `left` / `right` only when both bottom and top would cover the thing the user is working with.

## Example

Information — a tooltip:

```svelte
<i
  class="fa-solid fa-circle-exclamation text-warning"
  aria-label={problemsText}
  use:tooltip={[problemsText]}></i>
```

The name of a control — `title`, no tooltip:

```svelte
<button
  type="button"
  class="btn btn-link"
  title={$_('buttons.refresh')}
  aria-label={$_('buttons.refresh')}>
  <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>
</button>
```

## Don't

- A tooltip on a button, link or icon button just to say what it does — use `title`.
- `use:tooltip={[text, { placement: 'top' }]}`.
- Forcing a placement just to be explicit — leave it to the default.
