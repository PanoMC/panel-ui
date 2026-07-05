import * as React from 'react';
import { ConfirmSendVerificationEmailModal } from '@panomc/panel-ui';

// Opened from a player detail page for an unverified account: show(player).
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmSendVerificationEmailModal as any).show({
        id: 7,
        username: 'Alex',
        email: 'alex@craftrealms.example',
        isEmailVerified: false,
      });
    }, 50);
    return () => {
      clearTimeout(t);
      try { (ConfirmSendVerificationEmailModal as any).hide?.(); } catch {}
    };
  }, []);
  return <ConfirmSendVerificationEmailModal previewOpen />;
};

export const Confirm = () => <Opened />;
