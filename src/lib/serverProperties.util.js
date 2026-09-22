/**
 * The vanilla `server.properties` catalogue the Server properties page edits (§2.4.30).
 *
 * Every key the current Java server writes into a fresh file, with what the page needs to offer
 * the right control for it: a switch for a boolean, a bounded number, a select for the few fixed
 * vocabularies, a password field for a secret and a text box for the rest. `def` is the value a
 * fresh server starts with, which is what "Reset" restores and what the "changed" mark compares
 * against.
 *
 * The file may hold keys that are not here — a fork's own, or one a newer server added — and the
 * page shows those in a group of their own, editable as plain text. Only `server-port` is kept
 * out of reach: it is the startup port, allocated by the node and set on the Startup tab.
 *
 * Labels and help live in the locale files under `pages.servers.properties.keys.<key>`, so this
 * module stays data only.
 */

/**
 * @typedef {{ type: 'text' | 'bool' | 'int' | 'enum' | 'secret', def: string, min?: number, max?: number, options?: string[] }} PropertySpec
 */

/** Keys the page shows but never writes; they are managed on another settings tab. */
export const RESERVED_PROPERTY_KEYS = Object.freeze(['server-port']);

/**
 * @type {Readonly<Record<string, PropertySpec>>}
 */
export const PROPERTY_SPECS = Object.freeze({
  // General
  motd: { type: 'text', def: 'A Minecraft Server' },
  'max-players': { type: 'int', def: '20', min: 0, max: 2147483647 },
  'online-mode': { type: 'bool', def: 'true' },
  'white-list': { type: 'bool', def: 'false' },
  'enforce-whitelist': { type: 'bool', def: 'false' },
  difficulty: { type: 'enum', def: 'easy', options: ['peaceful', 'easy', 'normal', 'hard'] },
  gamemode: {
    type: 'enum',
    def: 'survival',
    options: ['survival', 'creative', 'adventure', 'spectator'],
  },
  'force-gamemode': { type: 'bool', def: 'false' },
  hardcore: { type: 'bool', def: 'false' },
  pvp: { type: 'bool', def: 'true' },
  'enable-command-block': { type: 'bool', def: 'false' },
  'pause-when-empty-seconds': { type: 'int', def: '60', min: -1, max: 2147483647 },
  'player-idle-timeout': { type: 'int', def: '0', min: 0, max: 2147483647 },
  'enable-code-of-conduct': { type: 'bool', def: 'false' },
  // World
  'level-name': { type: 'text', def: 'world' },
  'level-seed': { type: 'text', def: '' },
  'level-type': {
    type: 'enum',
    def: 'minecraft:normal',
    options: [
      'minecraft:normal',
      'minecraft:flat',
      'minecraft:large_biomes',
      'minecraft:amplified',
      'minecraft:single_biome_surface',
    ],
  },
  'generator-settings': { type: 'text', def: '{}' },
  'generate-structures': { type: 'bool', def: 'true' },
  'allow-nether': { type: 'bool', def: 'true' },
  'spawn-monsters': { type: 'bool', def: 'true' },
  'spawn-protection': { type: 'int', def: '16', min: 0, max: 29999984 },
  'max-world-size': { type: 'int', def: '29999984', min: 1, max: 29999984 },
  'initial-enabled-packs': { type: 'text', def: 'vanilla' },
  'initial-disabled-packs': { type: 'text', def: '' },
  // Performance
  'view-distance': { type: 'int', def: '10', min: 3, max: 32 },
  'simulation-distance': { type: 'int', def: '10', min: 3, max: 32 },
  'entity-broadcast-range-percentage': { type: 'int', def: '100', min: 10, max: 1000 },
  'max-tick-time': { type: 'int', def: '60000', min: -1, max: 9223372036854775807 },
  'max-chained-neighbor-updates': { type: 'int', def: '1000000', min: -1, max: 2147483647 },
  'network-compression-threshold': { type: 'int', def: '256', min: -1, max: 2147483647 },
  'rate-limit': { type: 'int', def: '0', min: 0, max: 2147483647 },
  'sync-chunk-writes': { type: 'bool', def: 'true' },
  'use-native-transport': { type: 'bool', def: 'true' },
  'region-file-compression': { type: 'enum', def: 'deflate', options: ['deflate', 'lz4', 'none'] },
  // Players
  'allow-flight': { type: 'bool', def: 'false' },
  'op-permission-level': { type: 'int', def: '4', min: 0, max: 4 },
  'function-permission-level': { type: 'int', def: '2', min: 1, max: 4 },
  'hide-online-players': { type: 'bool', def: 'false' },
  'enforce-secure-profile': { type: 'bool', def: 'true' },
  'broadcast-console-to-ops': { type: 'bool', def: 'true' },
  'broadcast-rcon-to-ops': { type: 'bool', def: 'true' },
  'accepts-transfers': { type: 'bool', def: 'false' },
  'log-ips': { type: 'bool', def: 'true' },
  'bug-report-link': { type: 'text', def: '' },
  'text-filtering-config': { type: 'text', def: '' },
  'text-filtering-version': { type: 'int', def: '0', min: 0, max: 2147483647 },
  'chat-spam-threshold-seconds': { type: 'int', def: '10', min: 0, max: 2147483647 },
  'command-spam-threshold-seconds': { type: 'int', def: '10', min: 0, max: 2147483647 },
  // Resource pack
  'require-resource-pack': { type: 'bool', def: 'false' },
  'resource-pack': { type: 'text', def: '' },
  'resource-pack-sha1': { type: 'text', def: '' },
  'resource-pack-id': { type: 'text', def: '' },
  'resource-pack-prompt': { type: 'text', def: '' },
  // Network
  'server-ip': { type: 'text', def: '' },
  'prevent-proxy-connections': { type: 'bool', def: 'false' },
  'enable-status': { type: 'bool', def: 'true' },
  'enable-query': { type: 'bool', def: 'false' },
  'query.port': { type: 'int', def: '25565', min: 1, max: 65535 },
  'enable-rcon': { type: 'bool', def: 'false' },
  'rcon.port': { type: 'int', def: '25575', min: 1, max: 65535 },
  'rcon.password': { type: 'secret', def: '' },
  'enable-jmx-monitoring': { type: 'bool', def: 'false' },
  'management-server-enabled': { type: 'bool', def: 'false' },
  'management-server-host': { type: 'text', def: 'localhost' },
  'management-server-port': { type: 'int', def: '0', min: 0, max: 65535 },
  'management-server-tls-enabled': { type: 'bool', def: 'true' },
  'management-server-secret': { type: 'secret', def: '' },
  'management-server-allowed-origins': { type: 'text', def: '' },
  'management-server-tls-keystore': { type: 'text', def: '' },
  'management-server-tls-keystore-password': { type: 'secret', def: '' },
  'status-heartbeat-interval': { type: 'int', def: '0', min: 0, max: 2147483647 },
  debug: { type: 'bool', def: 'false' },
});

