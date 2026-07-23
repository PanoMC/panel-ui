/**
 * panel-ui quick + full list; because the API / theme may return a different shape.
 * @param { { status?: string | { name?: string } } } n
 * @returns { boolean }
 */
export function isPanelNotificationUnread(n) {
  const s = n?.status;
  if (s === 'NOT_READ') {
    return true;
  }
  if (typeof s === 'string' && s.toUpperCase() === 'NOT_READ') {
    return true;
  }
  if (s && typeof s === 'object' && s.name != null) {
    return String(s.name).toUpperCase() === 'NOT_READ';
  }
  return false;
}
