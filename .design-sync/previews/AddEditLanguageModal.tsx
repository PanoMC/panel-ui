import * as React from 'react';
import { AddEditLanguageModal } from '@panomc/panel-ui';

// The app opens this modal imperatively: AddEditLanguageModal.show(mode, locale?).
const Opened = ({ open }: { open: () => void }) => {
  React.useEffect(() => {
    const t = setTimeout(open, 50);
    return () => {
      clearTimeout(t);
      try { (AddEditLanguageModal as any).hide?.(); } catch {}
    };
  }, []);
  return <AddEditLanguageModal previewOpen />;
};

export const CreateLanguage = () => (
  <Opened open={() => (AddEditLanguageModal as any).show('create')} />
);

export const EditLanguage = () => (
  <Opened
    open={() =>
      (AddEditLanguageModal as any).show('edit', {
        id: 3,
        name: 'Türkçe',
        code: 'tr-TR',
        dateFnsCode: 'tr',
        derivatives: ['tr', 'tr-tr', 'turkish'],
      })
    }
  />
);
