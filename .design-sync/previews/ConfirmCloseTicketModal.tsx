import * as React from 'react';
import { ConfirmCloseTicketModal } from '@panomc/panel-ui';

// Opened from the tickets list: ConfirmCloseTicketModal.show(selectedTicketIds).
const Opened = ({ tickets }: { tickets: number[] }) => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmCloseTicketModal as any).show(tickets);
    }, 50);
    return () => {
      clearTimeout(t);
      try { (ConfirmCloseTicketModal as any).hide?.(); } catch {}
    };
  }, []);
  return <ConfirmCloseTicketModal previewOpen />;
};

export const CloseSingleTicket = () => <Opened tickets={[42]} />;

export const CloseMultipleTickets = () => <Opened tickets={[42, 43, 47]} />;
