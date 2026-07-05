import * as React from 'react';
import { IpBanRow } from '@panomc/panel-ui';

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

const Table = ({ children }: { children: React.ReactNode }) => {
  useImgFallback();
  return (
    <div className="card">
      {/* Clamp the reason / banned-by columns (component allows up to 280/180px)
          so all 7 columns — Date included — fit the card without the
          .table-responsive scroller clipping the right edge in the shot. */}
      <style>{`.ds-rt > [data-pano-component]{display:table-row-group;}
        .ds-rt tr > *:nth-child(4){max-width:150px !important;}
        .ds-rt tr > *:nth-child(6){max-width:120px !important;}`}</style>
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0 ds-rt">
          <thead>
            <tr>
              {['', 'IP Address', 'Remaining', 'Reason', 'Source', 'Banned By', 'Date'].map(
                (c, i) => (
                  <th key={i} scope="col" className="text-nowrap">
                    {c}
                  </th>
                ),
              )}
            </tr>
          </thead>
          {children}
        </table>
      </div>
    </div>
  );
};

const DAY = 24 * 60 * 60 * 1000;

export const ActiveTemporaryBan = () => (
  <Table>
    <IpBanRow
      bannedIp={{
        id: 11,
        ip: '203.0.113.42',
        bannedUntil: Date.now() + 6 * DAY + 3 * 60 * 60 * 1000,
        reason: 'Bot attack on login server',
        source: 'PANEL',
        bannedBy: 'Herobrine',
        createdAt: Date.now() - 1 * DAY,
      }}
    />
  </Table>
);

export const PermanentBan = () => (
  <Table>
    <IpBanRow
      bannedIp={{
        id: 12,
        ip: '198.51.100.7',
        bannedUntil: null,
        reason: 'VPN used for ban evasion',
        source: 'SERVER',
        bannedBy: 'Alex',
        createdAt: Date.now() - 20 * DAY,
      }}
    />
  </Table>
);

export const ExpiredSystemBan = () => (
  <Table>
    <IpBanRow
      bannedIp={{
        id: 13,
        ip: '192.0.2.190',
        bannedUntil: Date.now() - 2 * DAY,
        reason: null,
        source: null,
        bannedBy: null,
        createdAt: Date.now() - 9 * DAY,
      }}
    />
  </Table>
);
