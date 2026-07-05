import * as React from 'react';
import { LicenseStatusBadge } from '@panomc/panel-ui';

export const Licensed = () => <LicenseStatusBadge status="LICENSED" />;

export const LicensedLabeled = () => <LicenseStatusBadge status="LICENSED" labeled />;

export const ExpiredLabeled = () => <LicenseStatusBadge status="EXPIRED" labeled />;

export const NoPurchaseLabeled = () => <LicenseStatusBadge status="NO_PURCHASE" labeled />;

export const NetworkErrorLabeled = () => <LicenseStatusBadge status="NETWORK_ERROR" labeled />;
