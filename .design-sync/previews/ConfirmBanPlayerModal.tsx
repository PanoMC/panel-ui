import * as React from 'react';
import { ConfirmBanPlayerModal } from '@panomc/panel-ui';

// Opened imperatively from the player detail page: ConfirmBanPlayerModal.show(player).
const Opened = ({ duration }: { duration?: 'custom' | 'datetime' }) => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmBanPlayerModal as any).show({ username: 'xX_Griefer99_Xx' });
      if (duration) {
        setTimeout(() => {
          const radio = document.getElementById(
            duration === 'custom' ? 'banCustom' : 'banDateTime',
          ) as HTMLInputElement | null;
          radio?.click();
        }, 150);
      }
    }, 50);
    return () => {
      clearTimeout(t);
      try { (ConfirmBanPlayerModal as any).hide?.(); } catch {}
    };
  }, []);
  return <ConfirmBanPlayerModal previewOpen />;
};

export const PermanentBan = () => <Opened />;

export const CustomDuration = () => <Opened duration="custom" />;

export const UntilDateTime = () => <Opened duration="datetime" />;
