import React from 'react';

export default function StatusBadge({
  status,
}: { status: string }): React.ReactElement {
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