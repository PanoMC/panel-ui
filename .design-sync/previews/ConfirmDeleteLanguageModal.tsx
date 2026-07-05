import * as React from 'react';
import { ConfirmDeleteLanguageModal } from '@panomc/panel-ui';

// Opened from the languages page: ConfirmDeleteLanguageModal.show(locale).
const Opened = () => {
  React.useEffect(() => {
    const t = setTimeout(() => {
      (ConfirmDeleteLanguageModal as any).show({ id: 3, name: 'Türkçe', code: 'tr-TR' });
    }, 50);
    return () => {
      clearTimeout(t);
      try { (ConfirmDeleteLanguageModal as any).hide?.(); } catch {}
    };
  }, []);
  return <ConfirmDeleteLanguageModal previewOpen />;
};

export const DeleteLanguage = () => <Opened />;
