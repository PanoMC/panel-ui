/**
 * Helpers for the managed-server file manager (SM-31, contract §2.4.4).
 *
 * The backend hands the panel a flat listing per directory — `{ name, type, size, modified,
 * mode? }` — and every path the panel sends back is relative to the server directory. Path
 * safety is enforced by the node and by Pano (canonicalize, reject `..`, reject symlink
 * escapes, §2.7); the helpers here are the second pair of eyes, so a typed path with a `..`
 * in it never leaves the browser.
 */

import ApiUtil from '$lib/api.util.js';
import { isEndpointUnavailable } from '$lib/servers.util.js';
import { formatBytes } from '$lib/string.util.js';

/** Entry types the contract defines. */
export const FileEntryTypes = Object.freeze({
  FILE: 'file',
  DIR: 'dir',
  SYMLINK: 'symlink',
});

/** @typedef {{ name: string, type: string, size: number, modified: number, mode?: string|null }} FileEntry */

/**
 * Strips the noise a hand-typed path collects — backslashes, doubled and trailing slashes,
 * `.` segments — without resolving `..`, which [isPathSafe] has to be able to see.
 *
 * @param {unknown} value
 * @returns {string} a relative path, `''` for the server root.
 */
export function normalizePath(value) {
  return String(value ?? '')
    .replace(/\\/g, '/')
    .split('/')
    .filter((segment) => segment && segment !== '.')
    .join('/');
}

/**
 * Whether the panel is willing to send this path at all. Absolute paths, Windows drive
 * letters, NUL bytes and any `..` segment are refused here as well as server-side.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isPathSafe(value) {
  const raw = String(value ?? '').replace(/\\/g, '/');

  if (raw.includes('\0') || raw.startsWith('/') || /^[a-zA-Z]:/.test(raw)) {
    return false;
  }

  return !raw.split('/').includes('..');
}

/**
 * Whether a single file or directory name is usable — no separators, no traversal.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isNameSafe(value) {
  const name = String(value ?? '').trim();

  return (
    name.length > 0 &&
    name !== '.' &&
    name !== '..' &&
    !name.includes('/') &&
    !name.includes('\\') &&
    !name.includes('\0')
  );
}

/**
 * @param {string} directory
 * @param {string} name
 * @returns {string}
 */
export function joinPath(directory, name) {
  const base = normalizePath(directory);
  const leaf = String(name ?? '').replace(/^\/+|\/+$/g, '');

  return base ? `${base}/${leaf}` : leaf;
}

/**
 * @param {string} path
 * @returns {string} the directory holding `path`, `''` once it is the root.
 */
export function parentPath(path) {
  const parts = normalizePath(path).split('/').filter(Boolean);

  parts.pop();

  return parts.join('/');
}

/**
 * The clickable breadcrumb of a path: one entry per segment, each carrying the path to
 * navigate to. The root is not included — the view renders it itself.
 *
 * @param {string} path
 * @returns {Array<{ name: string, path: string }>}
 */
export function pathSegments(path) {
  const parts = normalizePath(path).split('/').filter(Boolean);

  return parts.map((name, index) => ({ name, path: parts.slice(0, index + 1).join('/') }));
}

/**
 * @param {FileEntry | null | undefined} entry
 * @returns {boolean}
 */
export function isDirectory(entry) {
  return String(entry?.type || '').toLowerCase() === FileEntryTypes.DIR;
}

/**
 * @param {FileEntry | null | undefined} entry
 * @returns {boolean}
 */
export function isSymlink(entry) {
  return String(entry?.type || '').toLowerCase() === FileEntryTypes.SYMLINK;
}

/**
 * @param {string} name
 * @returns {string} the extension without the dot, lower case, `''` when there is none.
 */
export function fileExtension(name) {
  const value = String(name ?? '');
  const dot = value.lastIndexOf('.');

  return dot > 0 ? value.slice(dot + 1).toLowerCase() : '';
}

/**
 * What the browser can show of a file without downloading it, by extension: `'image'`,
 * `'video'`, `'audio'` or `null`.
 *
 * The same list Pano will serve inline (`InlinePreviewTypes`); SVG and HTML are left out on
 * purpose, since shown from the panel's own origin they could run script.
 */
const PREVIEW_KINDS = Object.freeze({
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'avif'],
  video: ['mp4', 'webm', 'ogv', 'mov'],
  audio: ['mp3', 'ogg', 'oga', 'wav', 'flac', 'm4a', 'aac', 'opus'],
});

/**
 * @param {FileEntry | string | null | undefined} entry an entry, or a file name.
 * @returns {'image' | 'video' | 'audio' | null}
 */
export function previewKind(entry) {
  if (entry && typeof entry === 'object' && isDirectory(entry)) {
    return null;
  }

  const extension = fileExtension(typeof entry === 'string' ? entry : entry?.name || '');

  for (const [kind, extensions] of Object.entries(PREVIEW_KINDS)) {
    if (extensions.includes(extension)) {
      return /** @type {'image' | 'video' | 'audio'} */ (kind);
    }
  }

  return null;
}

