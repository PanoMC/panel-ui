import * as React from 'react';
import { VerifiedStatus } from '@panomc/panel-ui';

export const Verified = () => <VerifiedStatus status="VERIFIED" />;

export const NotVerified = () => <VerifiedStatus status="NOT_VERIFIED" />;

export const InlineWithTitle = () => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
    Blaze Theme <VerifiedStatus status="VERIFIED" />
  </span>
);
