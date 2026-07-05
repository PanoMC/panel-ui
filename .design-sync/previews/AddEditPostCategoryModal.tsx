import * as React from 'react';
import { AddEditPostCategoryModal } from '@panomc/panel-ui';

// The app opens this modal imperatively: AddEditPostCategoryModal.show(mode, category?).
const Opened = ({ open }: { open: () => void }) => {
  React.useEffect(() => {
    const t = setTimeout(open, 50);
    return () => {
      clearTimeout(t);
      try { (AddEditPostCategoryModal as any).hide?.(); } catch {}
    };
  }, []);
  return <AddEditPostCategoryModal previewOpen />;
};

export const CreateCategory = () => (
  <Opened open={() => (AddEditPostCategoryModal as any).show('create')} />
);

export const EditCategory = () => (
  <Opened
    open={() =>
      (AddEditPostCategoryModal as any).show('edit', {
        id: 2,
        title: 'Server Announcements',
        description: 'Official news about CraftRealms Survival: updates, maintenance windows and seasonal events.',
        url: 'server-announcements',
        color: '#1976d2',
      })
    }
  />
);
