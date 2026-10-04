# Alerts

Alerts are plain Bootstrap 5 alerts (`alert alert-{variant}`). Do not restyle them.

## Structure

- **Icon on the left**, then the content. Use a Font Awesome icon matching the variant
  (`fa-circle-info`, `fa-triangle-exclamation`, `fa-circle-exclamation`, `fa-circle-check`).
- **Dismissible only when needed**: add `alert-dismissible` and the default Bootstrap
  `btn-close`. No custom close icon or button.

## Text

- **Title**: always a `<b>` element, and always capitalized (`Update Available`, not
  `Update available`). Write the capitalization in the language string itself. No `alert-heading`,
  no `h1`–`h6`.
- **Body / description**: default alert text. Never set a custom color or a custom size on it (no
  `text-*`, `small`, `fs-*`, `opacity-*`, inline styles).
- Allowed emphasis inside the body: bold and italic.
- Bulleted lists (`<ul>`) are allowed.

## Actions

- Buttons inside an alert use `alert-btn`, links use `alert-link`. No other button variants
  (`btn-primary`, `btn-outline-*`, …) inside an alert.
- Action labels are capitalized (`Open Settings`, `Try Again`).

## Example

```svelte
<div class="alert alert-warning alert-dismissible d-flex align-items-start" role="alert">
  <i class="fa-solid fa-triangle-exclamation me-3 mt-1" aria-hidden="true"></i>
  <div>
    <b>{$_('alerts.update.title')}</b>
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

- Title as `<strong>`, `<h5 class="alert-heading">` or lowercase.
- `small`, `text-muted` or colored spans on the description.
- Icon on the right, on top, or inside the title element.
- `btn btn-sm btn-warning` (or any regular button variant) as an alert action.
