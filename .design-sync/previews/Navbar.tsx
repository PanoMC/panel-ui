import * as React from 'react';
import { Navbar, NotificationContainer, panoStores } from '@panomc/panel-ui';

// The demo context seeds sidebarTabsState with 'site', but the app only uses
// 'website' | 'game' — set the real value so the left zone renders.
(panoStores as any).sidebarTabsState?.set?.('website');

// The demo context has no /api/profile/picture endpoint, so the avatar <img>
// 404s. Swap failed images for a pixel-art Steve-style avatar data URI.
const AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" shape-rendering="crispEdges">` +
      `<rect width="8" height="8" fill="#b58868"/>` +
      `<rect width="8" height="2" fill="#5b3f27"/>` +
      `<rect x="0" y="2" width="1" height="1" fill="#5b3f27"/><rect x="7" y="2" width="1" height="1" fill="#5b3f27"/>` +
      `<rect x="1" y="3" width="2" height="1" fill="#ffffff"/><rect x="5" y="3" width="2" height="1" fill="#ffffff"/>` +
      `<rect x="2" y="3" width="1" height="1" fill="#523d89"/><rect x="5" y="3" width="1" height="1" fill="#523d89"/>` +
      `<rect x="3" y="5" width="2" height="1" fill="#8a5a3b"/>` +
      `<rect x="2" y="6" width="4" height="1" fill="#7a4f33"/>` +
    `</svg>`,
  );

const useAvatarFallback = (ref: React.RefObject<HTMLDivElement | null>) => {
  React.useEffect(() => {
    const fix = () => {
      ref.current?.querySelectorAll('img').forEach((img) => {
        if (img.dataset.dsFixed) return;
        if (img.complete && img.naturalWidth === 0) {
          img.dataset.dsFixed = '1';
          img.src = AVATAR;
        } else if (!img.complete) {
          img.addEventListener(
            'error',
            () => {
              img.dataset.dsFixed = '1';
              img.src = AVATAR;
            },
            { once: true },
          );
        }
      });
    };
    const t1 = setInterval(fix, 150);
    const t2 = setTimeout(() => clearInterval(t1), 2500);
    return () => {
      clearInterval(t1);
      clearTimeout(t2);
    };
  }, [ref]);
};

// Canonical top navbar: sidebar toggler + Website link, page title,
// notifications (3 unread), theme picker, account avatar.
export const WebsiteTab = () => {
  const ref = React.useRef<HTMLDivElement>(null);
  useAvatarFallback(ref);
  return (
    <div ref={ref} style={{ minWidth: 720 }}>
      <Navbar />
    </div>
  );
};

// Navbar never fetches the quick notifications itself — NotificationContainer
// does (GET /api/panel/notifications/quick) and fills the shared
// quickNotifications store the dropdown renders from. Serve that endpoint
// from the preview and mount a hidden NotificationContainer so the real
// fetch → store → dropdown pipeline runs, and the list matches the badge.
// Two notifications: the card's declared 1100x420 viewport can't fit the
// dropdown with three wrapped rows — "Show All" would clip at the bottom.
const now = Date.now();
const demoNotifications = [
  {
    id: 201,
    type: 'NEW_TICKET',
    status: 'NOT_READ',
    createdAt: String(now - 4 * 60 * 1000),
    details: { username: 'CreeperSlayer99', id: 148, faIcon: 'fa-solid fa-ticket' },
  },
  {
    id: 203,
    type: 'PANO_UPDATE_FOUND',
    status: 'NOT_READ',
    createdAt: String(now - 2 * 60 * 60 * 1000),
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
    if (url.includes('markAsRead')) {
      // Keep the badge count stable while the dropdown is being screenshotted.
      return Promise.resolve(
        new Response(JSON.stringify({ result: 'ok', notificationCount: 2 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    }
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

// Notifications dropdown opened with 3 unread quick notifications + Show All
export const NotificationsOpen = () => {
  patchFetch();
  const ref = React.useRef<HTMLDivElement>(null);
  useAvatarFallback(ref);
  React.useEffect(() => {
    const t = setTimeout(() => {
      const btn = ref.current?.querySelector<HTMLElement>(
        '#quickNotificationsDropdown [data-bs-toggle="dropdown"]',
      );
      btn?.click();
    }, 400);
    return () => clearTimeout(t);
  }, []);
  return (
    <div ref={ref} style={{ minWidth: 720, minHeight: 440 }}>
      {/* hidden: only here to run the quick-notifications fetch pipeline */}
      <div style={{ display: 'none' }}>
        <NotificationContainer />
      </div>
      <Navbar />
    </div>
  );
};
