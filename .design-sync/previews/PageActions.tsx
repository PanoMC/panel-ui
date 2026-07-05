import * as React from 'react';
import {
  PageActions,
  CardFilters,
  CardFiltersItem,
  SearchInput,
  Pagination,
} from '@panomc/panel-ui';

// The classic list-page toolbar: filters left, search middle, pagination right
// (matches Players/Tickets page headers)
export const ListToolbar = () => (
  <PageActions
    left={
      <CardFilters>
        <CardFiltersItem href="/players" active><>All</></CardFiltersItem>
        <CardFiltersItem href="/players/online"><>Online</></CardFiltersItem>
        <CardFiltersItem href="/players/banned"><>Banned</></CardFiltersItem>
      </CardFilters>
    }
    middle={
      <div style={{ minWidth: 220 }}>
        <SearchInput onchange={() => {}} />
      </div>
    }
    right={<Pagination page={2} totalPage={7} />}
  />
);

// Left + right only: a primary action and pagination
export const ActionAndPagination = () => (
  <PageActions
    left={
      <button className="btn btn-sm btn-primary" type="button">
        <i className="fa-solid fa-plus me-1"></i>New Post
      </button>
    }
    right={<Pagination page={1} totalPage={4} />}
  />
);

// Search-only row centered (e.g. Addons marketplace header)
export const SearchOnly = () => (
  <PageActions
    middle={
      <div style={{ minWidth: 260 }}>
        <SearchInput placeholderKey="buttons.find" searching onchange={() => {}} />
      </div>
    }
  />
);