/**
 * The page's sections, in the order they are shown. `server-port` sits in Network as a read-only
 * row so nobody goes looking for it in the file.
 *
 * @type {ReadonlyArray<{ key: string, icon: string, keys: string[] }>}
 */
export const PROPERTY_GROUPS = Object.freeze([
  {
    key: 'general',
    icon: 'fa-solid fa-sliders',
    keys: [
      'motd',
      'max-players',
      'online-mode',
      'white-list',
      'enforce-whitelist',
      'difficulty',
      'gamemode',
      'force-gamemode',
      'hardcore',
      'pvp',
      'enable-command-block',
      'pause-when-empty-seconds',
      'player-idle-timeout',
      'enable-code-of-conduct',
    ],
  },
  {
    key: 'world',
    icon: 'fa-solid fa-earth-americas',
    keys: [
      'level-name',
      'level-seed',
      'level-type',
      'generator-settings',
      'generate-structures',
      'allow-nether',
      'spawn-monsters',
      'spawn-protection',
      'max-world-size',
      'initial-enabled-packs',
      'initial-disabled-packs',
    ],
  },
  {
    key: 'performance',
    icon: 'fa-solid fa-gauge-high',
    keys: [
      'view-distance',
      'simulation-distance',
      'entity-broadcast-range-percentage',
      'max-tick-time',
      'max-chained-neighbor-updates',
      'network-compression-threshold',
      'rate-limit',
      'sync-chunk-writes',
      'use-native-transport',
      'region-file-compression',
    ],
  },
  {
    key: 'players',
    icon: 'fa-solid fa-users',
    keys: [
      'allow-flight',
      'op-permission-level',
      'function-permission-level',
      'hide-online-players',
      'enforce-secure-profile',
      'broadcast-console-to-ops',
      'broadcast-rcon-to-ops',
      'accepts-transfers',
      'log-ips',
      'bug-report-link',
      'text-filtering-config',
      'text-filtering-version',
      'chat-spam-threshold-seconds',
      'command-spam-threshold-seconds',
    ],
  },
  {
    key: 'resource-pack',
    icon: 'fa-solid fa-box-open',
    keys: [
      'require-resource-pack',
      'resource-pack',
      'resource-pack-sha1',
      'resource-pack-id',
      'resource-pack-prompt',
    ],
  },
  {
    key: 'network',
    icon: 'fa-solid fa-network-wired',
    keys: [
      'server-port',
      'server-ip',
      'prevent-proxy-connections',
      'enable-status',
      'enable-query',
      'query.port',
      'enable-rcon',
      'rcon.port',
      'rcon.password',
      'enable-jmx-monitoring',
      'management-server-enabled',
      'management-server-host',
      'management-server-port',
      'management-server-tls-enabled',
      'management-server-secret',
      'management-server-allowed-origins',
      'management-server-tls-keystore',
      'management-server-tls-keystore-password',
      'status-heartbeat-interval',
      'debug',
    ],
  },
]);

