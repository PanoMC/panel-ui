import * as React from 'react';
import { TicketRow } from '@panomc/panel-ui';

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
  CreeperSlayer99: face('#b98b60', '#4a341f', '#3a5a9a'),
  EnderQueen: face('#d8a077', '#3a2a4a', '#7a3aa8'),
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

// TicketRow binds into `$checkedList[id]` — a svelte store contract, so a
// minimal hand-rolled writable keeps the preview free of a second svelte copy.
const writable = (value: Record<string, boolean>) => {
  const subs = new Set<(v: Record<string, boolean>) => void>();
  return {
    subscribe(fn: (v: Record<string, boolean>) => void) {
      subs.add(fn);
      fn(value);
      return () => subs.delete(fn);
    },
    set(v: Record<string, boolean>) {
      value = v;
      subs.forEach((fn) => fn(value));
    },
    update(fn: (v: Record<string, boolean>) => Record<string, boolean>) {
      this.set(fn(value));
    },
  };
};

const Table = ({ children }: { children: React.ReactNode }) => {
  useImgFallback();
  return (
    <div className="card">
      <style>{`.ds-rt > [data-pano-component]{display:table-row-group;}`}</style>
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0 ds-rt">
          <thead>
            <tr>
              {['', '#', 'Title', 'Category', 'Player', 'Status', 'Last Update'].map((c, i) => (
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

export const NewTicket = () => (
  <Table>
    <TicketRow
      checkedList={writable({})}
      ticket={{
        id: 148,
        title: 'Lost my items after the server crash last night',
        category: { id: 1, title: 'Bug Report', url: 'bug-report' },
        writer: { username: 'CreeperSlayer99' },
        status: 'NEW',
        lastUpdate: Date.now() - 3 * HOUR,
      }}
    />
  </Table>
);

export const RepliedTicket = () => (
  <Table>
    <TicketRow
      checkedList={writable({})}
      ticket={{
        id: 147,
        title: 'Cannot claim land next to my base in survival',
        category: { id: 2, title: 'Player Support', url: 'player-support' },
        writer: { username: 'EnderQueen' },
        status: 'REPLIED',
        lastUpdate: Date.now() - 1 * DAY,
      }}
    />
  </Table>
);

export const ClosedAndSelected = () => (
  <Table>
    <TicketRow
      checkedList={writable({ 139: true })}
      ticket={{
        id: 139,
        title: 'Ban appeal — I was AFK during the raid',
        category: { id: 3, title: 'Ban Appeal', url: 'ban-appeal' },
        writer: { username: 'xX_Griefer_Xx' },
        status: 'CLOSED',
        lastUpdate: Date.now() - 6 * DAY,
        selected: true,
      }}
    />
  </Table>
);

export const UncategorizedTicket = () => (
  <Table>
    <TicketRow
      checkedList={writable({})}
      ticket={{
        id: 150,
        title: 'Suggestion: add a weekly parkour event',
        category: { id: null, title: '-', url: '-' },
        writer: { username: 'Alex' },
        status: 'NEW',
        lastUpdate: Date.now() - 20 * 60 * 1000,
      }}
    />
  </Table>
);
