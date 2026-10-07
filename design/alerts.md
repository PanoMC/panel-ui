# Alerts

Alerts are plain Bootstrap 5 alerts (`alert alert-{variant}`). Do not restyle them.

## Structure

- **Icon on the left**, then the content. Use a Font Awesome icon matching the variant
  (`fa-circle-info`, `fa-triangle-exclamation`, `fa-circle-exclamation`, `fa-circle-check`).
- **Waiting alerts**: while the alert waits on something (a payment, a deploy), a
  `spinner-border spinner-border-sm me-3 mt-1` takes the icon's place. It turns into the matching
  variant icon once the wait is over.
- **Dismissible only when needed**: add `alert-dismissible` and the default Bootstrap
  `btn-close`. No custom close icon or button.

## Text

- **Title**: always `<h5 class="alert-heading mb-2">`, and always capitalized
  (`Update Available`, not `Update available`). Write the capitalization in the language string
  itself. Do not add `fw-bold` or any other weight or size class. No other heading level, no `<b>`
  or `<strong>`.
- **Body / description**: default alert text. Never set a custom color or a custom size on it (no
  `text-*`, `small`, `fs-*`, `opacity-*`, inline styles).
- Allowed emphasis inside the body: bold and italic.
- Bulleted lists (`<ul>`) are allowed.

## Actions

- Buttons inside an alert use `alert-btn`, links use `alert-link`. No other button variants
  (`btn-primary`, `btn-outline-*`, …) inside an alert.
- Action labels are capitalized (`Open Settings`, `Try Again`). Where the string cannot carry the
  capitalization, add `text-capitalize` to the button or link.
- An action goes **below** the text (`mt-2`), inside the content column. It is never placed on the
  right edge of the alert, and never carries its own icon.

## Example

```svelte
<div class="alert alert-warning alert-dismissible d-flex align-items-start" role="alert">
  <i class="fa-solid fa-triangle-exclamation me-3 mt-1" aria-hidden="true"></i>
  <div>
    <h5 class="alert-heading mb-2">{$_('alerts.update.title')}</h5>
    <div>{$_('alerts.update.description')}</div>
    <ul class="mb-2">
      <li>{$_('alerts.update.item-1')}</li>
      <li>{$_('alerts.update.item-2')}</li>
    </ul>
    <button class="btn alert-btn" type="button">{$_('alerts.update.install')}</button>
    <a class="alert-link ms-2" href="{base}/settings/updates">{$_('alerts.update.details')}</a>
  </div>
  <button class="btn-close" type="button" aria-label={$_('close')} onclick={dismiss}></button>
</div>
```

## Don't

- Title as `<b>`, `<strong>`, `<h6 class="alert-heading">` (any heading other than `h5`), with
  `fw-bold`, without `mb-2`, or lowercase.
- Title and description side by side on one line; the description goes in its own block below.
- `small`, `text-muted` or colored spans on the description.
- Icon on the right, on top, or inside the title element.
- `btn btn-sm btn-warning` (or any regular button variant) as an alert action.
