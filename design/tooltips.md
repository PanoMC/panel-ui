# Tooltips

Tooltips use the `tooltip` action (`$lib/tooltip.util`, tippy.js).

## Placement

- **Bottom, whenever possible.** The action already defaults to `placement: 'bottom'`, so do not
  pass a placement at all.
- **Avoid `top`.** A tooltip goes on top only when it would leave the screen below — and tippy does
  that flip by itself, so there is no need to set `placement: 'top'` by hand.
- `left` / `right` only when both bottom and top would cover the thing the user is working with.

## Example

```svelte
<button
  type="button"
  class="btn btn-link"
  aria-label={$_('buttons.refresh')}
  use:tooltip={[$_('buttons.refresh')]}>
  <i class="fa-solid fa-rotate-right" aria-hidden="true"></i>
</button>
```

## Don't

- `use:tooltip={[text, { placement: 'top' }]}`.
- Forcing a placement just to be explicit — leave it to the default.
