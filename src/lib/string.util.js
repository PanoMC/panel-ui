/**
 * Capitalises the first letter of every word, like CSS `text-transform: capitalize` would.
 *
 * This exists for `<option>` text, where the CSS class cannot be used: Blink and WebKit do not
 * apply `text-transform` to an option at all, because the dropdown is drawn by the platform
 * rather than by the page, so the class only takes effect on Gecko. Doing it on the string keeps
 * every browser showing the same thing.
 *
 * A word starts at a letter that has no letter or digit before it. That is spelled as a
 * lookbehind rather than `\b`, which is defined over ASCII `\w` only: a Turkish `ş` or `ı` is
 * not a `\w` character, so `\b` would see a word boundary after every one of them and raise the
 * wrong letter — "Başlangıç ayarları" would come out as "BaŞLangIç AyarlarI". `\p{L}`/`\p{N}`
 * cover the scripts the panel ships.
 *
 * @param {unknown} text
 * @param {string} [locale] the UI's locale, for the Turkish dotted/dotless `i`: `i` becomes
 *   `İ` in `tr` and `I` in `en`. Left out, the runtime default is used.
 * @returns {string}
 */
export function capitalize(text, locale) {
  return String(text ?? '').replace(/(?<![\p{L}\p{N}])\p{L}/gu, (letter) =>
    locale ? letter.toLocaleUpperCase(locale) : letter.toLocaleUpperCase(),
  );
}

export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

export function parseUserAgent(userAgent) {
  if (!userAgent || userAgent === '-') return 'Unknown';

  const ua = userAgent.toLowerCase();

  // Browser detection
  let browser = 'Unknown Browser';
  if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';

  // OS detection
  let os = 'Unknown OS';
  if (ua.includes('win')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  return `${browser} (${os})`;
}
