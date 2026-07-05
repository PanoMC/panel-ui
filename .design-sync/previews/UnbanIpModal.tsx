import * as React from 'react';
import { UnbanIpModal } from '@panomc/panel-ui';

const M = UnbanIpModal as any;

// Real call site (banned IPs list): show(bannedIp) with the ban row;
// the IP is interpolated into the confirmation question.
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      M.show({ id: 4, ip: '203.0.113.42' });
    }, 50);
    return () => {
      clearTimeout(t);
      try {
        M.hide();
      } catch {}
    };
  }, []);
  return <UnbanIpModal previewOpen />;
};

export const Confirm = () => <Opened />;
