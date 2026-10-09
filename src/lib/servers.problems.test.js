import { describe, expect, mock, test } from 'bun:test';

import { stubClient } from './pages/view/frontend/testkit.js';

// servers.util pulls the SvelteKit environment, the HTTP client and the toasts; none is under test.
mock.module('$app/environment', () => ({ browser: false, dev: false, building: false }));
mock.module('$lib/api.util', () => ({ default: stubClient(), buildQueryParams: () => '' }));
mock.module('$lib/components/ToastContainer.svelte', () => ({
  showSuccess: () => {},
  showError: () => {},
  show: () => {},
}));

const { isPluginUnreachable, serverProblems, unreachableDaemon } =
  await import('./servers.util.js');

const keys = (server) => serverProblems(server).map((problem) => problem.key);
const P = 'components.modals.servers.problems.';

describe('serverProblems', () => {
  test('nothing wrong gives no problems', () => {
    expect(serverProblems(null)).toEqual([]);
    expect(serverProblems({ panoPluginUpdate: { outdatedProtocol: false } })).toEqual([]);
  });

  test('a connected plugin on an older protocol is the partly compatible case', () => {
    expect(
      keys({ panoPluginUpdate: { outdatedProtocol: true, unreachableProtocol: false } }),
    ).toEqual([`${P}plugin-outdated`]);
  });

  test('a plugin too old to reach this Pano says so, not the old wording', () => {
    const server = {
      status: 'OFFLINE',
      panoPluginUpdate: { outdatedProtocol: false, unreachableProtocol: true },
    };

    expect(isPluginUnreachable(server)).toBe(true);
    expect(keys(server)).toEqual([`${P}plugin-unreachable`]);
    // Both flags at once never print two plugin sentences.
    expect(
      keys({ panoPluginUpdate: { outdatedProtocol: true, unreachableProtocol: true } }),
    ).toEqual([`${P}plugin-unreachable`]);
  });

  test('a node or agent too old to reach this Pano replaces the partly compatible sentence', () => {
    expect(
      keys({
        nodeOutdated: true,
        nodeUnreachable: { name: 'n', downloadPath: '/api/v1/node/pano-node.jar' },
      }),
    ).toEqual([`${P}node-unreachable`]);
    expect(
      keys({
        agent: true,
        nodeUnreachable: { agent: true, downloadPath: '/api/v1/node/pano-agent.jar' },
      }),
    ).toEqual([`${P}agent-unreachable`]);
  });

  test('the old node and agent sentences stay for a connected, older daemon', () => {
    expect(keys({ nodeOutdated: true })).toEqual([`${P}node-outdated`]);
    expect(keys({ nodeOutdated: true, agent: true })).toEqual([`${P}agent-outdated`]);
  });

  test('a crash and an unreachable jar are both listed', () => {
    expect(
      keys({
        processState: 'CRASHED',
        panoPluginUpdate: { unreachableProtocol: true },
      }),
    ).toEqual([`${P}crashed`, `${P}plugin-unreachable`]);
  });
});

describe('unreachableDaemon', () => {
  test('null without the field', () => {
    expect(unreachableDaemon({})).toBeNull();
    expect(unreachableDaemon(null)).toBeNull();
  });

  test('keeps a download path of this Pano and drops a foreign one', () => {
    expect(
      unreachableDaemon({ nodeUnreachable: { downloadPath: '/api/v1/node/x.jar' } })?.downloadPath,
    ).toBe('/api/v1/node/x.jar');
    expect(
      unreachableDaemon({ nodeUnreachable: { downloadPath: 'https://evil.example/x' } })
        ?.downloadPath,
    ).toBeNull();
    expect(
      unreachableDaemon({ nodeUnreachable: { downloadPath: '//evil.example/x' } })?.downloadPath,
    ).toBeNull();
  });
});
