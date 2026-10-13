import { expect, mock, test } from 'bun:test';

import { stubClient } from './pages/view/frontend/testkit.js';

// files.util pulls the SvelteKit environment, the HTTP client and the toasts; none is under test.
mock.module('$app/environment', () => ({ browser: false, dev: false, building: false }));
mock.module('$lib/api.util', () => ({ default: stubClient(), buildQueryParams: () => '' }));
mock.module('$lib/api.util.js', () => ({ default: stubClient(), buildQueryParams: () => '' }));
mock.module('$lib/components/ToastContainer.svelte', () => ({
  showSuccess: () => {},
  showError: () => {},
  show: () => {},
}));

const { filesFromDataTransfer, filesFromFolderInput } = await import('./files.util.js');

test('a picked folder keeps each file in its place', () => {
  const picked = filesFromFolderInput([
    { name: 'a.yml', webkitRelativePath: 'plugins/Essentials/a.yml' },
    { name: 'b.jar', webkitRelativePath: 'plugins/b.jar' },
    { name: 'c.txt', webkitRelativePath: '' },
  ]);
  expect(picked.map((p) => p.dir)).toEqual(['plugins/Essentials', 'plugins', '']);
});

test('a dropped folder is walked, batch by batch, and an empty folder is kept', async () => {
  const file = (name) => ({ isFile: true, name, file: (ok) => ok({ name }) });
  const dir = (name, children) => ({
    isDirectory: true,
    name,
    createReader() {
      let left = [children.slice(0, 1), children.slice(1), []];
      return { readEntries: (ok) => ok(left.shift()) };
    },
  });
  const transfer = {
    items: [
      {
        kind: 'file',
        webkitGetAsEntry: () =>
          dir('world', [
            file('level.dat'),
            dir('region', [file('r.0.0.mca')]),
            dir('playerdata', []),
          ]),
      },
      { kind: 'file', webkitGetAsEntry: () => file('server.properties') },
      { kind: 'string', webkitGetAsEntry: () => null },
    ],
  };
  const got = await filesFromDataTransfer(transfer);
  expect(got.map((p) => `${p.dir}|${p.file?.name ?? ''}`)).toEqual([
    'world|level.dat',
    'world/region|r.0.0.mca',
    'world/playerdata|',
    '|server.properties',
  ]);
});
