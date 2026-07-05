import * as React from 'react';
import { PlayerRow } from '@panomc/panel-ui';

const face = (skin: string, hair: string, eye: string) =>
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" shape-rendering="crispEdges">` +
      `<rect width="8" height="8" fill="${skin}"/><rect width="8" height="2" fill="${hair}"/>` +
      `<rect y="2" width="1" height="1" fill="${hair}"/><rect x="7" y="2" width="1" height="1" fill="${hair}"/>` +
      `<rect x="1" y="4" width="1" height="1" fill="#ffffff"/><rect x="2" y="4" width="1" height="1" fill="${eye}"/>` +
      `<rect x="5" y="4" width="1" height="1" fill="${eye}"/><rect x="6" y="4" width="1" height="1" fill="#ffffff"/>` +
      `<rect x="3" y="6" width="2" height="1" fill="#8a5a3a"/></svg>`,
  );
const FACES: Record<string, string> = {
  Herobrine: face('#c68e5f', '#2e2620', '#e8e8e8'),
  Alex: face('#d8a077', '#c46d2c', '#4a7a3a'),
  CreeperSlayer99: face('#b98b60', '#4a341f', '#3a5a9a'),
  xX_Griefer_Xx: face('#a87a52', '#1e1a16', '#8a2a2a'),
};
const useImgFallback = () =>
  React.useEffect(() => {
    const fix = (img: HTMLImageElement) => {
      if (img.dataset.dsFixed) return;
      const m = img.src.match(/profile\/picture\/([^?]+)/);
      if (!m) return;
      img.dataset.dsFixed = '1';
      img.src = FACES[decodeURIComponent(m[1])] ?? face('#b98b60', '#4a341f', '#3a5a9a');
    };
    const h = (e: Event) => {
      const t = e.target as HTMLImageElement;
      if (t && t.tagName === 'IMG') fix(t);
    };
    document.addEventListener('error', h, true);
    const iv = setInterval(() => {
      document.querySelectorAll('img').forEach((im) => {
        const i = im as HTMLImageElement;
        if (i.complete && i.naturalWidth === 0) fix(i);
      });
    }, 200);
    const stop = setTimeout(() => clearInterval(iv), 3000);
    return () => {
      document.removeEventListener('error', h, true);
      clearInterval(iv);
      clearTimeout(stop);
    };
  }, []);

const Table = ({ cols, children }: { cols: string[]; children: React.ReactNode }) => {
  useImgFallback();
  return (
    <div className="card">
      <style>{`.ds-rt > [data-pano-component]{display:table-row-group;}`}</style>
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0 ds-rt">
          <thead>
            <tr>
              {cols.map((c, i) => (
                <th key={i} scope="col" className="text-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          {children}
        </table>
      </div>
    </div>
  );
};

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const COLS = ['', 'Player', 'Permission Group', 'Status', 'Last Login', 'Registered'];

export const OnlinePlayer = () => (
  <Table cols={COLS}>
    <PlayerRow
      checkTime={Date.now()}
      player={{
        id: 7,
        username: 'Alex',
        permissionGroup: { id: 2, name: 'moderator', displayName: 'moderator' },
        isBanned: false,
        inGame: 1,
        lastActivityTime: Date.now() - 2 * 60 * 1000,
        lastLoginDate: Date.now() - 3 * HOUR,
        registerDate: Date.now() - 120 * DAY,
      }}
    />
  </Table>
);

export const OfflinePlayer = () => (
  <Table cols={COLS}>
    <PlayerRow
      checkTime={Date.now()}
      player={{
        id: 8,
        username: 'CreeperSlayer99',
        permissionGroup: { id: 4, name: 'vip', displayName: 'vip' },
        isBanned: false,
        inGame: 0,
        lastActivityTime: Date.now() - 4 * DAY,
        lastLoginDate: Date.now() - 4 * DAY,
        registerDate: Date.now() - 300 * DAY,
      }}
    />
  </Table>
);

export const BannedPlayer = () => (
  <Table cols={COLS}>
    <PlayerRow
      checkTime={Date.now()}
      player={{
        id: 9,
        username: 'xX_Griefer_Xx',
        permissionGroup: { id: 5, name: '-', displayName: 'player' },
        isBanned: true,
        inGame: 0,
        lastActivityTime: Date.now() - 12 * DAY,
        lastLoginDate: Date.now() - 12 * DAY,
        registerDate: Date.now() - 60 * DAY,
      }}
    />
  </Table>
);

export const BannedListRow = () => (
  <Table cols={['', 'Player', 'Permission Group', 'Banned At', 'Registered']}>
    <PlayerRow
      hideStatus
      player={{
        id: 9,
        username: 'xX_Griefer_Xx',
        permissionGroup: { id: 5, name: '-', displayName: 'player' },
        isBanned: true,
        bannedAt: Date.now() - 2 * DAY,
        registerDate: Date.now() - 60 * DAY,
      }}
    />
  </Table>
);
