import * as React from 'react';
import { ConfirmBanIpModal } from '@panomc/panel-ui';

// Opened imperatively from the IP bans page: ConfirmBanIpModal.show({ initialIp }).
const Opened = ({ duration }: { duration?: 'custom' | 'datetime' }) => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmBanIpModal as any).show({ initialIp: '185.94.23.117' });
      if (duration) {
        setTimeout(() => {
          const radio = document.getElementById(
            duration === 'custom' ? 'ipBanCustom' : 'ipBanDateTime',
          ) as HTMLInputElement | null;
          radio?.click();
        }, 150);
      }
    }, 50);
    return () => {
      clearTimeout(t);
      try { (ConfirmBanIpModal as any).hide?.(); } catch {}
    };
  }, []);
  return <ConfirmBanIpModal previewOpen />;
};

export const PermanentBan = () => <Opened />;

export const CustomDuration = () => <Opened duration="custom" />;

export const UntilDateTime = () => <Opened duration="datetime" />;