/**
 * The streaming download URL for one or more paths of a server (§2.4.4 `files/download`).
 *
 * One file downloads as itself; several paths, or a directory (`archive`), come back as a single
 * zip built on the fly, its entries named relative to `base`. `inline` asks for a previewable
 * file to be shown rather than saved.
 *
 * @param {number | string} serverId
 * @param {string[]} paths server-relative paths.
 * @param {{ base?: string, archive?: boolean, inline?: boolean }} [options]
 * @returns {string}
 */
export function fileDownloadUrl(serverId, paths, { base, archive = false, inline = false } = {}) {
  const query = new URLSearchParams();

  paths.forEach((path) => query.append('path', path));

  if (base != null && (archive || paths.length > 1)) {
    query.set('base', base);
  }

  if (archive) {
    query.set('archive', 'true');
  }

  if (inline) {
    query.set('inline', 'true');
  }

  return `/api/panel/servers/${serverId}/files/download?${query.toString()}`;
}

/**
 * @param {FileEntry | null | undefined} entry
 * @returns {boolean} whether the per-row menu offers "extract here".
 */
export function isArchive(entry) {
  return !isDirectory(entry) && fileExtension(entry?.name || '') === 'zip';
}

/**
 * A modified timestamp as epoch millis. The contract says millis, but an ISO string is a
 * cheap thing to tolerate.
 *
 * @param {unknown} value
 * @returns {number} `0` when there is nothing usable.
 */
