import * as React from 'react';
import { NoContent } from '@panomc/panel-ui';

export const Default = () => <NoContent />;

export const NoPosts = () => (
  <NoContent icon="fa-solid fa-newspaper fa-3x" text="No posts have been published yet." />
);

export const NoBannedPlayers = () => (
  <NoContent icon="fa-solid fa-user-slash fa-3x" text="No banned players. CraftRealms is peaceful!" />
);

export const WithSlotAction = () => (
  <NoContent icon="fa-solid fa-ticket fa-3x" text="No open tickets.">
    <div className="text-center mt-2">
      <button type="button" className="btn btn-sm btn-primary">
        <i className="fa-solid fa-plus me-1"></i>Create Ticket
      </button>
    </div>
  </NoContent>
);
