import * as React from 'react';
import { NotificationContainer } from '@panomc/panel-ui';

// The container fills itself from GET /api/panel/notifications/quick on mount.
// Serve that endpoint from the preview, exactly shaped like the backend
// response, so the real fetch → store → toast pipeline runs.
const now = Date.now();
const demoNotifications = [
  {
    id: 101,
    type: 'NEW_TICKET',
    status: 'NOT_READ',
    createdAt: String(now - 4 * 60 * 1000),
    details: { username: 'Alex', id: 42, faIcon: 'fa-solid fa-ticket' },
  },
  {
    id: 102,
    type: 'PANO_UPDATE_FOUND',
    status: 'NOT_READ',
    createdAt: String(now - 32 * 60 * 1000),
    details: { faIcon: 'fa-solid fa-download' },
  },
];

let patched = false;
function patchFetch() {
  if (patched) return;
  patched = true;
  const orig = window.fetch.bind(window);
  window.fetch = ((input: any, init?: any) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (url.includes('notifications/quick')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            result: 'ok',
            notifications: demoNotifications,
            notificationCount: demoNotifications.length,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    }
    return orig(input, init);
  }) as typeof window.fetch;
}

const Quick = () => {
  patchFetch();
  React.useEffect(() => {
    try {
      (window as any).bootstrap.Toast.Default.autohide = false;
    } catch {}
    const keep = setInterval(() => {
      document.querySelectorAll('.toast').forEach((el) => el.classList.add('show'));
    }, 250);
    return () => clearInterval(keep);
  }, []);
  return (
    <>
      <style>{`.toast-container{position:static !important; transform:none !important; display:block !important;} .toast{display:block !important; opacity:1 !important;}`}</style>
      <div style={{ minHeight: 140 }}>
        <NotificationContainer />
      </div>
    </>
  );
};

export const QuickNotifications = () => <Quick />;