export function entryModified(value) {
  if (value == null || value === '') {
    return 0;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const text = String(value);

  if (/^\d+$/.test(text)) {
    return Number(text);
  }

  const parsed = Date.parse(text);

  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * @param {FileEntry} entry
 * @returns {string} a human-readable size, or an em dash for a directory.
 */
export function formatEntrySize(entry) {
  if (isDirectory(entry)) {
    return '—';
  }

  const size = Number(entry?.size);

  if (!Number.isFinite(size) || size < 0) {
    return '—';
  }

  return formatBytes(size, size < 1024 ? 0 : 1);
}

/** Font Awesome classes per extension; anything unlisted falls back to a blank page icon. */
const EXTENSION_ICONS = Object.freeze({
  jar: 'fa-brands fa-java',
  zip: 'fa-solid fa-file-zipper',
  gz: 'fa-solid fa-file-zipper',
  tar: 'fa-solid fa-file-zipper',
  rar: 'fa-solid fa-file-zipper',
  json: 'fa-solid fa-file-code text-info',
  yml: 'fa-solid fa-file-code text-info',
  yaml: 'fa-solid fa-file-code text-info',
  toml: 'fa-solid fa-file-code text-info',
  properties: 'fa-solid fa-file-code text-info',
  conf: 'fa-solid fa-file-code text-info',
  cfg: 'fa-solid fa-file-code text-info',
  ini: 'fa-solid fa-file-code text-info',
  log: 'fa-solid fa-file-lines',
  txt: 'fa-solid fa-file-lines',
  md: 'fa-solid fa-file-lines',
  png: 'fa-solid fa-file-image',
  jpg: 'fa-solid fa-file-image',
  jpeg: 'fa-solid fa-file-image',
  gif: 'fa-solid fa-file-image',
  webp: 'fa-solid fa-file-image',
  ico: 'fa-solid fa-file-image',
  sh: 'fa-solid fa-terminal',
  bat: 'fa-solid fa-terminal',
  dat: 'fa-solid fa-database',
  db: 'fa-solid fa-database',
  mca: 'fa-solid fa-cubes',
  mcr: 'fa-solid fa-cubes',
});

/**
 * @param {FileEntry} entry
 * @returns {string} the Font Awesome classes for the row's icon.
 */
export function fileIconClass(entry) {
  if (isDirectory(entry)) {
    return 'fa-solid fa-folder text-warning';
  }

  if (isSymlink(entry)) {
    return 'fa-solid fa-link text-body-secondary';
  }

  return (
    EXTENSION_ICONS[fileExtension(entry?.name || '')] || 'fa-solid fa-file text-body-secondary'
  );
}

/** The sort keys the table header offers. */
export const FileSortKeys = Object.freeze({
  NAME: 'name',
  SIZE: 'size',
  MODIFIED: 'modified',
});

/**
 * Directories always come first — that is what every file manager does, and it survives a
 * sort by size, where a directory has no size to compare.
 *
 * @param {FileEntry[]} entries
 * @param {string} key
 * @param {'asc' | 'desc'} direction
 * @returns {FileEntry[]} a new array; the input is left alone.
 */
export function sortFileEntries(entries, key = FileSortKeys.NAME, direction = 'asc') {
  const factor = direction === 'desc' ? -1 : 1;
  const byName = (a, b) =>
    String(a.name).localeCompare(String(b.name), undefined, {
      numeric: true,
      sensitivity: 'base',
    });

  return [...(Array.isArray(entries) ? entries : [])].sort((a, b) => {
    const aDirectory = isDirectory(a);

    if (aDirectory !== isDirectory(b)) {
      return aDirectory ? -1 : 1;
    }

    let result = 0;

    if (key === FileSortKeys.SIZE) {
      result = (Number(a.size) || 0) - (Number(b.size) || 0);
    } else if (key === FileSortKeys.MODIFIED) {
      result = entryModified(a.modified) - entryModified(b.modified);
    } else {
      result = byName(a, b);
    }

    if (result === 0 && key !== FileSortKeys.NAME) {
      result = byName(a, b);
    }

    return result * factor;
  });
}

/**
 * Normalizes whatever the listing endpoint returned into rows the table can render.
 *
 * @param {unknown} list
 * @returns {FileEntry[]}
 */
export function normalizeEntries(list) {
  return (Array.isArray(list) ? list : [])
    .map((entry) => ({
      name: String(entry?.name ?? ''),
      type: String(entry?.type ?? FileEntryTypes.FILE).toLowerCase(),
      size: Number(entry?.size) || 0,
      modified: entryModified(entry?.modified),
      mode: entry?.mode == null ? null : String(entry.mode),
    }))
    .filter((entry) => isNameSafe(entry.name));
}

/** Editor languages the lazy-loaded CodeMirror bundle knows about. */
export const EditorLanguages = Object.freeze({
  JSON: 'json',
  YAML: 'yaml',
  PROPERTIES: 'properties',
  TOML: 'toml',
  TEXT: 'text',
});

/** Extension → editor language. Everything else opens as plain text. */
const LANGUAGE_BY_EXTENSION = Object.freeze({
  json: EditorLanguages.JSON,
  mcmeta: EditorLanguages.JSON,
  yml: EditorLanguages.YAML,
  yaml: EditorLanguages.YAML,
  toml: EditorLanguages.TOML,
  properties: EditorLanguages.PROPERTIES,
  conf: EditorLanguages.PROPERTIES,
  cfg: EditorLanguages.PROPERTIES,
  ini: EditorLanguages.PROPERTIES,
});

/**
 * @param {string} name a file name or a path.
 * @returns {string} one of [EditorLanguages].
 */
export function editorLanguageFor(name) {
  const leaf =
    String(name ?? '')
      .split('/')
      .pop() || '';

  if (leaf.toLowerCase() === 'server.properties') {
    return EditorLanguages.PROPERTIES;
  }

  return LANGUAGE_BY_EXTENSION[fileExtension(leaf)] || EditorLanguages.TEXT;
}

/**
 * The folder "extract here" proposes for a zip: its own name without the extension.
 *
 * @param {string} name
 * @returns {string}
 */
export function defaultExtractName(name) {
  const leaf = String(name ?? '');
  const dot = leaf.lastIndexOf('.');

  return dot > 0 ? leaf.slice(0, dot) : `${leaf}-extracted`;
}

/**
 * POSIX modes travel as strings (`"0644"`), because a number would lose the leading zero the
 * moment anyone `JSON.parse`s it. Only a three or four digit octal is accepted.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isModeValid(value) {
  return /^[0-7]{3,4}$/.test(String(value ?? '').trim());
}

/**
 * `GET /api/panel/servers/:id/files?path=` — one directory listing (§2.4.4).
 *
 * The page's `load` and the file manager's own navigation both come through here, so SSR and
 * the client parse the same answer. Nothing throws: an unsafe path never leaves the browser
 * (`denied`), a build without the endpoint answers `unavailable`, and a node that cannot be
 * reached answers `error` — the page shows its listing-failed state for all three.
 *
 * @param {number|string} serverId
 * @param {string} path relative to the server directory; `''` is the root.
 * @param {import('@sveltejs/kit').LoadEvent | Request} [request] pass the load event for SSR.
 * @returns {Promise<{ status: string, error?: string, path: string, entries: FileEntry[] }>}
 */
export async function fetchServerFiles(serverId, path, request) {
  const target = normalizePath(path);

  if (!isPathSafe(target)) {
    return { status: 'denied', path: target, entries: [] };
  }

  const body = await ApiUtil.get({
    path: `/api/panel/servers/${serverId}/files?path=${encodeURIComponent(target)}`,
    request,
    handler: (/** @type {object} */ response) => response,
  });

  // `undefined`/`null` is the network-error path — ApiUtil already raised the offline splash.
  if (body === undefined || body === null) {
    return { status: 'network', path: target, entries: [] };
  }

  if (isEndpointUnavailable(body)) {
    return { status: 'unavailable', path: target, entries: [] };
  }

  if (body.error) {
    return { status: 'error', error: String(body.error), path: target, entries: [] };
  }

  return { status: 'ok', path: target, entries: normalizeEntries(body.entries) };
}
