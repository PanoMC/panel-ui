import * as React from 'react';
import { PostRow } from '@panomc/panel-ui';

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
// Minecraft-landscape banner for the post thumbnail (sky, sun, grass, tree).
const BANNER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90" shape-rendering="crispEdges">` +
      `<rect width="160" height="90" fill="#7ec9e8"/>` +
      `<rect x="120" y="12" width="18" height="18" fill="#ffd94a"/>` +
      `<rect y="58" width="160" height="8" fill="#7dbb4a"/><rect y="66" width="160" height="24" fill="#69a83f"/>` +
      `<rect x="28" y="34" width="10" height="26" fill="#7a5a3a"/>` +
      `<rect x="16" y="16" width="34" height="22" fill="#3f7d2e"/>` +
      `<rect x="86" y="44" width="26" height="14" fill="#9a9a9a"/><rect x="92" y="36" width="14" height="8" fill="#9a9a9a"/>` +
      `</svg>`,
  );
const useImgFallback = () =>
  React.useEffect(() => {
    const fix = (img: HTMLImageElement) => {
      if (img.dataset.dsFixed) return;
      const m = img.src.match(/profile\/picture\/([^?]+)/);
      img.dataset.dsFixed = '1';
      img.src = m ? (FACES[decodeURIComponent(m[1])] ?? face('#b98b60', '#4a341f', '#3a5a9a')) : BANNER;
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
      <style>{`.ds-rt > [data-pano-component]{display:table-row-group;}`}</style>
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0 ds-rt">
          <thead>
            <tr>
              {['', '', 'Title', 'Category', 'Views', 'Writer', 'Date'].map((c, i) => (
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

export const PublishedPost = () => (
  <Table>
    <PostRow
      pageType="PUBLISHED"
      buttonsLoading={false}
      post={{
        id: 42,
        title: 'Season 8 Reset Announcement — new world border, new dungeons',
        category: { id: 1, title: 'Announcements', url: 'announcements' },
        views: 1873,
        writer: { username: 'Herobrine' },
        date: Date.now() - 2 * DAY,
        thumbnailUrl: 'https://demo.panomc.local/uploads/posts/season-8-reset.png',
      }}
    />
  </Table>
);

export const DraftWithoutThumbnail = () => (
  <Table>
    <PostRow
      pageType="DRAFT"
      buttonsLoading={false}
      post={{
        id: 43,
        title: 'Summer Build Contest — rules draft',
        category: { id: 2, title: 'Events', url: 'events' },
        views: 0,
        writer: { username: 'Alex' },
        date: Date.now() - 6 * 60 * 60 * 1000,
        thumbnailUrl: null,
      }}
    />
  </Table>
);

export const UncategorizedInTrash = () => (
  <Table>
    <PostRow
      pageType="TRASH"
      buttonsLoading={false}
      post={{
        id: 44,
        title: 'Old spawn tour video',
        category: { id: null, title: '-', url: '-' },
        views: 214,
        writer: { username: 'Alex' },
        date: Date.now() - 90 * DAY,
        thumbnailUrl: null,
      }}
    />
  </Table>
);
