import * as React from 'react';
import { Sidebar, panoStores } from '@panomc/panel-ui';

// Sidebar renders collapsed (width 0) unless isSidebarOpen is true, and the
// app only uses 'website' | 'game' tab states.
(panoStores as any).isSidebarOpen?.set?.(true);
(panoStores as any).sidebarTabsState?.set?.('website');

// The capture server only serves the bundle dir, so the brand logo
// (/assets/img/logo.svg) 404s — swap failed <img>s with a Pano-style mark.
const LOGO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">` +
      `<rect x="4" y="1" width="14" height="19" rx="4" fill="#ffffff"/>` +
      `<rect x="1" y="15" width="8" height="8" rx="2.5" fill="#9db8d8"/>` +
    `</svg>`,
  );

const useImgFallback = (ref: React.RefObject<HTMLDivElement | null>) => {
  React.useEffect(() => {
    const fix = () => {
      ref.current?.querySelectorAll('img').forEach((img) => {
        if (img.dataset.dsFixed) return;
        if (img.complete && img.naturalWidth === 0) {
          img.dataset.dsFixed = '1';
          img.src = LOGO;
        } else if (!img.complete) {
          img.addEventListener(
            'error',
            () => {
              img.dataset.dsFixed = '1';
              img.src = LOGO;
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

// The capture viewport is 900px wide — below the component's 992px desktop
// breakpoint, so its own "@media (min-width: 992px)" open-sidebar rules never
// apply and Bootstrap keeps the offcanvas translated off-screen. Force the
// desktop-open layout so the real markup (header, tabs, site menu, bottom
// links) is visible in the shot.
const FORCE_OPEN = `
  #sidebar.offcanvas.offcanvas-lg {
    position: static !important;
    display: flex !important;
    flex-direction: column !important;
    transform: none !important;
    visibility: visible !important;
    width: 240px !important;
    height: 500px !important;
    max-height: 500px !important;
    z-index: auto !important;
  }
`;

export const OpenSidebar = () => {
  const ref = React.useRef<HTMLDivElement>(null);
  useImgFallback(ref);
  return (
    <div ref={ref} style={{ width: 260, minHeight: 520 }}>
      <style>{FORCE_OPEN}</style>
      <Sidebar />
    </div>
  );
};
