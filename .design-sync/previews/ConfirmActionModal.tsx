import * as React from 'react';
import { ConfirmActionModal } from '@panomc/panel-ui';

// The app opens this modal imperatively: ConfirmActionModal.show(i18nKey, onYes).
// The preview does exactly that after mount, same as Addons.svelte does.
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      ConfirmActionModal.show('pages.addons.enable-all-confirm', () => {});
    }, 50);
    return () => {
      clearTimeout(t);
      try { ConfirmActionModal.hide(); } catch {}
    };
  }, []);
  return <ConfirmActionModal previewOpen />;
};

export const Confirm = () => <Opened />;
