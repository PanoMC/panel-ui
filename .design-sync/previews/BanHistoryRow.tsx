import * as React from 'react';
import { BanHistoryRow } from '@panomc/panel-ui';

// Pixel-face avatar fallback: profile pictures come from /panel/api which is
// absent in previews, so failed avatar imgs get a Minecraft-style face.
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
const pickImg = (img: HTMLImageElement) => {
  const m = img.src.match(/profile\/picture\/([^?]+)/);
  if (m) return FACES[decodeURIComponent(m[1])] ?? face('#b98b60', '#4a341f', '#3a5a9a');
  return null;
};
const useImgFallback = () =>
  React.useEffect(() => {
    const fix = (img: HTMLImageElement) => {
      if (img.dataset.dsFixed) return;
      const src = pickImg(img);
      if (src) {
        img.dataset.dsFixed = '1';
        img.src = src;
      }
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

// The bridge hosts each row in a div; display:table-row-group slots it into
// the table like a tbody so Bootstrap `.table > * > * > *` cell styles apply.
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

const DAY = 24 * 60 * 60 * 1000;
const COLS = ['Duration', 'Reason', 'E-mail', 'Banned By', 'Source', 'Date'];

export const TemporaryBan = () => (
  <Table cols={COLS}>
    <BanHistoryRow
      banHistory={{
        id: 71,
        bannedAt: Date.now() - 2 * DAY,
        bannedUntil: Date.now() + 5 * DAY,
        reason: 'X-ray texture pack confirmed by anti-cheat',
        emailNotified: true,
        bannedBy: 'Herobrine',
        source: 'PANEL',
      }}
    />
  </Table>
);

export const PermanentSystemBan = () => (
  <Table cols={COLS}>
    <BanHistoryRow
      banHistory={{
        id: 72,
        bannedAt: Date.now() - 14 * DAY,
        bannedUntil: null,
        reason: null,
        emailNotified: false,
        bannedBy: null,
        source: null,
      }}
    />
  </Table>
);

export const PlayerBanHistory = () => (
  <Table cols={['Player', ...COLS]}>
    <BanHistoryRow
      showBannedPlayer
      banHistory={{
        id: 73,
        username: 'xX_Griefer_Xx',
        bannedAt: Date.now() - 1 * DAY,
        bannedUntil: Date.now() + 30 * DAY,
        reason: 'Griefing spawn builds with TNT',
        emailNotified: true,
        bannedBy: 'Herobrine',
        source: 'SERVER',
      }}
    />
    <BanHistoryRow
      showBannedPlayer
      banHistory={{
        id: 74,
        username: 'CreeperSlayer99',
        bannedAt: Date.now() - 40 * DAY,
        bannedUntil: null,
        reason: 'Chargeback on store purchase',
        emailNotified: false,
        bannedBy: 'Alex',
        source: 'PANEL',
      }}
    />
  </Table>
);