/** Every catalogued key, so "other keys" is what is left after these. */
export const KNOWN_PROPERTY_KEYS = Object.freeze(Object.keys(PROPERTY_SPECS));

/** A key the file could hold and Pano may write — the backend's own rule, mirrored here. */
const SAFE_KEY = /^[a-z0-9][a-z0-9._-]{0,63}$/;

/**
 * @param {string} key
 * @returns {boolean}
 */
export function isPropertyKeyWritable(key) {
  return SAFE_KEY.test(key) && !RESERVED_PROPERTY_KEYS.includes(key);
}

/**
 * The form's starting values: the catalogue's defaults, then what Pano stores, then — when the
 * node could read it — the file itself, which is what the server will actually start with.
 *
 * Everything is kept as the text the file holds, booleans included (`"true"`/`"false"`), so a
 * value round-trips byte for byte and a number field's empty state is simply `''`.
 *
 * @param {Record<string, unknown> | null | undefined} stored
 * @param {Record<string, unknown> | null | undefined} file
 * @returns {Record<string, string>}
 */
export function initialPropertyValues(stored, file) {
  /** @type {Record<string, string>} */
  const values = {};

  for (const [key, spec] of Object.entries(PROPERTY_SPECS)) {
    values[key] = spec.def;
  }

  for (const source of [stored, file]) {
    if (!source || typeof source !== 'object') {
      continue;
    }

    for (const [key, value] of Object.entries(source)) {
      if (value === null || value === undefined) {
        continue;
      }

      values[key] = String(value);
    }
  }

  return values;
}

/**
 * The keys of [values] the catalogue does not know, sorted — a fork's own settings, or ones a
 * newer server added — minus the reserved ones, which have a row of their own.
 *
 * @param {Record<string, unknown>} values
 * @returns {string[]}
 */
export function otherPropertyKeys(values) {
  return Object.keys(values)
    .filter((key) => !(key in PROPERTY_SPECS) && !RESERVED_PROPERTY_KEYS.includes(key))
    .sort();
}

/**
 * Whether a value is within what the control for [key] allows: a whole number within its
 * bounds, one of the options, or `true`/`false`. Free text is always fine.
 *
 * @param {string} key
 * @param {string} value
 * @returns {boolean}
 */
export function isPropertyValueValid(key, value) {
  const spec = PROPERTY_SPECS[key];

  if (!spec) {
    return true;
  }

  switch (spec.type) {
    case 'int': {
      if (!/^-?\d+$/.test(value)) {
        return false;
      }

      const number = Number(value);

      return (
        (spec.min === undefined || number >= spec.min) &&
        (spec.max === undefined || number <= spec.max)
      );
    }
    case 'bool':
      return value === 'true' || value === 'false';
    case 'enum':
      return (spec.options || []).includes(value);
    default:
      return true;
  }
}

/**
 * Which of [current] differ from [initial]: exactly what a save sends, so a key nobody touched is
 * never written — that matters most when the file could not be read and the form started from
 * stored values that may be older than what is on disk.
 *
 * @param {Record<string, string>} initial
 * @param {Record<string, string>} current
 * @returns {Record<string, string>}
 */
export function changedProperties(initial, current) {
  /** @type {Record<string, string>} */
  const changed = {};

  for (const [key, value] of Object.entries(current)) {
    if (initial[key] !== value) {
      changed[key] = value;
    }
  }

  return changed;
}
