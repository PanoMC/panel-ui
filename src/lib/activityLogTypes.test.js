import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

import { logClasses, PENDING, typeOf } from '../../scripts/refresh-activity-log-types.js';

const types = JSON.parse(readFileSync(new URL('./activityLogTypes.json', import.meta.url)));

describe('activity log texts', () => {
  for (const locale of ['en-US', 'tr', 'ru']) {
    test(`${locale} has a text for every type the backend can write`, () => {
      const lang = JSON.parse(readFileSync(new URL(`../../lang/${locale}.json`, import.meta.url)));
      const missing = types.filter((type) => typeof lang['activity-logs'][type] !== 'string');

      // Add the text, or run `bun scripts/refresh-activity-log-types.js` if the list is stale.
      expect(missing).toEqual([]);
    });
  }

  test('the list is sorted, without duplicates, and holds the pending webhook types', () => {
    expect([...new Set(types)].sort()).toEqual(types);

    for (const type of PENDING) expect(types).toContain(type);
  });

  test('a type is the class name in upper snake case without Log', () => {
    expect(typeOf('UpdatedFrontendOriginsLog')).toBe('UPDATED_FRONTEND_ORIGINS');
    expect(typeOf('NewLocaleLog')).toBe('NEW_LOCALE');
  });

  test('log classes are read with default values and sibling classes', () => {
    const source = `
class ALog(
    userId: Long,
    action: String = "x",
) : PanelActivityLog(
    userId = userId,
    details = JsonObject().put("a", 1)
)

class NotALog(val x: Int) : Other()

class BLog(userId: Long) : PanelActivityLog(userId = userId)
open class PluginActivityLog(userId: Long) : PanelActivityLog(userId = userId)
`;

    expect(logClasses(source)).toEqual(['ALog', 'BLog']);
  });
});
