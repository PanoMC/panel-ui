import * as React from 'react';
import { TicketStatusBadge } from '@panomc/panel-ui';

export const New = () => <TicketStatusBadge status="NEW" />;

export const Replied = () => <TicketStatusBadge status="REPLIED" />;

export const Closed = () => <TicketStatusBadge status="CLOSED" />;
