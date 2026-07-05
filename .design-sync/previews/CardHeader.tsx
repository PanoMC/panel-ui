import * as React from 'react';
import { CardHeader, SearchInput } from '@panomc/panel-ui';

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="card">{children}</div>
);

export const TitleOnly = () => (
  <Card>
    <CardHeader left={<h5 className="m-0 fw-bold">Posts</h5>} />
  </Card>
);

export const TitleAndActions = () => (
  <Card>
    <CardHeader
      left={<h5 className="m-0 fw-bold">Players</h5>}
      right={
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-primary" type="button">
            <i className="fa-solid fa-filter me-1"></i>Filter
          </button>
          <button className="btn btn-sm btn-primary" type="button">
            <i className="fa-solid fa-plus me-1"></i>Add Player
          </button>
        </div>
      }
    />
  </Card>
);

export const WithMiddleSection = () => (
  <Card>
    <CardHeader
      left={<h5 className="m-0 fw-bold">Tickets</h5>}
      middle={
        <ul className="nav nav-pills">
          <li className="nav-item"><a className="nav-link active" href="#">Open</a></li>
          <li className="nav-item"><a className="nav-link" href="#">Closed</a></li>
        </ul>
      }
      right={<span className="badge text-bg-secondary">24 total</span>}
    />
  </Card>
);
