import * as React from 'react';
import { TicketCategoryRow } from '@panomc/panel-ui';

const Table = ({ children }: { children: React.ReactNode }) => (
  <div className="card">
    <style>{`.ds-rt > [data-pano-component]{display:table-row-group;}`}</style>
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0 ds-rt">
        <thead>
          <tr>
            {['', 'Title', 'Description'].map((c, i) => (
              <th key={i} scope="col" className="text-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        {children}
      </table>
    </div>
  </div>
);

export const BugReport = () => (
  <Table>
    <TicketCategoryRow
      index={0}
      category={{
        id: 1,
        title: 'Bug Report',
        description: 'Broken plugins, item loss, world glitches and anything else misbehaving',
      }}
    />
  </Table>
);

export const Selected = () => (
  <Table>
    <TicketCategoryRow
      index={1}
      category={{
        id: 2,
        title: 'Ban Appeal',
        description: 'Request a review of a ban or mute decision',
        selected: true,
      }}
    />
  </Table>
);

export const CategoryList = () => (
  <Table>
    <TicketCategoryRow
      index={0}
      category={{
        id: 1,
        title: 'Bug Report',
        description: 'Broken plugins, item loss, world glitches and anything else misbehaving',
      }}
    />
    <TicketCategoryRow
      index={1}
      category={{
        id: 2,
        title: 'Ban Appeal',
        description: 'Request a review of a ban or mute decision',
      }}
    />
    <TicketCategoryRow
      index={2}
      category={{
        id: 3,
        title: 'Player Report',
        description: 'Report griefing, cheating or chat abuse — include coordinates and screenshots',
      }}
    />
  </Table>
);
