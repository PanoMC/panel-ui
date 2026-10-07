# Confirmation modals

A modal that asks the user to confirm or verify one action before it runs (delete, stop, start,
publish, update…). The reference implementation is the **start server** modal in
`panel-ui/src/lib/layouts/ServerDetailLayout.svelte` (the power modal) — icon size, text alignment,
text sizes and footer layout are copied from it.

## Body

Centered (`modal-body text-center`), in this order:

1. **Icon** — `fa-3x d-block m-auto` inside a `div.pb-3`. **No color class** (no `text-warning`,
   `text-danger`, `text-gray`…); it takes the default text color.
2. **Title** — `<h5 class="mb-2">`. No color class. Written as a **question** in sentence case, not
   capitalized: `Start this server?`, not `Start This Server` or `Server will be started`.
3. **Description** — `<div class="text-body-secondary">`. One short summary of what will happen
   when the user confirms. Every confirmation modal has one.

4. **Extra content** (optional) — only when the action needs one more input or a short list, e.g. a
   passphrase or the items affected. It goes below the description in a `text-start mt-3` block.
   It never replaces the description.

## Footer

`modal-footer flex-nowrap`, two buttons of equal width (`col-6 m-0`), cancel first.

- **Cancel** — `btn btn-link text-decoration-none`. The negative choice is always **Cancel**
  (`buttons.cancel`), never Close, No or Dismiss.
- **CTA** — a solid button colored by what the action does: `btn-primary` for a positive /
  constructive action (start, publish, install, enable, update), `btn-danger` for a negative /
  destructive one (delete, remove, stop, kill, ban, disable, reset).
- Every footer label is capitalized (`Cancel`, `Start`, `Delete Permanently`).
- While the action runs, disable both buttons and show `spinner-border spinner-border-sm me-1`
  inside the CTA.

## Example

```svelte
<div class="modal fade" tabindex="-1" aria-hidden="true" bind:this={modalElement}>
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-body text-center">
        <div class="pb-3">
          <i class="fa-solid fa-circle-question fa-3x d-block m-auto"></i>
        </div>
        <h5 class="mb-2">{$_('components.modals.confirm-delete-post.title')}</h5>
        <div class="text-body-secondary">
          {$_('components.modals.confirm-delete-post.description')}
        </div>
      </div>
      <div class="modal-footer flex-nowrap">
        <button
          class="btn btn-link text-decoration-none col-6 m-0"
          type="button"
          disabled={loading}
          onclick={hide}>
          {$_('buttons.cancel')}
        </button>
        <button class="btn btn-danger col-6 m-0" type="button" disabled={loading} onclick={confirm}>
          {#if loading}
            <span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>
          {/if}
          {$_('buttons.delete')}
        </button>
      </div>
    </div>
  </div>
</div>
```

## Don't

- A colored icon, a colored title, or a title that is a statement.
- A title with no description under it.
- `Close` / `No` as the negative button, or a cancel button without `btn-link text-decoration-none`.
- A `modal-header` with a close (×) button on a confirmation modal.
- `btn-danger` for a harmless action, or `btn-primary` for a destructive one.
