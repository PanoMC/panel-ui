/**
 * Brand marks and fallback icons for the Minecraft server software Pano can install or talk to.
 *
 * The panel names a server's software in a handful of places — the create-server wizard, the
 * server cards, the server header — and a bare string is hard to scan. This module is the single place that maps a software id to its bundled logo, so the
 * files in `static/assets/img/software/` are referenced from exactly one spot.
 *
 * Ids arrive in two shapes and both are accepted: `/api/panel/software` reports them lowercase
 * (`paper`, `velocity`) while a connected server reports `server.type` uppercase (`PAPER`,
 * `VELOCITY`), so every lookup lowercases first.
 *
 * Logos are shipped with the panel — nothing is fetched from a project's own site at render
 * time. `SOFTWARE-LOGOS.md` in the repo root records where each file came from.
 */

import { base } from '$app/paths';

/** Where the bundled marks live, relative to the panel's base path. */
const LOGO_DIR = 'assets/img/software';

/**
 * Per-software metadata. `logo` is a file name inside {@link LOGO_DIR}, or a path relative to
 * `static/` when the mark is shared with another part of the panel; `icon` is the Font Awesome
 * class used when there is no logo or the image fails to load.
 *
 * Paper, Folia, Velocity and Waterfall are all PaperMC projects and share the PaperMC mark —
 * the projects do not publish separate square marks.
 *
 * @type {Readonly<Record<string, { logo: string | null, icon: string, label: string }>>}
 */
const SOFTWARE = Object.freeze({
  paper: { logo: `${LOGO_DIR}/papermc.svg`, icon: 'fa-solid fa-scroll', label: 'Paper' },
  folia: { logo: `${LOGO_DIR}/papermc.svg`, icon: 'fa-solid fa-layer-group', label: 'Folia' },
  velocity: { logo: `${LOGO_DIR}/papermc.svg`, icon: 'fa-solid fa-bolt', label: 'Velocity' },
  waterfall: { logo: `${LOGO_DIR}/papermc.svg`, icon: 'fa-solid fa-water', label: 'Waterfall' },
  purpur: {
    logo: `${LOGO_DIR}/purpur.svg`,
    icon: 'fa-solid fa-wand-magic-sparkles',
    label: 'Purpur',
  },
  spigot: { logo: `${LOGO_DIR}/spigot.png`, icon: 'fa-solid fa-faucet', label: 'Spigot' },
  bungeecord: { logo: `${LOGO_DIR}/spigot.png`, icon: 'fa-solid fa-shuffle', label: 'BungeeCord' },
  fabric: { logo: `${LOGO_DIR}/fabric.png`, icon: 'fa-solid fa-scroll', label: 'Fabric' },
  quilt: { logo: `${LOGO_DIR}/quilt.svg`, icon: 'fa-solid fa-table-cells', label: 'Quilt' },
  forge: { logo: `${LOGO_DIR}/forge.png`, icon: 'fa-solid fa-hammer', label: 'Forge' },
  neoforge: { logo: `${LOGO_DIR}/neoforge.png`, icon: 'fa-solid fa-hammer', label: 'NeoForge' },
  // Vanilla has no mark we may ship: "Minecraft" is a Mojang trademark. The panel's own neutral
  // cube icon stands in for it.
  vanilla: { logo: 'assets/img/minecraft-icon.png', icon: 'fa-solid fa-cube', label: 'Vanilla' },
  // Not a software but a value `server.type` can carry on a server Pano only linked to.
  unknown: { logo: null, icon: 'fa-solid fa-cube', label: '' },
});

/** The icon shown for a software that has no entry here. */
const FALLBACK_ICON = 'fa-solid fa-cube';

/**
 * @param {string | null | undefined} id
 * @returns {{ logo: string | null, icon: string, label: string } | null}
 */
function entryFor(id) {
  const key = String(id ?? '')
    .trim()
    .toLowerCase();

  return key && Object.prototype.hasOwnProperty.call(SOFTWARE, key) ? SOFTWARE[key] : null;
}

/**
 * @param {string | null | undefined} id A software id in either case, e.g. `paper` or `PAPER`.
 * @returns {string} the URL of the bundled logo, or `''` when the software has none.
 */
export function softwareLogo(id) {
  const logo = entryFor(id)?.logo;

  return logo ? `${base}/${logo}` : '';
}

/**
 * @param {string | null | undefined} id
 * @returns {string} the Font Awesome classes to show when there is no logo, never empty.
 */
export function softwareIcon(id) {
  return entryFor(id)?.icon || FALLBACK_ICON;
}

/**
 * @param {string | null | undefined} id
 * @returns {string} the software's proper name, or the id as given when it is not known here.
 */
export function softwareLabel(id) {
  return entryFor(id)?.label || String(id ?? '').trim();
}
