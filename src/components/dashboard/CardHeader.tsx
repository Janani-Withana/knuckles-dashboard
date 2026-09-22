import React from 'react';

import type { CardHeaderProps } from '../../types/dashboard';

export default function CardHeader({
  icon: Icon,
  title,
  action,
}: CardHeaderProps): React.ReactElement {
  return (
    <div className="card-header">
      <div className="card-title">
        <Icon size={21} />
        <h2>{title}</h2>
      </div>

      {action &&
        (typeof action === 'string' ? (
          <button
            type="button"
            className="view-all"
          >
            {action}
          </button>
        ) : (
          action
        ))}
    </div>
  );
}