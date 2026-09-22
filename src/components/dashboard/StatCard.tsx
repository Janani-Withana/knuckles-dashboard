import React from 'react';

import { ChevronRight } from 'lucide-react';

import type {
  StatCardProps,
} from '../../types/dashboard';

export default function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  theme,
  arrow = true,
}: StatCardProps): React.ReactElement {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${theme}`}>
        <Icon size={24} />
      </div>

      <div className="stat-content">
        <div className="stat-title">
          {title}
        </div>

        <div className="stat-value">
          {value}
        </div>

        <div className="stat-subtitle">
          {subtitle}
        </div>
      </div>

      {arrow && (
        <ChevronRight
          className="stat-arrow"
          size={17}
        />
      )}
    </div>
  );
}