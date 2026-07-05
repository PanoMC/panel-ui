import * as React from 'react';
import { LocaleRow } from '@panomc/panel-ui';

const Table = ({ children }: { children: React.ReactNode }) => (
  <div className="card">
    <style>{`.ds-rt > [data-pano-component]{display:table-row-group;}`}</style>
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0 ds-rt">
        <thead>
          <tr>
            {['', 'Name', 'Code', 'date-fns Code', 'Derivatives', 'Defined By'].map((c, i) => (
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

export const SystemLocale = () => (
  <Table>
    <LocaleRow
      index={0}
      locale={{
        id: 1,
        name: 'English',
        code: 'en-US',
        dateFnsCode: 'enUS',
        derivatives: 'en, en-GB',
        definedBy: 'SYSTEM',
      }}
    />
  </Table>
);

export const UserLocale = () => (
  <Table>
    <LocaleRow
      index={1}
      locale={{
        id: 2,
        name: 'Türkçe',
        code: 'tr-TR',
        dateFnsCode: 'tr',
        derivatives: 'tr',
        definedBy: 'USER',
      }}
    />
  </Table>
);

export const LanguageList = () => (
  <Table>
    <LocaleRow
      index={0}
      locale={{
        id: 1,
        name: 'English',
        code: 'en-US',
        dateFnsCode: 'enUS',
        derivatives: 'en, en-GB',
        definedBy: 'SYSTEM',
      }}
    />
    <LocaleRow
      index={1}
      locale={{
        id: 2,
        name: 'Türkçe',
        code: 'tr-TR',
        dateFnsCode: 'tr',
        derivatives: 'tr',
        definedBy: 'USER',
        selected: true,
      }}
    />
    <LocaleRow
      index={2}
      locale={{
        id: 3,
        name: 'Deutsch',
        code: 'de-DE',
        dateFnsCode: 'de',
        derivatives: 'de, de-AT',
        definedBy: 'USER',
      }}
    />
  </Table>
);
