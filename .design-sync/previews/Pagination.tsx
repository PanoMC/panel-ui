import * as React from 'react';
import { Pagination } from '@panomc/panel-ui';

// First page of a long player list: prev caret disabled, trailing "..." jump
export const FirstPage = () => <Pagination page={1} totalPage={12} />;

// Deep in the middle of the list: dots on both sides
export const MiddlePage = () => <Pagination page={6} totalPage={12} />;

// Last page: next caret disabled
export const LastPage = () => <Pagination page={12} totalPage={12} />;

// Few pages (e.g. 3 pages of tickets): every page number visible, no dots
export const FewPages = () => <Pagination page={2} totalPage={3} />;
