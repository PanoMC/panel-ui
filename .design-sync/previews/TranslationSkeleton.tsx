import * as React from 'react';
import { TranslationSkeleton } from '@panomc/panel-ui';

// Loading placeholder shown while the Translations page fetches a locale.
export const LoadingRow = () => (
  <div className="card">
    <div className="card-body">
      <TranslationSkeleton />
    </div>
  </div>
);

export const LoadingList = () => (
  <div className="card">
    <div className="card-body">
      <TranslationSkeleton />
      <TranslationSkeleton />
      <TranslationSkeleton />
      <TranslationSkeleton />
    </div>
  </div>
);
