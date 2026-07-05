import * as React from 'react';
import { PostCategoryRow } from '@panomc/panel-ui';

const Table = ({ children }: { children: React.ReactNode }) => (
  <div className="card">
    <style>{`.ds-rt > [data-pano-component]{display:table-row-group;}`}</style>
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0 ds-rt">
        <thead>
          <tr>
            {['', 'Title', 'Description', 'URL'].map((c, i) => (
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

export const Announcements = () => (
  <Table>
    <PostCategoryRow
      index={0}
      category={{
        id: 1,
        title: 'Announcements',
        description: 'Official CraftRealms server news, resets and maintenance notices',
        url: 'announcements',
        color: '3aa856',
      }}
    />
  </Table>
);

export const Selected = () => (
  <Table>
    <PostCategoryRow
      index={1}
      category={{
        id: 2,
        title: 'Events',
        description: 'Build contests, drop parties and seasonal community events',
        url: 'events',
        color: 'e0a83a',
        selected: true,
      }}
    />
  </Table>
);

export const CategoryList = () => (
  <Table>
    <PostCategoryRow
      index={0}
      category={{
        id: 1,
        title: 'Announcements',
        description: 'Official CraftRealms server news, resets and maintenance notices',
        url: 'announcements',
        color: '3aa856',
      }}
    />
    <PostCategoryRow
      index={1}
      category={{
        id: 2,
        title: 'Events',
        description: 'Build contests, drop parties and seasonal community events',
        url: 'events',
        color: 'e0a83a',
      }}
    />
    <PostCategoryRow
      index={2}
      category={{
        id: 3,
        title: 'Dev Blog',
        description: 'Behind-the-scenes changelogs from the plugin team',
        url: 'dev-blog',
        color: '5a7ae0',
      }}
    />
  </Table>
);
