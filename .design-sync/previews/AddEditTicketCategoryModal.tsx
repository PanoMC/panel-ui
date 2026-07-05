import * as React from 'react';
import { AddEditTicketCategoryModal } from '@panomc/panel-ui';

// The app opens this modal imperatively: AddEditTicketCategoryModal.show(mode, category?).
const Opened = ({ open }: { open: () => void }) => {
  React.useEffect(() => {
    const t = setTimeout(open, 50);
    return () => {
      clearTimeout(t);
      try { (AddEditTicketCategoryModal as any).hide?.(); } catch {}
    };
  }, []);
  return <AddEditTicketCategoryModal previewOpen />;
};

export const CreateCategory = () => (
  <Opened open={() => (AddEditTicketCategoryModal as any).show('create')} />
);

export const EditCategory = () => (
  <Opened
    open={() =>
      (AddEditTicketCategoryModal as any).show('edit', {
        id: 1,
        title: 'Bug Reports',
        description: 'Broken game mechanics, plugin errors and glitches on CraftRealms Survival. Include coordinates and what you were doing.',
      })
    }
  />
);
