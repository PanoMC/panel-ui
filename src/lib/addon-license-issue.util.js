/**
 * Premium addon license outcomes exposed as `licenseStatus` by the panel API.
 * Keep in sync with `com.panomc.platform.license.LicenseStatus` (excluding NOT_PREMIUM / LICENSED).
 */
export const ADDON_LICENSE_ISSUE_STATUSES = new Set([
  'MISSING',
  'NO_PURCHASE',
  'EXPIRED',
  'NETWORK_ERROR',
  'NOT_CONNECTED',
  'NEEDS_REFRESH',
  'JAR_TAMPERED',
  'SIGNATURE_INVALID',
  'VERSION_MISMATCH',
  'AUDIENCE_MISMATCH',
  'PLATFORM_MISMATCH',
  'UNKNOWN',
]);

/**
 * True when FAILED state is due to DRM / license gate — not a generic plugin crash.
 * Prefer host-provided `startupBlockedByLicense` (derived from LicenseRequiredException chain).
 */
export function isAddonLicenseStartupBlocked(addon) {
  if (!addon) return false;
  if (addon.startupBlockedByLicense === true) return true;
  if (!addon.premium) return false;
  return ADDON_LICENSE_ISSUE_STATUSES.has(addon.licenseStatus);
}

/**
 * Do not hard-block most premium enable attempts in UI.
 *
 * License state can be stale (e.g. purchase/account link happened after startup), and backend
 * start flow should be the source of truth. We only block when host is clearly disconnected.
 */
export function isPremiumAddonEnableBlockedByLicense(addon) {
  if (!addon?.premium) return false;
  return addon.licenseStatus === 'NOT_CONNECTED';
}
