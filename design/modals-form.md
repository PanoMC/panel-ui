# Form modals (create / save / edit)

A modal with inputs that creates, saves or edits something. Reference:
`panel-ui/src/lib/components/modals/AddEditPostCategoryModal.svelte`. For a modal that only asks
"are you sure?", see `modals-confirmation.md` instead — its footer rules are different.

## Header

- `modal-header` with the title (`<h5 class="modal-title">`) and, optionally, the default
  Bootstrap `btn-close` in the top right corner.
- Header-level actions (a refresh, an info toggle) are icon-only `btn btn-link` buttons in a
  `ms-auto d-flex align-items-center gap-1` group between the title and the `btn-close`. Never
  more than two, and never a text button.
- **The title is the only text describing the modal.** No description, subtitle, intro paragraph or
  hint under it or at the top of the body.

## Body — inputs

- Keep inputs simple. An input mostly carries **only a placeholder**: no separate label, no help
  text, no description under it, no icon.
- Add a label or helper line only when the field cannot be understood from its placeholder (a
  checkbox / switch, a select, a value with a required format).
- Mark an invalid field on the input itself (`is-invalid` / `border-danger`).

## Footer

- **One button: the CTA, full width (`btn w-100`)**, `type="submit"` inside the modal's `<form>`.
- **No Cancel button.** The modal is dismissed with the header's `btn-close` (or Esc / backdrop).
- While saving, disable the CTA.

## Example

```svelte
<div class="modal fade" tabindex="-1" role="dialog" bind:this={modalElement}>
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">
          {$_('components.modals.add-edit-post-category.create-category')}
        </h5>
        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          aria-label={$_('buttons.close')}></button>
      </div>
      <form onsubmit={onSubmit}>
        <div class="modal-body">
          <input
            class="form-control form-control-lg mb-3"
            class:is-invalid={errors.title}
            type="text"
            placeholder={$_('components.modals.add-edit-post-category.inputs.title.placeholder')}
            bind:value={category.title} />
          <textarea
            class="form-control"
            rows="5"
            placeholder={$_(
              'components.modals.add-edit-post-category.inputs.description.placeholder',
            )}
            bind:value={category.description}></textarea>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary w-100" type="submit" disabled={loading}>
            {$_('buttons.save')}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
```

## Don't

- A Cancel / Close button in the footer, or two half-width buttons.
- A CTA that is not full width.
- A description or intro text under the title.
- A label plus placeholder plus help text on every field.
