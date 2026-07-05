import * as React from 'react';
import { ConfirmDeleteTicketCategoryModal } from '@panomc/panel-ui';

// Opened from Tickets → Categories: ConfirmDeleteTicketCategoryModal.show(category).
const Opened = ({ category }: { category: any }) => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmDeleteTicketCategoryModal as any).show(category);
    }, 50);
    return () => {
      clearTimeout(t);
      try { (ConfirmDeleteTicketCategoryModal as any).hide?.(); } catch {}
    };
  }, []);
  return <ConfirmDeleteTicketCategoryModal previewOpen />;
};

export const EmptyCategory = () => (
  <Opened category={{ id: 4, title: 'Other', ticketCount: 0, tickets: [] }} />
);

export const CategoryWithTickets = () => (
  <Opened
    category={{
      id: 1,
      title: 'Bug Reports',
      ticketCount: 8,
      tickets: [
        { id: 42, title: 'Lost my inventory after server crash' },
        { id: 43, title: 'Villager trades reset every restart' },
        { id: 44, title: 'Cannot claim land near spawn' },
        { id: 45, title: 'Elytra disappears in the End' },
        { id: 46, title: 'Shop plugin overcharges diamonds' },
      ],
    }}
  />
);
