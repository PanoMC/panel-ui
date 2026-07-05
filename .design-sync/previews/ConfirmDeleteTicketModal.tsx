import * as React from 'react';
import { ConfirmDeleteTicketModal } from '@panomc/panel-ui';

// Opened imperatively: show(selectedTickets) — Tickets.svelte passes the selected ticket rows.
const Opened = ({ tickets }: { tickets: any[] }) => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmDeleteTicketModal as any).show(tickets);
    }, 50);
    return () => {
      clearTimeout(t);
      try {
        (ConfirmDeleteTicketModal as any).hide();
      } catch {}
    };
  }, []);
  return <ConfirmDeleteTicketModal previewOpen />;
};

export const DeleteSingleTicket = () => (
  <Opened tickets={[{ id: 42, title: 'Griefing report: spawn town burned down' }]} />
);

export const DeleteMultipleTickets = () => (
  <Opened
    tickets={[
      { id: 42, title: 'Griefing report: spawn town burned down' },
      { id: 43, title: 'Lost inventory after server crash' },
      { id: 44, title: 'Ban appeal: Herobrine' },
    ]}
  />
);
