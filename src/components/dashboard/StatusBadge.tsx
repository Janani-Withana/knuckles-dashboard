import React from 'react';

import type {
  StatusBadgeProps,
} from '../../types/dashboard';

export default function StatusBadge({
  status,
}: StatusBadgeProps): React.ReactElement {
  const statusClass = status
    .toLowerCase()
    .replace(/\s+/g, '-');

  return (
    <span
      className={`status-badge ${statusClass}`}
    >
      {status}
    </span>
  );
}