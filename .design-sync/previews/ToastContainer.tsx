import * as React from 'react';
import { ToastContainer } from '@panomc/panel-ui';

// The app queues toasts imperatively: show(i18nKey, values). The preview does
// exactly that after mount. Bootstrap's autohide is disabled so the capture
// doesn't race the 5s dismiss timer, and the fixed bottom-center container is
// made static so it renders inside the card instead of over the viewport.
const Shown = ({ toasts }: { toasts: Array<[string, Record<string, unknown>]> }) => {
  React.useEffect(() => {
    try {
      (window as any).bootstrap.Toast.Default.autohide = false;
    } catch {}
    const t = setTimeout(() => {
      for (const [text, values] of toasts) {
        (ToastContainer as any).show(text, values);
      }
    }, 60);
    const keep = setInterval(() => {
      document.querySelectorAll('.toast').forEach((el) => el.classList.add('show'));
    }, 250);
    return () => {
      clearTimeout(t);
      clearInterval(keep);
    };
  }, []);
  return (
    <>
      <style>{`.toast-container{position:static !important; transform:none !important;} .toast{display:block !important; opacity:1 !important;}`}</style>
      <div style={{ minHeight: 90 }}>
        <ToastContainer />
      </div>
    </>
  );
};

export const SingleToast = () => (
  <Shown toasts={[['components.toasts.post-published', { title: 'Announcing Season 5!' }]]} />
);

export const StackedToasts = () => (
  <Shown
    toasts={[
      ['components.toasts.player-deleted-success', { username: 'Griefer_2010' }],
      ['components.toasts.license-refreshed', {}],
    ]}
  />
);
